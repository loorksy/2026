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
app.use('/api/hosts', hostRoutes);
app.use('/api/sub-agents', subAgentRoutes);
app.use('/api/approved', approvedRoutes);
app.use('/api/trusted-persons', trustedPersonRoutes);
app.use('/api/supervisors', supervisorRoutes);
app.use('/api/marketers', marketerRoutes);
app.use('/api/manual-transfers', manualTransferRoutes);
app.use('/api/transfer-records', transferRecordRoutes);
app.use('/api/reports', reportRoutes);

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
