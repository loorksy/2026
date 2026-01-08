import { Router } from 'express';
import {
  getAllPermissions,
  getPermissionById
} from '../controllers/permissionController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get(
  '/',
  authenticate,
  authorize('permissions', 'READ'),
  getAllPermissions
);

router.get(
  '/:id',
  authenticate,
  authorize('permissions', 'READ'),
  getPermissionById
);

export default router;
