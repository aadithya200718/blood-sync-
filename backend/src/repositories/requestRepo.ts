import db from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface BloodRequest {
  request_id: string;
  patient_id: number;
  patient_name?: string;
  hospital?: string;
  blood_group: string;
  component_type: string;
  quantity: number;
  urgency: 'Routine' | 'Urgent' | 'Emergency';
  status: 'Pending' | 'Partially Fulfilled' | 'Fulfilled' | 'Cancelled';
  requested_at: string;
}

export const getAllRequests = async (filters?: {
  status?: string;
  urgency?: string;
  blood_group?: string;
  search?: string;
}) => {
  let sql = `
    SELECT r.*, p.name AS patient_name, p.hospital
    FROM blood_requests r
    LEFT JOIN patients p ON r.patient_id = p.patient_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filters?.status) {
    sql += ' AND r.status = ?';
    params.push(filters.status);
  }
  if (filters?.urgency) {
    sql += ' AND r.urgency = ?';
    params.push(filters.urgency);
  }
  if (filters?.blood_group) {
    sql += ' AND r.blood_group = ?';
    params.push(filters.blood_group);
  }
  if (filters?.search) {
    sql += ' AND (r.request_id LIKE ? OR p.name LIKE ? OR p.hospital LIKE ?)';
    params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
  }

  sql += ' ORDER BY FIELD(r.urgency, "Emergency", "Urgent", "Routine"), r.requested_at DESC';
  const [rows] = await db.query<RowDataPacket[]>(sql, params);
  return rows as BloodRequest[];
};

export const getRequestById = async (requestId: string) => {
  const sql = `
    SELECT r.*, p.name AS patient_name, p.hospital
    FROM blood_requests r
    LEFT JOIN patients p ON r.patient_id = p.patient_id
    WHERE r.request_id = ?
  `;
  const [rows] = await db.query<RowDataPacket[]>(sql, [requestId]);
  return (rows[0] as BloodRequest) || null;
};

export const createRequest = async (data: {
  request_id?: string;
  patient_id: number;
  blood_group: string;
  component_type: string;
  quantity: number;
  urgency?: string;
}) => {
  const requestId = data.request_id || `REQ-${Date.now()}`;
  await db.query(
    `INSERT INTO blood_requests (request_id, patient_id, blood_group, component_type, quantity, urgency, status)
     VALUES (?, ?, ?, ?, ?, ?, 'Pending')`,
    [
      requestId,
      data.patient_id,
      data.blood_group,
      data.component_type,
      data.quantity,
      data.urgency || 'Routine'
    ]
  );
  return getRequestById(requestId);
};

export const updateRequestStatus = async (requestId: string, status: string) => {
  await db.query('UPDATE blood_requests SET status = ? WHERE request_id = ?', [status, requestId]);
  return getRequestById(requestId);
};

export const getReservationsByRequest = async (requestId: string) => {
  const sql = `
    SELECT res.*, u.blood_group, u.component_type, u.expiry_date, u.storage_location
    FROM reservations res
    JOIN blood_units u ON res.unit_id = u.unit_id
    WHERE res.request_id = ?
    ORDER BY res.reserved_at DESC
  `;
  const [rows] = await db.query<RowDataPacket[]>(sql, [requestId]);
  return rows;
};

export const getIssuancesByRequest = async (requestId: string) => {
  const sql = `
    SELECT iss.*, u.blood_group, u.component_type, usr.name AS issued_by_name
    FROM issuances iss
    JOIN blood_units u ON iss.unit_id = u.unit_id
    LEFT JOIN users usr ON iss.issued_by = usr.user_id
    WHERE iss.request_id = ?
    ORDER BY iss.issued_at DESC
  `;
  const [rows] = await db.query<RowDataPacket[]>(sql, [requestId]);
  return rows;
};

export const getCrossmatchesByRequest = async (requestId: string) => {
  const sql = `
    SELECT cm.*, u.blood_group, u.component_type, usr.name AS tester_name
    FROM cross_matches cm
    JOIN blood_units u ON cm.unit_id = u.unit_id
    LEFT JOIN users usr ON cm.tested_by = usr.user_id
    WHERE cm.request_id = ?
    ORDER BY cm.tested_at DESC
  `;
  const [rows] = await db.query<RowDataPacket[]>(sql, [requestId]);
  return rows;
};

export const recordCrossmatch = async (data: {
  request_id: string;
  unit_id: string;
  result: 'Compatible' | 'Incompatible' | 'Pending';
  tested_by: number;
}) => {
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO cross_matches (request_id, unit_id, result, tested_by)
     VALUES (?, ?, ?, ?)`,
    [data.request_id, data.unit_id, data.result, data.tested_by]
  );
  return { crossmatch_id: result.insertId, ...data };
};

export const cancelReservation = async (requestId: string, unitId: string) => {
  await db.query(
    `UPDATE reservations SET status = 'Cancelled'
     WHERE request_id = ? AND unit_id = ? AND status = 'Active'`,
    [requestId, unitId]
  );
  await db.query(
    `UPDATE blood_units SET status = 'AVAILABLE'
     WHERE unit_id = ? AND status = 'RESERVED'`,
    [unitId]
  );
  return { success: true };
};

export const getAllReservations = async (status?: string) => {
  let sql = `
    SELECT res.*, u.blood_group, u.component_type, u.expiry_date, u.storage_location,
           r.patient_id, p.name AS patient_name, p.hospital, r.urgency
    FROM reservations res
    JOIN blood_units u ON res.unit_id = u.unit_id
    JOIN blood_requests r ON res.request_id = r.request_id
    LEFT JOIN patients p ON r.patient_id = p.patient_id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (status) {
    sql += ' AND res.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY res.reserved_at DESC';
  const [rows] = await db.query<RowDataPacket[]>(sql, params);
  return rows;
};

export const getAllIssuances = async () => {
  const sql = `
    SELECT iss.*, u.blood_group, u.component_type, u.collection_date, u.expiry_date,
           usr.name AS issued_by_name,
           r.patient_id, p.name AS patient_name, p.hospital, r.urgency
    FROM issuances iss
    JOIN blood_units u ON iss.unit_id = u.unit_id
    JOIN blood_requests r ON iss.request_id = r.request_id
    LEFT JOIN patients p ON r.patient_id = p.patient_id
    LEFT JOIN users usr ON iss.issued_by = usr.user_id
    ORDER BY iss.issued_at DESC
  `;
  const [rows] = await db.query<RowDataPacket[]>(sql);
  return rows;
};

