import { Router } from 'express';
import { getDashboardAnalytics, getInventoryBreakdown } from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/dashboard', getDashboardAnalytics);
router.get('/inventory', getInventoryBreakdown);

export default router;
