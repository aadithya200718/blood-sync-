import db from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface NotificationRow extends RowDataPacket {
  notification_id: number;
  recipient_role: string;
  recipient_user_id: number | null;
  request_id: string | null;
  unit_id: string | null;
  event_type: string;
  severity: 'Info' | 'Warning' | 'Critical';
  title: string;
  message: string;
  is_read: number;
  created_at: string;
  read_at: string | null;
}

export const createNotification = async (data: {
  recipient_role?: string;
  recipient_user_id?: number | null;
  request_id?: string | null;
  unit_id?: string | null;
  event_type: string;
  severity?: 'Info' | 'Warning' | 'Critical';
  title: string;
  message: string;
}): Promise<number> => {
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO notifications (recipient_role, recipient_user_id, request_id, unit_id, event_type, severity, title, message)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.recipient_role || 'Technician',
      data.recipient_user_id || null,
      data.request_id || null,
      data.unit_id || null,
      data.event_type,
      data.severity || 'Info',
      data.title,
      data.message
    ]
  );
  return result.insertId;
};

export const getNotificationsForRole = async (
  role: string,
  userId?: number,
  unreadOnly: boolean = false
): Promise<{ notifications: NotificationRow[]; unreadCount: number }> => {
  let sql = `
    SELECT * FROM notifications 
    WHERE (recipient_role = ? OR recipient_role = 'All' OR (recipient_user_id IS NOT NULL AND recipient_user_id = ?))
  `;
  const params: any[] = [role, userId || 0];

  if (unreadOnly) {
    sql += ' AND is_read = 0';
  }

  sql += ' ORDER BY created_at DESC LIMIT 50';

  const [rows] = await db.query<NotificationRow[]>(sql, params);

  const [countRows]: any = await db.query(
    `SELECT COUNT(*) as unread_count FROM notifications 
     WHERE is_read = 0 AND (recipient_role = ? OR recipient_role = 'All' OR recipient_user_id = ?)`,
    [role, userId || 0]
  );

  return {
    notifications: rows,
    unreadCount: countRows[0]?.unread_count || 0
  };
};

export const markNotificationRead = async (notificationId: number): Promise<boolean> => {
  const [result] = await db.query<ResultSetHeader>(
    'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE notification_id = ?',
    [notificationId]
  );
  return result.affectedRows > 0;
};

export const acknowledgeAllForRole = async (role: string, userId?: number): Promise<number> => {
  const [result] = await db.query<ResultSetHeader>(
    `UPDATE notifications SET is_read = 1, read_at = NOW() 
     WHERE is_read = 0 AND (recipient_role = ? OR recipient_role = 'All' OR recipient_user_id = ?)`,
    [role, userId || 0]
  );
  return result.affectedRows;
};
