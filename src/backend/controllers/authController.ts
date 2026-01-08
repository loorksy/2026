import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../middleware/auditLog';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';

// Validation schemas
const loginSchema = {
  email: { type: 'string', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  password: { type: 'string', required: true, minLength: 6 }
};

const registerSchema = {
  email: { type: 'string', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  username: { type: 'string', required: true, minLength: 3, maxLength: 50 },
  password: { type: 'string', required: true, minLength: 8 },
  firstName: { type: 'string', required: false, maxLength: 100 },
  lastName: { type: 'string', required: false, maxLength: 100 },
  userType: { type: 'string', required: false }
};

const passwordChangeSchema = {
  currentPassword: { type: 'string', required: true },
  newPassword: { type: 'string', required: true, minLength: 8 },
  confirmPassword: { type: 'string', required: true }
};

const resetPasswordSchema = {
  token: { type: 'string', required: true },
  password: { type: 'string', required: true, minLength: 8 },
  confirmPassword: { type: 'string', required: true }
};

// Helper function to validate input
const validateInput = (data: any, schema: any) => {
  const errors: string[] = [];
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    const rule = rules as any;
    
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`الـ ${field} مطلوب`);
      continue;
    }
    
    if (value !== undefined && value !== null) {
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(`تنسيق ${field} غير صحيح`);
      }
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(`الـ ${field} يجب أن يكون ${rule.minLength} أحرف على الأقل`);
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`الـ ${field} يجب أن يكون ${rule.maxLength} أحرف على الأكثر`);
      }
    }
  }
  
  return errors;
};

// Helper function to generate tokens
const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

// Helper function to create session
const createSession = async (
  userId: string,
  token: string,
  refreshToken: string,
  req: Request
) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  const deviceInfo = req.headers['user-agent'] || 'Unknown';
  const ipAddress = req.ip || req.socket.remoteAddress || 'Unknown';
  
  await prisma.session.create({
    data: {
      userId,
      token,
      refreshToken,
      deviceInfo,
      ipAddress,
      expiresAt
    }
  });
};

// Helper function to cleanup expired sessions
const cleanupExpiredSessions = async () => {
  await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date()
      }
    }
  });
};

// Register new user
export const register = async (req: Request, res: Response) => {
  try {
    const validationErrors = validateInput(req.body, registerSchema);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors.join('، ')
      });
    }

    const { email, username, password, firstName, lastName, userType } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email 
          ? 'البريد الإلكتروني مستخدم بالفعل' 
          : 'اسم المستخدم مستخدم بالفعل'
      });
    }

    // Hash password with bcrypt (12 rounds)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        firstName,
        lastName,
        userType: userType || 'Host',
        emailVerified: false
      }
    });

    // Assign default Viewer role
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

    // Create audit log
    await createAuditLog({
      userId: user.id,
      action: 'REGISTERED',
      resource: 'users',
      resourceId: user.id,
      newValues: { email, username, firstName, lastName },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح. يرجى التحقق من بريدك الإلكتروني.',
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

// Login
export const login = async (req: Request, res: Response) => {
  try {
    const validationErrors = validateInput(req.body, loginSchema);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors.join('، ')
      });
    }

    const { email, password } = req.body;

    // Find user with roles and permissions
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

    // Check if user exists
    if (!user) {
      await createAuditLog({
        action: 'LOGIN_FAILED',
        resource: 'auth',
        newValues: { email, reason: 'User not found' },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      return res.status(401).json({
        success: false,
        message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      });
    }

    // Check if account is suspended
    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'الحساب معلق. يرجى التواصل مع الإدارة.'
      });
    }

    // Check if account is inactive
    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'الحساب غير نشط. يرجى التواصل مع الإدارة.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Log failed login attempt
      await createAuditLog({
        userId: user.id,
        action: 'LOGIN_FAILED',
        resource: 'auth',
        newValues: { email, reason: 'Invalid password' },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.status(401).json({
        success: false,
        message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      });
    }

    // Check if email is verified (optional based on requirements)
    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'يرجى التحقق من بريدك الإلكتروني أولاً',
        requiresVerification: true
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Create session
    await createSession(user.id, accessToken, refreshToken, req);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Get permissions
    const permissions = user.userRoles.flatMap(ur =>
      ur.role.permissions.map(rp => ({
        resource: rp.permission.resource,
        action: rp.permission.action
      }))
    );

    const roles = user.userRoles.map(ur => ur.role.name);

    // Create audit log
    await createAuditLog({
      userId: user.id,
      action: 'LOGIN',
      resource: 'auth',
      newValues: { email, deviceInfo: req.headers['user-agent'] },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Cleanup expired sessions
    await cleanupExpiredSessions();

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: {
        token: accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          userType: user.userType,
          role: user.role,
          status: user.status,
          lastLogin: user.lastLogin,
          twoFactorEnabled: user.twoFactorEnabled,
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

// Logout
export const logout = async (req: AuthRequest, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      // Delete current session
      await prisma.session.deleteMany({
        where: { token }
      });
    }

    // Create audit log
    if (req.user) {
      await createAuditLog({
        userId: req.user.id,
        action: 'LOGOUT',
        resource: 'auth',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    }

    res.json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تسجيل الخروج'
    });
  }
};

// Logout from all devices
export const logoutAll = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح'
      });
    }

    // Delete all user sessions
    await prisma.session.deleteMany({
      where: { userId: req.user.id }
    });

    // Create audit log
    await createAuditLog({
      userId: req.user.id,
      action: 'LOGOUT_ALL',
      resource: 'auth',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'تم تسجيل الخروج من جميع الأجهزة بنجاح'
    });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تسجيل الخروج'
    });
  }
};

