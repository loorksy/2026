import express from 'express';
import {
  getAllSupervisors,
  getSupervisorById,
  createSupervisor,
  updateSupervisor,
  deleteSupervisor,
  toggleSupervisorStatus,
  getSupervisorStats
} from '../controllers/supervisorController';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';

const router = express.Router();

router.get(
  '/',
  authenticate,
  requirePermission('supervisors', 'READ'),
  getAllSupervisors
);

router.get(
  '/stats',
  authenticate,
  requirePermission('supervisors', 'READ'),
  getSupervisorStats
);

router.get(
  '/:id',
  authenticate,
  requirePermission('supervisors', 'READ'),
  getSupervisorById
);

router.post(
  '/',
  authenticate,
  requirePermission('supervisors', 'CREATE'),
  createSupervisor
);

router.put(
  '/:id',
  authenticate,
  requirePermission('supervisors', 'UPDATE'),
  updateSupervisor
);

router.patch(
  '/:id/toggle-status',
  authenticate,
  requirePermission('supervisors', 'UPDATE'),
  toggleSupervisorStatus
);

router.delete(
  '/:id',
  authenticate,
  requirePermission('supervisors', 'DELETE'),
  deleteSupervisor
);

export default router;
