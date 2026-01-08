import { Router } from 'express';
import {
  getAuditLogs,
  getAuditLogById,
  getAuditLogStats
} from '../controllers/auditLogController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get(
  '/',
  authenticate,
  authorize('audit_logs', 'READ'),
  getAuditLogs
);

router.get(
  '/stats',
  authenticate,
  authorize('audit_logs', 'READ'),
  getAuditLogStats
);

router.get(
  '/:id',
  authenticate,
  authorize('audit_logs', 'READ'),
  getAuditLogById
);

export default router;
