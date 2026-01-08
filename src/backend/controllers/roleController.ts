import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../middleware/auditLog';

const prisma = new PrismaClient();

export const getAllRoles = async (req: AuthRequest, res: Response) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: {
            userRoles: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedRoles = roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isActive: role.isActive,
      isSystem: role.isSystem,
      userCount: role._count.userRoles,
      permissions: role.permissions.map(rp => ({
        id: rp.permission.id,
        name: rp.permission.name,
        resource: rp.permission.resource,
        action: rp.permission.action,
        description: rp.permission.description
      })),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt
    }));

    res.json({
      success: true,
      data: formattedRoles
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الأدوار'
    });
  }
};

export const getRoleById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'الدور غير موجود'
      });
    }

    res.json({
      success: true,
      data: {
        ...role,
        permissions: role.permissions.map(rp => rp.permission),
        users: role.userRoles.map(ur => ur.user)
      }
    });
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الدور'
    });
  }
};

export const createRole = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, permissionIds } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'اسم الدور مطلوب'
      });
    }

    const existingRole = await prisma.role.findUnique({
      where: { name }
    });

    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: 'الدور موجود بالفعل'
      });
    }

    const role = await prisma.role.create({
      data: {
        name,
        description,
        isSystem: false
      }
    });

    if (permissionIds && Array.isArray(permissionIds)) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId: string) => ({
          roleId: role.id,
          permissionId
        }))
      });
    }

    await createAuditLog({
      userId: req.user?.id,
      action: 'CREATED',
      resource: 'roles',
      resourceId: role.id,
      newValues: { name, description, permissionIds },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الدور بنجاح',
      data: role
    });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء الدور'
    });
  }
};

export const updateRole = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, isActive, permissionIds } = req.body;

    const existingRole = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: true
      }
    });

    if (!existingRole) {
      return res.status(404).json({
        success: false,
        message: 'الدور غير موجود'
      });
    }

    if (existingRole.isSystem && name && name !== existingRole.name) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن تغيير اسم الأدوار النظامية'
      });
    }

    const role = await prisma.role.update({
      where: { id },
      data: {
        name: name || existingRole.name,
        description: description !== undefined ? description : existingRole.description,
        isActive: isActive !== undefined ? isActive : existingRole.isActive
      }
    });

    if (permissionIds && Array.isArray(permissionIds)) {
      await prisma.rolePermission.deleteMany({
        where: { roleId: id }
      });

      await prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId: string) => ({
          roleId: id,
          permissionId
        }))
      });
    }

    await createAuditLog({
      userId: req.user?.id,
      action: 'UPDATED',
      resource: 'roles',
      resourceId: id,
      oldValues: existingRole,
      newValues: { name, description, isActive, permissionIds },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'تم تحديث الدور بنجاح',
      data: role
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث الدور'
    });
  }
};

export const deleteRole = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            userRoles: true
          }
        }
      }
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'الدور غير موجود'
      });
    }

    if (role.isSystem) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن حذف الأدوار النظامية'
      });
    }

    if (role._count.userRoles > 0) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن حذف الدور لأنه مرتبط بمستخدمين'
      });
    }

    await prisma.role.delete({
      where: { id }
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'DELETED',
      resource: 'roles',
      resourceId: id,
      oldValues: role,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'تم حذف الدور بنجاح'
    });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف الدور'
    });
  }
};
