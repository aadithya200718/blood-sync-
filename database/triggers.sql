-- bloodsync/database/triggers.sql
USE bloodsync;

DELIMITER //

-- 1. Audit Logging for blood_units (AFTER UPDATE)
CREATE TRIGGER after_blood_unit_update
AFTER UPDATE ON blood_units
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status OR OLD.storage_location != NEW.storage_location THEN
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, before_state, after_state)
        VALUES (
            NULL, -- We'll leave user_id NULL if updated by trigger, or it would require session variables in a real app
            'UNIT_UPDATED',
            'blood_units',
            NEW.unit_id,
            JSON_OBJECT('status', OLD.status, 'storage_location', OLD.storage_location),
            JSON_OBJECT('status', NEW.status, 'storage_location', NEW.storage_location)
        );
    END IF;
    
    -- Low Stock Alert Check (only if status changed FROM AVAILABLE or TO AVAILABLE)
    IF OLD.status != NEW.status AND (OLD.status = 'AVAILABLE' OR NEW.status = 'AVAILABLE') THEN
        SET @inv_status = get_inventory_status(NEW.blood_group, NEW.component_type);
        
        IF @inv_status IN ('Critical', 'Low') THEN
            -- Insert alert if one doesn't already exist for this group today
            IF NOT EXISTS (
                SELECT 1 FROM alerts 
                WHERE type = 'LOW_STOCK' 
                  AND blood_group = NEW.blood_group 
                  AND status = 'Active'
                  AND DATE(created_at) = CURRENT_DATE
            ) THEN
                INSERT INTO alerts (type, severity, blood_group, message)
                VALUES (
                    'LOW_STOCK', 
                    IF(@inv_status = 'Critical', 'Critical', 'Warning'),
                    NEW.blood_group,
                    CONCAT('Inventory for ', NEW.blood_group, ' ', NEW.component_type, ' is at ', @inv_status, ' level.')
                );
            END IF;
        END IF;
    END IF;
END //

-- 2. Audit Logging for reservations (AFTER INSERT)
CREATE TRIGGER after_reservation_insert
AFTER INSERT ON reservations
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (action, entity_type, entity_id, after_state)
    VALUES (
        'RESERVATION_CREATED',
        'reservations',
        NEW.reservation_id,
        JSON_OBJECT('request_id', NEW.request_id, 'unit_id', NEW.unit_id, 'expires_at', NEW.expires_at)
    );
END //

DELIMITER ;
