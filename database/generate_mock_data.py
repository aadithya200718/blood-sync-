"""
BloodSync - Massive Realistic Seed Data Generator
Generates 1,000+ Blood Units and thousands of supporting records
across donors, patients, requests, cross-matches, reservations,
issuances, alerts, audit logs, decision traces, and AI insights.
"""

import sys
import io
import json
import random
import os
from datetime import datetime, date, timedelta
import pymysql

# Fix Windows console UTF-8 output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', 'root'),
    'database': os.getenv('DB_NAME', 'bloodsync'),
    'autocommit': False
}

BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
# Population frequency distribution weights
BLOOD_GROUP_WEIGHTS = [0.28, 0.04, 0.32, 0.05, 0.08, 0.02, 0.19, 0.02]

COMPONENTS = ['Red Blood Cells', 'Whole Blood', 'Platelets', 'Plasma']
COMPONENT_WEIGHTS = [0.55, 0.20, 0.15, 0.10]

HOSPITALS = [
    'Apollo Multi-Specialty Hospital',
    'Fortis Memorial Research Institute',
    'AIIMS Trauma Center',
    'Max Super Speciality Hospital',
    'Manipal Hospital & Blood Bank',
    'City General Hospital',
    'St. Jude Medical Center',
    'Memorial Trauma & Emergency Center',
    'Narayana Health City',
    'KIMS Premier Institute',
    'Rainbow Children Hospital',
    'Global Health City Research Wing'
]

STORAGE_LOCATIONS = {
    'Red Blood Cells': [
        'Fridge 1, Shelf A', 'Fridge 1, Shelf B', 'Fridge 1, Shelf C',
        'Fridge 2, Shelf A', 'Fridge 2, Shelf B', 'Fridge 2, Shelf C',
        'Fridge 3, Shelf A', 'Fridge 3, Shelf B'
    ],
    'Whole Blood': [
        'Fridge 3, Shelf C', 'Fridge 4, Shelf A', 'Fridge 4, Shelf B'
    ],
    'Platelets': [
        'Platelet Agitator 1, Tray A', 'Platelet Agitator 1, Tray B',
        'Platelet Agitator 2, Tray A', 'Platelet Agitator 2, Tray B'
    ],
    'Plasma': [
        'Deep Freezer -20C, Rack 1', 'Deep Freezer -20C, Rack 2',
        'Deep Freezer -20C, Rack 3', 'Ultra-Low Cryo Unit, Tray 1'
    ]
}

FIRST_NAMES = [
    'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
    'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Kabir', 'Ananya', 'Diya', 'Gauri', 'Isha', 'Kavya',
    'Khushi', 'Myra', 'Navya', 'Pari', 'Prisha', 'Riya', 'Saanvi', 'Sarah', 'Pooja', 'Tanvi',
    'Alexander', 'Benjamin', 'Charlotte', 'Daniel', 'Emma', 'Felix', 'Grace', 'Henry', 'Isabella', 'James',
    'Liam', 'Mia', 'Noah', 'Olivia', 'Peter', 'Quinn', 'Rachel', 'Samuel', 'Thomas', 'Victoria',
    'Rahul', 'Rohit', 'Suresh', 'Ramesh', 'Vikram', 'Deepak', 'Manish', 'Aditi', 'Sneha', 'Neha',
    'Sunita', 'Rekha', 'Kiran', 'Rajesh', 'Praveen', 'Sanjay', 'Amit', 'Anil', 'Sunil', 'Vijay'
]

LAST_NAMES = [
    'Sharma', 'Verma', 'Gupta', 'Patel', 'Reddy', 'Rao', 'Nair', 'Menon', 'Iyer', 'Chatterjee',
    'Banerjee', 'Mukherjee', 'Das', 'Roy', 'Singh', 'Kaur', 'Chopra', 'Malhotra', 'Bhatia', 'Kapoor',
    'Joshi', 'Kulkarni', 'Deshmukh', 'Patil', 'Shinde', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones',
    'Miller', 'Davis', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee'
]

