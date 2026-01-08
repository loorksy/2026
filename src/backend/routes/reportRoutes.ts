import { Router } from 'express';
import * as reportController from '../controllers/reportController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All report routes require authentication
router.use(authenticate);

router.get('/payroll', authorize(['reports:READ']), reportController.getPayrollReport);
router.get('/shipping', authorize(['reports:READ']), reportController.getShippingReport);
router.get('/profits', authorize(['reports:READ']), reportController.getProfitsReport);
router.get('/credits', authorize(['reports:READ']), reportController.getCreditsReport);
router.get('/companies', authorize(['reports:READ']), reportController.getCompaniesReport);
router.get('/exchange-diffs', authorize(['reports:READ']), reportController.getExchangeDiffsReport);
router.get('/dashboard-stats', reportController.getDashboardStats);

export default router;
