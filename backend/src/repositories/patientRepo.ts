import db from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface Patient {
  patient_id: number;
  name: string;
  blood_group: string;
  hospital?: string;
  created_at: string;
}

export const getAllPatients = async (filters?: { blood_group?: string; search?: string }) => {
  let sql = 'SELECT * FROM patients WHERE 1=1';
  const params: any[] = [];

  if (filters?.blood_group) {
    sql += ' AND blood_group = ?';
    params.push(filters.blood_group);
  }
  if (filters?.search) {
    sql += ' AND (name LIKE ? OR hospital LIKE ?)';
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  sql += ' ORDER BY created_at DESC';
  const [rows] = await db.query<RowDataPacket[]>(sql, params);
  return rows as Patient[];
};

export const getPatientById = async (id: number) => {
  const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM patients WHERE patient_id = ?', [id]);
  return (rows[0] as Patient) || null;
};

export const getPatientRequests = async (patientId: number) => {
  const [rows] = await db.query<RowDataPacket[]>(
    'SELECT * FROM blood_requests WHERE patient_id = ? ORDER BY requested_at DESC',
    [patientId]
  );
  return rows;
};

export const createPatient = async (data: { name: string; blood_group: string; hospital?: string }) => {
  const [result] = await db.query<ResultSetHeader>(
    'INSERT INTO patients (name, blood_group, hospital) VALUES (?, ?, ?)',
    [data.name, data.blood_group, data.hospital || null]
  );
  return { patient_id: result.insertId, ...data };
};

export const updatePatient = async (
  id: number,
  data: Partial<{ name: string; blood_group: string; hospital: string }>
) => {
  const fields: string[] = [];
  const params: any[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      params.push(value);
    }
  }

  if (fields.length === 0) return null;

  params.push(id);
  await db.query(`UPDATE patients SET ${fields.join(', ')} WHERE patient_id = ?`, params);
  return getPatientById(id);
};

export const deletePatient = async (id: number) => {
  await db.query('DELETE FROM patients WHERE patient_id = ?', [id]);
  return { success: true };
};
