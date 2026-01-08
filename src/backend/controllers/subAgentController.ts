import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../middleware/auditLog';

const prisma = new PrismaClient();

// Get all sub-agents
export const getAllSubAgents = async (req: AuthRequest, res: Response) => {
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
        { roomId: { contains: String(search), mode: 'insensitive' } },
        { whatsappNumber: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const subAgents = await prisma.subAgent.findMany({
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
      data: subAgents
    });
  } catch (error) {
    console.error('Get sub-agents error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الوكلاء الفرعيين'
    });
  }
};

// Get sub-agent by ID
export const getSubAgentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const subAgent = await prisma.subAgent.findUnique({
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

    if (!subAgent) {
      return res.status(404).json({
        success: false,
        message: 'الوكيل الفرعي غير موجود'
      });
    }

    res.json({
      success: true,
      data: subAgent
    });
  } catch (error) {
    console.error('Get sub-agent error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الوكيل الفرعي'
    });
  }
};

// Create new sub-agent
export const createSubAgent = async (req: AuthRequest, res: Response) => {
  try {
    const {
      userId,
      roomId,
      activationCode,
      whatsappNumber,
      commissionRate,
      agencyName,
      notes,
      numberOfUsers
    } = req.body;

    if (!roomId || !activationCode || !whatsappNumber || !agencyName || !commissionRate) {
      return res.status(400).json({
        success: false,
        message: 'معرف الغرفة ورمز التفعيل ورقم الواتساب واسم الوكالة ونسبة العمولة مطلوبة'
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

    // Check for duplicate roomId
    const existingSubAgent = await prisma.subAgent.findFirst({
      where: { roomId }
    });

    if (existingSubAgent) {
      return res.status(400).json({
        success: false,
        message: 'معرف الغرفة مستخدم بالفعل'
      });
    }

    const subAgent = await prisma.subAgent.create({
      data: {
        userId: userId || req.user?.id,
        roomId,
        activationCode,
        whatsappNumber,
        commissionRate: parseFloat(commissionRate),
        agencyName,
        notes,
        numberOfUsers: numberOfUsers || 0
      }
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'CREATE',
      resource: 'sub_agents',
      resourceId: subAgent.id,
      newValues: subAgent,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الوكيل الفرعي بنجاح',
      data: subAgent
    });
  } catch (error) {
    console.error('Create sub-agent error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء الوكيل الفرعي'
    });
  }
};

// Update sub-agent
export const updateSubAgent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const existingSubAgent = await prisma.subAgent.findUnique({
      where: { id }
    });

    if (!existingSubAgent) {
      return res.status(404).json({
        success: false,
        message: 'الوكيل الفرعي غير موجود'
      });
    }

    // Handle numeric fields
    if (updateData.commissionRate) {
      updateData.commissionRate = parseFloat(updateData.commissionRate);
    }
    if (updateData.totalAgencyAmount) {
      updateData.totalAgencyAmount = parseFloat(updateData.totalAgencyAmount);
    }
    if (updateData.numberOfUsers) {
      updateData.numberOfUsers = parseInt(updateData.numberOfUsers);
    }

    const subAgent = await prisma.subAgent.update({
      where: { id },
      data: updateData
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'UPDATE',
      resource: 'sub_agents',
      resourceId: id,
      oldValues: existingSubAgent,
      newValues: updateData,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'تم تحديث الوكيل الفرعي بنجاح',
      data: subAgent
    });
  } catch (error) {
    console.error('Update sub-agent error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث الوكيل الفرعي'
    });
  }
};

// Delete sub-agent
export const deleteSubAgent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const subAgent = await prisma.subAgent.findUnique({
      where: { id }
    });

    if (!subAgent) {
      return res.status(404).json({
        success: false,
        message: 'الوكيل الفرعي غير موجود'
      });
    }

    await prisma.subAgent.delete({
      where: { id }
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'DELETE',
      resource: 'sub_agents',
      resourceId: id,
      oldValues: subAgent,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'تم حذف الوكيل الفرعي بنجاح'
    });
  } catch (error) {
    console.error('Delete sub-agent error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف الوكيل الفرعي'
    });
  }
};

// Regenerate activation code
export const regenerateActivationCode = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const subAgent = await prisma.subAgent.findUnique({
      where: { id }
    });

    if (!subAgent) {
      return res.status(404).json({
        success: false,
        message: 'الوكيل الفرعي غير موجود'
      });
    }

    const newActivationCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    const updated = await prisma.subAgent.update({
      where: { id },
      data: {
        activationCode: newActivationCode
      }
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'REGENERATE_ACTIVATION_CODE',
      resource: 'sub_agents',
      resourceId: id,
      newValues: { activationCode: newActivationCode },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'تم إعادة توليد رمز التفعيل بنجاح',
      data: {
        activationCode: newActivationCode
      }
    });
  } catch (error) {
    console.error('Regenerate activation code error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إعادة توليد رمز التفعيل'
    });
  }
};

// Toggle sub-agent status
export const toggleSubAgentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const subAgent = await prisma.subAgent.findUnique({
      where: { id }
    });

    if (!subAgent) {
      return res.status(404).json({
        success: false,
        message: 'الوكيل الفرعي غير موجود'
      });
    }

    const updated = await prisma.subAgent.update({
      where: { id },
      data: {
        isActive: !subAgent.isActive
      }
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'UPDATE',
      resource: 'sub_agents',
      resourceId: id,
      oldValues: { isActive: subAgent.isActive },
      newValues: { isActive: updated.isActive },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: `تم ${updated.isActive ? 'تفعيل' : 'إلغاء تفعيل'} الوكيل الفرعي بنجاح`,
      data: updated
    });
  } catch (error) {
    console.error('Toggle sub-agent status error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تغيير حالة الوكيل الفرعي'
    });
  }
};
