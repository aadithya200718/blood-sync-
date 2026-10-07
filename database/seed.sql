-- BloodSync Database Seed Data
USE bloodsync;

-- 1. users
-- Password for all seed users is 'password123'
INSERT INTO users (user_id, name, email, password_hash, role, status) VALUES
(1, 'Admin User', 'admin@bloodsync.local', '$argon2id$v=19$m=65536,t=3,p=4$gq8GYXCoBGzYQs3xmEsj5A$ddoSLbDkBy7NY5uS7ivSIXmgRW5J6jarPmsx3TBR4dY', 'Admin', 'Active'),
(2, 'John Tech', 'john@bloodsync.local', '$argon2id$v=19$m=65536,t=3,p=4$gq8GYXCoBGzYQs3xmEsj5A$ddoSLbDkBy7NY5uS7ivSIXmgRW5J6jarPmsx3TBR4dY', 'Technician', 'Active'),
(3, 'Sarah Manager', 'sarah@bloodsync.local', '$argon2id$v=19$m=65536,t=3,p=4$gq8GYXCoBGzYQs3xmEsj5A$ddoSLbDkBy7NY5uS7ivSIXmgRW5J6jarPmsx3TBR4dY', 'Manager', 'Active'),
(4, 'Robert Auditor', 'auditor@bloodsync.local', '$argon2id$v=19$m=65536,t=3,p=4$gq8GYXCoBGzYQs3xmEsj5A$ddoSLbDkBy7NY5uS7ivSIXmgRW5J6jarPmsx3TBR4dY', 'Auditor', 'Active')
ON DUPLICATE KEY UPDATE name=VALUES(name), password_hash=VALUES(password_hash), role=VALUES(role), status=VALUES(status);

-- 2. inventory_targets
INSERT INTO inventory_targets (blood_group, component_type, critical_level, minimum_level, target_level) VALUES
('O+', 'Red Blood Cells', 10, 25, 60),
('O-', 'Red Blood Cells', 5, 15, 30),
('A+', 'Red Blood Cells', 10, 20, 50),
('A-', 'Red Blood Cells', 3, 10, 20),
('B+', 'Red Blood Cells', 5, 15, 40),
('B-', 'Red Blood Cells', 2, 5, 15),
('AB+', 'Red Blood Cells', 2, 5, 15),
('AB-', 'Red Blood Cells', 1, 3, 10),
('O+', 'Whole Blood', 8, 18, 40),
('O-', 'Whole Blood', 4, 10, 25),
('A+', 'Whole Blood', 6, 15, 35),
('A-', 'Whole Blood', 2, 8, 15),
('B+', 'Whole Blood', 5, 12, 30),
('B-', 'Whole Blood', 2, 5, 12),
('AB+', 'Whole Blood', 2, 5, 12),
('AB-', 'Whole Blood', 1, 3, 8),
('O+', 'Platelets', 4, 10, 20),
('O-', 'Platelets', 2, 6, 12),
('A+', 'Platelets', 3, 8, 16),
('B+', 'Platelets', 3, 8, 16),
('AB+', 'Platelets', 1, 4, 10),
('O+', 'Plasma', 6, 15, 30),
('O-', 'Plasma', 3, 8, 18),
('A+', 'Plasma', 5, 12, 25),
('B+', 'Plasma', 4, 10, 20),
('AB+', 'Plasma', 2, 6, 15)
ON DUPLICATE KEY UPDATE critical_level=VALUES(critical_level), minimum_level=VALUES(minimum_level), target_level=VALUES(target_level);

-- 3. compatibility_rules (Red Blood Cells)
INSERT INTO compatibility_rules (recipient_group, donor_group, component_type, is_compatible) VALUES
('O+', 'O+', 'Red Blood Cells', TRUE),
('O+', 'O-', 'Red Blood Cells', TRUE),
('O-', 'O-', 'Red Blood Cells', TRUE),

('A+', 'A+', 'Red Blood Cells', TRUE),
('A+', 'A-', 'Red Blood Cells', TRUE),
('A+', 'O+', 'Red Blood Cells', TRUE),
('A+', 'O-', 'Red Blood Cells', TRUE),

