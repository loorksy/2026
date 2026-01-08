import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = '1',
      limit = '50',
      userId,
      resource,
      action,
      startDate,
      endDate
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (resource) {
      where.resource = resource;
    }

    if (action) {
      where.action = action;
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate as string);
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        skip,
        take: limitNum
      }),
      prisma.auditLog.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب سجل التدقيق'
    });
  }
};

export const getAuditLogById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const log = await prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'سجل التدقيق غير موجود'
      });
    }

    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب سجل التدقيق'
    });
  }
};

export const getAuditLogStats = async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalLogs,
      logsByAction,
      logsByResource,
      recentLogs
    ] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.groupBy({
        by: ['action'],
        _count: {
          action: true
        }
      }),
      prisma.auditLog.groupBy({
        by: ['resource'],
        _count: {
          resource: true
        }
      }),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: {
          timestamp: 'desc'
        },
        include: {
          user: {
            select: {
              username: true,
              email: true
            }
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalLogs,
        byAction: logsByAction.reduce((acc, item) => {
          acc[item.action] = item._count.action;
          return acc;
        }, {} as Record<string, number>),
        byResource: logsByResource.reduce((acc, item) => {
          acc[item.resource] = item._count.resource;
          return acc;
        }, {} as Record<string, number>),
        recentLogs
      }
    });
  } catch (error) {
    console.error('Get audit log stats error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب إحصائيات سجل التدقيق'
    });
  }
};
