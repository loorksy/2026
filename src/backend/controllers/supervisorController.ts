import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../middleware/auditLog';

const prisma = new PrismaClient();

// Get all supervisors
export const getAllSupervisors = async (req: AuthRequest, res: Response) => {
  try {
    const { isActive, search, supervisorType } = req.query;

    const where: any = {};
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (supervisorType) {
      where.supervisorType = supervisorType;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: String(search), mode: 'insensitive' } },
        { whatsappNumber: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const supervisors = await prisma.supervisor.findMany({
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
      data: supervisors
    });
  } catch (error) {
    console.error('Get supervisors error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب المشرفين'
    });
  }
};

// Get supervisor by ID
export const getSupervisorById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const supervisor = await prisma.supervisor.findUnique({
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

    if (!supervisor) {
      return res.status(404).json({
        success: false,
        message: 'المشرف غير موجود'
      });
    }

    res.json({
      success: true,
      data: supervisor
    });
  } catch (error) {
    console.error('Get supervisor error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب المشرف'
    });
  }
};

// Create new supervisor
export const createSupervisor = async (req: AuthRequest, res: Response) => {
  try {
    const {
      userId,
      supervisorType,
      salary,
      salaryPeriod,
      fullName,
      whatsappNumber
    } = req.body;

    if (!supervisorType || !salary || !salaryPeriod || !fullName || !whatsappNumber) {
      return res.status(400).json({
        success: false,
        message: 'نوع المشرف والراتب وفترة الراتب والاسم الكامل ورقم الواتساب مطلوبة'
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

    const supervisor = await prisma.supervisor.create({
      data: {
        userId: userId || req.user?.id,
        supervisorType,
        salary: parseFloat(salary),
        salaryPeriod,
        fullName,
        whatsappNumber
      }
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'CREATE',
      resource: 'supervisors',
      resourceId: supervisor.id,
      newValues: supervisor,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء المشرف بنجاح',
      data: supervisor
    });
  } catch (error) {
    console.error('Create supervisor error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء المشرف'
    });
  }
};

// Update supervisor
export const updateSupervisor = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const existingSupervisor = await prisma.supervisor.findUnique({
      where: { id }
    });

    if (!existingSupervisor) {
      return res.status(404).json({
        success: false,
        message: 'المشرف غير موجود'
      });
    }

    // Handle numeric fields
    if (updateData.salary) {
      updateData.salary = parseFloat(updateData.salary);
    }

    const supervisor = await prisma.supervisor.update({
      where: { id },
      data: updateData
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'UPDATE',
      resource: 'supervisors',
      resourceId: id,
      oldValues: existingSupervisor,
      newValues: updateData,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'تم تحديث المشرف بنجاح',
      data: supervisor
    });
  } catch (error) {
    console.error('Update supervisor error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث المشرف'
    });
  }
};

// Delete supervisor
export const deleteSupervisor = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const supervisor = await prisma.supervisor.findUnique({
      where: { id }
    });

    if (!supervisor) {
      return res.status(404).json({
        success: false,
        message: 'المشرف غير موجود'
      });
    }

    await prisma.supervisor.delete({
      where: { id }
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'DELETE',
      resource: 'supervisors',
      resourceId: id,
      oldValues: supervisor,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'تم حذف المشرف بنجاح'
    });
  } catch (error) {
    console.error('Delete supervisor error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف المشرف'
    });
  }
};

// Toggle supervisor status
export const toggleSupervisorStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const supervisor = await prisma.supervisor.findUnique({
      where: { id }
    });

    if (!supervisor) {
      return res.status(404).json({
        success: false,
        message: 'المشرف غير موجود'
      });
    }

    const updated = await prisma.supervisor.update({
      where: { id },
      data: {
        isActive: !supervisor.isActive
      }
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'UPDATE',
      resource: 'supervisors',
      resourceId: id,
      oldValues: { isActive: supervisor.isActive },
      newValues: { isActive: updated.isActive },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: `تم ${updated.isActive ? 'تفعيل' : 'إلغاء تفعيل'} المشرف بنجاح`,
      data: updated
    });
  } catch (error) {
    console.error('Toggle supervisor status error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تغيير حالة المشرف'
    });
  }
};

// Get supervisor statistics
export const getSupervisorStats = async (req: AuthRequest, res: Response) => {
  try {
    const agencyCount = await prisma.supervisor.count({
      where: { supervisorType: 'AGENCY', isActive: true }
    });

    const whatsappCount = await prisma.supervisor.count({
      where: { supervisorType: 'WHATSAPP', isActive: true }
    });

    const totalSalary = await prisma.supervisor.aggregate({
      where: { isActive: true },
      _sum: {
        salary: true
      }
    });

    res.json({
      success: true,
      data: {
        agencyCount,
        whatsappCount,
        totalSalary: totalSalary._sum.salary || 0
      }
    });
  } catch (error) {
    console.error('Get supervisor stats error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب إحصائيات المشرفين'
    });
  }
};
