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

const staffRoles = ['Technician', 'Manager', 'Admin', 'Auditor'];
const editRoles = ['Technician', 'Manager', 'Admin'];

router.get('/', rbac(staffRoles), getAlerts);
router.put('/:id/acknowledge', rbac(editRoles), acknowledgeAlert);
router.put('/:id/resolve', rbac(editRoles), resolveAlert);
router.put('/:id/dismiss', rbac(['Manager', 'Admin']), dismissAlert);
router.post('/run-checks', rbac(editRoles), runChecks);

export default router;
