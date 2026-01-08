import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    roles: string[];
    permissions: Array<{ resource: string; action: string }>;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'لم يتم توفير رمز المصادقة'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
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
            }
          }
        }
      }
    });

    if (!user || user.status === 'inactive' || user.status === 'suspended') {
      return res.status(401).json({
        success: false,
        message: 'المستخدم غير موجود أو غير نشط'
      });
    }

    const permissions = user.userRoles.flatMap(ur =>
      ur.role.permissions.map(rp => ({
        resource: rp.permission.resource,
        action: rp.permission.action
      }))
    );

    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      roles: user.userRoles.map(ur => ur.role.name),
      permissions
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'رمز المصادقة غير صالح'
    });
  }
};

export const authorize = (resource: string, action: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'يجب تسجيل الدخول أولاً'
      });
    }

    const hasPermission = req.user.permissions.some(
      p => p.resource === resource && p.action === action
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية للوصول إلى هذا المورد',
        requiredPermission: { resource, action }
      });
    }

    next();
  };
};

export const checkRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'يجب تسجيل الدخول أولاً'
      });
    }

    const hasRole = req.user.roles.some(role => roles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك الدور المطلوب للوصول',
        requiredRoles: roles
      });
    }

    next();
  };
};
