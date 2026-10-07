import { Router } from 'express';
import {
  getRequests,
  getRequestById,
  createRequest,
  updateRequestStatus,
  matchRequest,
  recordCrossmatch,
  reserveUnit,
  issueUnit,
  cancelReservation,
  getAllReservations,
  getAllIssuances
} from '../controllers/requestController';
import { authenticate } from '../middleware/auth';
import { authorize as rbac } from '../middleware/rbac';

const router = Router();

router.use(authenticate);

// View listings
router.get('/', getRequests);
router.get('/reservations/all', getAllReservations);
router.get('/issuances/all', getAllIssuances);
router.get('/:id', getRequestById);

// Create and update request lifecycle
router.post('/', rbac(['Technician', 'Manager', 'Admin']), createRequest);
router.put('/:id/status', rbac(['Technician', 'Manager', 'Admin']), updateRequestStatus);

// Clinical actions: match, crossmatch, reserve, issue, release
router.get('/:id/match', rbac(['Technician', 'Manager', 'Admin']), matchRequest);
router.post('/:id/crossmatch', rbac(['Technician', 'Manager', 'Admin']), recordCrossmatch);
router.post('/:id/reserve', rbac(['Technician', 'Manager', 'Admin']), reserveUnit);
router.post('/:id/issue', rbac(['Technician', 'Manager', 'Admin']), issueUnit);
router.delete('/:id/reserve/:unitId', rbac(['Technician', 'Manager', 'Admin']), cancelReservation);

export default router;
