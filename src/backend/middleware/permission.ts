import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { Action } from '@prisma/client';

export const requirePermission = (resource: string, action: Action | string) => {
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
