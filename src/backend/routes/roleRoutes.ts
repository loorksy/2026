import { Router } from 'express';
import {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole
} from '../controllers/roleController';
import { authenticate, authorize } from '../middleware/auth';
import { auditLog } from '../middleware/auditLog';

const router = Router();

router.get(
  '/',
  authenticate,
  authorize('roles', 'READ'),
  getAllRoles
);

router.get(
  '/:id',
  authenticate,
  authorize('roles', 'READ'),
  getRoleById
);

router.post(
  '/',
  authenticate,
  authorize('roles', 'CREATE'),
  auditLog('roles', 'CREATE'),
  createRole
);

router.put(
  '/:id',
  authenticate,
  authorize('roles', 'UPDATE'),
  auditLog('roles', 'UPDATE'),
  updateRole
);

router.delete(
  '/:id',
  authenticate,
  authorize('roles', 'DELETE'),
  auditLog('roles', 'DELETE'),
  deleteRole
);

export default router;
