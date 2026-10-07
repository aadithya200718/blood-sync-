import db from '../config/db';
import { RowDataPacket } from 'mysql2';

export interface UserRow extends RowDataPacket {
  user_id: number;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  status: string;
}

export const getUserByEmail = async (email: string): Promise<UserRow | null> => {
  const [rows] = await db.query<UserRow[]>('SELECT * FROM users WHERE email = ?', [email]);
  if (rows.length > 0) {
    return rows[0];
  }
  return null;
};
