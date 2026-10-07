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

router.get('/', getDonors);
router.get('/:id', getDonorById);
router.post('/', rbac(['Technician', 'Manager', 'Admin']), createDonor);
router.put('/:id', rbac(['Technician', 'Manager', 'Admin']), updateDonor);
router.delete('/:id', rbac(['Manager', 'Admin']), deleteDonor);

export default router;
