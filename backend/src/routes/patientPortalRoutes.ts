import { Router } from 'express';
import {
  getPatientProfile,
  getPatientRequests,
  createPatientBloodRequest,
  cancelPatientBloodRequest
} from '../controllers/patientPortalController';
import { authenticate } from '../middleware/auth';
import { authorize as rbac } from '../middleware/rbac';

const router = Router();

router.use(authenticate);

// Restricted to authenticated Patients
router.get('/profile', rbac(['Patient']), getPatientProfile);
router.get('/requests', rbac(['Patient']), getPatientRequests);
router.post('/requests', rbac(['Patient']), createPatientBloodRequest);
router.post('/requests/:id/cancel', rbac(['Patient']), cancelPatientBloodRequest);

export default router;
