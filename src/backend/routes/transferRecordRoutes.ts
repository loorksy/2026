import express from 'express';
import {
  getTransferRecordsByTransfer,
  createTransferRecord,
  updateTransferRecord,
  confirmTransferRecord,
  deleteTransferRecord,
  bulkCreateTransferRecords
} from '../controllers/transferRecordController';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';

const router = express.Router();

router.get(
  '/transfer/:transferId',
  authenticate,
  requirePermission('transfer_records', 'READ'),
  getTransferRecordsByTransfer
);

router.post(
  '/',
  authenticate,
  requirePermission('transfer_records', 'CREATE'),
  createTransferRecord
);

router.post(
  '/bulk',
  authenticate,
  requirePermission('transfer_records', 'CREATE'),
  bulkCreateTransferRecords
);

router.put(
  '/:id',
  authenticate,
  requirePermission('transfer_records', 'UPDATE'),
  updateTransferRecord
);

router.patch(
  '/:id/confirm',
  authenticate,
  requirePermission('transfer_records', 'UPDATE'),
  confirmTransferRecord
);

router.delete(
  '/:id',
  authenticate,
  requirePermission('transfer_records', 'DELETE'),
  deleteTransferRecord
);

export default router;
