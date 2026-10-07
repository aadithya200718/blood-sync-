-- bloodsync/database/events.sql
USE bloodsync;

-- Enable event scheduler (ensure this is enabled in mysql config)
SET GLOBAL event_scheduler = ON;

DELIMITER //

-- 1. Check Expiries Event (Runs daily)
CREATE EVENT check_expiries_event
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    -- Expire units that are past their date
    UPDATE blood_units
    SET status = 'EXPIRED'
    WHERE status = 'AVAILABLE' AND expiry_date <= CURRENT_DATE;
    
    -- Create alerts for units expiring in the next 7 days
    INSERT INTO alerts (type, severity, unit_id, blood_group, message)
    SELECT 'EXPIRING_SOON', 'Warning', unit_id, blood_group, CONCAT('Unit ', unit_id, ' expires on ', expiry_date)
    FROM blood_units
    WHERE status = 'AVAILABLE' 
      AND expiry_date > CURRENT_DATE 
      AND expiry_date <= DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY)
      AND NOT EXISTS (
          SELECT 1 FROM alerts a WHERE a.unit_id = blood_units.unit_id AND a.type = 'EXPIRING_SOON' AND a.status = 'Active'
      );
END //

-- 2. Expire Reservations Event (Runs every hour)
CREATE EVENT expire_reservations_event
ON SCHEDULE EVERY 1 HOUR
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    -- Temporary table to hold expired reservations
    CREATE TEMPORARY TABLE temp_expired_res AS
    SELECT reservation_id, unit_id 
    FROM reservations 
    WHERE status = 'Active' AND expires_at <= NOW();
    
    IF (SELECT COUNT(*) FROM temp_expired_res) > 0 THEN
        -- Mark units back to AVAILABLE
        UPDATE blood_units u
        JOIN temp_expired_res t ON u.unit_id = t.unit_id
        SET u.status = 'AVAILABLE';
        
        -- Mark reservations as Expired
        UPDATE reservations r
        JOIN temp_expired_res t ON r.reservation_id = t.reservation_id
        SET r.status = 'Expired';
    END IF;
    
    DROP TEMPORARY TABLE IF EXISTS temp_expired_res;
END //

DELIMITER ;
