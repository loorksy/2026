import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني وكلمة المرور مطلوبان'
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    const permissions = user.userRoles.flatMap(ur =>
      ur.role.permissions.map(rp => ({
        resource: rp.permission.resource,
        action: rp.permission.action
      }))
    );

    const roles = user.userRoles.map(ur => ur.role.name);

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          roles,
          permissions
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تسجيل الدخول'
    });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, username, password, firstName, lastName } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني واسم المستخدم وكلمة المرور مطلوبة'
      });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'المستخدم موجود بالفعل'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        firstName,
        lastName
      }
    });

    const viewerRole = await prisma.role.findUnique({
      where: { name: 'Viewer' }
    });

    if (viewerRole) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: viewerRole.id
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName
        }
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء الحساب'
    });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    const permissions = user.userRoles.flatMap(ur =>
      ur.role.permissions.map(rp => ({
        resource: rp.permission.resource,
        action: rp.permission.action
      }))
    );

    const roles = user.userRoles.map(ur => ({
      id: ur.role.id,
      name: ur.role.name
    }));

    res.json({
      success: true,
      data: {
        ...user,
        roles,
        permissions
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب بيانات المستخدم'
    });
  }
};
