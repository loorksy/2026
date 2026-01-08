import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  assignRole,
  revokeRole
} from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';
import { auditLog } from '../middleware/auditLog';

const router = Router();

router.get(
  '/',
  authenticate,
  authorize('users', 'READ'),
  getAllUsers
);

router.get(
  '/:id',
  authenticate,
  authorize('users', 'READ'),
  getUserById
);

router.post(
  '/',
  authenticate,
  authorize('users', 'CREATE'),
  auditLog('users', 'CREATE'),
  createUser
);

router.put(
  '/:id',
  authenticate,
  authorize('users', 'UPDATE'),
  auditLog('users', 'UPDATE'),
  updateUser
);

router.delete(
  '/:id',
  authenticate,
  authorize('users', 'DELETE'),
  auditLog('users', 'DELETE'),
  deleteUser
);

router.post(
  '/assign-role',
  authenticate,
  authorize('users', 'UPDATE'),
  auditLog('user_roles', 'ASSIGN'),
  assignRole
);

router.post(
  '/revoke-role',
  authenticate,
  authorize('users', 'UPDATE'),
  auditLog('user_roles', 'REVOKE'),
  revokeRole
);

export default router;
