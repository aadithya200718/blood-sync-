-- BloodSync Database Schema

CREATE DATABASE IF NOT EXISTS bloodsync;
USE bloodsync;

-- 1. users
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Technician', 'Manager', 'Auditor') NOT NULL,
    status ENUM('Active', 'Inactive', 'Suspended') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. donors
CREATE TABLE donors (
    donor_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    phone VARCHAR(20),
    last_donation_date DATE,
    status ENUM('Eligible', 'Deferred', 'Inactive') DEFAULT 'Eligible',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. patients
CREATE TABLE patients (
    patient_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    hospital VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. blood_units
CREATE TABLE blood_units (
    unit_id VARCHAR(50) PRIMARY KEY,
    donor_id INT NOT NULL,
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    component_type ENUM('Whole Blood', 'Red Blood Cells', 'Platelets', 'Plasma') NOT NULL,
    collection_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status ENUM('AVAILABLE', 'RESERVED', 'ISSUED', 'EXPIRED', 'DISCARDED', 'QUARANTINE') DEFAULT 'AVAILABLE',
    storage_location VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (donor_id) REFERENCES donors(donor_id)
);

-- 5. blood_requests
CREATE TABLE blood_requests (
    request_id VARCHAR(50) PRIMARY KEY,
    patient_id INT NOT NULL,
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    component_type ENUM('Whole Blood', 'Red Blood Cells', 'Platelets', 'Plasma') NOT NULL,
    quantity INT NOT NULL,
    urgency ENUM('Routine', 'Urgent', 'Emergency') DEFAULT 'Routine',
    status ENUM('Pending', 'Partially Fulfilled', 'Fulfilled', 'Cancelled') DEFAULT 'Pending',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
);

-- 6. cross_matches
CREATE TABLE cross_matches (
    crossmatch_id INT AUTO_INCREMENT PRIMARY KEY,
    request_id VARCHAR(50) NOT NULL,
    unit_id VARCHAR(50) NOT NULL,
    result ENUM('Compatible', 'Incompatible', 'Pending') DEFAULT 'Pending',
    tested_by INT NOT NULL,
    tested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES blood_requests(request_id),
    FOREIGN KEY (unit_id) REFERENCES blood_units(unit_id),
    FOREIGN KEY (tested_by) REFERENCES users(user_id)
);

-- 7. reservations
CREATE TABLE reservations (
    reservation_id INT AUTO_INCREMENT PRIMARY KEY,
    request_id VARCHAR(50) NOT NULL,
    unit_id VARCHAR(50) NOT NULL,
    reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    status ENUM('Active', 'Fulfilled', 'Expired', 'Cancelled') DEFAULT 'Active',
    FOREIGN KEY (request_id) REFERENCES blood_requests(request_id),
    FOREIGN KEY (unit_id) REFERENCES blood_units(unit_id)
);

-- 8. issuances
CREATE TABLE issuances (
    issuance_id INT AUTO_INCREMENT PRIMARY KEY,
    request_id VARCHAR(50) NOT NULL,
    unit_id VARCHAR(50) NOT NULL,
    issued_by INT NOT NULL,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason_code VARCHAR(100),
    FOREIGN KEY (request_id) REFERENCES blood_requests(request_id),
    FOREIGN KEY (unit_id) REFERENCES blood_units(unit_id),
    FOREIGN KEY (issued_by) REFERENCES users(user_id)
);

-- 9. inventory_targets
CREATE TABLE inventory_targets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    component_type ENUM('Whole Blood', 'Red Blood Cells', 'Platelets', 'Plasma') NOT NULL,
    critical_level INT NOT NULL,
    minimum_level INT NOT NULL,
    target_level INT NOT NULL,
    UNIQUE KEY unique_target (blood_group, component_type)
);

-- 10. compatibility_rules
CREATE TABLE compatibility_rules (
    rule_id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    donor_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    component_type ENUM('Whole Blood', 'Red Blood Cells', 'Platelets', 'Plasma') NOT NULL,
    is_compatible BOOLEAN DEFAULT TRUE,
    UNIQUE KEY unique_rule (recipient_group, donor_group, component_type)
);

-- 11. alerts
CREATE TABLE alerts (
    alert_id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('LOW_STOCK', 'EXPIRING_SOON', 'SYSTEM_ERROR', 'UNFULFILLED_REQUEST') NOT NULL,
    severity ENUM('Info', 'Warning', 'Critical') NOT NULL,
    unit_id VARCHAR(50),
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    message TEXT NOT NULL,
    status ENUM('Active', 'Resolved', 'Dismissed') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    FOREIGN KEY (unit_id) REFERENCES blood_units(unit_id)
);

-- 12. audit_logs
CREATE TABLE audit_logs (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    before_state JSON,
    after_state JSON,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- 13. decision_traces
CREATE TABLE decision_traces (
    trace_id INT AUTO_INCREMENT PRIMARY KEY,
    request_id VARCHAR(50) NOT NULL,
    unit_id VARCHAR(50),
    rule_name VARCHAR(255) NOT NULL,
    rule_result BOOLEAN NOT NULL,
    rule_value VARCHAR(255),
    explanation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES blood_requests(request_id),
    FOREIGN KEY (unit_id) REFERENCES blood_units(unit_id)
);

-- 14. ai_insights
CREATE TABLE ai_insights (
    insight_id INT AUTO_INCREMENT PRIMARY KEY,
    agent_name VARCHAR(100) NOT NULL,
    insight_type VARCHAR(100) NOT NULL,
    severity ENUM('Info', 'Warning', 'Critical') NOT NULL,
    summary TEXT NOT NULL,
    evidence JSON,
    recommendation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
