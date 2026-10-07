import db from '../config/db';
import { RowDataPacket } from 'mysql2';
import { runAlertChecks } from './alertService';
import { createAuditEntry } from '../repositories/auditRepo';

let schedulerInterval: NodeJS.Timeout | null = null;

export const processAutomatedJobs = async () => {
  console.log('[Scheduler] Running automated BloodSync background jobs...');

  try {
    // 1. Mark expired units
    const [expiredRows] = await db.query<RowDataPacket[]>(`
      SELECT unit_id, blood_group, component_type 
      FROM blood_units 
      WHERE status = 'AVAILABLE' AND expiry_date <= CURRENT_DATE
    `);

    if (expiredRows.length > 0) {
      await db.query(`
        UPDATE blood_units 
        SET status = 'EXPIRED', storage_location = 'Disposal Pending'
        WHERE status = 'AVAILABLE' AND expiry_date <= CURRENT_DATE
      `);

      for (const unit of expiredRows) {
        await createAuditEntry({
          action: 'UNIT_AUTO_EXPIRED',
          entity_type: 'blood_units',
          entity_id: unit.unit_id,
          reason: 'Unit reached expiry date and was automatically retired from available inventory'
        });
      }
      console.log(`[Scheduler] Auto-expired ${expiredRows.length} units.`);
    }

    // 2. Expire active reservations past expires_at
    const [expiredReservations] = await db.query<RowDataPacket[]>(`
      SELECT reservation_id, request_id, unit_id
      FROM reservations
      WHERE status = 'Active' AND expires_at <= NOW()
    `);

    if (expiredReservations.length > 0) {
      for (const res of expiredReservations) {
        await db.query(`UPDATE reservations SET status = 'Expired' WHERE reservation_id = ?`, [
          res.reservation_id
        ]);
        await db.query(`UPDATE blood_units SET status = 'AVAILABLE' WHERE unit_id = ?`, [
          res.unit_id
        ]);
        await createAuditEntry({
          action: 'RESERVATION_AUTO_EXPIRED',
          entity_type: 'reservations',
          entity_id: String(res.reservation_id),
          reason: 'Reservation window expired; unit returned to available inventory'
        });
      }
      console.log(`[Scheduler] Released ${expiredReservations.length} expired reservations.`);
    }

    // 3. Run stock and expiry alert checks
    const alertResult = await runAlertChecks();
    if (alertResult.alertsGenerated > 0) {
      console.log(`[Scheduler] Generated ${alertResult.alertsGenerated} new alerts.`);
    }

    console.log('[Scheduler] Background jobs cycle completed successfully.');
  } catch (error: any) {
    console.error('[Scheduler] Error executing automated jobs:', error.message);
  }
};

export const startScheduler = (intervalMinutes: number = 10) => {
  if (schedulerInterval) return;

  // Run once immediately at startup
  processAutomatedJobs();

  // Then schedule periodically
  schedulerInterval = setInterval(() => {
    processAutomatedJobs();
  }, intervalMinutes * 60 * 1000);

  console.log(`[Scheduler] BloodSync automated maintenance initialized (interval: ${intervalMinutes}m).`);
};

export const stopScheduler = () => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[Scheduler] Background scheduler stopped.');
  }
};
