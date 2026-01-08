import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../middleware/auditLog';

const prisma = new PrismaClient();

export const getAllTrustedPersons = async (req: AuthRequest, res: Response) => {
  try {
    const { isActive } = req.query;
    
    const where = isActive !== undefined ? { isActive: isActive === 'true' } : {};
    
    const trustedPersons = await prisma.trustedPerson.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: trustedPersons
    });
  } catch (error) {
    console.error('Get trusted persons error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الموثوقيين'
    });
  }
};

export const getTrustedPersonById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const trustedPerson = await prisma.trustedPerson.findUnique({
      where: { id },
      include: {
        manualTransfers: {
          orderBy: {
            transferDate: 'desc'
          },
          take: 10
        }
      }
    });

    if (!trustedPerson) {
      return res.status(404).json({
        success: false,
        message: 'الشخص الموثوق غير موجود'
      });
    }

    res.json({
      success: true,
      data: trustedPerson
    });
  } catch (error) {
    console.error('Get trusted person error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الشخص الموثوق'
    });
  }
};

export const createTrustedPerson = async (req: AuthRequest, res: Response) => {
  try {
    const {
      fullName,
      address,
      whatsappNumber,
      idDocuments,
      salaryType,
      baseSalary,
      salaryPeriod,
      bankAccount
    } = req.body;

    if (!fullName || !address || !whatsappNumber || !salaryType || !baseSalary) {
      return res.status(400).json({
        success: false,
        message: 'الاسم الكامل والعنوان ورقم الواتساب ونوع الراتب والراتب الأساسي مطلوبة'
      });
    }

    const trustedPerson = await prisma.trustedPerson.create({
      data: {
        fullName,
        address,
        whatsappNumber,
        idDocuments,
        salaryType,
        baseSalary,
        salaryPeriod,
        bankAccount
      }
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'CREATE',
      resource: 'trusted_persons',
      resourceId: trustedPerson.id,
      newValues: trustedPerson,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الشخص الموثوق بنجاح',
      data: trustedPerson
    });
  } catch (error) {
    console.error('Create trusted person error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء الشخص الموثوق'
    });
  }
};

export const updateTrustedPerson = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const existingPerson = await prisma.trustedPerson.findUnique({
      where: { id }
    });

    if (!existingPerson) {
      return res.status(404).json({
        success: false,
        message: 'الشخص الموثوق غير موجود'
      });
    }

    const trustedPerson = await prisma.trustedPerson.update({
      where: { id },
      data: updateData
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'UPDATE',
      resource: 'trusted_persons',
      resourceId: id,
      oldValues: existingPerson,
      newValues: updateData,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'تم تحديث الشخص الموثوق بنجاح',
      data: trustedPerson
    });
  } catch (error) {
    console.error('Update trusted person error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث الشخص الموثوق'
    });
  }
};

export const deleteTrustedPerson = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const trustedPerson = await prisma.trustedPerson.findUnique({
      where: { id },
      include: {
        manualTransfers: true
      }
    });

    if (!trustedPerson) {
      return res.status(404).json({
        success: false,
        message: 'الشخص الموثوق غير موجود'
      });
    }

    if (trustedPerson.manualTransfers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن حذف الشخص الموثوق لوجود عمليات تحويل مرتبطة به'
      });
    }

    await prisma.trustedPerson.delete({
      where: { id }
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'DELETE',
      resource: 'trusted_persons',
      resourceId: id,
      oldValues: trustedPerson,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'تم حذف الشخص الموثوق بنجاح'
    });
  } catch (error) {
    console.error('Delete trusted person error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف الشخص الموثوق'
    });
  }
};

export const toggleTrustedPersonStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const trustedPerson = await prisma.trustedPerson.findUnique({
      where: { id }
    });

    if (!trustedPerson) {
      return res.status(404).json({
        success: false,
        message: 'الشخص الموثوق غير موجود'
      });
    }

    const updated = await prisma.trustedPerson.update({
      where: { id },
      data: {
        isActive: !trustedPerson.isActive
      }
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'UPDATE',
      resource: 'trusted_persons',
      resourceId: id,
      oldValues: { isActive: trustedPerson.isActive },
      newValues: { isActive: updated.isActive },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: `تم ${updated.isActive ? 'تفعيل' : 'إلغاء تفعيل'} الشخص الموثوق بنجاح`,
      data: updated
    });
  } catch (error) {
    console.error('Toggle trusted person status error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تغيير حالة الشخص الموثوق'
    });
  }
};
