import db from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface AuditLog {
  audit_id: number;
  user_id?: number;
  user_name?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  before_state?: any;
  after_state?: any;
  reason?: string;
  created_at: string;
}

export const getAuditLogs = async (filters?: {
  entity_type?: string;
  action?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) => {
  let sql = `
    SELECT a.*, u.name as user_name
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.user_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filters?.entity_type) {
    sql += ' AND a.entity_type = ?';
    params.push(filters.entity_type);
  }
  if (filters?.action) {
    sql += ' AND a.action = ?';
    params.push(filters.action);
  }
  if (filters?.search) {
    sql += ' AND (a.entity_id LIKE ? OR a.action LIKE ? OR a.reason LIKE ? OR u.name LIKE ?)';
    params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
  }

  sql += ' ORDER BY a.created_at DESC';

  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;
  sql += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const [rows] = await db.query<RowDataPacket[]>(sql, params);
  return rows as AuditLog[];
};

export const createAuditEntry = async (data: {
  user_id?: number | null;
  action: string;
  entity_type: string;
  entity_id: string;
  before_state?: any;
  after_state?: any;
  reason?: string;
}) => {
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, before_state, after_state, reason)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.user_id || null,
      data.action,
      data.entity_type,
      data.entity_id,
      data.before_state ? JSON.stringify(data.before_state) : null,
      data.after_state ? JSON.stringify(data.after_state) : null,
      data.reason || null
    ]
  );
  return result.insertId;
};

export const getAuditSummary = async () => {
  const [actionCounts] = await db.query<RowDataPacket[]>(`
    SELECT action, COUNT(*) as count
    FROM audit_logs
    GROUP BY action
    ORDER BY count DESC
    LIMIT 10
  `);

  const [entityCounts] = await db.query<RowDataPacket[]>(`
    SELECT entity_type, COUNT(*) as count
    FROM audit_logs
    GROUP BY entity_type
    ORDER BY count DESC
  `);

  return {
    topActions: actionCounts,
    entityBreakdown: entityCounts
  };
};
