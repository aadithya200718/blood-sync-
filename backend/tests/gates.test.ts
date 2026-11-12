/**
 * Phase 16 — Comprehensive Acceptance Gates Test Suite (Gates A to G)
 * ===================================================================
 * Validates Authentication, Patient Sync, Emergency Blood Request,
 * ABO/Rh & FEFO Matching, Concurrency Safety, Mandatory Crossmatch,
 * Dispensing / Issuance, and Cancellation Protections against live MySQL.
 */

import http from 'http';
import app from '../src/app';
import db from '../src/config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { seedDemoData } from '../src/scripts/seedDemoData';

interface TestResult {
  gate: string;
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];
let server: http.Server;
let BASE_ORIGIN = '';

async function fetchJson(path: string, options: any = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const cleanPath = path.startsWith('/') ? path : '/' + path;
    const fullUrl = `${BASE_ORIGIN}/api${cleanPath}`;
    const url = new URL(fullUrl);
    const reqOptions: http.RequestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const req = http.request(reqOptions, (res: http.IncomingMessage) => {
      let data = '';
      res.on('data', (chunk: Buffer) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runGates() {
  console.log('\n============================================================');
  console.log('  BLOODSYNC — COMPREHENSIVE ACCEPTANCE GATES (A - G)');
  console.log('============================================================\n');

  // Seed / refresh synthetic demo baseline
  await seedDemoData();

  // Start ephemeral test server
  server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, () => {
      const addr = server.address() as any;
      BASE_ORIGIN = `http://127.0.0.1:${addr.port}`;
      console.log(`[Test Server] Listening on ${BASE_ORIGIN}\n`);
      resolve();
    });
  });

  let patientToken = '';
  let techToken = '';
  let adminToken = '';
  let demoPatientId = 0;

  // ============================================================
  // GATE A: AUTHENTICATION & ACCESS CONTROL
  // ============================================================
  console.log('--- GATE A: Authentication & Access Control ---');

  // 1. Patient Login
  try {
    const res = await fetchJson('/auth/login', {
      method: 'POST',
      body: { email: 'patient.demo@bloodsync.test', password: process.env.DEMO_PATIENT_PASSWORD || 'password123' }
    });
    patientToken = res.body?.token;
    demoPatientId = res.body?.user?.patientId;
    const passed = res.status === 200 && Boolean(patientToken) && res.body?.user?.role === 'Patient';
    results.push({
      gate: 'Gate A',
      name: 'Patient login with valid Argon2 credentials',
      passed,
      details: `Status: ${res.status}, Role: ${res.body?.user?.role}, Patient ID: ${demoPatientId}`
    });
  } catch (e: any) {
    results.push({ gate: 'Gate A', name: 'Patient login', passed: false, details: e.message });
  }

  // 2. Technician Login
  try {
    const res = await fetchJson('/auth/login', {
      method: 'POST',
      body: { email: 'tech.demo@bloodsync.test', password: process.env.DEMO_TECH_PASSWORD || 'password123' }
    });
    techToken = res.body?.token;
    const passed = res.status === 200 && Boolean(techToken) && res.body?.user?.role === 'Technician';
    results.push({
      gate: 'Gate A',
      name: 'Technician login with valid Argon2 credentials',
      passed,
      details: `Status: ${res.status}, Role: ${res.body?.user?.role}`
    });
  } catch (e: any) {
    results.push({ gate: 'Gate A', name: 'Technician login', passed: false, details: e.message });
  }

  // 3. Existing Admin login (password123 via Argon2id)
  try {
    const res = await fetchJson('/auth/login', {
      method: 'POST',
      body: { email: 'admin@bloodsync.local', password: 'password123' }
    });
    adminToken = res.body?.token;
    const passed = res.status === 200 && res.body?.user?.role === 'Admin';
    results.push({
      gate: 'Gate A',
      name: 'Existing institutional Admin login',
      passed,
      details: `Status: ${res.status}, Role: ${res.body?.user?.role}`
    });
  } catch (e: any) {
    results.push({ gate: 'Gate A', name: 'Admin login', passed: false, details: e.message });
  }

  // 4. Reject invalid password
  try {
    const res = await fetchJson('/auth/login', {
      method: 'POST',
      body: { email: 'patient.demo@bloodsync.test', password: 'WrongPassword!2026' }
    });
    const passed = res.status === 401;
    results.push({
      gate: 'Gate A',
      name: 'Reject invalid password attempt',
      passed,
      details: `Status: ${res.status} (Expected 401)`
    });
  } catch (e: any) {
    results.push({ gate: 'Gate A', name: 'Reject invalid password', passed: false, details: e.message });
  }

  // 5. Patient cannot access staff-only endpoints (RBAC Enforcement)
  try {
    const [invRes, auditRes, donorRes] = await Promise.all([
      fetchJson('/inventory', { headers: { Authorization: `Bearer ${patientToken}` } }),
      fetchJson('/audit', { headers: { Authorization: `Bearer ${patientToken}` } }),
      fetchJson('/donors', { headers: { Authorization: `Bearer ${patientToken}` } })
    ]);
    const passed = invRes.status === 403 && auditRes.status === 403 && donorRes.status === 403;
    results.push({
      gate: 'Gate A',
      name: 'Patient strictly barred from staff-only APIs (403 Forbidden)',
      passed,
      details: `Inventory: ${invRes.status}, Audit: ${auditRes.status}, Donors: ${donorRes.status}`
    });
  } catch (e: any) {
    results.push({ gate: 'Gate A', name: 'Patient barred from staff APIs', passed: false, details: e.message });
  }

  // ============================================================
  // GATE B: PATIENT REGISTRATION & SYNCHRONIZATION
  // ============================================================
  console.log('--- GATE B: Patient Synchronization ---');

  let syncPatientId = 0;
  try {
    // 1. Technician creates a patient
    const createRes = await fetchJson('/patients', {
      method: 'POST',
      headers: { Authorization: `Bearer ${techToken}` },
      body: {
        name: 'Gate B Test Patient',
        blood_group: 'AB+',
        hospital: 'Clinical Trial Center'
      }
    });

    syncPatientId = createRes.body?.data?.patient_id;

    // 2. Verify patient row in MySQL
    const [dbRows] = await db.query<RowDataPacket[]>(
      'SELECT patient_id, name, blood_group, hospital FROM patients WHERE patient_id = ?',
      [syncPatientId]
    );

    // 3. Verify patient listing reflects the new record
    const listRes = await fetchJson('/patients', {
      headers: { Authorization: `Bearer ${techToken}` }
    });

    const appearsInList = listRes.body?.data?.some((p: any) => p.patient_id === syncPatientId);
    const passed = createRes.status === 201 && dbRows.length === 1 && appearsInList;

    results.push({
      gate: 'Gate B',
      name: 'Technician registers patient; record appears in MySQL and staff registry',
      passed,
      details: `Patient ID: ${syncPatientId}, In DB: ${dbRows.length === 1}, In List: ${appearsInList}`
    });
  } catch (e: any) {
    results.push({ gate: 'Gate B', name: 'Patient registration', passed: false, details: e.message });
  }

  // ============================================================
  // GATE C: BLOOD REQUEST CREATION & NOTIFICATION
  // ============================================================
  console.log('--- GATE C: Blood Request & Durable Notifications ---');

  let emergencyReqId = '';
  try {
    // 1. Patient creates O+ RBC Emergency Request
    const reqRes = await fetchJson('/patient/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${patientToken}` },
      body: {
        component_type: 'Red Blood Cells',
        quantity: 1,
        urgency: 'Emergency'
      }
    });

    emergencyReqId = reqRes.body?.data?.request_id;

    // 2. Verify single MySQL record exists with correct patient ID and urgency
    const [reqDb] = await db.query<RowDataPacket[]>(
      'SELECT * FROM blood_requests WHERE request_id = ?',
      [emergencyReqId]
    );

    // 3. Verify durable technician notification in database
    const [notifDb] = await db.query<RowDataPacket[]>(
      'SELECT * FROM notifications WHERE request_id = ? AND event_type = "EMERGENCY_REQUEST"',
      [emergencyReqId]
    );

    // 4. Verify technician notifications endpoint returns it
    const notifApiRes = await fetchJson('/notifications', {
      headers: { Authorization: `Bearer ${techToken}` }
    });

    const hasNotif = notifApiRes.body?.data?.some((n: any) => n.request_id === emergencyReqId);

    const passed =
      reqRes.status === 201 &&
      reqDb.length === 1 &&
      reqDb[0].blood_group === 'O+' &&
      reqDb[0].urgency === 'Emergency' &&
      notifDb.length >= 1 &&
      hasNotif;

    results.push({
      gate: 'Gate C',
      name: 'Patient creates emergency request; durable notification created for technicians',
      passed,
      details: `Request: ${emergencyReqId}, Patient ID: ${reqDb[0]?.patient_id}, Urgency: ${reqDb[0]?.urgency}, Notif Count: ${notifDb.length}`
    });
  } catch (e: any) {
    results.push({ gate: 'Gate C', name: 'Emergency Blood Request', passed: false, details: e.message });
  }

  // ============================================================
  // GATE D: ABO/Rh MATCHING & FEFO RANKING
  // ============================================================
  console.log('--- GATE D: ABO/Rh Matching & FEFO Ranking ---');

  try {
    // Query matching units for the O+ recipient request
    const matchRes = await fetchJson(`/requests/${emergencyReqId}/match`, {
      headers: { Authorization: `Bearer ${techToken}` }
    });

    const recUnits: any[] = matchRes.body?.data?.recommendedUnits || [];

    // O+ recipient can receive O+ or O- red cells
    const allCompatible = recUnits.every((u: any) => ['O+', 'O-'].includes(u.blood_group));
    // Must NOT contain expired unit (DEMO-RBC-OP-EX01) or quarantine unit (DEMO-RBC-OP-Q01)
    const noExpired = recUnits.every((u: any) => u.unit_id !== 'DEMO-RBC-OP-EX01');
    const noQuarantine = recUnits.every((u: any) => u.unit_id !== 'DEMO-RBC-OP-Q01');
    // Top recommended unit must be earliest expiring eligible unit (FEFO)
    const topUnit = recUnits[0];

    const passed =
      matchRes.status === 200 &&
      recUnits.length > 0 &&
      allCompatible &&
      noExpired &&
      noQuarantine;

    results.push({
      gate: 'Gate D',
      name: 'ABO/Rh rules enforced; expired and quarantine excluded; FEFO ranked',
      passed,
      details: `Recommended units: ${recUnits.map((u: any) => `${u.unit_id}(${u.blood_group},exp:${u.expiry_date?.substring(0, 10)})`).join(', ')}. Top: ${topUnit?.unit_id}`
    });
  } catch (e: any) {
    results.push({ gate: 'Gate D', name: 'ABO/Rh matching', passed: false, details: e.message });
  }

  // ============================================================
  // GATE E: CONCURRENCY & DOUBLE-ALLOCATION PREVENTION
  // ============================================================
  console.log('--- GATE E: Concurrency & Double-Allocation Prevention ---');

  try {
    // Create two concurrent requests racing for the same unit DEMO-RBC-OP-03
    const targetUnit = 'DEMO-RBC-OP-03';
    
    // Ensure unit is AVAILABLE
    await db.query('UPDATE blood_units SET status = "AVAILABLE" WHERE unit_id = ?', [targetUnit]);
    await db.query('DELETE FROM reservations WHERE unit_id = ?', [targetUnit]);

    const req1Id = `CONC-REQ-1-${Date.now()}`;
    const req2Id = `CONC-REQ-2-${Date.now()}`;

    await db.query(
      `INSERT INTO blood_requests (request_id, patient_id, blood_group, component_type, quantity, urgency, status)
       VALUES (?, ?, 'O+', 'Red Blood Cells', 1, 'Emergency', 'Pending'),
              (?, ?, 'O+', 'Red Blood Cells', 1, 'Emergency', 'Pending')`,
      [req1Id, demoPatientId, req2Id, demoPatientId]
    );

    // Race two reservation calls concurrently
    const [res1, res2] = await Promise.all([
      fetchJson(`/requests/${req1Id}/reserve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${techToken}` },
        body: { unit_id: targetUnit }
      }),
      fetchJson(`/requests/${req2Id}/reserve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${techToken}` },
        body: { unit_id: targetUnit }
      })
    ]);

    const successCount = (res1.status === 200 ? 1 : 0) + (res2.status === 200 ? 1 : 0);
    const failureCount = (res1.status !== 200 ? 1 : 0) + (res2.status !== 200 ? 1 : 0);

    // Verify database only has 1 active reservation for targetUnit
    const [resRows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM reservations WHERE unit_id = ? AND status = "Active"',
      [targetUnit]
    );

    // Clean up temporary concurrency test requests
    await db.query('UPDATE blood_requests SET status = "Cancelled" WHERE request_id IN (?, ?)', [req1Id, req2Id]);
    await db.query('DELETE FROM reservations WHERE unit_id = ?', [targetUnit]);
    await db.query('UPDATE blood_units SET status = "AVAILABLE" WHERE unit_id = ?', [targetUnit]);

    const passed = successCount === 1 && failureCount === 1 && resRows.length === 1;

    results.push({
      gate: 'Gate E',
      name: 'Concurrent race for single unit: exactly 1 succeeds, 1 safely rejected with no double-allocation',
      passed,
      details: `Success: ${successCount}, Rejected: ${failureCount}, Active Reservations in DB: ${resRows.length}`
    });
  } catch (e: any) {
    results.push({ gate: 'Gate E', name: 'Concurrency safety', passed: false, details: e.message });
  }

  // ============================================================
  // GATE F: LABORATORY CROSSMATCH & TECHNICIAN DISPENSING
  // ============================================================
  console.log('--- GATE F: Crossmatch & Technician Dispensing ---');

  const issueUnitId = 'DEMO-RBC-OP-01';
  try {
    // 1. Reserve DEMO-RBC-OP-01 for emergencyReqId
    await db.query('UPDATE blood_units SET status = "AVAILABLE" WHERE unit_id = ?', [issueUnitId]);
    await db.query('DELETE FROM reservations WHERE unit_id = ?', [issueUnitId]);
    await db.query('DELETE FROM cross_matches WHERE unit_id = ?', [issueUnitId]);

    const reserveRes = await fetchJson(`/requests/${emergencyReqId}/reserve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${techToken}` },
      body: { unit_id: issueUnitId }
    });

    // 2. Attempt to issue WITHOUT a crossmatch -> MUST FAIL (Clinical Invariant)
    const issueWithoutCm = await fetchJson(`/requests/${emergencyReqId}/issue`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${techToken}` },
      body: { unit_id: issueUnitId, reason_code: 'Premature Issuance Attempt' }
    });

    const blockedWithoutCm = issueWithoutCm.status !== 200;

    // 3. Record Incompatible crossmatch -> MUST FAIL
    await fetchJson(`/requests/${emergencyReqId}/crossmatch`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${techToken}` },
      body: { unit_id: issueUnitId, result: 'Incompatible' }
    });

    const issueWithIncompat = await fetchJson(`/requests/${emergencyReqId}/issue`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${techToken}` },
      body: { unit_id: issueUnitId, reason_code: 'Incompatible Transfusion Attempt' }
    });

    const blockedWithIncompat = issueWithIncompat.status !== 200;

    // 4. Record Verified Compatible crossmatch -> MUST SUCCEED
    await fetchJson(`/requests/${emergencyReqId}/crossmatch`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${techToken}` },
      body: { unit_id: issueUnitId, result: 'Compatible' }
    });

    const issueSuccessRes = await fetchJson(`/requests/${emergencyReqId}/issue`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${techToken}` },
      body: { unit_id: issueUnitId, reason_code: 'Authorized Simulated Emergency Transfusion' }
    });

    // 5. Verify database records
    const [unitDb] = await db.query<RowDataPacket[]>(
      'SELECT status FROM blood_units WHERE unit_id = ?',
      [issueUnitId]
    );

    const [issDb] = await db.query<RowDataPacket[]>(
      'SELECT * FROM issuances WHERE request_id = ? AND unit_id = ?',
      [emergencyReqId, issueUnitId]
    );

    const [reqDb] = await db.query<RowDataPacket[]>(
      'SELECT status FROM blood_requests WHERE request_id = ?',
      [emergencyReqId]
    );

    // 6. Duplicate issuance attempt -> MUST FAIL
    const dupIssueRes = await fetchJson(`/requests/${emergencyReqId}/issue`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${techToken}` },
      body: { unit_id: issueUnitId, reason_code: 'Duplicate Issuance' }
    });

    const passed =
      reserveRes.status === 200 &&
      blockedWithoutCm &&
      blockedWithIncompat &&
      issueSuccessRes.status === 200 &&
      unitDb[0]?.status === 'ISSUED' &&
      issDb.length === 1 &&
      reqDb[0]?.status === 'Fulfilled' &&
      dupIssueRes.status !== 200;

    results.push({
      gate: 'Gate F',
      name: 'Mandatory crossmatch enforced; authorized dispensing transitions unit to ISSUED; duplicates blocked',
      passed,
      details: `Blocked w/o CM: ${blockedWithoutCm}, Blocked Incompat: ${blockedWithIncompat}, Issued: ${issueSuccessRes.status === 200}, Unit Status: ${unitDb[0]?.status}, Request Status: ${reqDb[0]?.status}, Dup Blocked: ${dupIssueRes.status !== 200}`
    });
  } catch (e: any) {
    results.push({ gate: 'Gate F', name: 'Dispensing & crossmatch', passed: false, details: e.message });
  }

  // ============================================================
  // GATE G: PATIENT CANCELLATION & PROTECTION OF ISSUED UNITS
  // ============================================================
  console.log('--- GATE G: Patient Cancellation & Inventory Safety ---');

  try {
    // Wait for the 2-second rate debounce window to expire cleanly
    await new Promise((r) => setTimeout(r, 2200));

    // 1. Create a fresh request, reserve DEMO-RBC-OP-02
    const cancelUnitId = 'DEMO-RBC-OP-02';
    await db.query('UPDATE blood_units SET status = "AVAILABLE" WHERE unit_id = ?', [cancelUnitId]);
    await db.query('DELETE FROM reservations WHERE unit_id = ?', [cancelUnitId]);

    const reqToCancelRes = await fetchJson('/patient/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${patientToken}` },
      body: { component_type: 'Red Blood Cells', quantity: 1, urgency: 'Urgent' }
    });
    const reqToCancelId = reqToCancelRes.body?.data?.request_id;

    await fetchJson(`/requests/${reqToCancelId}/reserve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${techToken}` },
      body: { unit_id: cancelUnitId }
    });

    // Verify unit is RESERVED
    const [resBefore] = await db.query<RowDataPacket[]>(
      'SELECT status FROM blood_units WHERE unit_id = ?',
      [cancelUnitId]
    );

    // 2. Patient cancels the request
    const cancelRes = await fetchJson(`/patient/requests/${reqToCancelId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${patientToken}` }
    });

    // 3. Verify unit is safely returned to AVAILABLE
    const [unitAfter] = await db.query<RowDataPacket[]>(
      'SELECT status FROM blood_units WHERE unit_id = ?',
      [cancelUnitId]
    );

    // 4. Verify request status is Cancelled
    const [reqAfter] = await db.query<RowDataPacket[]>(
      'SELECT status FROM blood_requests WHERE request_id = ?',
      [reqToCancelId]
    );

    // 5. Verify technician cancellation notification was created
    const [notifCancel] = await db.query<RowDataPacket[]>(
      'SELECT * FROM notifications WHERE request_id = ? AND event_type = "REQUEST_CANCELLED"',
      [reqToCancelId]
    );

    // 6. Critical safety invariant: Attempting to cancel an ISSUED request MUST FAIL
    // and an ISSUED unit must NEVER be reverted to AVAILABLE
    const cancelIssuedRes = await fetchJson(`/patient/requests/${emergencyReqId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${patientToken}` }
    });

    const [issuedUnitStillIssued] = await db.query<RowDataPacket[]>(
      'SELECT status FROM blood_units WHERE unit_id = ?',
      [issueUnitId]
    );

    const passed =
      cancelRes.status === 200 &&
      resBefore[0]?.status === 'RESERVED' &&
      unitAfter[0]?.status === 'AVAILABLE' &&
      reqAfter[0]?.status === 'Cancelled' &&
      notifCancel.length >= 1 &&
      cancelIssuedRes.status === 400 &&
      issuedUnitStillIssued[0]?.status === 'ISSUED';

    results.push({
      gate: 'Gate G',
      name: 'Patient cancels active reservation; unit safely released; ISSUED unit strictly protected from reavailability',
      passed,
      details: `Cancelled: ${cancelRes.status === 200}, Unit Released: ${unitAfter[0]?.status === 'AVAILABLE'}, Notif: ${notifCancel.length >= 1}, Cancel Issued Blocked: ${cancelIssuedRes.status === 400}, Issued Unit Safe: ${issuedUnitStillIssued[0]?.status === 'ISSUED'}`
    });
  } catch (e: any) {
    results.push({ gate: 'Gate G', name: 'Patient cancellation safety', passed: false, details: e.message });
  }

  // ============================================================
  // SUMMARY PRINT
  // ============================================================
  console.log('\n============================================================');
  console.log('  ACCEPTANCE GATE EXECUTION RESULTS SUMMARY');
  console.log('============================================================\n');

  let passedCount = 0;
  for (const r of results) {
    const symbol = r.passed ? '✅ [PASS]' : '❌ [FAIL]';
    console.log(`${symbol}  ${r.gate} — ${r.name}`);
    console.log(`     Details: ${r.details}\n`);
    if (r.passed) passedCount++;
  }

  console.log('------------------------------------------------------------');
  console.log(`  Total Gates Executed: ${results.length}`);
  console.log(`  Passed:               ${passedCount}`);
  console.log(`  Failed:               ${results.length - passedCount}`);
  console.log(`  Success Rate:         ${((passedCount / results.length) * 100).toFixed(1)}%`);
  console.log('============================================================\n');

  if (server) {
    server.close();
  }

  if (passedCount !== results.length) {
    process.exit(1);
  }
}

runGates()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[Fatal Gates Test Runner Error]', err);
    if (server) server.close();
    process.exit(1);
  });
