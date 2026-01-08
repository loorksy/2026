import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../middleware/auditLog';

const prisma = new PrismaClient();

// Get all hosts
export const getAllHosts = async (req: AuthRequest, res: Response) => {
  try {
    const { isActive, search } = req.query;

    const where: any = {};
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { fullName: { contains: String(search), mode: 'insensitive' } },
        { agencyName: { contains: String(search), mode: 'insensitive' } },
        { whatsappNumber: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const hosts = await prisma.host.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: hosts
    });
  } catch (error) {
    console.error('Get hosts error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب المضيفين'
    });
  }
};

// Get host by ID
export const getHostById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const host = await prisma.host.findUnique({
      where: { id },
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
    });

    if (!host) {
      return res.status(404).json({
        success: false,
        message: 'المضيف غير موجود'
      });
    }

    res.json({
      success: true,
      data: host
    });
  } catch (error) {
    console.error('Get host error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب المضيف'
    });
  }
};

// Create new host
export const createHost = async (req: AuthRequest, res: Response) => {
  try {
    const {
      userId,
      fullName,
      agencyName,
      address,
      whatsappNumber,
      notes
    } = req.body;

    if (!fullName || !agencyName || !address || !whatsappNumber) {
      return res.status(400).json({
        success: false,
        message: 'الاسم الكامل واسم الوكالة والعنوان ورقم الواتساب مطلوبة'
      });
    }

    // Validate user if provided
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'المستخدم غير موجود'
        });
      }
    }

    const host = await prisma.host.create({
      data: {
        userId: userId || req.user?.id,
        fullName,
        agencyName,
        address,
        whatsappNumber,
        notes
      }
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'CREATE',
      resource: 'hosts',
      resourceId: host.id,
      newValues: host,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء المضيف بنجاح',
      data: host
    });
  } catch (error) {
    console.error('Create host error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء المضيف'
    });
  }
};

// Update host
export const updateHost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const existingHost = await prisma.host.findUnique({
      where: { id }
    });

    if (!existingHost) {
      return res.status(404).json({
        success: false,
        message: 'المضيف غير موجود'
      });
    }

    const host = await prisma.host.update({
      where: { id },
      data: updateData
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'UPDATE',
      resource: 'hosts',
      resourceId: id,
      oldValues: existingHost,
      newValues: updateData,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'تم تحديث المضيف بنجاح',
      data: host
    });
  } catch (error) {
    console.error('Update host error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث المضيف'
    });
  }
};

// Delete host
export const deleteHost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const host = await prisma.host.findUnique({
      where: { id }
    });

    if (!host) {
      return res.status(404).json({
        success: false,
        message: 'المضيف غير موجود'
      });
    }

    await prisma.host.delete({
      where: { id }
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'DELETE',
      resource: 'hosts',
      resourceId: id,
      oldValues: host,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'تم حذف المضيف بنجاح'
    });
  } catch (error) {
    console.error('Delete host error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف المضيف'
    });
  }
};

// Toggle host status
export const toggleHostStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const host = await prisma.host.findUnique({
      where: { id }
    });

    if (!host) {
      return res.status(404).json({
        success: false,
        message: 'المضيف غير موجود'
      });
    }

    const updated = await prisma.host.update({
      where: { id },
      data: {
        isActive: !host.isActive
      }
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'UPDATE',
      resource: 'hosts',
      resourceId: id,
      oldValues: { isActive: host.isActive },
      newValues: { isActive: updated.isActive },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: `تم ${updated.isActive ? 'تفعيل' : 'إلغاء تفعيل'} المضيف بنجاح`,
      data: updated
    });
  } catch (error) {
    console.error('Toggle host status error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تغيير حالة المضيف'
    });
  }
};
