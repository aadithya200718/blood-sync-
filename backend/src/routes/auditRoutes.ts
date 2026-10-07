import { Router } from 'express';
import { getAuditLogs, getAuditSummary } from '../controllers/auditController';
import { authenticate } from '../middleware/auth';
import { authorize as rbac } from '../middleware/rbac';

const router = Router();

router.use(authenticate);

// Auditor, Manager, and Admin can review audit trail
router.get('/', rbac(['Auditor', 'Manager', 'Admin']), getAuditLogs);
router.get('/summary', rbac(['Auditor', 'Manager', 'Admin']), getAuditSummary);

export default router;
