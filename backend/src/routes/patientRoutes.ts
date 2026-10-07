import { Router } from 'express';
import {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient
} from '../controllers/patientController';
import { authenticate } from '../middleware/auth';
import { authorize as rbac } from '../middleware/rbac';

const router = Router();

router.use(authenticate);

router.get('/', getPatients);
router.get('/:id', getPatientById);
router.post('/', rbac(['Technician', 'Manager', 'Admin']), createPatient);
router.put('/:id', rbac(['Technician', 'Manager', 'Admin']), updatePatient);
router.delete('/:id', rbac(['Manager', 'Admin']), deletePatient);

export default router;
