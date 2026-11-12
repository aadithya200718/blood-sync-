-- Migration: 001_patient_technician_integration.sql
-- Database: bloodsync
-- Description: Additive schema updates for Patient identity, verification, technician notifications, and hardened procedures

USE bloodsync;

-- 1. Extend user roles to include 'Patient'
ALTER TABLE users 
MODIFY COLUMN role ENUM('Admin', 'Technician', 'Manager', 'Auditor', 'Patient') NOT NULL;

-- 2. Add patient foreign key to users, verification status, and clinical audit fields
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'bloodsync' AND TABLE_NAME = 'patients' AND COLUMN_NAME = 'user_id');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE patients ADD COLUMN user_id INT NULL UNIQUE', 'SELECT "user_id already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'bloodsync' AND TABLE_NAME = 'patients' AND COLUMN_NAME = 'is_verified');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE patients ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT FALSE', 'SELECT "is_verified already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'bloodsync' AND TABLE_NAME = 'patients' AND COLUMN_NAME = 'verified_by');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE patients ADD COLUMN verified_by INT NULL', 'SELECT "verified_by already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'bloodsync' AND TABLE_NAME = 'patients' AND COLUMN_NAME = 'verified_at');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE patients ADD COLUMN verified_at TIMESTAMP NULL', 'SELECT "verified_at already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add foreign keys for patients if not present
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = 'bloodsync' AND TABLE_NAME = 'patients' AND CONSTRAINT_NAME = 'fk_patients_user');
SET @sql = IF(@fk_exists = 0, 'ALTER TABLE patients ADD CONSTRAINT fk_patients_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL', 'SELECT "fk_patients_user already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = 'bloodsync' AND TABLE_NAME = 'patients' AND CONSTRAINT_NAME = 'fk_patients_verified_by');
SET @sql = IF(@fk_exists = 0, 'ALTER TABLE patients ADD CONSTRAINT fk_patients_verified_by FOREIGN KEY (verified_by) REFERENCES users(user_id) ON DELETE SET NULL', 'SELECT "fk_patients_verified_by already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Mark all existing benchmark patients as verified
UPDATE patients SET is_verified = TRUE WHERE is_verified = FALSE AND user_id IS NULL;

-- 3. Create persistent notifications table
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_role VARCHAR(50) DEFAULT 'Technician',
    recipient_user_id INT NULL,
    request_id VARCHAR(50) NULL,
    unit_id VARCHAR(50) NULL,
    event_type VARCHAR(50) NOT NULL,
    severity ENUM('Info', 'Warning', 'Critical') DEFAULT 'Info',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    FOREIGN KEY (recipient_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (request_id) REFERENCES blood_requests(request_id) ON DELETE CASCADE,
    INDEX idx_role_unread (recipient_role, is_read),
    INDEX idx_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 4. Replace stored procedures with hardened clinical rules and FEFO priority

DROP PROCEDURE IF EXISTS match_request;
DELIMITER //
CREATE PROCEDURE match_request(IN p_request_id VARCHAR(50))
BEGIN
    DECLARE v_patient_group VARCHAR(10);
    DECLARE v_component_type VARCHAR(50);
    DECLARE v_quantity INT;
    DECLARE v_status VARCHAR(20);
    
    -- Load request details
    SELECT blood_group, component_type, quantity, status
    INTO v_patient_group, v_component_type, v_quantity, v_status
    FROM blood_requests
    WHERE request_id = p_request_id;
    
    -- Return error if not pending or partially fulfilled
    IF v_status NOT IN ('Pending', 'Partially Fulfilled') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Request is not in an active allocatable status';
    END IF;
    
    -- Main matching logic:
    -- 1. Must be AVAILABLE
    -- 2. Correct component type
    -- 3. check_compatibility() returns true (ABO/Rh compatibility)
    -- 4. Must not be expired (expiry_date > CURRENT_DATE)
    -- 5. Exclude any recorded Incompatible crossmatches for this request
    -- 6. FEFO priority: earliest expiring unit first
    -- 7. Secondary tie-breaker: exact ABO group match first (conserves universal donors like O-)
    SELECT 
        u.unit_id,
        u.blood_group,
        u.component_type,
        u.expiry_date,
        u.storage_location,
        IFNULL(c.result, 'None') as crossmatch_status,
        CASE 
            WHEN u.blood_group = v_patient_group THEN 'Exact ABO/Rh match; earliest-expiring eligible unit (FEFO)'
            ELSE 'Compatible donor alternative; earliest-expiring eligible unit (FEFO)'
        END AS matching_reason
    FROM blood_units u
    LEFT JOIN cross_matches c ON c.unit_id = u.unit_id AND c.request_id = p_request_id
    WHERE u.status = 'AVAILABLE'
      AND u.component_type = v_component_type
      AND check_compatibility(v_patient_group, u.blood_group, u.component_type) = TRUE
      AND u.expiry_date > CURRENT_DATE
      AND (c.result IS NULL OR c.result != 'Incompatible')
    ORDER BY 
      u.expiry_date ASC,
      (u.blood_group = v_patient_group) DESC,
      u.unit_id ASC
    LIMIT v_quantity;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS reserve_unit;
DELIMITER //
CREATE PROCEDURE reserve_unit(
    IN p_request_id VARCHAR(50), 
    IN p_unit_id VARCHAR(50), 
    IN p_user_id INT
)
BEGIN
    DECLARE v_req_blood_group VARCHAR(10);
    DECLARE v_req_component VARCHAR(50);
    DECLARE v_req_quantity INT;
    DECLARE v_req_status VARCHAR(20);
    DECLARE v_current_reserved INT DEFAULT 0;
    DECLARE v_unit_blood_group VARCHAR(10);
    DECLARE v_unit_component VARCHAR(50);
    DECLARE v_unit_status VARCHAR(20);
    DECLARE v_unit_expiry DATE;
    DECLARE v_is_compat BOOLEAN DEFAULT FALSE;
    
    START TRANSACTION;
    
    -- 1. Lock and validate the blood request
    SELECT blood_group, component_type, quantity, status
    INTO v_req_blood_group, v_req_component, v_req_quantity, v_req_status
    FROM blood_requests
    WHERE request_id = p_request_id
    FOR UPDATE;
    
    IF v_req_status IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Blood request not found';
    END IF;
    
    IF v_req_status NOT IN ('Pending', 'Partially Fulfilled') THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Request is not in an active allocatable status';
    END IF;
    
    -- 2. Verify requested quantity limit
    SELECT COUNT(*) INTO v_current_reserved
    FROM reservations
    WHERE request_id = p_request_id AND status = 'Active';
    
    IF v_current_reserved >= v_req_quantity THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Requested quantity is already fully reserved';
    END IF;
    
    -- 3. Lock and validate the blood unit
    SELECT blood_group, component_type, status, expiry_date
    INTO v_unit_blood_group, v_unit_component, v_unit_status, v_unit_expiry
    FROM blood_units
    WHERE unit_id = p_unit_id
    FOR UPDATE;
    
    IF v_unit_status IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Blood unit not found';
    END IF;
    
    IF v_unit_status != 'AVAILABLE' THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unit is not available for reservation';
    END IF;
    
    IF v_unit_expiry <= CURRENT_DATE THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unit has expired and cannot be reserved';
    END IF;
    
    IF v_unit_component != v_req_component THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unit component type does not match requested component';
    END IF;
    
    -- Check ABO/Rh compatibility
    SET v_is_compat = check_compatibility(v_req_blood_group, v_unit_blood_group, v_unit_component);
    IF v_is_compat = FALSE THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unit is ABO/Rh incompatible with recipient';
    END IF;
    
    -- Exclude if crossmatch is recorded as Incompatible
    IF EXISTS (SELECT 1 FROM cross_matches WHERE request_id = p_request_id AND unit_id = p_unit_id AND result = 'Incompatible') THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unit has a recorded incompatible crossmatch for this request';
    END IF;
    
    -- Verify no active reservation already exists on this unit
    IF EXISTS (SELECT 1 FROM reservations WHERE unit_id = p_unit_id AND status = 'Active') THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unit is already actively reserved';
    END IF;
    
    -- 4. Apply status transition and record reservation (valid 24 hours)
    UPDATE blood_units 
    SET status = 'RESERVED', updated_at = NOW() 
    WHERE unit_id = p_unit_id;
    
    INSERT INTO reservations (request_id, unit_id, reserved_at, expires_at, status)
    VALUES (p_request_id, p_unit_id, NOW(), DATE_ADD(NOW(), INTERVAL 24 HOUR), 'Active');
    
    COMMIT;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS issue_unit;
DELIMITER //
CREATE PROCEDURE issue_unit(
    IN p_request_id VARCHAR(50), 
    IN p_unit_id VARCHAR(50), 
    IN p_user_id INT,
    IN p_reason_code VARCHAR(100)
)
BEGIN
    DECLARE v_unit_status VARCHAR(20);
    DECLARE v_unit_expiry DATE;
    DECLARE v_active_res_id INT;
    DECLARE v_is_crossmatch_compat BOOLEAN DEFAULT FALSE;
    DECLARE v_req_quantity INT;
    DECLARE v_issued_count INT DEFAULT 0;
    
    START TRANSACTION;
    
    -- 1. Lock and validate unit
    SELECT status, expiry_date 
    INTO v_unit_status, v_unit_expiry
    FROM blood_units
    WHERE unit_id = p_unit_id
    FOR UPDATE;
    
    IF v_unit_status IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Blood unit not found';
    END IF;
    
    IF v_unit_status != 'RESERVED' THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unit must be RESERVED before it can be issued';
    END IF;
    
    IF v_unit_expiry <= CURRENT_DATE THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unit has expired and cannot be issued';
    END IF;
    
    -- 2. Verify that unit is actively reserved specifically for THIS request
    SELECT reservation_id INTO v_active_res_id
    FROM reservations
    WHERE request_id = p_request_id 
      AND unit_id = p_unit_id 
      AND status = 'Active'
    LIMIT 1;
    
    IF v_active_res_id IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unit is not reserved for this specific blood request';
    END IF;
    
    -- 3. Verify laboratory crossmatch compatibility evidence
    SELECT (result = 'Compatible') INTO v_is_crossmatch_compat
    FROM cross_matches
    WHERE request_id = p_request_id 
      AND unit_id = p_unit_id 
    ORDER BY crossmatch_id DESC 
    LIMIT 1;
    
    IF v_is_crossmatch_compat IS NULL OR v_is_crossmatch_compat = FALSE THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Issuance blocked: A verified Compatible crossmatch record is required';
    END IF;
    
    -- 4. Execute atomic state transitions
    UPDATE blood_units 
    SET status = 'ISSUED', updated_at = NOW() 
    WHERE unit_id = p_unit_id;
    
    UPDATE reservations 
    SET status = 'Fulfilled' 
    WHERE reservation_id = v_active_res_id;
    
    INSERT INTO issuances (request_id, unit_id, issued_by, reason_code, issued_at)
    VALUES (p_request_id, p_unit_id, p_user_id, p_reason_code, NOW());
    
    -- 5. Update request status based on fulfilled count
    SELECT quantity INTO v_req_quantity
    FROM blood_requests
    WHERE request_id = p_request_id;
    
    SELECT COUNT(*) INTO v_issued_count
    FROM issuances
    WHERE request_id = p_request_id;
    
    IF v_issued_count >= v_req_quantity THEN
        UPDATE blood_requests SET status = 'Fulfilled' WHERE request_id = p_request_id;
    ELSE
        UPDATE blood_requests SET status = 'Partially Fulfilled' WHERE request_id = p_request_id;
    END IF;
    
    COMMIT;
END //
DELIMITER ;

-- 5. Harden reservation expiry scheduled event so ISSUED units can NEVER be altered to AVAILABLE
DROP EVENT IF EXISTS expire_reservations_event;
DELIMITER //
CREATE EVENT expire_reservations_event
ON SCHEDULE EVERY 1 HOUR
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    -- Temporary table to hold expired active reservations
    CREATE TEMPORARY TABLE temp_expired_res AS
    SELECT reservation_id, unit_id 
    FROM reservations 
    WHERE status = 'Active' AND expires_at <= NOW();
    
    IF (SELECT COUNT(*) FROM temp_expired_res) > 0 THEN
        -- Only restore unit to AVAILABLE if it is still RESERVED and not expired!
        UPDATE blood_units u
        JOIN temp_expired_res t ON u.unit_id = t.unit_id
        SET u.status = 'AVAILABLE', u.updated_at = NOW()
        WHERE u.status = 'RESERVED' AND u.expiry_date > CURRENT_DATE;
        
        -- Mark reservations as Expired
        UPDATE reservations r
        JOIN temp_expired_res t ON r.reservation_id = t.reservation_id
        SET r.status = 'Expired';
    END IF;
    
    DROP TEMPORARY TABLE IF EXISTS temp_expired_res;
END //
DELIMITER ;
