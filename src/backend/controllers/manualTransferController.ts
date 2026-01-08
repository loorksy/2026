import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../middleware/auditLog';

const prisma = new PrismaClient();

export const getAllManualTransfers = async (req: AuthRequest, res: Response) => {
  try {
    const { status, trustedPersonId, period } = req.query;
    
    const where: any = {};
    if (status) where.status = status;
    if (trustedPersonId) where.trustedPersonId = trustedPersonId;
    if (period) where.period = period;
    
    const transfers = await prisma.manualTransfer.findMany({
      where,
      include: {
        trustedPerson: true,
        transferRecords: true
      },
      orderBy: {
        transferDate: 'desc'
      }
    });

    res.json({
      success: true,
      data: transfers
    });
  } catch (error) {
    console.error('Get manual transfers error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب التحويلات اليدوية'
    });
  }
};

export const getManualTransferById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const transfer = await prisma.manualTransfer.findUnique({
      where: { id },
      include: {
        trustedPerson: true,
        transferRecords: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'التحويل اليدوي غير موجود'
      });
    }

    res.json({
      success: true,
      data: transfer
    });
  } catch (error) {
    console.error('Get manual transfer error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب التحويل اليدوي'
    });
  }
};

export const createManualTransfer = async (req: AuthRequest, res: Response) => {
  try {
    const {
      trustedPersonId,
      period,
      amount,
      currency,
      transferDate,
      transferMethod,
      recipientInfo,
      notes
    } = req.body;

    if (!trustedPersonId || !period || !amount || !transferDate || !transferMethod) {
      return res.status(400).json({
        success: false,
        message: 'الشخص الموثوق والفترة والمبلغ وتاريخ التحويل وطريقة التحويل مطلوبة'
      });
    }

    const trustedPerson = await prisma.trustedPerson.findUnique({
      where: { id: trustedPersonId }
    });

    if (!trustedPerson) {
      return res.status(404).json({
        success: false,
        message: 'الشخص الموثوق غير موجود'
      });
    }

    if (!trustedPerson.isActive) {
      return res.status(400).json({
        success: false,
        message: 'الشخص الموثوق غير نشط'
      });
    }

    const transfer = await prisma.manualTransfer.create({
      data: {
        trustedPersonId,
        period,
        amount,
        currency: currency || 'IQD',
        transferDate: new Date(transferDate),
        transferMethod,
        recipientInfo,
        notes
      },
      include: {
        trustedPerson: true
      }
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'CREATE',
      resource: 'manual_transfers',
      resourceId: transfer.id,
      newValues: transfer,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء التحويل اليدوي بنجاح',
      data: transfer
    });
  } catch (error) {
    console.error('Create manual transfer error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء التحويل اليدوي'
    });
  }
};

export const updateManualTransfer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const existingTransfer = await prisma.manualTransfer.findUnique({
      where: { id }
    });

    if (!existingTransfer) {
      return res.status(404).json({
        success: false,
        message: 'التحويل اليدوي غير موجود'
      });
    }

    if (existingTransfer.status === 'VERIFIED') {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن تعديل تحويل تم التحقق منه'
      });
    }

    if (updateData.transferDate) {
      updateData.transferDate = new Date(updateData.transferDate);
    }

    const transfer = await prisma.manualTransfer.update({
      where: { id },
      data: updateData,
      include: {
        trustedPerson: true,
        transferRecords: true
      }
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'UPDATE',
      resource: 'manual_transfers',
      resourceId: id,
      oldValues: existingTransfer,
      newValues: updateData,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'تم تحديث التحويل اليدوي بنجاح',
      data: transfer
    });
  } catch (error) {
    console.error('Update manual transfer error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث التحويل اليدوي'
    });
  }
};

export const updateTransferStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['PENDING', 'COMPLETED', 'VERIFIED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'حالة التحويل غير صالحة'
      });
    }

    const existingTransfer = await prisma.manualTransfer.findUnique({
      where: { id }
    });

    if (!existingTransfer) {
      return res.status(404).json({
        success: false,
        message: 'التحويل اليدوي غير موجود'
      });
    }

    const transfer = await prisma.manualTransfer.update({
      where: { id },
      data: { status },
      include: {
        trustedPerson: true
      }
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'UPDATE',
      resource: 'manual_transfers',
      resourceId: id,
      oldValues: { status: existingTransfer.status },
      newValues: { status },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'تم تحديث حالة التحويل بنجاح',
      data: transfer
    });
  } catch (error) {
    console.error('Update transfer status error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث حالة التحويل'
    });
  }
};

export const deleteManualTransfer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const transfer = await prisma.manualTransfer.findUnique({
      where: { id },
      include: {
        transferRecords: true
      }
    });

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'التحويل اليدوي غير موجود'
      });
    }

    if (transfer.status === 'VERIFIED') {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن حذف تحويل تم التحقق منه'
      });
    }

    await prisma.manualTransfer.delete({
      where: { id }
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'DELETE',
      resource: 'manual_transfers',
      resourceId: id,
      oldValues: transfer,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'تم حذف التحويل اليدوي بنجاح'
    });
  } catch (error) {
    console.error('Delete manual transfer error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف التحويل اليدوي'
    });
  }
};

export const getTransfersByPeriod = async (req: AuthRequest, res: Response) => {
  try {
    const { period } = req.params;

    const transfers = await prisma.manualTransfer.findMany({
      where: { period },
      include: {
        trustedPerson: true,
        transferRecords: true
      },
      orderBy: {
        transferDate: 'desc'
      }
    });

    const totalAmount = transfers.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalRecords = transfers.reduce((sum, t) => sum + t.transferRecords.length, 0);

    res.json({
      success: true,
      data: {
        transfers,
        summary: {
          totalTransfers: transfers.length,
          totalAmount,
          totalRecords,
          byStatus: {
            pending: transfers.filter(t => t.status === 'PENDING').length,
            completed: transfers.filter(t => t.status === 'COMPLETED').length,
            verified: transfers.filter(t => t.status === 'VERIFIED').length
          }
        }
      }
    });
  } catch (error) {
    console.error('Get transfers by period error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب التحويلات حسب الفترة'
    });
  }
};
