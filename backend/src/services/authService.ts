import { getUserByEmail, getPatientByUserId } from '../repositories/userRepo';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import db from '../config/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { createAuditEntry } from '../repositories/auditRepo';

export const login = async (email: string, password: string) => {
  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password.');
  }

  // Strictly verify password using Argon2id without any hardcoded bypass
  let isValid = false;
  try {
    isValid = await argon2.verify(user.password_hash, password);
  } catch (err: any) {
    console.error('[Auth Error] Argon2 verification failed:', err.message);
    throw new Error('Invalid email or password.');
  }

  if (!isValid) {
    throw new Error('Invalid email or password.');
  }

  if (user.status !== 'Active') {
    throw new Error('User account is not active.');
  }

  // Resolve linked patient record if user is a Patient
  let linkedPatient: any = null;
  if (user.role === 'Patient') {
    linkedPatient = await getPatientByUserId(user.user_id);
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be configured in production environment');
  }
  const secretKey = jwtSecret || 'secret123';

  const payload: any = {
    userId: user.user_id,
    role: user.role,
    name: user.name,
    email: user.email
  };

  if (linkedPatient) {
    payload.patientId = linkedPatient.patient_id;
  }

  const token = jwt.sign(payload, secretKey, { expiresIn: '24h' });

  return {
    token,
    user: {
      id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
      patientId: linkedPatient?.patient_id || null,
      bloodGroup: linkedPatient?.blood_group || null,
      isVerified: linkedPatient ? Boolean(linkedPatient.is_verified) : null,
      hospital: linkedPatient?.hospital || null
    }
  };
};

export const registerPatientAccount = async (data: {
  name: string;
  email: string;
  password: string;
  blood_group: string;
  hospital?: string;
}) => {
  const existingUser = await getUserByEmail(data.email);
  if (existingUser) {
    throw new Error('An account with this email already exists.');
  }

  const passwordHash = await argon2.hash(data.password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4
  });

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Insert into users table
    const [userResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES (?, ?, ?, 'Patient', 'Active')`,
      [data.name, data.email, passwordHash]
    );
    const newUserId = userResult.insertId;

    // 2. Insert into patients table (Self-reported blood group: is_verified = FALSE)
    const [patientResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO patients (name, blood_group, hospital, user_id, is_verified)
       VALUES (?, ?, ?, ?, 0)`,
      [data.name, data.blood_group, data.hospital || 'Self-Registered', newUserId]
    );
    const newPatientId = patientResult.insertId;

    // 3. Create persistent notification for Technician staff
    await connection.query(
      `INSERT INTO notifications (recipient_role, event_type, severity, title, message)
       VALUES ('Technician', 'PATIENT_REGISTERED', 'Info', 'NEW PATIENT REGISTRATION', ?)`,
      [`Patient ${data.name} (ID: ${newPatientId}) registered. Self-reported blood group: ${data.blood_group} (Clinical verification required).`]
    );

    await connection.commit();

    await createAuditEntry({
      user_id: newUserId,
      action: 'PATIENT_SELF_REGISTERED',
      entity_type: 'patients',
      entity_id: String(newPatientId),
      reason: 'Patient self-registration through patient portal'
    });

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret && process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be configured in production environment');
    }
    const secretKey = jwtSecret || 'secret123';

    const token = jwt.sign(
      {
        userId: newUserId,
        role: 'Patient',
        name: data.name,
        email: data.email,
        patientId: newPatientId
      },
      secretKey,
      { expiresIn: '24h' }
    );

    return {
      token,
      user: {
        id: newUserId,
        name: data.name,
        email: data.email,
        role: 'Patient',
        patientId: newPatientId,
        bloodGroup: data.blood_group,
        isVerified: false,
        hospital: data.hospital || 'Self-Registered'
      }
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};
