import db from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface UserRow extends RowDataPacket {
  user_id: number;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  status: string;
}

export interface LinkedPatientRow extends RowDataPacket {
  patient_id: number;
  name: string;
  blood_group: string;
  hospital: string;
  user_id: number;
  is_verified: number;
  verified_by: number | null;
  verified_at: string | null;
}

export const getUserByEmail = async (email: string): Promise<UserRow | null> => {
  const [rows] = await db.query<UserRow[]>('SELECT * FROM users WHERE email = ?', [email]);
  if (rows.length > 0) {
    return rows[0];
  }
  return null;
};

export const getUserById = async (userId: number): Promise<UserRow | null> => {
  const [rows] = await db.query<UserRow[]>('SELECT * FROM users WHERE user_id = ?', [userId]);
  if (rows.length > 0) {
    return rows[0];
  }
  return null;
};

export const getPatientByUserId = async (userId: number): Promise<LinkedPatientRow | null> => {
  const [rows] = await db.query<LinkedPatientRow[]>(
    'SELECT * FROM patients WHERE user_id = ?',
    [userId]
  );
  if (rows.length > 0) {
    return rows[0];
  }
  return null;
};

export const createUser = async (data: {
  name: string;
  email: string;
  password_hash: string;
  role: string;
  status?: string;
}): Promise<number> => {
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO users (name, email, password_hash, role, status)
     VALUES (?, ?, ?, ?, ?)`,
    [data.name, data.email, data.password_hash, data.role, data.status || 'Active']
  );
  return result.insertId;
};
