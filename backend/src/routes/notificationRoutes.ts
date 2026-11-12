import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  acknowledgeAll
} from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';
import { authorize as rbac } from '../middleware/rbac';

const router = Router();

router.use(authenticate);

// Staff notification endpoints
router.get('/', rbac(['Technician', 'Manager', 'Admin', 'Auditor']), getNotifications);
router.put('/:id/read', rbac(['Technician', 'Manager', 'Admin', 'Auditor']), markAsRead);
router.post('/acknowledge-all', rbac(['Technician', 'Manager', 'Admin', 'Auditor']), acknowledgeAll);

export default router;
