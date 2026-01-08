import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../middleware/auditLog';

const prisma = new PrismaClient();

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        status: true,
        userType: true,
        role: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        userRoles: {
          include: {
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedUsers = users.map(user => ({
      ...user,
      roles: user.userRoles.map(ur => ur.role)
    }));

    res.json({
      success: true,
      data: formattedUsers
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب المستخدمين'
    });
  }
};

export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        status: true,
        userType: true,
        role: true,
        lastLogin: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            },
            assignedByUser: {
              select: {
                id: true,
                username: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    res.json({
      success: true,
      data: {
        ...user,
        roles: user.userRoles.map(ur => ({
          ...ur.role,
          assignedAt: ur.assignedAt,
          assignedBy: ur.assignedByUser
        }))
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب المستخدم'
    });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { email, username, password, firstName, lastName, roleIds } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني واسم المستخدم وكلمة المرور مطلوبة'
      });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'المستخدم موجود بالفعل'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        firstName,
        lastName
      }
    });

    if (roleIds && Array.isArray(roleIds)) {
      await prisma.userRole.createMany({
        data: roleIds.map((roleId: string) => ({
          userId: user.id,
          roleId,
          assignedBy: req.user?.id
        }))
      });
    }

    await createAuditLog({
      userId: req.user?.id,
      action: 'CREATED',
      resource: 'users',
      resourceId: user.id,
      newValues: { email, username, firstName, lastName, roleIds },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء المستخدم بنجاح',
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء المستخدم'
    });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { email, username, firstName, lastName, status } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        email: email || existingUser.email,
        username: username || existingUser.username,
        firstName: firstName !== undefined ? firstName : existingUser.firstName,
        lastName: lastName !== undefined ? lastName : existingUser.lastName,
        status: status || existingUser.status
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        status: true,
        userType: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'UPDATED',
      resource: 'users',
      resourceId: id,
      oldValues: existingUser,
      newValues: { email, username, firstName, lastName, status },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'تم تحديث المستخدم بنجاح',
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث المستخدم'
    });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    if (id === req.user?.id) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكنك حذف حسابك الخاص'
      });
    }

    await prisma.user.delete({
      where: { id }
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'DELETED',
      resource: 'users',
      resourceId: id,
      oldValues: user,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'تم حذف المستخدم بنجاح'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف المستخدم'
    });
  }
};

export const assignRole = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, roleId } = req.body;

    if (!userId || !roleId) {
      return res.status(400).json({
        success: false,
        message: 'معرف المستخدم ومعرف الدور مطلوبان'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    const role = await prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'الدور غير موجود'
      });
    }

    const existingUserRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId
        }
      }
    });

    if (existingUserRole) {
      return res.status(400).json({
        success: false,
        message: 'الدور مسند بالفعل لهذا المستخدم'
      });
    }

    const userRole = await prisma.userRole.create({
      data: {
        userId,
        roleId,
        assignedBy: req.user?.id
      }
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'ASSIGNED_ROLE',
      resource: 'user_roles',
      resourceId: userRole.id,
      newValues: { userId, roleId },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      message: 'تم إسناد الدور بنجاح',
      data: userRole
    });
  } catch (error) {
    console.error('Assign role error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إسناد الدور'
    });
  }
};

export const revokeRole = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, roleId } = req.body;

    if (!userId || !roleId) {
      return res.status(400).json({
        success: false,
        message: 'معرف المستخدم ومعرف الدور مطلوبان'
      });
    }

    const userRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId
        }
      }
    });

    if (!userRole) {
      return res.status(404).json({
        success: false,
        message: 'الدور غير مسند لهذا المستخدم'
      });
    }

    await prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId
        }
      }
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'REVOKED_ROLE',
      resource: 'user_roles',
      resourceId: userRole.id,
      oldValues: { userId, roleId },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'تم إلغاء الدور بنجاح'
    });
  } catch (error) {
    console.error('Revoke role error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إلغاء الدور'
    });
  }
};
