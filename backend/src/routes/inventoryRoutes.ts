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

const staffRoles = ['Technician', 'Manager', 'Admin', 'Auditor'];
const editRoles = ['Technician', 'Manager', 'Admin'];

// View inventory and stats (Accessible strictly to staff roles)
router.get('/', rbac(staffRoles), getInventory);
router.get('/stats', rbac(staffRoles), getInventoryStats);
router.get('/unit/:id', rbac(staffRoles), getUnitById);

// Staff operational actions (Technicians, Managers, Admins)
router.post('/unit', rbac(editRoles), addUnit);
router.put('/unit/:id/discard', rbac(editRoles), discardUnit);
router.put('/unit/:id/quarantine', rbac(editRoles), quarantineUnit);

// Matching, reservation and issuance
router.get('/match/:requestId', rbac(editRoles), matchRequest);
router.post('/reserve/:requestId', rbac(editRoles), reserveUnit);
router.post('/issue/:requestId', rbac(editRoles), issueUnit);

export default router;
