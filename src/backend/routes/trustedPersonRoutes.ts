import express from 'express';
import {
  getAllTrustedPersons,
  getTrustedPersonById,
  createTrustedPerson,
  updateTrustedPerson,
  deleteTrustedPerson,
  toggleTrustedPersonStatus
} from '../controllers/trustedPersonController';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';

const router = express.Router();

router.get(
  '/',
  authenticate,
  requirePermission('trusted_persons', 'READ'),
  getAllTrustedPersons
);

router.get(
  '/:id',
  authenticate,
  requirePermission('trusted_persons', 'READ'),
  getTrustedPersonById
);

router.post(
  '/',
  authenticate,
  requirePermission('trusted_persons', 'CREATE'),
  createTrustedPerson
);

router.put(
  '/:id',
  authenticate,
  requirePermission('trusted_persons', 'UPDATE'),
  updateTrustedPerson
);

router.patch(
  '/:id/toggle-status',
  authenticate,
  requirePermission('trusted_persons', 'UPDATE'),
  toggleTrustedPersonStatus
);

router.delete(
  '/:id',
  authenticate,
  requirePermission('trusted_persons', 'DELETE'),
  deleteTrustedPerson
);

export default router;
