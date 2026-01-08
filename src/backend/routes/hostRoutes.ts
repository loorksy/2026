import express from 'express';
import {
  getAllHosts,
  getHostById,
  createHost,
  updateHost,
  deleteHost,
  toggleHostStatus
} from '../controllers/hostController';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';

const router = express.Router();

router.get(
  '/',
  authenticate,
  requirePermission('hosts', 'READ'),
  getAllHosts
);

router.get(
  '/:id',
  authenticate,
  requirePermission('hosts', 'READ'),
  getHostById
);

router.post(
  '/',
  authenticate,
  requirePermission('hosts', 'CREATE'),
  createHost
);

router.put(
  '/:id',
  authenticate,
  requirePermission('hosts', 'UPDATE'),
  updateHost
);

router.patch(
  '/:id/toggle-status',
  authenticate,
  requirePermission('hosts', 'UPDATE'),
  toggleHostStatus
);

router.delete(
  '/:id',
  authenticate,
  requirePermission('hosts', 'DELETE'),
  deleteHost
);

export default router;
