import db from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface Donor {
  donor_id: number;
  name: string;
  blood_group: string;
  phone?: string;
  last_donation_date?: string;
  status: 'Eligible' | 'Deferred' | 'Inactive';
  created_at: string;
}

export const getAllDonors = async (filters?: { blood_group?: string; status?: string; search?: string }) => {
  let sql = 'SELECT * FROM donors WHERE 1=1';
  const params: any[] = [];

  if (filters?.blood_group) {
    sql += ' AND blood_group = ?';
    params.push(filters.blood_group);
  }
  if (filters?.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }
  if (filters?.search) {
    sql += ' AND (name LIKE ? OR phone LIKE ?)';
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  sql += ' ORDER BY created_at DESC';
  const [rows] = await db.query<RowDataPacket[]>(sql, params);
  return rows as Donor[];
};

export const getDonorById = async (id: number) => {
  const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM donors WHERE donor_id = ?', [id]);
  return (rows[0] as Donor) || null;
};

export const getDonorDonations = async (donorId: number) => {
  const [rows] = await db.query<RowDataPacket[]>(
    'SELECT * FROM blood_units WHERE donor_id = ? ORDER BY collection_date DESC',
    [donorId]
  );
  return rows;
};

export const createDonor = async (data: {
  name: string;
  blood_group: string;
  phone?: string;
  status?: string;
  last_donation_date?: string;
}) => {
  const [result] = await db.query<ResultSetHeader>(
    'INSERT INTO donors (name, blood_group, phone, status, last_donation_date) VALUES (?, ?, ?, ?, ?)',
    [
      data.name,
      data.blood_group,
      data.phone || null,
      data.status || 'Eligible',
      data.last_donation_date || null
    ]
  );
  return { donor_id: result.insertId, ...data };
};

export const updateDonor = async (
  id: number,
  data: Partial<{ name: string; blood_group: string; phone: string; status: string; last_donation_date: string }>
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
  await db.query(`UPDATE donors SET ${fields.join(', ')} WHERE donor_id = ?`, params);
  return getDonorById(id);
};

export const deleteDonor = async (id: number) => {
  await db.query('DELETE FROM donors WHERE donor_id = ?', [id]);
  return { success: true };
};