// Refresh token
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'رمز التحديث مطلوب'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as {
      userId: string;
      type: string;
    };

    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'رمز تحديث غير صالح'
      });
    }

    // Check if session exists
    const session = await prisma.session.findFirst({
      where: {
        userId: decoded.userId,
        refreshToken,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'انتهت الجلسة أو غير موجودة'
      });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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

    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'المستخدم غير موجود أو غير نشط'
      });
    }

    // Generate new tokens
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(user.id);

    // Update session with new refresh token
    await prisma.session.update({
      where: { id: session.id },
      data: {
        token: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    // Get permissions
    const permissions = user.userRoles.flatMap(ur =>
      ur.role.permissions.map(rp => ({
        resource: rp.permission.resource,
        action: rp.permission.action
      }))
    );

    const roles = user.userRoles.map(ur => ur.role.name);

    res.json({
      success: true,
      message: 'تم تحديث الرمز بنجاح',
      data: {
        token: newAccessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          userType: user.userType,
          role: user.role,
          roles,
          permissions
        }
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'رمز التحديث غير صالح أو منتهي'
    });
  }
};

// Forgot password
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني مطلوب'
      });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'إذا كان البريد الإلكتروني مسجلاً، ستReceive رابط إعادة التعيين'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set expiration (1 hour)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Delete old reset tokens
    await prisma.passwordReset.deleteMany({
      where: { userId: user.id }
    });

    // Create new reset token
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt
      }
    });

    // In production, send email here
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/reset-password?token=${resetToken}`;

    console.log('Reset password link:', resetLink);

    // Create audit log
    await createAuditLog({
      userId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      resource: 'auth',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'إذا كان البريد الإلكتروني مسجلاً، ستReceive رابط إعادة التعيين',
      // Only in development
      ...(process.env.NODE_ENV === 'development' && { resetLink })
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء معالجة الطلب'
    });
  }
};

// Reset password
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const validationErrors = validateInput(req.body, resetPasswordSchema);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors.join('، ')
      });
    }

    const { token, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'كلمتا المرور غير متطابقتين'
      });
    }

    // Hash the token from the URL
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid reset token
    const resetToken = await prisma.passwordReset.findFirst({
      where: {
        token: hashedToken,
        usedAt: null,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: 'رابط إعادة التعيين غير صالح أو منتهي'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword }
    });

    // Mark reset token as used
    await prisma.passwordReset.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() }
    });

    // Delete all user sessions (force logout from all devices)
    await prisma.session.deleteMany({
      where: { userId: resetToken.userId }
    });

    // Create audit log
    await createAuditLog({
      userId: resetToken.userId,
      action: 'PASSWORD_RESET',
      resource: 'auth',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'تم إعادة تعيين كلمة المرور بنجاح'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إعادة تعيين كلمة المرور'
    });
  }
};

// Verify email
export const verifyEmail = async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'رمز التحقق مطلوب'
      });
    }

    // For now, we'll just mark the user as verified
    // In production, you would verify the token properly
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح'
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true }
    });

    // Create audit log
    await createAuditLog({
      userId,
      action: 'EMAIL_VERIFIED',
      resource: 'auth',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'تم التحقق من البريد الإلكتروني بنجاح'
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء التحقق من البريد الإلكتروني'
    });
  }
};

// Resend verification email
export const resendVerification = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني تم التحقق منه بالفعل'
      });
    }

    // In production, send verification email here
    console.log('Verification email sent to:', user.email);

    // Create audit log
    await createAuditLog({
      userId: req.user.id,
      action: 'VERIFICATION_EMAIL_RESENT',
      resource: 'auth',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'تم إرسال رابط التحقق إلى بريدك الإلكتروني'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إرسال رابط التحقق'
    });
  }
};

// Get current user profile
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
        userType: true,
        role: true,
        status: true,
        lastLogin: true,
        twoFactorEnabled: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
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

// Update current user profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح'
      });
    }

    const { firstName, lastName } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        firstName: firstName || existingUser.firstName,
        lastName: lastName !== undefined ? lastName : existingUser.lastName
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        userType: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Create audit log
    await createAuditLog({
      userId: req.user.id,
      action: 'PROFILE_UPDATED',
      resource: 'users',
      resourceId: req.user.id,
      oldValues: { firstName: existingUser.firstName, lastName: existingUser.lastName },
      newValues: { firstName, lastName },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'تم تحديث الملف الشخصي بنجاح',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث الملف الشخصي'
    });
  }
};

// Change password
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح'
      });
    }

    const validationErrors = validateInput(req.body, passwordChangeSchema);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors.join('، ')
      });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'كلمتا المرور الجديدة غير متطابقتين'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      await createAuditLog({
        userId: req.user.id,
        action: 'PASSWORD_CHANGE_FAILED',
        resource: 'auth',
        newValues: { reason: 'Invalid current password' },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.status(400).json({
        success: false,
        message: 'كلمة المرور الحالية غير صحيحة'
      });
    }

    // Check if new password is same as old
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور الجديدة يجب أن تكون مختلفة عن كلمة المرور الحالية'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    // Delete all sessions except current one (optional - security measure)
    const currentToken = req.headers.authorization?.replace('Bearer ', '');
    await prisma.session.deleteMany({
      where: {
        userId: req.user.id,
        token: { not: currentToken }
      }
    });

    // Create audit log
    await createAuditLog({
      userId: req.user.id,
      action: 'PASSWORD_CHANGED',
      resource: 'auth',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تغيير كلمة المرور'
    });
  }
};

// Get user's active sessions
export const getMySessions = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح'
      });
    }

    const sessions = await prisma.session.findMany({
      where: {
        userId: req.user.id,
        expiresAt: {
          gt: new Date()
        }
      },
      select: {
        id: true,
        deviceInfo: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الجلسات'
    });
  }
};

// Revoke a specific session
export const revokeSession = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح'
      });
    }

    const { sessionId } = req.params;

    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        userId: req.user.id
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'ال الجلسة غير موجودة'
      });
    }

    await prisma.session.delete({
      where: { id: sessionId }
    });

    // Create audit log
    await createAuditLog({
      userId: req.user.id,
      action: 'SESSION_REVOKED',
      resource: 'auth',
      newValues: { sessionId },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'تم إنهاء الجلسة بنجاح'
    });
  } catch (error) {
    console.error('Revoke session error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنهاء الجلسة'
    });
  }
};
