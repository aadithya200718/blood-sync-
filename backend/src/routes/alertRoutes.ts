import { Router } from 'express';
import {
  getAlerts,
  acknowledgeAlert,
  resolveAlert,
  dismissAlert,
  runChecks
} from '../controllers/alertController';
import { authenticate } from '../middleware/auth';
import { authorize as rbac } from '../middleware/rbac';

const router = Router();

router.use(authenticate);

router.get('/', getAlerts);
router.put('/:id/acknowledge', rbac(['Technician', 'Manager', 'Admin']), acknowledgeAlert);
router.put('/:id/resolve', rbac(['Technician', 'Manager', 'Admin']), resolveAlert);
router.put('/:id/dismiss', rbac(['Manager', 'Admin']), dismissAlert);
router.post('/run-checks', rbac(['Technician', 'Manager', 'Admin']), runChecks);

export default router;
