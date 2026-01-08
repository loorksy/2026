import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const getAllPermissions = async (req: AuthRequest, res: Response) => {
  try {
    const permissions = await prisma.permission.findMany({
      include: {
        _count: {
          select: {
            roles: true
          }
        }
      },
      orderBy: [
        { resource: 'asc' },
        { action: 'asc' }
      ]
    });

    const groupedPermissions = permissions.reduce((acc, permission) => {
      if (!acc[permission.resource]) {
        acc[permission.resource] = [];
      }
      acc[permission.resource].push({
        id: permission.id,
        name: permission.name,
        action: permission.action,
        description: permission.description,
        roleCount: permission._count.roles,
        createdAt: permission.createdAt,
        updatedAt: permission.updatedAt
      });
      return acc;
    }, {} as Record<string, any[]>);

    res.json({
      success: true,
      data: {
        all: permissions,
        grouped: groupedPermissions
      }
    });
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الصلاحيات'
    });
  }
};

export const getPermissionById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const permission = await prisma.permission.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'الصلاحية غير موجودة'
      });
    }

    res.json({
      success: true,
      data: {
        ...permission,
        roles: permission.roles.map(rp => rp.role)
      }
    });
  } catch (error) {
    console.error('Get permission error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الصلاحية'
    });
  }
};
