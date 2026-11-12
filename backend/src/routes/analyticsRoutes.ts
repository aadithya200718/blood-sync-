import { Router } from 'express';
import { getDashboardAnalytics, getInventoryBreakdown } from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';
import { authorize as rbac } from '../middleware/rbac';

const router = Router();

router.use(authenticate);

const staffRoles = ['Technician', 'Manager', 'Admin', 'Auditor'];

router.get('/dashboard', rbac(staffRoles), getDashboardAnalytics);
router.get('/inventory', rbac(staffRoles), getInventoryBreakdown);

export default router;
