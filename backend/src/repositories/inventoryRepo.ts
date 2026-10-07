import db from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface BloodUnit {
  unit_id: string;
  donor_id: number;
  blood_group: string;
  component_type: string;
  collection_date: string;
  expiry_date: string;
  status: 'AVAILABLE' | 'RESERVED' | 'ISSUED' | 'EXPIRED' | 'DISCARDED' | 'QUARANTINE';
  storage_location?: string;
  created_at: string;
  updated_at: string;
  donor_name?: string;
}

export const callMatchRequest = async (requestId: string) => {
  // CALL match_request(?) returns a result set with recommended units
  const [rows] = await db.query<RowDataPacket[]>('CALL match_request(?)', [requestId]);
  return rows[0]; // The first result set from the stored procedure
};

export const callReserveUnit = async (requestId: string, unitId: string, userId: number) => {
  // reserve_unit doesn't return a result set, it performs an update or throws an error
  await db.query('CALL reserve_unit(?, ?, ?)', [requestId, unitId, userId]);
};

export const callIssueUnit = async (requestId: string, unitId: string, userId: number, reasonCode: string) => {
  await db.query('CALL issue_unit(?, ?, ?, ?)', [requestId, unitId, userId, reasonCode]);
};

export const getInventory = async (filters?: {
  blood_group?: string;
  component_type?: string;
  status?: string;
  search?: string;
}) => {
  let sql = `
    SELECT u.*, d.name as donor_name
    FROM blood_units u
    LEFT JOIN donors d ON u.donor_id = d.donor_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filters?.blood_group) {
    sql += ' AND u.blood_group = ?';
    params.push(filters.blood_group);
  }
  if (filters?.component_type) {
    sql += ' AND u.component_type = ?';
    params.push(filters.component_type);
  }
  if (filters?.status) {
    sql += ' AND u.status = ?';
    params.push(filters.status);
  }
  if (filters?.search) {
    sql += ' AND (u.unit_id LIKE ? OR u.storage_location LIKE ? OR d.name LIKE ?)';
    params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
  }

  sql += ' ORDER BY u.expiry_date ASC';
  const [rows] = await db.query<RowDataPacket[]>(sql, params);
  return rows as BloodUnit[];
};

export const getUnitById = async (unitId: string) => {
  const sql = `
    SELECT u.*, d.name as donor_name
    FROM blood_units u
    LEFT JOIN donors d ON u.donor_id = d.donor_id
    WHERE u.unit_id = ?
  `;
  const [rows] = await db.query<RowDataPacket[]>(sql, [unitId]);
  return (rows[0] as BloodUnit) || null;
};

export const addBloodUnit = async (data: {
  unit_id: string;
  donor_id: number;
  blood_group: string;
  component_type: string;
  collection_date: string;
  expiry_date: string;
  storage_location?: string;
  status?: string;
}) => {
  await db.query(
    `INSERT INTO blood_units (unit_id, donor_id, blood_group, component_type, collection_date, expiry_date, status, storage_location)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.unit_id,
      data.donor_id,
      data.blood_group,
      data.component_type,
      data.collection_date,
      data.expiry_date,
      data.status || 'AVAILABLE',
      data.storage_location || 'Main Storage'
    ]
  );
  return getUnitById(data.unit_id);
};

export const updateUnitStatus = async (
  unitId: string,
  status: 'AVAILABLE' | 'RESERVED' | 'ISSUED' | 'EXPIRED' | 'DISCARDED' | 'QUARANTINE',
  storage_location?: string
) => {
  if (storage_location) {
    await db.query('UPDATE blood_units SET status = ?, storage_location = ? WHERE unit_id = ?', [
      status,
      storage_location,
      unitId
    ]);
  } else {
    await db.query('UPDATE blood_units SET status = ? WHERE unit_id = ?', [status, unitId]);
  }
  return getUnitById(unitId);
};

export const getInventoryStats = async () => {
  const [counts] = await db.query<RowDataPacket[]>(`
    SELECT 
      blood_group,
      component_type,
      SUM(CASE WHEN status = 'AVAILABLE' THEN 1 ELSE 0 END) AS available_count,
      SUM(CASE WHEN status = 'RESERVED' THEN 1 ELSE 0 END) AS reserved_count,
      SUM(CASE WHEN status = 'ISSUED' THEN 1 ELSE 0 END) AS issued_count,
      SUM(CASE WHEN status = 'EXPIRED' THEN 1 ELSE 0 END) AS expired_count,
      SUM(CASE WHEN status = 'DISCARDED' THEN 1 ELSE 0 END) AS discarded_count,
      SUM(CASE WHEN status = 'QUARANTINE' THEN 1 ELSE 0 END) AS quarantine_count,
      COUNT(*) AS total_count
    FROM blood_units
    GROUP BY blood_group, component_type
  `);

  const [expiringSoon] = await db.query<RowDataPacket[]>(`
    SELECT COUNT(*) AS count
    FROM blood_units
    WHERE status = 'AVAILABLE'
      AND expiry_date > CURRENT_DATE
      AND expiry_date <= DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY)
  `);

  return {
    byGroup: counts,
    expiringSoonCount: expiringSoon[0]?.count || 0
  };
};
