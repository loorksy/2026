import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../middleware/auditLog';

const prisma = new PrismaClient();

export const getTransferRecordsByTransfer = async (req: AuthRequest, res: Response) => {
  try {
    const { transferId } = req.params;

    const records = await prisma.transferRecord.findMany({
      where: {
        manualTransferId: transferId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    console.error('Get transfer records error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب سجلات التحويل'
    });
  }
};

export const createTransferRecord = async (req: AuthRequest, res: Response) => {
  try {
    const {
      manualTransferId,
      userId,
      employeeName,
      amount,
      salaryType,
      description
    } = req.body;

    if (!manualTransferId || !employeeName || !amount || !salaryType) {
      return res.status(400).json({
        success: false,
        message: 'التحويل اليدوي واسم الموظف والمبلغ ونوع الراتب مطلوبة'
      });
    }

    const transfer = await prisma.manualTransfer.findUnique({
      where: { id: manualTransferId }
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
        message: 'لا يمكن إضافة سجلات لتحويل تم التحقق منه'
      });
    }

    const record = await prisma.transferRecord.create({
      data: {
        manualTransferId,
        userId,
        employeeName,
        amount,
        salaryType,
        description
      }
    });

    const totalRecordsAmount = await prisma.transferRecord.aggregate({
      where: { manualTransferId },
      _sum: {
        amount: true
      }
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'CREATE',
      resource: 'transfer_records',
      resourceId: record.id,
      newValues: record,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء سجل التحويل بنجاح',
      data: {
        record,
        totalRecordsAmount: totalRecordsAmount._sum.amount || 0,
        transferAmount: transfer.amount
      }
    });
  } catch (error) {
    console.error('Create transfer record error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء سجل التحويل'
    });
  }
};

export const updateTransferRecord = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const existingRecord = await prisma.transferRecord.findUnique({
      where: { id },
      include: {
        manualTransfer: true
      }
    });

    if (!existingRecord) {
      return res.status(404).json({
        success: false,
        message: 'سجل التحويل غير موجود'
      });
    }

    if (existingRecord.manualTransfer.status === 'VERIFIED') {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن تعديل سجل لتحويل تم التحقق منه'
      });
    }

    const record = await prisma.transferRecord.update({
      where: { id },
      data: updateData
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'UPDATE',
      resource: 'transfer_records',
      resourceId: id,
      oldValues: existingRecord,
      newValues: updateData,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'تم تحديث سجل التحويل بنجاح',
      data: record
    });
  } catch (error) {
    console.error('Update transfer record error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث سجل التحويل'
    });
  }
};

export const confirmTransferRecord = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const record = await prisma.transferRecord.findUnique({
      where: { id },
      include: {
        manualTransfer: true
      }
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'سجل التحويل غير موجود'
      });
    }

    const updated = await prisma.transferRecord.update({
      where: { id },
      data: {
        confirmed: !record.confirmed
      }
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'UPDATE',
      resource: 'transfer_records',
      resourceId: id,
      oldValues: { confirmed: record.confirmed },
      newValues: { confirmed: updated.confirmed },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: `تم ${updated.confirmed ? 'تأكيد' : 'إلغاء تأكيد'} سجل التحويل بنجاح`,
      data: updated
    });
  } catch (error) {
    console.error('Confirm transfer record error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تأكيد سجل التحويل'
    });
  }
};

export const deleteTransferRecord = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const record = await prisma.transferRecord.findUnique({
      where: { id },
      include: {
        manualTransfer: true
      }
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'سجل التحويل غير موجود'
      });
    }

    if (record.manualTransfer.status === 'VERIFIED') {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن حذف سجل لتحويل تم التحقق منه'
      });
    }

    await prisma.transferRecord.delete({
      where: { id }
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'DELETE',
      resource: 'transfer_records',
      resourceId: id,
      oldValues: record,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'تم حذف سجل التحويل بنجاح'
    });
  } catch (error) {
    console.error('Delete transfer record error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف سجل التحويل'
    });
  }
};

export const bulkCreateTransferRecords = async (req: AuthRequest, res: Response) => {
  try {
    const { manualTransferId, records } = req.body;

    if (!manualTransferId || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'التحويل اليدوي وقائمة السجلات مطلوبة'
      });
    }

    const transfer = await prisma.manualTransfer.findUnique({
      where: { id: manualTransferId }
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
        message: 'لا يمكن إضافة سجلات لتحويل تم التحقق منه'
      });
    }

    const recordsData = records.map(r => ({
      manualTransferId,
      userId: r.userId,
      employeeName: r.employeeName,
      amount: r.amount,
      salaryType: r.salaryType,
      description: r.description
    }));

    const result = await prisma.transferRecord.createMany({
      data: recordsData
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'CREATE',
      resource: 'transfer_records',
      resourceId: manualTransferId,
      newValues: { count: result.count, records: recordsData },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      message: `تم إنشاء ${result.count} سجل تحويل بنجاح`,
      data: { count: result.count }
    });
  } catch (error) {
    console.error('Bulk create transfer records error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء سجلات التحويل'
    });
  }
};
