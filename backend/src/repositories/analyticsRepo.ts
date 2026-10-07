import db from '../config/db';
import { RowDataPacket } from 'mysql2';

export const getDashboardKPIs = async () => {
  const [unitStats] = await db.query<RowDataPacket[]>(`
    SELECT 
      SUM(CASE WHEN status = 'AVAILABLE' THEN 1 ELSE 0 END) AS available_units,
      SUM(CASE WHEN status = 'RESERVED' THEN 1 ELSE 0 END) AS reserved_units,
      SUM(CASE WHEN status = 'ISSUED' THEN 1 ELSE 0 END) AS issued_units,
      SUM(CASE WHEN status = 'EXPIRED' THEN 1 ELSE 0 END) AS expired_units,
      SUM(CASE WHEN status = 'DISCARDED' THEN 1 ELSE 0 END) AS discarded_units,
      SUM(CASE WHEN status = 'QUARANTINE' THEN 1 ELSE 0 END) AS quarantine_units,
      COUNT(*) AS total_units
    FROM blood_units
  `);

  const [requestStats] = await db.query<RowDataPacket[]>(`
    SELECT 
      SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending_requests,
      SUM(CASE WHEN urgency = 'Emergency' AND status = 'Pending' THEN 1 ELSE 0 END) AS emergency_pending,
      COUNT(*) AS total_requests
    FROM blood_requests
  `);

  const [donorStats] = await db.query<RowDataPacket[]>(`
    SELECT 
      COUNT(*) AS total_donors,
      SUM(CASE WHEN status = 'Eligible' THEN 1 ELSE 0 END) AS eligible_donors
    FROM donors
  `);

  const [alertStats] = await db.query<RowDataPacket[]>(`
    SELECT 
      COUNT(*) AS active_alerts,
      SUM(CASE WHEN severity = 'Critical' THEN 1 ELSE 0 END) AS critical_alerts
    FROM alerts
    WHERE status = 'Active'
  `);

  const [expiringStats] = await db.query<RowDataPacket[]>(`
    SELECT COUNT(*) AS expiring_soon
    FROM blood_units
    WHERE status = 'AVAILABLE'
      AND expiry_date > CURRENT_DATE
      AND expiry_date <= DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY)
  `);

  const available = Number(unitStats[0]?.available_units || 0);
  const discarded = Number(unitStats[0]?.discarded_units || 0);
  const expired = Number(unitStats[0]?.expired_units || 0);
  const issued = Number(unitStats[0]?.issued_units || 0);
  const totalOut = issued + expired + discarded;
  const wastageRate = totalOut > 0 ? (((expired + discarded) / totalOut) * 100).toFixed(1) : '0.0';

  return {
    availableUnits: available,
    reservedUnits: Number(unitStats[0]?.reserved_units || 0),
    issuedUnits: issued,
    expiredUnits: expired,
    discardedUnits: discarded,
    quarantineUnits: Number(unitStats[0]?.quarantine_units || 0),
    totalUnits: Number(unitStats[0]?.total_units || 0),
    pendingRequests: Number(requestStats[0]?.pending_requests || 0),
    emergencyPending: Number(requestStats[0]?.emergency_pending || 0),
    totalRequests: Number(requestStats[0]?.total_requests || 0),
    totalDonors: Number(donorStats[0]?.total_donors || 0),
    eligibleDonors: Number(donorStats[0]?.eligible_donors || 0),
    activeAlerts: Number(alertStats[0]?.active_alerts || 0),
    criticalAlerts: Number(alertStats[0]?.critical_alerts || 0),
    expiringSoon: Number(expiringStats[0]?.expiring_soon || 0),
    wastageRate: `${wastageRate}%`
  };
};

export const getBloodGroupInventory = async () => {
  const [rows] = await db.query<RowDataPacket[]>(`
    SELECT 
      blood_group,
      SUM(CASE WHEN status = 'AVAILABLE' THEN 1 ELSE 0 END) AS available,
      SUM(CASE WHEN status = 'RESERVED' THEN 1 ELSE 0 END) AS reserved,
      COUNT(*) AS total
    FROM blood_units
    GROUP BY blood_group
    ORDER BY blood_group ASC
  `);
  return rows;
};

export const getComponentBreakdown = async () => {
  const [rows] = await db.query<RowDataPacket[]>(`
    SELECT 
      component_type,
      SUM(CASE WHEN status = 'AVAILABLE' THEN 1 ELSE 0 END) AS available,
      COUNT(*) AS total
    FROM blood_units
    GROUP BY component_type
  `);
  return rows;
};

export const getShelfLifeBuckets = async () => {
  const [rows] = await db.query<RowDataPacket[]>(`
    SELECT 
      SUM(CASE WHEN DATEDIFF(expiry_date, CURRENT_DATE) <= 0 THEN 1 ELSE 0 END) AS expired,
      SUM(CASE WHEN DATEDIFF(expiry_date, CURRENT_DATE) BETWEEN 1 AND 7 THEN 1 ELSE 0 END) AS within_7_days,
      SUM(CASE WHEN DATEDIFF(expiry_date, CURRENT_DATE) BETWEEN 8 AND 14 THEN 1 ELSE 0 END) AS within_14_days,
      SUM(CASE WHEN DATEDIFF(expiry_date, CURRENT_DATE) BETWEEN 15 AND 30 THEN 1 ELSE 0 END) AS within_30_days,
      SUM(CASE WHEN DATEDIFF(expiry_date, CURRENT_DATE) > 30 THEN 1 ELSE 0 END) AS over_30_days
    FROM blood_units
    WHERE status = 'AVAILABLE'
  `);
  return rows[0];
};

export const getRecentActivities = async () => {
  const [rows] = await db.query<RowDataPacket[]>(`
    SELECT a.*, u.name as user_name
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.user_id
    ORDER BY a.created_at DESC
    LIMIT 8
  `);
  return rows;
};
