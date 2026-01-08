import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import roleRoutes from './routes/roleRoutes';
import permissionRoutes from './routes/permissionRoutes';
import userRoutes from './routes/userRoutes';
import auditLogRoutes from './routes/auditLogRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit-logs', auditLogRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'RBAC System API is running',
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'الصفحة غير موجودة'
  });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'حدث خطأ في الخادم'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 API Health: http://localhost:${PORT}/api/health`);
});

export default app;
