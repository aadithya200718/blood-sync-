-- bloodsync/database/procedures.sql
USE bloodsync;

DELIMITER //

-- 1. match_request
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
    
    -- Return error if not pending
    IF v_status != 'Pending' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Request is not in Pending status';
    END IF;
    
    -- Main matching logic
    SELECT 
        u.unit_id,
        u.blood_group,
        u.expiry_date,
        u.storage_location,
        IFNULL(c.result, 'None') as crossmatch_status
    FROM blood_units u
    LEFT JOIN cross_matches c ON c.unit_id = u.unit_id AND c.request_id = p_request_id
    WHERE u.status = 'AVAILABLE'
      AND u.component_type = v_component_type
      AND check_compatibility(v_patient_group, u.blood_group, u.component_type) = TRUE
      -- Exclude units expiring today to be safe
      AND u.expiry_date > CURRENT_DATE
    ORDER BY 
      -- Prioritize acceptable crossmatches
      (c.result = 'Compatible') DESC,
      -- FEFO (First Expire, First Out)
      u.expiry_date ASC
    LIMIT v_quantity;
    
END //

-- 2. reserve_unit
CREATE PROCEDURE reserve_unit(
    IN p_request_id VARCHAR(50), 
    IN p_unit_id VARCHAR(50), 
    IN p_user_id INT
)
BEGIN
    DECLARE v_unit_status VARCHAR(20);
    
    START TRANSACTION;
    
    -- Lock the row to prevent concurrent reservation
    SELECT status INTO v_unit_status
    FROM blood_units
    WHERE unit_id = p_unit_id
    FOR UPDATE;
    
    IF v_unit_status != 'AVAILABLE' THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unit is not available for reservation';
    ELSE
        -- Update unit status
        UPDATE blood_units SET status = 'RESERVED' WHERE unit_id = p_unit_id;
        
        -- Create reservation record (valid for 24 hours)
        INSERT INTO reservations (request_id, unit_id, expires_at, status)
        VALUES (p_request_id, p_unit_id, DATE_ADD(NOW(), INTERVAL 24 HOUR), 'Active');
        
        COMMIT;
    END IF;
END //

-- 3. issue_unit
CREATE PROCEDURE issue_unit(
    IN p_request_id VARCHAR(50), 
    IN p_unit_id VARCHAR(50), 
    IN p_user_id INT,
    IN p_reason_code VARCHAR(100)
)
BEGIN
    DECLARE v_unit_status VARCHAR(20);
    
    START TRANSACTION;
    
    SELECT status INTO v_unit_status
    FROM blood_units
    WHERE unit_id = p_unit_id
    FOR UPDATE;
    
    -- Allow issuance if available or reserved (by this request specifically, logic simplified here)
    IF v_unit_status NOT IN ('AVAILABLE', 'RESERVED') THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unit cannot be issued from its current status';
    ELSE
        -- Update unit status
        UPDATE blood_units SET status = 'ISSUED' WHERE unit_id = p_unit_id;
        
        -- Mark reservation as fulfilled if it exists
        UPDATE reservations SET status = 'Fulfilled' 
        WHERE request_id = p_request_id AND unit_id = p_unit_id AND status = 'Active';
        
        -- Create issuance record
        INSERT INTO issuances (request_id, unit_id, issued_by, reason_code)
        VALUES (p_request_id, p_unit_id, p_user_id, p_reason_code);
        
        COMMIT;
    END IF;
END //

DELIMITER ;
