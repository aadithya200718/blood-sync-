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

const staffRoles = ['Technician', 'Manager', 'Admin', 'Auditor'];
const editRoles = ['Technician', 'Manager', 'Admin'];

// View listings (Staff only)
router.get('/', rbac(staffRoles), getRequests);
router.get('/reservations/all', rbac(staffRoles), getAllReservations);
router.get('/issuances/all', rbac(staffRoles), getAllIssuances);
router.get('/:id', rbac(staffRoles), getRequestById);

// Create and update request lifecycle
router.post('/', rbac(editRoles), createRequest);
router.put('/:id/status', rbac(editRoles), updateRequestStatus);

// Clinical actions: match, crossmatch, reserve, issue, release
router.get('/:id/match', rbac(editRoles), matchRequest);
router.post('/:id/crossmatch', rbac(editRoles), recordCrossmatch);
router.post('/:id/reserve', rbac(editRoles), reserveUnit);
router.post('/:id/issue', rbac(editRoles), issueUnit);
router.delete('/:id/reserve/:unitId', rbac(editRoles), cancelReservation);

export default router;