('A-', 'A-', 'Red Blood Cells', TRUE),
('A-', 'O-', 'Red Blood Cells', TRUE),

('B+', 'B+', 'Red Blood Cells', TRUE),
('B+', 'B-', 'Red Blood Cells', TRUE),
('B+', 'O+', 'Red Blood Cells', TRUE),
('B+', 'O-', 'Red Blood Cells', TRUE),

('B-', 'B-', 'Red Blood Cells', TRUE),
('B-', 'O-', 'Red Blood Cells', TRUE),

('AB+', 'O+', 'Red Blood Cells', TRUE),
('AB+', 'O-', 'Red Blood Cells', TRUE),
('AB+', 'A+', 'Red Blood Cells', TRUE),
('AB+', 'A-', 'Red Blood Cells', TRUE),
('AB+', 'B+', 'Red Blood Cells', TRUE),
('AB+', 'B-', 'Red Blood Cells', TRUE),
('AB+', 'AB+', 'Red Blood Cells', TRUE),
('AB+', 'AB-', 'Red Blood Cells', TRUE),

('AB-', 'AB-', 'Red Blood Cells', TRUE),
('AB-', 'A-', 'Red Blood Cells', TRUE),
('AB-', 'B-', 'Red Blood Cells', TRUE),
('AB-', 'O-', 'Red Blood Cells', TRUE),

-- Compatibility rules for Whole Blood
('O+', 'O+', 'Whole Blood', TRUE),
('O-', 'O-', 'Whole Blood', TRUE),
('A+', 'A+', 'Whole Blood', TRUE),
('A-', 'A-', 'Whole Blood', TRUE),
('B+', 'B+', 'Whole Blood', TRUE),
('B-', 'B-', 'Whole Blood', TRUE),
('AB+', 'AB+', 'Whole Blood', TRUE),
('AB-', 'AB-', 'Whole Blood', TRUE)
ON DUPLICATE KEY UPDATE is_compatible=VALUES(is_compatible);

-- 4. donors
INSERT INTO donors (donor_id, name, blood_group, phone, last_donation_date, status) VALUES
(1, 'Alice Smith', 'O+', '555-0101', '2026-08-01', 'Eligible'),
(2, 'Bob Johnson', 'O-', '555-0102', '2026-08-15', 'Eligible'),
(3, 'Charlie Brown', 'A+', '555-0103', '2026-09-01', 'Eligible'),
(4, 'Diana Prince', 'A-', '555-0104', '2026-01-01', 'Deferred'),
(5, 'Evan Wright', 'B+', '555-0105', '2026-09-10', 'Eligible'),
(6, 'Fiona Davis', 'AB+', '555-0106', '2026-07-20', 'Eligible'),
(7, 'George King', 'B-', '555-0107', '2026-08-25', 'Eligible'),
(8, 'Helen Troy', 'AB-', '555-0108', '2026-09-05', 'Eligible')
ON DUPLICATE KEY UPDATE name=VALUES(name), blood_group=VALUES(blood_group), phone=VALUES(phone), status=VALUES(status);

-- 5. patients
INSERT INTO patients (patient_id, name, blood_group, hospital) VALUES
(1, 'George Miller', 'A+', 'City General Hospital'),
(2, 'Hannah Abbott', 'O-', 'St. Jude Medical Center'),
(3, 'Ian Malcolm', 'B+', 'Metro Hospital'),
(4, 'Julia Roberts', 'AB+', 'Memorial Trauma Center'),
(5, 'Kevin Spacey', 'O+', 'University Health Clinic')
ON DUPLICATE KEY UPDATE name=VALUES(name), blood_group=VALUES(blood_group), hospital=VALUES(hospital);