REASON_CODES = [
    'Emergency Trauma Resuscitation',
    'Elective Coronary Artery Bypass',
    'Acute Obstetric Post-Partum Hemorrhage',
    'Chemotherapy Severe Anemia Support',
    'Orthopedic Total Hip Replacement',
    'Pediatric Thalassemia Major Transfusion',
    'ICU Septic Shock Hemotherapy',
    'Gastrointestinal Bleed Management',
    'Organ Transplant Intra-operative Support',
    'Aplastic Anemia Platelet Support',
    'Neurosurgical Aneurysm Clipping',
    'Emergency Operating Theatre Release'
]

def generate_name():
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"

def generate_phone():
    return f"+91-9{random.randint(100000000, 999999999)}"

def main():
    print("Connecting to MySQL...")
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()

    try:
        # Disable foreign keys temporarily for clean reset
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
        
        # Clear transaction tables (preserve users, inventory_targets, compatibility_rules)
        print("Cleaning up old mock data...")
        tables_to_clear = [
            'ai_insights', 'decision_traces', 'audit_logs', 'alerts',
            'issuances', 'reservations', 'cross_matches', 'blood_requests',
            'blood_units', 'patients', 'donors'
        ]
        for t in tables_to_clear:
            cursor.execute(f"TRUNCATE TABLE {t};")
        
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
        
        # 1. Ensure Standard Users exist
        print("\n[1/10] Verifying core system users...")
        users = [
            (1, 'System Administrator', 'admin@bloodsync.local', '$argon2id$v=19$m=65536,t=3,p=4$gq8GYXCoBGzYQs3xmEsj5A$ddoSLbDkBy7NY5uS7ivSIXmgRW5J6jarPmsx3TBR4dY', 'Admin', 'Active'),
            (2, 'John Technician', 'john@bloodsync.local', '$argon2id$v=19$m=65536,t=3,p=4$gq8GYXCoBGzYQs3xmEsj5A$ddoSLbDkBy7NY5uS7ivSIXmgRW5J6jarPmsx3TBR4dY', 'Technician', 'Active'),
            (3, 'Sarah Operations Manager', 'sarah@bloodsync.local', '$argon2id$v=19$m=65536,t=3,p=4$gq8GYXCoBGzYQs3xmEsj5A$ddoSLbDkBy7NY5uS7ivSIXmgRW5J6jarPmsx3TBR4dY', 'Manager', 'Active'),
            (4, 'Robert Compliance Auditor', 'auditor@bloodsync.local', '$argon2id$v=19$m=65536,t=3,p=4$gq8GYXCoBGzYQs3xmEsj5A$ddoSLbDkBy7NY5uS7ivSIXmgRW5J6jarPmsx3TBR4dY', 'Auditor', 'Active')
        ]
        cursor.executemany("""
            INSERT INTO users (user_id, name, email, password_hash, role, status)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE name=VALUES(name), status=VALUES(status);
        """, users)
        print("  -> 4 core users active.")

        today = date.today()

        # 2. Generate 350 Realistic Donors
        print("\n[2/10] Generating 350 donors...")
        donor_records = []
        for i in range(1, 351):
            name = generate_name()
            bg = random.choices(BLOOD_GROUPS, weights=BLOOD_GROUP_WEIGHTS)[0]
            phone = generate_phone()
            # donation date in past 1 to 200 days
            days_ago = random.randint(10, 250)
            last_date = today - timedelta(days=days_ago)
            # Status: 85% Eligible, 10% Deferred, 5% Inactive
            status = random.choices(['Eligible', 'Deferred', 'Inactive'], weights=[0.85, 0.10, 0.05])[0]
            created = datetime.now() - timedelta(days=random.randint(100, 400))
            donor_records.append((i, name, bg, phone, last_date, status, created))
        
        cursor.executemany("""
            INSERT INTO donors (donor_id, name, blood_group, phone, last_donation_date, status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, donor_records)
        print(f"  -> Inserted {len(donor_records)} donors.")

        # 3. Generate 350 Realistic Patients
        print("\n[3/10] Generating 350 patients...")
        patient_records = []
        for i in range(1, 351):
            name = generate_name()
            bg = random.choices(BLOOD_GROUPS, weights=BLOOD_GROUP_WEIGHTS)[0]
            hosp = random.choice(HOSPITALS)
            created = datetime.now() - timedelta(days=random.randint(5, 120))
            patient_records.append((i, name, bg, hosp, created))

        cursor.executemany("""
            INSERT INTO patients (patient_id, name, blood_group, hospital, created_at)
            VALUES (%s, %s, %s, %s, %s)
        """, patient_records)
        print(f"  -> Inserted {len(patient_records)} patients.")

        # 4. Generate 1,150 Blood Units
        print("\n[4/10] Generating 1,150 blood units across all 8 blood groups and components...")
        blood_unit_records = []
        unit_ids = []

        for i in range(1, 1151):
            uid = f"UNIT-2026-{i:04d}"
            unit_ids.append(uid)
            donor_id = random.randint(1, 350)
            donor_bg = donor_records[donor_id - 1][2]
            comp = random.choices(COMPONENTS, weights=COMPONENT_WEIGHTS)[0]

            # Realistic collection & expiry rules:
            if comp == 'Platelets':
                # Collected within last 1 to 4 days, shelf life 5 days
                coll_days_ago = random.randint(1, 6)
                shelf_life = 5
            elif comp == 'Red Blood Cells':
                # Collected within last 1 to 38 days, shelf life 42 days
                coll_days_ago = random.randint(2, 45)
                shelf_life = 42
            elif comp == 'Whole Blood':
                coll_days_ago = random.randint(2, 35)
                shelf_life = 35
            else:  # Plasma
                coll_days_ago = random.randint(5, 200)
                shelf_life = 365

            coll_date = today - timedelta(days=coll_days_ago)
            exp_date = coll_date + timedelta(days=shelf_life)

            # Determine realistic status
            is_past_expiry = exp_date < today
            if is_past_expiry:
                status = random.choices(['EXPIRED', 'DISCARDED'], weights=[0.8, 0.2])[0]
                loc = 'Disposal Quarantine Bin'
            else:
                # Distribution of active inventory
                status = random.choices(
                    ['AVAILABLE', 'RESERVED', 'ISSUED', 'QUARANTINE', 'DISCARDED'],
                    weights=[0.74, 0.11, 0.11, 0.03, 0.01]
                )[0]
                loc = random.choice(STORAGE_LOCATIONS[comp])
                if status == 'QUARANTINE':
                    loc = 'Quarantine Chamber Q-2'
                elif status == 'ISSUED':
                    loc = 'Dispatched (Clinical Transfusion)'

            created = datetime.combine(coll_date, datetime.min.time()) + timedelta(hours=random.randint(8, 18))
            blood_unit_records.append((
                uid, donor_id, donor_bg, comp, coll_date, exp_date, status, loc, created
            ))

        cursor.executemany("""
            INSERT INTO blood_units (unit_id, donor_id, blood_group, component_type, collection_date, expiry_date, status, storage_location, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, blood_unit_records)
        print(f"  -> Inserted {len(blood_unit_records)} blood units.")

        # 5. Generate 400 Blood Requests
        print("\n[5/10] Generating 400 clinical blood requests...")
        request_records = []
        request_ids = []

        for i in range(1, 401):
            rid = f"REQ-2026-{i:04d}"
            request_ids.append(rid)
            pat_id = random.randint(1, 350)
            pat_bg = patient_records[pat_id - 1][2]
            comp = random.choices(COMPONENTS, weights=COMPONENT_WEIGHTS)[0]
            qty = random.choices([1, 2, 3, 4], weights=[0.55, 0.30, 0.10, 0.05])[0]
            urgency = random.choices(['Routine', 'Urgent', 'Emergency'], weights=[0.60, 0.25, 0.15])[0]
            
            # Status
            status = random.choices(['Pending', 'Partially Fulfilled', 'Fulfilled', 'Cancelled'], weights=[0.40, 0.15, 0.40, 0.05])[0]
            req_time = datetime.now() - timedelta(days=random.randint(0, 30), hours=random.randint(1, 23))

            request_records.append((
                rid, pat_id, pat_bg, comp, qty, urgency, status, req_time
            ))

        cursor.executemany("""
            INSERT INTO blood_requests (request_id, patient_id, blood_group, component_type, quantity, urgency, status, requested_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, request_records)
        print(f"  -> Inserted {len(request_records)} blood requests.")

        # 6. Generate Cross Matches
        print("\n[6/10] Generating 300 cross-matches...")
        cross_records = []
        sampled_units = random.sample(unit_ids, 300)
        for i in range(300):
            rid = random.choice(request_ids)
            uid = sampled_units[i]
            res = random.choices(['Compatible', 'Incompatible', 'Pending'], weights=[0.88, 0.08, 0.04])[0]
            tester = random.choice([1, 2, 3])
            t_time = datetime.now() - timedelta(days=random.randint(0, 20), hours=random.randint(1, 12))
            cross_records.append((rid, uid, res, tester, t_time))

        cursor.executemany("""
            INSERT INTO cross_matches (request_id, unit_id, result, tested_by, tested_at)
            VALUES (%s, %s, %s, %s, %s)
        """, cross_records)
        print(f"  -> Inserted {len(cross_records)} cross-match records.")

        # 7. Generate Reservations
        print("\n[7/10] Generating 160 unit reservations...")
        # Pick units marked RESERVED or past ones
        reserved_units = [u[0] for u in blood_unit_records if u[6] == 'RESERVED']
        other_units = [u[0] for u in blood_unit_records if u[6] == 'AVAILABLE']
        
        reservation_records = []
        count = 0
        # Active holds for currently RESERVED units
        for uid in reserved_units[:100]:
            rid = random.choice(request_ids)
            res_at = datetime.now() - timedelta(hours=random.randint(1, 20))
            exp_at = res_at + timedelta(hours=24)
            reservation_records.append((rid, uid, res_at, exp_at, 'Active'))
            count += 1
        
        # Historical holds (Fulfilled / Expired / Cancelled)
        for uid in other_units[:60]:
            rid = random.choice(request_ids)
            res_at = datetime.now() - timedelta(days=random.randint(2, 25))
            exp_at = res_at + timedelta(hours=24)
            st = random.choice(['Fulfilled', 'Expired', 'Cancelled'])
            reservation_records.append((rid, uid, res_at, exp_at, st))
            count += 1

        cursor.executemany("""
            INSERT INTO reservations (request_id, unit_id, reserved_at, expires_at, status)
            VALUES (%s, %s, %s, %s, %s)
        """, reservation_records)
        print(f"  -> Inserted {len(reservation_records)} reservations.")

        # 8. Generate Issuances
        print("\n[8/10] Generating 220 clinical unit issuances...")
        issued_units = [u[0] for u in blood_unit_records if u[6] == 'ISSUED']
        issuance_records = []
        for uid in issued_units[:220]:
            rid = random.choice(request_ids)
            issuer = random.choice([1, 2, 3])
            iss_time = datetime.now() - timedelta(days=random.randint(0, 25), hours=random.randint(1, 10))
            reason = random.choice(REASON_CODES)
            issuance_records.append((rid, uid, issuer, iss_time, reason))

        # If not enough issued units, sample some available
        if len(issuance_records) < 200:
            extra = [u[0] for u in blood_unit_records if u[6] == 'AVAILABLE'][:(200 - len(issuance_records))]
            for uid in extra:
                rid = random.choice(request_ids)
                issuer = random.choice([1, 2, 3])
                iss_time = datetime.now() - timedelta(days=random.randint(1, 20))
                reason = random.choice(REASON_CODES)
                issuance_records.append((rid, uid, issuer, iss_time, reason))

        cursor.executemany("""
            INSERT INTO issuances (request_id, unit_id, issued_by, issued_at, reason_code)
            VALUES (%s, %s, %s, %s, %s)
        """, issuance_records)
        print(f"  -> Inserted {len(issuance_records)} issuances.")

        # 9. Generate Alerts & Audit Logs
        print("\n[9/10] Generating 75 alerts and 850 audit logs...")
        alert_records = []
        # Low stock alerts
        for bg in ['AB-', 'O-', 'B-', 'A-']:
            alert_records.append((
                'LOW_STOCK', 'Critical' if '-' in bg else 'Warning', None, bg,
                f"Reserve buffer critical: {bg} inventory below emergency threshold (<5 units).",
                'Active', datetime.now() - timedelta(hours=random.randint(1, 48)), None
            ))

        # Expiring soon alerts
        for i in range(25):
            u = random.choice(blood_unit_records)
            alert_records.append((
                'EXPIRING_SOON', 'Warning', u[0], u[2],
                f"Unit {u[0]} ({u[2]} {u[3]}) reaches shelf-life expiration on {u[5]}. FEFO priority issuance recommended.",
                'Active', datetime.now() - timedelta(hours=random.randint(2, 36)), None
            ))

        # Resolved alerts
        for i in range(45):
            bg = random.choice(BLOOD_GROUPS)
            created = datetime.now() - timedelta(days=random.randint(2, 20))
            resolved = created + timedelta(hours=random.randint(3, 18))
            alert_records.append((
                random.choice(['LOW_STOCK', 'EXPIRING_SOON', 'SYSTEM_ERROR', 'UNFULFILLED_REQUEST']),
                random.choice(['Info', 'Warning', 'Critical']),
                None, bg,
                f"Standard inventory surveillance notification for {bg} blood supply.",
                'Resolved', created, resolved
            ))

        cursor.executemany("""
            INSERT INTO alerts (type, severity, unit_id, blood_group, message, status, created_at, resolved_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, alert_records)
        print(f"  -> Inserted {len(alert_records)} alerts.")

        # Audit Logs
        audit_records = []
        actions = [
            ('UNIT_ACCESSIONED', 'blood_units', 'Physical blood unit accessioned into storage fridge'),
            ('UNIT_RESERVED', 'reservations', 'Pre-operative crossmatch hold reserved for clinical patient'),
            ('UNIT_ISSUED', 'issuances', 'Clinical verification passed and blood unit released for transfusion'),
            ('CROSSMATCH_TESTED', 'cross_matches', 'Major tube crossmatch serology validated'),
            ('REQUEST_CREATED', 'blood_requests', 'Emergency physician requisition received and queued'),
            ('UNIT_QUARANTINED', 'blood_units', 'Placed in quarantine pending serological confirmation'),
            ('ALERT_RESOLVED', 'alerts', 'Automated supervisor acknowledged alert condition'),
            ('USER_LOGIN', 'users', 'Secure cryptographic token issued to clinical operator')
        ]

        for i in range(850):
            act, ent_type, reason_tpl = random.choice(actions)
            user_id = random.choice([1, 2, 3, 4])
            ent_id = f"REF-{random.randint(1000, 9999)}"
            before = {"status": "PENDING_VERIFICATION", "code": 100} if random.random() > 0.4 else None
            after = {"status": "AUTHORIZED", "audit_seq": i, "verified": True}
            t = datetime.now() - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23), minutes=random.randint(0, 59))
            
            audit_records.append((
                user_id, act, ent_type, ent_id,
                json.dumps(before) if before else None,
                json.dumps(after),
                reason_tpl, t
            ))

        cursor.executemany("""
            INSERT INTO audit_logs (user_id, action, entity_type, entity_id, before_state, after_state, reason, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, audit_records)
        print(f"  -> Inserted {len(audit_records)} audit logs.")

        # 10. Generate Decision Traces & AI Insights
        print("\n[10/10] Generating Decision Traces and AI Agent Insights...")
        trace_records = []
        for i in range(160):
            rid = random.choice(request_ids)
            uid = random.choice(unit_ids)
            rule = random.choice([
                'ABO_RhD_Compatibility_Rule',
                'FEFO_Earliest_Expiry_Rule',
                'Paper_10_ML_Predicted_Return_Override',
                'Crossmatch_Serology_Compatibility_Rule',
                'Storage_Temperature_Compliance_Rule'
            ])
            res = True if random.random() > 0.08 else False
            val = 'PASS' if res else 'FAIL_INCOMPATIBLE'
            exp = f"Automated rule evaluation for request {rid} and unit {uid}: evaluated valid under AABB guidelines."
            t = datetime.now() - timedelta(days=random.randint(0, 25))
            trace_records.append((rid, uid, rule, res, val, exp, t))

        cursor.executemany("""
            INSERT INTO decision_traces (request_id, unit_id, rule_name, rule_result, rule_value, explanation, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, trace_records)
        print(f"  -> Inserted {len(trace_records)} decision traces.")

        # AI Insights
        ai_records = [
            (
                'Inventory Intelligence Agent',
                'STOCK_OPTIMIZATION',
                'Warning',
                'O-Negative RBC inventory is approaching critical buffer safety levels (<4 units on hand).',
                json.dumps({"blood_group": "O-", "component": "Red Blood Cells", "available": 3, "critical_threshold": 5}),
                'Initiate targeted voluntary donor SMS campaign to O- eligible donor cohort.',
                datetime.now() - timedelta(hours=2)
            ),
            (
                'Waste Reduction Agent',
                'EXPIRY_RISK_PREDICTION',
                'Warning',
                '5 Platelet units will reach maximum 5-day shelf-life within 48 hours.',
                json.dumps({"at_risk_units": 5, "component": "Platelets", "shelf_life_hours_left": 42}),
                'Recommend prioritized issuance for upcoming scheduled orthopedic procedures or transfer to high-turnover trauma center.',
                datetime.now() - timedelta(hours=6)
            ),
            (
                'ML-Guided Issuance Agent (Paper 10)',
                'POLICY_OVERRIDE_RECOMMENDATION',
                'Info',
                'High return probability (78%) detected for General Ward order REQ-2026-0042. Recommending fresher unit over FEFO.',
                json.dumps({"request_id": "REQ-2026-0042", "predicted_return_prob": 0.78, "algorithm": "arXiv:2411.14939"}),
                'Override strict FEFO: Issue unit with >14 days shelf life to avoid expiry upon anticipated return to stock.',
                datetime.now() - timedelta(hours=14)
            ),
            (
                'Transfusion Safety Sentinel',
                'COMPATIBILITY_AUDIT',
                'Info',
                '100% of the last 200 issuances strictly satisfied ABO/RhD and major crossmatch compatibility protocols.',
                json.dumps({"compliance_rate": "100%", "verified_units": 200}),
                'Zero ABO discrepancies detected. Continuous protocol adherence validated.',
                datetime.now() - timedelta(days=1)
            ),
            (
                'Supply Chain Forecasting Agent',
                'WEEKEND_DEMAND_SURGE',
                'Warning',
                'Predicted 35% surge in emergency trauma blood requisitions over the upcoming weekend.',
                json.dumps({"expected_emergency_demand": 28, "historical_weekend_avg": 20.5}),
                'Pre-screen available O-positive and O-negative reserves; ensure fridge 1 and 2 storage buffers are maxed.',
                datetime.now() - timedelta(days=2)
            )
        ]

        cursor.executemany("""
            INSERT INTO ai_insights (agent_name, insight_type, severity, summary, evidence, recommendation, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, ai_records)
        print(f"  -> Inserted {len(ai_records)} AI insights.")

        conn.commit()
        print("\n" + "=" * 60)
        print(" SUCCESS! ALL 1,000+ RECORDS SUCCESSFULLY COMMITTED TO MYSQL!")
        print("=" * 60)

        # Print final counts
        cursor.execute("SHOW TABLES")
        tables = [r[0] for r in cursor.fetchall()]
        print("\nFinal Database Table Counts:")
        for t in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {t}")
            cnt = cursor.fetchone()[0]
            print(f"  • {t.ljust(22)} : {cnt} rows")

    except Exception as e:
        conn.rollback()
        print(f"\n[ERROR] Transaction rolled back due to error: {e}")
        raise e
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    main()
