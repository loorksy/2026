import express from 'express';
import {
  getAllApproved,
  getApprovedById,
  createApproved,
  updateApproved,
  deleteApproved,
  toggleApprovedStatus,
  getAllCountries
} from '../controllers/approvedController';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';

const router = express.Router();

router.get(
  '/',
  authenticate,
  requirePermission('approved', 'READ'),
  getAllApproved
);

router.get(
  '/countries',
  authenticate,
  requirePermission('approved', 'READ'),
  getAllCountries
);

router.get(
  '/:id',
  authenticate,
  requirePermission('approved', 'READ'),
  getApprovedById
);

router.post(
  '/',
  authenticate,
  requirePermission('approved', 'CREATE'),
  createApproved
);

router.put(
  '/:id',
  authenticate,
  requirePermission('approved', 'UPDATE'),
  updateApproved
);

router.patch(
  '/:id/toggle-status',
  authenticate,
  requirePermission('approved', 'UPDATE'),
  toggleApprovedStatus
);

router.delete(
  '/:id',
  authenticate,
  requirePermission('approved', 'DELETE'),
  deleteApproved
);

export default router;
