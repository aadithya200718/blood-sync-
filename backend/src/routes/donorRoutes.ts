import { Router } from 'express';
import {
  getDonors,
  getDonorById,
  createDonor,
  updateDonor,
  deleteDonor
} from '../controllers/donorController';
import { authenticate } from '../middleware/auth';
import { authorize as rbac } from '../middleware/rbac';

const router = Router();

router.use(authenticate);

const staffRoles = ['Technician', 'Manager', 'Admin', 'Auditor'];
const editRoles = ['Technician', 'Manager', 'Admin'];

router.get('/', rbac(staffRoles), getDonors);
router.get('/:id', rbac(staffRoles), getDonorById);
router.post('/', rbac(editRoles), createDonor);
router.put('/:id', rbac(editRoles), updateDonor);
router.delete('/:id', rbac(['Manager', 'Admin']), deleteDonor);

export default router;
