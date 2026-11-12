import pool from '../config/db';
import argon2 from 'argon2';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function seedDemoData() {
  console.log('[Seed] Initializing idempotent demo data in bloodsync database...');

  // 1. Hash passwords using real Argon2id
  const patientPassword = process.env.DEMO_PATIENT_PASSWORD || 'password123';
  const techPassword = process.env.DEMO_TECH_PASSWORD || 'password123';

  const patientHash = await argon2.hash(patientPassword, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4
  });

  const techHash = await argon2.hash(techPassword, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4
  });

  // 2. Provision Lab Technician user: tech.demo@bloodsync.test
  const [existingTech] = await pool.query<RowDataPacket[]>(
    'SELECT user_id FROM users WHERE email = ?',
    ['tech.demo@bloodsync.test']
  );

  let techUserId: number;
  if (existingTech.length === 0) {
    const [res] = await pool.query<ResultSetHeader>(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES (?, ?, ?, 'Technician', 'Active')`,
      ['Demo Lab Technician', 'tech.demo@bloodsync.test', techHash]
    );
    techUserId = res.insertId;
    console.log(`[Seed] Created Technician user (ID: ${techUserId})`);
  } else {
    techUserId = existingTech[0].user_id;
    await pool.query(
      `UPDATE users SET name = ?, password_hash = ?, role = 'Technician', status = 'Active' WHERE user_id = ?`,
      ['Demo Lab Technician', techHash, techUserId]
    );
    console.log(`[Seed] Updated Technician user credentials (ID: ${techUserId})`);
  }

  // 3. Provision Patient user: patient.demo@bloodsync.test
  const [existingPatientUser] = await pool.query<RowDataPacket[]>(
    'SELECT user_id FROM users WHERE email = ?',
    ['patient.demo@bloodsync.test']
  );

  let patientUserId: number;
  if (existingPatientUser.length === 0) {
    const [res] = await pool.query<ResultSetHeader>(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES (?, ?, ?, 'Patient', 'Active')`,
      ['Aarav Kumar', 'patient.demo@bloodsync.test', patientHash]
    );
    patientUserId = res.insertId;
    console.log(`[Seed] Created Patient user (ID: ${patientUserId})`);
  } else {
    patientUserId = existingPatientUser[0].user_id;
    await pool.query(
      `UPDATE users SET name = ?, password_hash = ?, role = 'Patient', status = 'Active' WHERE user_id = ?`,
      ['Aarav Kumar', patientHash, patientUserId]
    );
    console.log(`[Seed] Updated Patient user credentials (ID: ${patientUserId})`);
  }

  // 4. Provision and link Patient record: Aarav Kumar (O+, Verified)
  const [existingPatient] = await pool.query<RowDataPacket[]>(
    'SELECT patient_id FROM patients WHERE user_id = ?',
    [patientUserId]
  );

  let canonicalPatientId: number;
  if (existingPatient.length === 0) {
    const [res] = await pool.query<ResultSetHeader>(
      `INSERT INTO patients (name, blood_group, hospital, user_id, is_verified, verified_by, verified_at)
       VALUES (?, 'O+', ?, ?, 1, ?, NOW())`,
      ['Aarav Kumar', 'BloodSync Demo Hospital', patientUserId, techUserId]
    );
    canonicalPatientId = res.insertId;
    console.log(`[Seed] Created Patient dossier for Aarav Kumar (ID: ${canonicalPatientId})`);
  } else {
    canonicalPatientId = existingPatient[0].patient_id;
    await pool.query(
      `UPDATE patients 
       SET name = 'Aarav Kumar', blood_group = 'O+', hospital = 'BloodSync Demo Hospital', 
           is_verified = 1, verified_by = ?, verified_at = IFNULL(verified_at, NOW())
       WHERE patient_id = ?`,
      [techUserId, canonicalPatientId]
    );
    console.log(`[Seed] Verified Patient dossier for Aarav Kumar (ID: ${canonicalPatientId})`);
  }

  // 5. Ensure synthetic donor exists
  const [existingDonor] = await pool.query<RowDataPacket[]>(
    'SELECT donor_id FROM donors WHERE name = ?',
    ['Demo Voluntary Donor']
  );

  let demoDonorId: number;
  if (existingDonor.length === 0) {
    const [res] = await pool.query<ResultSetHeader>(
      `INSERT INTO donors (name, blood_group, phone, status, last_donation_date)
       VALUES ('Demo Voluntary Donor', 'O+', '+1-555-DEMO-01', 'Eligible', CURDATE())`
    );
    demoDonorId = res.insertId;
    console.log(`[Seed] Created Demo Donor (ID: ${demoDonorId})`);
  } else {
    demoDonorId = existingDonor[0].donor_id;
  }

  // 6. Provision the 6 synthetic blood units
  // Dates calculated dynamically relative to CURDATE()
  const demoUnits = [
    {
      unit_id: 'DEMO-RBC-OP-01',
      donor_id: demoDonorId,
      blood_group: 'O+',
      component_type: 'Red Blood Cells',
      collection_days_ago: 5,
      expiry_days: 3,
      location: 'Fridge A, Shelf A2',
      status: 'AVAILABLE'
    },
    {
      unit_id: 'DEMO-RBC-OP-02',
      donor_id: demoDonorId,
      blood_group: 'O+',
      component_type: 'Red Blood Cells',
      collection_days_ago: 3,
      expiry_days: 10,
      location: 'Fridge A, Shelf A3',
      status: 'AVAILABLE'
    },
    {
      unit_id: 'DEMO-RBC-OP-03',
      donor_id: demoDonorId,
      blood_group: 'O+',
      component_type: 'Red Blood Cells',
      collection_days_ago: 1,
      expiry_days: 25,
      location: 'Fridge B, Shelf B1',
      status: 'AVAILABLE'
    },
    {
      unit_id: 'DEMO-RBC-ON-01',
      donor_id: demoDonorId,
      blood_group: 'O-',
      component_type: 'Red Blood Cells',
      collection_days_ago: 2,
      expiry_days: 28,
      location: 'Fridge C, Shelf C1',
      status: 'AVAILABLE'
    },
    {
      unit_id: 'DEMO-RBC-OP-Q01',
      donor_id: demoDonorId,
      blood_group: 'O+',
      component_type: 'Red Blood Cells',
      collection_days_ago: 10,
      expiry_days: 14,
      location: 'Quarantine Vault, Shelf Q1',
      status: 'QUARANTINE'
    },
    {
      unit_id: 'DEMO-RBC-OP-EX01',
      donor_id: demoDonorId,
      blood_group: 'O+',
      component_type: 'Red Blood Cells',
      collection_days_ago: 45,
      expiry_days: -2,
      location: 'Disposal Area, Shelf EX1',
      status: 'EXPIRED'
    }
  ];

  for (const u of demoUnits) {
    await pool.query(
      `INSERT INTO blood_units (unit_id, donor_id, blood_group, component_type, collection_date, expiry_date, status, storage_location)
       VALUES (?, ?, ?, ?, DATE_SUB(CURDATE(), INTERVAL ? DAY), DATE_ADD(CURDATE(), INTERVAL ? DAY), ?, ?)
       ON DUPLICATE KEY UPDATE
         blood_group = VALUES(blood_group),
         component_type = VALUES(component_type),
         collection_date = VALUES(collection_date),
         expiry_date = VALUES(expiry_date),
         status = VALUES(status),
         storage_location = VALUES(storage_location)`,
      [
        u.unit_id,
        u.donor_id,
        u.blood_group,
        u.component_type,
        u.collection_days_ago,
        u.expiry_days,
        u.status,
        u.location
      ]
    );
    console.log(`[Seed] Unit ${u.unit_id} (${u.blood_group}, ${u.status}, Exp: ${u.expiry_days}d) synchronized.`);
  }

  console.log('[Seed] Demo data seeding completed successfully.');
  return {
    patientUserId,
    canonicalPatientId,
    techUserId
  };
}

if (require.main === module) {
  seedDemoData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Error]', err);
      process.exit(1);
    });
}
