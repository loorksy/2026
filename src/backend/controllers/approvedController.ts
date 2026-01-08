import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../middleware/auditLog';

const prisma = new PrismaClient();

// Get all approved persons
export const getAllApproved = async (req: AuthRequest, res: Response) => {
  try {
    const { isActive, search, country } = req.query;

    const where: any = {};
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { approvedName: { contains: String(search), mode: 'insensitive' } },
        { whatsappNumber: { contains: String(search), mode: 'insensitive' } },
        { agencyName: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    if (country) {
      where.countries = { contains: String(country) };
    }

    const approved = await prisma.approved.findMany({
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
      data: approved
    });
  } catch (error) {
    console.error('Get approved error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب المعتمدين'
    });
  }
};

// Get approved by ID
export const getApprovedById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const approved = await prisma.approved.findUnique({
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

    if (!approved) {
      return res.status(404).json({
        success: false,
        message: 'المعتمد غير موجود'
      });
    }

    res.json({
      success: true,
      data: approved
    });
  } catch (error) {
    console.error('Get approved error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب المعتمد'
    });
  }
};

// Create new approved
export const createApproved = async (req: AuthRequest, res: Response) => {
  try {
    const {
      userId,
      approvedName,
      whatsappNumber,
      amount,
      approvalDate,
      numberOfUsers,
      countries,
      address,
      notes
    } = req.body;

    if (!approvedName || !whatsappNumber || !amount) {
      return res.status(400).json({
        success: false,
        message: 'اسم المعتمد ورقم الواتساب والمبلغ مطلوبة'
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

    const approved = await prisma.approved.create({
      data: {
        userId: userId || req.user?.id,
        approvedName,
        whatsappNumber,
        amount: parseFloat(amount),
        approvalDate: approvalDate ? new Date(approvalDate) : null,
        numberOfUsers: numberOfUsers || 0,
        countries: countries ? JSON.parse(countries) : [],
        address,
        notes
      }
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'CREATE',
      resource: 'approved',
      resourceId: approved.id,
      newValues: approved,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء المعتمد بنجاح',
      data: approved
    });
  } catch (error) {
    console.error('Create approved error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء المعتمد'
    });
  }
};

// Update approved
export const updateApproved = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const existingApproved = await prisma.approved.findUnique({
      where: { id }
    });

    if (!existingApproved) {
      return res.status(404).json({
        success: false,
        message: 'المعتمد غير موجود'
      });
    }

    // Handle numeric and date fields
    if (updateData.amount) {
      updateData.amount = parseFloat(updateData.amount);
    }
    if (updateData.numberOfUsers) {
      updateData.numberOfUsers = parseInt(updateData.numberOfUsers);
    }
    if (updateData.approvalDate) {
      updateData.approvalDate = new Date(updateData.approvalDate);
    }
    if (updateData.countries && typeof updateData.countries === 'string') {
      updateData.countries = JSON.parse(updateData.countries);
    }

    const approved = await prisma.approved.update({
      where: { id },
      data: updateData
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'UPDATE',
      resource: 'approved',
      resourceId: id,
      oldValues: existingApproved,
      newValues: updateData,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'تم تحديث المعتمد بنجاح',
      data: approved
    });
  } catch (error) {
    console.error('Update approved error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث المعتمد'
    });
  }
};

// Delete approved
export const deleteApproved = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const approved = await prisma.approved.findUnique({
      where: { id }
    });

    if (!approved) {
      return res.status(404).json({
        success: false,
        message: 'المعتمد غير موجود'
      });
    }

    await prisma.approved.delete({
      where: { id }
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'DELETE',
      resource: 'approved',
      resourceId: id,
      oldValues: approved,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'تم حذف المعتمد بنجاح'
    });
  } catch (error) {
    console.error('Delete approved error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف المعتمد'
    });
  }
};

// Toggle approved status
export const toggleApprovedStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const approved = await prisma.approved.findUnique({
      where: { id }
    });

    if (!approved) {
      return res.status(404).json({
        success: false,
        message: 'المعتمد غير موجود'
      });
    }

    const updated = await prisma.approved.update({
      where: { id },
      data: {
        isActive: !approved.isActive
      }
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'UPDATE',
      resource: 'approved',
      resourceId: id,
      oldValues: { isActive: approved.isActive },
      newValues: { isActive: updated.isActive },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: `تم ${updated.isActive ? 'تفعيل' : 'إلغاء تفعيل'} المعتمد بنجاح`,
      data: updated
    });
  } catch (error) {
    console.error('Toggle approved status error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تغيير حالة المعتمد'
    });
  }
};

// Get all unique countries
export const getAllCountries = async (req: AuthRequest, res: Response) => {
  try {
    const approved = await prisma.approved.findMany({
      select: {
        countries: true
      },
      where: {
        isActive: true
      }
    });

    const countriesSet = new Set<string>();
    approved.forEach(a => {
      if (a.countries && Array.isArray(a.countries)) {
        (a.countries as string[]).forEach(c => countriesSet.add(c));
      }
    });

    res.json({
      success: true,
      data: Array.from(countriesSet).sort()
    });
  } catch (error) {
    console.error('Get countries error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الدول'
    });
  }
};
