import { Router } from 'express';
import {
  login,
  register,
  logout,
  logoutAll,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  getCurrentUser,
  updateProfile,
  changePassword,
  getMySessions,
  revokeSession
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/login', login);
router.post('/register', register);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', authenticate, getCurrentUser);
router.put('/profile', authenticate, updateProfile);
router.put('/password', authenticate, changePassword);
router.post('/logout', authenticate, logout);
router.post('/logout-all', authenticate, logoutAll);
router.post('/refresh', refreshToken);
router.post('/verify-email', authenticate, verifyEmail);
router.post('/resend-verification', authenticate, resendVerification);
router.get('/sessions', authenticate, getMySessions);
router.delete('/sessions/:sessionId', authenticate, revokeSession);

export default router;
