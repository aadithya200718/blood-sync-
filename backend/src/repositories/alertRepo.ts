import db from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface Alert {
  alert_id: number;
  type: 'LOW_STOCK' | 'EXPIRING_SOON' | 'SYSTEM_ERROR' | 'UNFULFILLED_REQUEST';
  severity: 'Info' | 'Warning' | 'Critical';
  unit_id?: string;
  blood_group?: string;
  message: string;
  status: 'Active' | 'Resolved' | 'Dismissed';
  created_at: string;
  resolved_at?: string;
}

export const getAlerts = async (filters?: {
  status?: string;
  severity?: string;
  type?: string;
}) => {
  let sql = 'SELECT * FROM alerts WHERE 1=1';
  const params: any[] = [];

  if (filters?.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }
  if (filters?.severity) {
    sql += ' AND severity = ?';
    params.push(filters.severity);
  }
  if (filters?.type) {
    sql += ' AND type = ?';
    params.push(filters.type);
  }

  sql += ' ORDER BY FIELD(severity, "Critical", "Warning", "Info"), created_at DESC';
  const [rows] = await db.query<RowDataPacket[]>(sql, params);
  return rows as Alert[];
};

export const getAlertById = async (id: number) => {
  const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM alerts WHERE alert_id = ?', [id]);
  return (rows[0] as Alert) || null;
};

export const updateAlertStatus = async (
  id: number,
  status: 'Active' | 'Resolved' | 'Dismissed'
) => {
  const resolvedAt = status === 'Resolved' || status === 'Dismissed' ? new Date() : null;
  await db.query(
    'UPDATE alerts SET status = ?, resolved_at = ? WHERE alert_id = ?',
    [status, resolvedAt, id]
  );
  return getAlertById(id);
};

export const createAlert = async (data: {
  type: string;
  severity: string;
  unit_id?: string;
  blood_group?: string;
  message: string;
}) => {
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO alerts (type, severity, unit_id, blood_group, message, status)
     VALUES (?, ?, ?, ?, ?, 'Active')`,
    [data.type, data.severity, data.unit_id || null, data.blood_group || null, data.message]
  );
  return getAlertById(result.insertId);
};
