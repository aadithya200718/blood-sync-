import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getPatientByUserId } from '../repositories/userRepo';
import db from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { createAuditEntry } from '../repositories/auditRepo';
import { createStaffNotification } from '../services/notificationService';
import { z } from 'zod';

const createPatientRequestSchema = z.object({
  component_type: z.enum(['Whole Blood', 'Red Blood Cells', 'Platelets', 'Plasma']).default('Red Blood Cells'),
  quantity: z.number().int().min(1).max(10).default(1),
  urgency: z.enum(['Routine', 'Urgent', 'Emergency']).default('Emergency'),
  idempotency_key: z.string().optional()
});

// Cache for idempotency keys (5 minutes expiry)
const idempotencyMap = new Map<string, { timestamp: number; response: any }>();

export const getPatientProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const patient = await getPatientByUserId(userId);
    if (!patient) {
      return res.status(404).json({ error: 'No linked patient record found for this user account' });
    }

    res.json({
      data: {
        patient_id: patient.patient_id,
        user_id: patient.user_id,
        name: patient.name,
        blood_group: patient.blood_group,
        hospital: patient.hospital,
        is_verified: Boolean(patient.is_verified),
        verified_at: patient.verified_at,
        email: req.user.email
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getPatientRequests = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const patient = await getPatientByUserId(userId);
    if (!patient) {
      return res.status(404).json({ error: 'No linked patient record found' });
    }

    const [requests] = await db.query<RowDataPacket[]>(`
      SELECT r.*, 
        (SELECT res.unit_id FROM reservations res WHERE res.request_id = r.request_id AND res.status = 'Active' LIMIT 1) as reserved_unit_id,
        (SELECT res.expires_at FROM reservations res WHERE res.request_id = r.request_id AND res.status = 'Active' LIMIT 1) as reservation_expires_at,
        (SELECT iss.unit_id FROM issuances iss WHERE iss.request_id = r.request_id LIMIT 1) as issued_unit_id,
        (SELECT iss.issued_at FROM issuances iss WHERE iss.request_id = r.request_id LIMIT 1) as issued_at
      FROM blood_requests r
      WHERE r.patient_id = ?
      ORDER BY r.requested_at DESC
    `, [patient.patient_id]);

    res.json({ data: requests });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createPatientBloodRequest = async (req: AuthRequest, res: Response) => {
  const connection = await db.getConnection();
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const validated = createPatientRequestSchema.parse(req.body);

    // Check idempotency key to prevent double clicks / rapid retries
    if (validated.idempotency_key) {
      const cached = idempotencyMap.get(validated.idempotency_key);
      if (cached && Date.now() - cached.timestamp < 300000) {
        return res.status(200).json(cached.response);
      }
    }

    // Server-side authoritative patient lookup
    const patient = await getPatientByUserId(userId);
    if (!patient) {
      return res.status(404).json({ error: 'No linked patient record found for this user account' });
    }

    // Require clinical verification for emergency blood allocation
    if (!patient.is_verified) {
      return res.status(403).json({
        error: 'Clinical verification pending. Self-reported blood group must be confirmed by authorized hospital staff before emergency blood allocation.'
      });
    }

    await connection.beginTransaction();

    // Check for duplicate pending requests within the last 2 seconds (debounce rapid double-clicks)
    const [recent] = await connection.query<RowDataPacket[]>(`
      SELECT request_id FROM blood_requests 
      WHERE patient_id = ? AND status = 'Pending' AND component_type = ? AND requested_at >= DATE_SUB(NOW(), INTERVAL 2 SECOND)
    `, [patient.patient_id, validated.component_type]);

    if (recent.length > 0) {
      await connection.rollback();
      return res.status(429).json({ error: 'A pending blood request was just submitted. Please wait a moment.' });
    }

    const requestId = `REQ-${Date.now()}`;

    // Insert blood request using authoritative database-backed blood group
    await connection.query(
      `INSERT INTO blood_requests (request_id, patient_id, blood_group, component_type, quantity, urgency, status)
       VALUES (?, ?, ?, ?, ?, ?, 'Pending')`,
      [
        requestId,
        patient.patient_id,
        patient.blood_group,
        validated.component_type,
        validated.quantity,
        validated.urgency
      ]
    );

    // Create durable staff notification for Technicians
    await connection.query(
      `INSERT INTO notifications (recipient_role, request_id, event_type, severity, title, message)
       VALUES ('Technician', ?, 'EMERGENCY_REQUEST', 'Critical', 'EMERGENCY BLOOD REQUEST', ?)`,
      [
        requestId,
        `Request: ${requestId} | Blood group: ${patient.blood_group} | Component: ${validated.component_type} | Quantity: ${validated.quantity} | Urgency: ${validated.urgency} | Patient: ${patient.name}`
      ]
    );

    await connection.commit();

    await createAuditEntry({
      user_id: userId,
      action: 'PATIENT_EMERGENCY_REQUEST',
      entity_type: 'blood_requests',
      entity_id: requestId,
      reason: `Emergency blood request initiated by patient for ${patient.blood_group} ${validated.component_type}`
    });

    const [createdRows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM blood_requests WHERE request_id = ?',
      [requestId]
    );

    const responsePayload = {
      data: createdRows[0],
      message: 'Emergency blood request registered and transmitted to technician queue'
    };

    if (validated.idempotency_key) {
      idempotencyMap.set(validated.idempotency_key, {
        timestamp: Date.now(),
        response: responsePayload
      });
    }

    res.status(201).json(responsePayload);
  } catch (error: any) {
    await connection.rollback();
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(400).json({ error: error.message });
  } finally {
    connection.release();
  }
};

export const cancelPatientBloodRequest = async (req: AuthRequest, res: Response) => {
  const connection = await db.getConnection();
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const patient = await getPatientByUserId(userId);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    await connection.beginTransaction();

    // 1. Lock the request and verify ownership
    const [reqRows] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM blood_requests WHERE request_id = ? FOR UPDATE',
      [id]
    );

    if (reqRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Request not found' });
    }

    const bloodReq = reqRows[0];

    // Strictly enforce that patients can only cancel their own requests
    if (bloodReq.patient_id !== patient.patient_id) {
      await connection.rollback();
      return res.status(403).json({ error: 'Access denied: You can only cancel your own blood requests' });
    }

    // Check if cancellation is legally permitted
    if (bloodReq.status === 'Cancelled') {
      await connection.rollback();
      return res.status(400).json({ error: 'Request has already been cancelled' });
    }

    if (bloodReq.status === 'Fulfilled') {
      await connection.rollback();
      return res.status(400).json({
        error: 'Cannot cancel request: Blood units have already been physically issued. Please contact hospital staff for clinical disposition.'
      });
    }

    // 2. Check for active reservations
    const [reservations] = await connection.query<RowDataPacket[]>(
      `SELECT reservation_id, unit_id FROM reservations WHERE request_id = ? AND status = 'Active' FOR UPDATE`,
      [id]
    );

    let releasedUnitId: string | null = null;
    if (reservations.length > 0) {
      releasedUnitId = reservations[0].unit_id;

      // Cancel active reservation
      await connection.query(
        `UPDATE reservations SET status = 'Cancelled' WHERE request_id = ? AND status = 'Active'`,
        [id]
      );

      // Restore blood unit to AVAILABLE ONLY if still RESERVED and not expired
      // An ISSUED unit is NEVER changed to AVAILABLE
      await connection.query(
        `UPDATE blood_units 
         SET status = 'AVAILABLE', updated_at = NOW() 
         WHERE unit_id = ? AND status = 'RESERVED' AND expiry_date > CURRENT_DATE`,
        [releasedUnitId]
      );
    }

    // 3. Mark request as Cancelled
    await connection.query(
      "UPDATE blood_requests SET status = 'Cancelled' WHERE request_id = ?",
      [id]
    );

    // 4. Create persistent cancellation notification for technician
    await connection.query(
      `INSERT INTO notifications (recipient_role, request_id, unit_id, event_type, severity, title, message)
       VALUES ('Technician', ?, ?, 'REQUEST_CANCELLED', 'Warning', 'BLOOD REQUEST CANCELLED', ?)`,
      [
        id,
        releasedUnitId,
        `Request ${id} cancelled by patient ${patient.name}. Reserved Unit: ${releasedUnitId || 'None'}. Review allocation and confirm safe release.`
      ]
    );

    await connection.commit();

    await createAuditEntry({
      user_id: userId,
      action: 'PATIENT_REQUEST_CANCELLED',
      entity_type: 'blood_requests',
      entity_id: id,
      reason: `Patient cancelled request ${id}. Unit ${releasedUnitId || 'none'} returned to available inventory.`
    });

    res.json({
      success: true,
      message: 'Blood request successfully cancelled and technician queue updated',
      releasedUnitId
    });
  } catch (error: any) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};
