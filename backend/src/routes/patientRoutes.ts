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
import db from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { createAuditEntry } from '../repositories/auditRepo';

const router = Router();

router.use(authenticate);

// Staff-only endpoints for patient registry
router.get('/', rbac(['Technician', 'Manager', 'Admin', 'Auditor']), getPatients);
router.get('/:id', rbac(['Technician', 'Manager', 'Admin', 'Auditor']), getPatientById);
router.post('/', rbac(['Technician', 'Manager', 'Admin']), createPatient);
router.put('/:id', rbac(['Technician', 'Manager', 'Admin']), updatePatient);
router.delete('/:id', rbac(['Manager', 'Admin']), deletePatient);

// Clinical verification of self-registered patient blood group
router.put('/:id/verify', rbac(['Technician', 'Manager', 'Admin']), async (req: AuthRequest, res) => {
  try {
    const patientId = parseInt(req.params.id, 10);
    const userId = req.user?.userId;
    const { blood_group } = req.body;

    const [existing]: any = await db.query('SELECT * FROM patients WHERE patient_id = ?', [patientId]);
    if (existing.length === 0) return res.status(404).json({ error: 'Patient not found' });

    const newGroup = blood_group || existing[0].blood_group;
    await db.query(
      `UPDATE patients 
       SET is_verified = 1, blood_group = ?, verified_by = ?, verified_at = NOW() 
       WHERE patient_id = ?`,
      [newGroup, userId, patientId]
    );

    await createAuditEntry({
      user_id: userId,
      action: 'PATIENT_VERIFIED',
      entity_type: 'patients',
      entity_id: String(patientId),
      reason: `Patient clinical blood group verified as ${newGroup}`
    });

    const [updated]: any = await db.query('SELECT * FROM patients WHERE patient_id = ?', [patientId]);
    res.json({ data: updated[0], message: 'Patient clinical verification confirmed' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
