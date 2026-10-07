import * as alertRepo from '../repositories/alertRepo';
import db from '../config/db';
import { RowDataPacket } from 'mysql2';
import { createAuditEntry } from '../repositories/auditRepo';

export const listAlerts = async (filters?: {
  status?: string;
  severity?: string;
  type?: string;
}) => {
  return await alertRepo.getAlerts(filters);
};

export const acknowledgeAlert = async (id: number, userId?: number) => {
  const alert = await alertRepo.getAlertById(id);
  if (!alert) throw new Error('Alert not found');

  const updated = await alertRepo.updateAlertStatus(id, 'Resolved');
  await createAuditEntry({
    user_id: userId,
    action: 'ALERT_ACKNOWLEDGED',
    entity_type: 'alerts',
    entity_id: String(id),
    before_state: alert,
    after_state: updated,
    reason: 'Alert acknowledged and resolved by user'
  });
  return updated;
};

export const resolveAlert = async (id: number, userId?: number) => {
  const alert = await alertRepo.getAlertById(id);
  if (!alert) throw new Error('Alert not found');

  const updated = await alertRepo.updateAlertStatus(id, 'Resolved');
  await createAuditEntry({
    user_id: userId,
    action: 'ALERT_RESOLVED',
    entity_type: 'alerts',
    entity_id: String(id),
    before_state: alert,
    after_state: updated,
    reason: 'Alert marked as resolved'
  });
  return updated;
};

export const dismissAlert = async (id: number, userId?: number) => {
  const alert = await alertRepo.getAlertById(id);
  if (!alert) throw new Error('Alert not found');

  const updated = await alertRepo.updateAlertStatus(id, 'Dismissed');
  await createAuditEntry({
    user_id: userId,
    action: 'ALERT_DISMISSED',
    entity_type: 'alerts',
    entity_id: String(id),
    before_state: alert,
    after_state: updated,
    reason: 'Alert dismissed'
  });
  return updated;
};

export const runAlertChecks = async () => {
  let createdCount = 0;

  // 1. Check for expiring units in the next 7 days
  const [expiringUnits] = await db.query<RowDataPacket[]>(`
    SELECT unit_id, blood_group, component_type, expiry_date, DATEDIFF(expiry_date, CURRENT_DATE) as days_left
    FROM blood_units
    WHERE status = 'AVAILABLE'
      AND expiry_date > CURRENT_DATE
      AND expiry_date <= DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY)
  `);

  for (const unit of expiringUnits) {
    const [existing] = await db.query<RowDataPacket[]>(
      `SELECT 1 FROM alerts WHERE unit_id = ? AND type = 'EXPIRING_SOON' AND status = 'Active'`,
      [unit.unit_id]
    );

    if (existing.length === 0) {
      await alertRepo.createAlert({
        type: 'EXPIRING_SOON',
        severity: unit.days_left <= 3 ? 'Critical' : 'Warning',
        unit_id: unit.unit_id,
        blood_group: unit.blood_group,
        message: `Unit ${unit.unit_id} (${unit.blood_group} ${unit.component_type}) expires in ${unit.days_left} day(s) on ${unit.expiry_date}.`
      });
      createdCount++;
    }
  }

  // 2. Check for inventory targets vs available stock
  const [targets] = await db.query<RowDataPacket[]>(`SELECT * FROM inventory_targets`);
  for (const target of targets) {
    const [stock] = await db.query<RowDataPacket[]>(`
      SELECT COUNT(*) as available
      FROM blood_units
      WHERE blood_group = ? AND component_type = ? AND status = 'AVAILABLE'
    `, [target.blood_group, target.component_type]);

    const count = stock[0]?.available || 0;
    if (count <= target.critical_level) {
      const [existing] = await db.query<RowDataPacket[]>(`
        SELECT 1 FROM alerts 
        WHERE blood_group = ? AND type = 'LOW_STOCK' AND status = 'Active' AND DATE(created_at) = CURRENT_DATE
      `, [target.blood_group]);

      if (existing.length === 0) {
        await alertRepo.createAlert({
          type: 'LOW_STOCK',
          severity: 'Critical',
          blood_group: target.blood_group,
          message: `CRITICAL: Stock for ${target.blood_group} ${target.component_type} is at ${count} units (critical threshold: ${target.critical_level}).`
        });
        createdCount++;
      }
    } else if (count <= target.minimum_level) {
      const [existing] = await db.query<RowDataPacket[]>(`
        SELECT 1 FROM alerts 
        WHERE blood_group = ? AND type = 'LOW_STOCK' AND status = 'Active' AND DATE(created_at) = CURRENT_DATE
      `, [target.blood_group]);

      if (existing.length === 0) {
        await alertRepo.createAlert({
          type: 'LOW_STOCK',
          severity: 'Warning',
          blood_group: target.blood_group,
          message: `WARNING: Stock for ${target.blood_group} ${target.component_type} is at ${count} units (minimum threshold: ${target.minimum_level}).`
        });
        createdCount++;
      }
    }
  }

  return { success: true, alertsGenerated: createdCount };
};
