import { Router } from 'express';
import {
  getInventory,
  getUnitById,
  addUnit,
  discardUnit,
  quarantineUnit,
  getInventoryStats,
  matchRequest,
  reserveUnit,
  issueUnit
} from '../controllers/inventoryController';
import { authenticate } from '../middleware/auth';
import { authorize as rbac } from '../middleware/rbac';

const router = Router();

// Require valid JWT for all inventory routes
router.use(authenticate);

// View inventory and stats (Accessible to all authenticated roles)
router.get('/', getInventory);
router.get('/stats', getInventoryStats);
router.get('/unit/:id', getUnitById);

// Staff operational actions (Technicians, Managers, Admins)
router.post('/unit', rbac(['Technician', 'Manager', 'Admin']), addUnit);
router.put('/unit/:id/discard', rbac(['Technician', 'Manager', 'Admin']), discardUnit);
router.put('/unit/:id/quarantine', rbac(['Technician', 'Manager', 'Admin']), quarantineUnit);

// Matching, reservation and issuance
router.get('/match/:requestId', rbac(['Technician', 'Manager', 'Admin']), matchRequest);
router.post('/reserve/:requestId', rbac(['Technician', 'Manager', 'Admin']), reserveUnit);
router.post('/issue/:requestId', rbac(['Technician', 'Manager', 'Admin']), issueUnit);

export default router;
