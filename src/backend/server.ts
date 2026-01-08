import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import roleRoutes from './routes/roleRoutes';
import permissionRoutes from './routes/permissionRoutes';
import userRoutes from './routes/userRoutes';
import auditLogRoutes from './routes/auditLogRoutes';
import hostRoutes from './routes/hostRoutes';
import subAgentRoutes from './routes/subAgentRoutes';
import approvedRoutes from './routes/approvedRoutes';
import trustedPersonRoutes from './routes/trustedPersonRoutes';
import supervisorRoutes from './routes/supervisorRoutes';
import marketerRoutes from './routes/marketerRoutes';
import manualTransferRoutes from './routes/manualTransferRoutes';
import transferRecordRoutes from './routes/transferRecordRoutes';
import reportRoutes from './routes/reportRoutes';
import { corsMiddleware, securityHeaders, sanitizeRequest, validateContentType } from './middleware/security';
import { apiRateLimiter, authRateLimiter, passwordResetRateLimiter } from './middleware/rateLimiter';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(corsMiddleware);
app.use(securityHeaders);
app.use(sanitizeRequest);

// Body parsing
app.use(express.json({ limit: '10kb' })); // Limit body size to 10kb
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Validate content type for POST/PUT/PATCH
app.use(validateContentType);

// Rate limiting
app.use('/api', apiRateLimiter);
app.use('/api/auth/login', authRateLimiter);
app.use('/api/auth/register', authRateLimiter);
app.use('/api/auth/forgot-password', passwordResetRateLimiter);
app.use('/api/auth/reset-password', passwordResetRateLimiter);

// Health check (no auth required)
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'RBAC System API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/hosts', hostRoutes);
app.use('/api/sub-agents', subAgentRoutes);
app.use('/api/approved', approvedRoutes);
app.use('/api/trusted-persons', trustedPersonRoutes);
app.use('/api/supervisors', supervisorRoutes);
app.use('/api/marketers', marketerRoutes);
app.use('/api/manual-transfers', manualTransferRoutes);
app.use('/api/transfer-records', transferRecordRoutes);
app.use('/api/reports', reportRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'الصفحة غير موجودة'
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  // Handle JSON parsing errors
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'تنسيق البيانات غير صحيح'
    });
  }
  
  // Handle rate limit errors
  if (err.status === 429) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later'
    });
  }
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'حدث خطأ في الخادم' 
      : err.message || 'حدث خطأ في الخادم'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 API Health: http://localhost:${PORT}/api/health`);
});

export default app;
