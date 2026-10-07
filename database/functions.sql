-- bloodsync/database/functions.sql
USE bloodsync;

DELIMITER //

-- 1. check_compatibility
-- Checks if a specific donor blood group is compatible with a recipient blood group
CREATE FUNCTION check_compatibility(
    p_recipient_group VARCHAR(10),
    p_donor_group VARCHAR(10),
    p_component_type VARCHAR(50)
) 
RETURNS BOOLEAN
DETERMINISTIC
BEGIN
    DECLARE v_is_compatible BOOLEAN DEFAULT FALSE;
    
    SELECT is_compatible INTO v_is_compatible
    FROM compatibility_rules
    WHERE recipient_group = p_recipient_group
      AND donor_group = p_donor_group
      AND component_type = p_component_type
    LIMIT 1;
    
    RETURN v_is_compatible;
END //

-- 2. get_inventory_status
-- Returns 'Critical', 'Low', or 'Normal' based on inventory targets
CREATE FUNCTION get_inventory_status(
    p_blood_group VARCHAR(10),
    p_component_type VARCHAR(50)
)
RETURNS VARCHAR(20)
READS SQL DATA
BEGIN
    DECLARE v_current_stock INT DEFAULT 0;
    DECLARE v_critical_level INT DEFAULT 0;
    DECLARE v_minimum_level INT DEFAULT 0;
    DECLARE v_status VARCHAR(20) DEFAULT 'Normal';
    
    -- Get current stock
    SELECT COUNT(*) INTO v_current_stock
    FROM blood_units
    WHERE blood_group = p_blood_group
      AND component_type = p_component_type
      AND status = 'AVAILABLE';
      
    -- Get targets
    SELECT critical_level, minimum_level 
    INTO v_critical_level, v_minimum_level
    FROM inventory_targets
    WHERE blood_group = p_blood_group
      AND component_type = p_component_type
    LIMIT 1;
    
    -- Determine status
    IF v_current_stock <= v_critical_level THEN
        SET v_status = 'Critical';
    ELSEIF v_current_stock <= v_minimum_level THEN
        SET v_status = 'Low';
    END IF;
    
    RETURN v_status;
END //

DELIMITER ;
