import express from 'express';
import {
  getAllMarketers,
  getMarketerById,
  createMarketer,
  updateMarketer,
  deleteMarketer,
  toggleMarketerStatus,
  getMarketerStats,
  getAllMarketingMethods
} from '../controllers/marketerController';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';

const router = express.Router();

router.get(
  '/',
  authenticate,
  requirePermission('marketers', 'READ'),
  getAllMarketers
);

router.get(
  '/stats',
  authenticate,
  requirePermission('marketers', 'READ'),
  getMarketerStats
);

router.get(
  '/methods',
  authenticate,
  requirePermission('marketers', 'READ'),
  getAllMarketingMethods
);

router.get(
  '/:id',
  authenticate,
  requirePermission('marketers', 'READ'),
  getMarketerById
);

router.post(
  '/',
  authenticate,
  requirePermission('marketers', 'CREATE'),
  createMarketer
);

router.put(
  '/:id',
  authenticate,
  requirePermission('marketers', 'UPDATE'),
  updateMarketer
);

router.patch(
  '/:id/toggle-status',
  authenticate,
  requirePermission('marketers', 'UPDATE'),
  toggleMarketerStatus
);

router.delete(
  '/:id',
  authenticate,
  requirePermission('marketers', 'DELETE'),
  deleteMarketer
);

export default router;
