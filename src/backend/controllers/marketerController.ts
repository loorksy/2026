import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../middleware/auditLog';

const prisma = new PrismaClient();

// Get all marketers
export const getAllMarketers = async (req: AuthRequest, res: Response) => {
  try {
    const { isActive, search, marketingMethod } = req.query;

    const where: any = {};
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { fullName: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    if (marketingMethod) {
      where.marketingMethods = { contains: String(marketingMethod) };
    }

    const marketers = await prisma.marketer.findMany({
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
      data: marketers
    });
  } catch (error) {
    console.error('Get marketers error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب المسوقين'
    });
  }
};

// Get marketer by ID
export const getMarketerById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const marketer = await prisma.marketer.findUnique({
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

    if (!marketer) {
      return res.status(404).json({
        success: false,
        message: 'المسوق غير موجود'
      });
    }

    res.json({
      success: true,
      data: marketer
    });
  } catch (error) {
    console.error('Get marketer error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب المسوق'
    });
  }
};

// Create new marketer
export const createMarketer = async (req: AuthRequest, res: Response) => {
  try {
    const {
      userId,
      fullName,
      numberOfPeople,
      marketingMethods,
      marketingSalary,
      profitPerCustomer
    } = req.body;

    if (!fullName) {
      return res.status(400).json({
        success: false,
        message: 'الاسم الكامل مطلوب'
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

    const marketer = await prisma.marketer.create({
      data: {
        userId: userId || req.user?.id,
        fullName,
        numberOfPeople: numberOfPeople || 0,
        marketingMethods: marketingMethods ? JSON.parse(marketingMethods) : [],
        marketingSalary: marketingSalary ? parseFloat(marketingSalary) : 0,
        profitPerCustomer: profitPerCustomer ? parseFloat(profitPerCustomer) : 0
      }
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'CREATE',
      resource: 'marketers',
      resourceId: marketer.id,
      newValues: marketer,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء المسوق بنجاح',
      data: marketer
    });
  } catch (error) {
    console.error('Create marketer error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء المسوق'
    });
  }
};

// Update marketer
export const updateMarketer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const existingMarketer = await prisma.marketer.findUnique({
      where: { id }
    });

    if (!existingMarketer) {
      return res.status(404).json({
        success: false,
        message: 'المسوق غير موجود'
      });
    }

    // Handle numeric and array fields
    if (updateData.numberOfPeople) {
      updateData.numberOfPeople = parseInt(updateData.numberOfPeople);
    }
    if (updateData.marketingSalary) {
      updateData.marketingSalary = parseFloat(updateData.marketingSalary);
    }
    if (updateData.profitPerCustomer) {
      updateData.profitPerCustomer = parseFloat(updateData.profitPerCustomer);
    }
    if (updateData.marketingMethods && typeof updateData.marketingMethods === 'string') {
      updateData.marketingMethods = JSON.parse(updateData.marketingMethods);
    }

    const marketer = await prisma.marketer.update({
      where: { id },
      data: updateData
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'UPDATE',
      resource: 'marketers',
      resourceId: id,
      oldValues: existingMarketer,
      newValues: updateData,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'تم تحديث المسوق بنجاح',
      data: marketer
    });
  } catch (error) {
    console.error('Update marketer error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث المسوق'
    });
  }
};

// Delete marketer
export const deleteMarketer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const marketer = await prisma.marketer.findUnique({
      where: { id }
    });

    if (!marketer) {
      return res.status(404).json({
        success: false,
        message: 'المسوق غير موجود'
      });
    }

    await prisma.marketer.delete({
      where: { id }
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'DELETE',
      resource: 'marketers',
      resourceId: id,
      oldValues: marketer,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'تم حذف المسوق بنجاح'
    });
  } catch (error) {
    console.error('Delete marketer error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف المسوق'
    });
  }
};

// Toggle marketer status
export const toggleMarketerStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const marketer = await prisma.marketer.findUnique({
      where: { id }
    });

    if (!marketer) {
      return res.status(404).json({
        success: false,
        message: 'المسوق غير موجود'
      });
    }

    const updated = await prisma.marketer.update({
      where: { id },
      data: {
        isActive: !marketer.isActive
      }
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'UPDATE',
      resource: 'marketers',
      resourceId: id,
      oldValues: { isActive: marketer.isActive },
      newValues: { isActive: updated.isActive },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: `تم ${updated.isActive ? 'تفعيل' : 'إلغاء تفعيل'} المسوق بنجاح`,
      data: updated
    });
  } catch (error) {
    console.error('Toggle marketer status error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تغيير حالة المسوق'
    });
  }
};

// Get marketer statistics
export const getMarketerStats = async (req: AuthRequest, res: Response) => {
  try {
    const totalMarketers = await prisma.marketer.count({
      where: { isActive: true }
    });

    const totalPeople = await prisma.marketer.aggregate({
      where: { isActive: true },
      _sum: {
        numberOfPeople: true
      }
    });

    const totalMarketingSalary = await prisma.marketer.aggregate({
      where: { isActive: true },
      _sum: {
        marketingSalary: true
      }
    });

    const totalProfit = await prisma.marketer.aggregate({
      where: { isActive: true },
      _sum: {
        profitPerCustomer: true
      }
    });

    res.json({
      success: true,
      data: {
        totalMarketers,
        totalPeople: totalPeople._sum.numberOfPeople || 0,
        totalMarketingSalary: totalMarketingSalary._sum.marketingSalary || 0,
        totalProfit: totalProfit._sum.profitPerCustomer || 0
      }
    });
  } catch (error) {
    console.error('Get marketer stats error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب إحصائيات المسوقين'
    });
  }
};

// Get all unique marketing methods
export const getAllMarketingMethods = async (req: AuthRequest, res: Response) => {
  try {
    const marketers = await prisma.marketer.findMany({
      select: {
        marketingMethods: true
      },
      where: {
        isActive: true
      }
    });

    const methodsSet = new Set<string>();
    marketers.forEach(m => {
      if (m.marketingMethods && Array.isArray(m.marketingMethods)) {
        (m.marketingMethods as string[]).forEach(c => methodsSet.add(c));
      }
    });

    res.json({
      success: true,
      data: Array.from(methodsSet).sort()
    });
  } catch (error) {
    console.error('Get marketing methods error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب طرق التسويق'
    });
  }
};
