import express from 'express';
import {
  getAllManualTransfers,
  getManualTransferById,
  createManualTransfer,
  updateManualTransfer,
  updateTransferStatus,
  deleteManualTransfer,
  getTransfersByPeriod
} from '../controllers/manualTransferController';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';

const router = express.Router();

router.get(
  '/',
  authenticate,
  requirePermission('manual_transfers', 'READ'),
  getAllManualTransfers
);

router.get(
  '/period/:period',
  authenticate,
  requirePermission('manual_transfers', 'READ'),
  getTransfersByPeriod
);

router.get(
  '/:id',
  authenticate,
  requirePermission('manual_transfers', 'READ'),
  getManualTransferById
);

router.post(
  '/',
  authenticate,
  requirePermission('manual_transfers', 'CREATE'),
  createManualTransfer
);

router.put(
  '/:id',
  authenticate,
  requirePermission('manual_transfers', 'UPDATE'),
  updateManualTransfer
);

router.patch(
  '/:id/status',
  authenticate,
  requirePermission('manual_transfers', 'UPDATE'),
  updateTransferStatus
);

router.delete(
  '/:id',
  authenticate,
  requirePermission('manual_transfers', 'DELETE'),
  deleteManualTransfer
);

export default router;