-- 6. blood_units
-- Dynamic dates ensure freshness regardless of run date
INSERT INTO blood_units (unit_id, donor_id, blood_group, component_type, collection_date, expiry_date, status, storage_location) VALUES
('UNIT-O-001', 1, 'O+', 'Red Blood Cells', DATE_SUB(CURRENT_DATE, INTERVAL 10 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 25 DAY), 'AVAILABLE', 'Fridge 1, Shelf A'),
('UNIT-O-002', 1, 'O+', 'Red Blood Cells', DATE_SUB(CURRENT_DATE, INTERVAL 5 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY), 'AVAILABLE', 'Fridge 1, Shelf A'),
('UNIT-O-003', 2, 'O-', 'Red Blood Cells', DATE_SUB(CURRENT_DATE, INTERVAL 15 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 20 DAY), 'AVAILABLE', 'Fridge 1, Shelf B'),
('UNIT-O-004', 2, 'O-', 'Red Blood Cells', DATE_SUB(CURRENT_DATE, INTERVAL 2 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 35 DAY), 'AVAILABLE', 'Fridge 1, Shelf B'),
('UNIT-A-001', 3, 'A+', 'Red Blood Cells', DATE_SUB(CURRENT_DATE, INTERVAL 8 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 27 DAY), 'AVAILABLE', 'Fridge 2, Shelf A'),
('UNIT-A-002', 3, 'A+', 'Red Blood Cells', DATE_SUB(CURRENT_DATE, INTERVAL 3 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 32 DAY), 'AVAILABLE', 'Fridge 2, Shelf A'),
('UNIT-A-003', 4, 'A-', 'Red Blood Cells', DATE_SUB(CURRENT_DATE, INTERVAL 12 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 22 DAY), 'AVAILABLE', 'Fridge 2, Shelf B'),
('UNIT-B-001', 5, 'B+', 'Red Blood Cells', DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 28 DAY), 'AVAILABLE', 'Fridge 3, Shelf A'),
('UNIT-B-002', 5, 'B+', 'Red Blood Cells', DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 34 DAY), 'AVAILABLE', 'Fridge 3, Shelf A'),
('UNIT-B-003', 7, 'B-', 'Red Blood Cells', DATE_SUB(CURRENT_DATE, INTERVAL 14 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 21 DAY), 'AVAILABLE', 'Fridge 3, Shelf B'),
('UNIT-AB-001', 6, 'AB+', 'Red Blood Cells', DATE_SUB(CURRENT_DATE, INTERVAL 20 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 15 DAY), 'AVAILABLE', 'Fridge 4, Shelf A'),
('UNIT-AB-002', 8, 'AB-', 'Red Blood Cells', DATE_SUB(CURRENT_DATE, INTERVAL 18 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 17 DAY), 'AVAILABLE', 'Fridge 4, Shelf B'),
('UNIT-O-EXP1', 1, 'O+', 'Red Blood Cells', DATE_SUB(CURRENT_DATE, INTERVAL 40 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 2 DAY), 'EXPIRED', 'Disposal Bin A'),
('UNIT-O-WARN', 1, 'O+', 'Red Blood Cells', DATE_SUB(CURRENT_DATE, INTERVAL 32 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 3 DAY), 'AVAILABLE', 'Fridge 1, Shelf C')
ON DUPLICATE KEY UPDATE status=VALUES(status), expiry_date=VALUES(expiry_date), storage_location=VALUES(storage_location);

-- 7. blood_requests
INSERT INTO blood_requests (request_id, patient_id, blood_group, component_type, quantity, urgency, status, requested_at) VALUES
('REQ-2026-001', 1, 'A+', 'Red Blood Cells', 2, 'Routine', 'Pending', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('REQ-2026-002', 2, 'O-', 'Red Blood Cells', 1, 'Emergency', 'Pending', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
('REQ-2026-003', 3, 'B+', 'Red Blood Cells', 1, 'Urgent', 'Pending', DATE_SUB(NOW(), INTERVAL 30 MINUTE))
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- 8. initial alerts
INSERT INTO alerts (type, severity, blood_group, message, status) VALUES
('LOW_STOCK', 'Warning', 'AB-', 'AB- Red Blood Cells is approaching minimum target buffer.', 'Active'),
('EXPIRING_SOON', 'Warning', 'O+', 'Unit UNIT-O-WARN expires in 3 days. Recommend prioritized issuance.', 'Active');
