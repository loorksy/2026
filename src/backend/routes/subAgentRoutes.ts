import express from 'express';
import {
  getAllSubAgents,
  getSubAgentById,
  createSubAgent,
  updateSubAgent,
  deleteSubAgent,
  toggleSubAgentStatus,
  regenerateActivationCode
} from '../controllers/subAgentController';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';

const router = express.Router();

router.get(
  '/',
  authenticate,
  requirePermission('sub_agents', 'READ'),
  getAllSubAgents
);

router.get(
  '/:id',
  authenticate,
  requirePermission('sub_agents', 'READ'),
  getSubAgentById
);

router.post(
  '/',
  authenticate,
  requirePermission('sub_agents', 'CREATE'),
  createSubAgent
);

router.put(
  '/:id',
  authenticate,
  requirePermission('sub_agents', 'UPDATE'),
  updateSubAgent
);

router.patch(
  '/:id/toggle-status',
  authenticate,
  requirePermission('sub_agents', 'UPDATE'),
  toggleSubAgentStatus
);

router.post(
  '/:id/regenerate-code',
  authenticate,
  requirePermission('sub_agents', 'UPDATE'),
  regenerateActivationCode
);

router.delete(
  '/:id',
  authenticate,
  requirePermission('sub_agents', 'DELETE'),
  deleteSubAgent
);

export default router;
