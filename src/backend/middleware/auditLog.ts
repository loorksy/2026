import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from './auth';

const prisma = new PrismaClient();

export const auditLog = (resource: string, action: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);

    res.json = function (body: any) {
      if (req.user && res.statusCode >= 200 && res.statusCode < 300) {
        const resourceId = req.params.id || body?.data?.id || null;
        
        prisma.auditLog.create({
          data: {
            userId: req.user.id,
            action,
            resource,
            resourceId,
            oldValues: req.body?.oldValues || null,
            newValues: req.body || null,
            ipAddress: req.ip || req.socket.remoteAddress || null,
            userAgent: req.headers['user-agent'] || null
          }
        }).catch(err => console.error('Audit log error:', err));
      }

      return originalJson(body);
    };

    next();
  };
};

export const createAuditLog = async (data: {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
}) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId || null,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId || null,
        oldValues: data.oldValues || null,
        newValues: data.newValues || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null
      }
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};
