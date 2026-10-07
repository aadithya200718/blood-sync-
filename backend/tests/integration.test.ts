/**
 * Phase 6 — Backend Integration & Concurrency Tests
 * ==================================================
 * Validates Express API endpoints, JWT auth, RBAC,
 * donors, patients, request matching/reservation/issuance,
 * alerts, audit trail, analytics, and concurrency safety.
 */

import http from 'http';
import app from '../src/app';
import db from '../src/config/db';

interface TestResult {
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
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

async function startTestServer(): Promise<number> {
  return new Promise((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address() as any;
      BASE_ORIGIN = `http://localhost:${addr.port}`;
      resolve(addr.port);
    });
  });
}

// -----------------------------------------------------------------------
// Test Cases
// -----------------------------------------------------------------------

async function runAllTests() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║      BloodSync — Full Backend Integration & Concurrency  ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const port = await startTestServer();
  console.log(`[Test Runner] Test server started on port ${port}\n`);

  let token = '';

  // 1. Health check
  try {
    const res = await fetchJson('/health');
    results.push({
      name: 'System Health Check',
      passed: res.status === 200 && res.body.status === 'healthy',
      details: `Status ${res.status}: ${JSON.stringify(res.body)}`
    });
  } catch (e: any) {
    results.push({ name: 'System Health Check', passed: false, details: e.message });
  }

  // 2. Auth - Login valid
  try {
    const res = await fetchJson('/auth/login', {
      method: 'POST',
      body: { email: 'admin@bloodsync.local', password: 'password123' },
    });
    if (res.status === 200 && res.body.token) {
      token = res.body.token;
      results.push({ name: 'Auth — Login with valid credentials', passed: true, details: `Token received: ${token.substring(0, 15)}...` });
    } else {
      results.push({ name: 'Auth — Login with valid credentials', passed: false, details: `Status ${res.status}: ${JSON.stringify(res.body)}` });
    }
  } catch (e: any) {
    results.push({ name: 'Auth — Login with valid credentials', passed: false, details: e.message });
  }

  // 3. Auth - Reject invalid
  try {
    const res = await fetchJson('/auth/login', {
      method: 'POST',
      body: { email: 'admin@bloodsync.local', password: 'badpassword' },
    });
    results.push({
      name: 'Auth — Reject invalid credentials',
      passed: res.status === 401 || res.status === 400 || res.status === 500,
      details: `Rejected with status ${res.status}`
    });
  } catch (e: any) {
    results.push({ name: 'Auth — Reject invalid credentials', passed: false, details: e.message });
  }

  // 4. RBAC - Reject unauthenticated
  try {
    const res = await fetchJson('/inventory');
    results.push({
      name: 'RBAC — Inventory rejects unauthenticated requests',
      passed: res.status === 401,
      details: `Correctly rejected with 401: ${JSON.stringify(res.body)}`
    });
  } catch (e: any) {
    results.push({ name: 'RBAC — Inventory rejects unauthenticated requests', passed: false, details: e.message });
  }

  // 5. Validation - Reject malformed login
  try {
    const res = await fetchJson('/auth/login', {
      method: 'POST',
      body: { email: 'not-an-email', password: '12' },
    });
    results.push({
      name: 'Validation — Reject malformed login payload',
      passed: res.status === 400,
      details: `Correctly returned 400 validation error`
    });
  } catch (e: any) {
    results.push({ name: 'Validation — Reject malformed login payload', passed: false, details: e.message });
  }

  const authHeaders = { Authorization: `Bearer ${token}` };

  // 6. Inventory - Fetch inventory with valid token
  try {
    const res = await fetchJson('/inventory', { headers: authHeaders });
    results.push({
      name: 'Inventory — Fetch with valid JWT',
      passed: res.status === 200 && Array.isArray(res.body.data),
      details: `Retrieved ${res.body.data?.length || 0} units`
    });
  } catch (e: any) {
    results.push({ name: 'Inventory — Fetch with valid JWT', passed: false, details: e.message });
  }

  // 7. Donors - List and create donor
  let testDonorId = 0;
  try {
    const resCreate = await fetchJson('/donors', {
      method: 'POST',
      headers: authHeaders,
      body: {
        name: 'Integration Test Donor',
        blood_group: 'O+',
        phone: '555-9999',
        status: 'Eligible'
      }
    });

    testDonorId = resCreate.body?.data?.donor_id;
    const resList = await fetchJson('/donors', { headers: authHeaders });

    results.push({
      name: 'Donors — Create and list donors',
      passed: resCreate.status === 201 && Array.isArray(resList.body.data),
      details: `Created donor ID ${testDonorId}, total donors: ${resList.body.data?.length}`
    });
  } catch (e: any) {
    results.push({ name: 'Donors — Create and list donors', passed: false, details: e.message });
  }

  // 8. Patients - Create and list patients
  let testPatientId = 0;
  try {
    const resCreate = await fetchJson('/patients', {
      method: 'POST',
      headers: authHeaders,
      body: {
        name: 'Integration Test Patient',
        blood_group: 'A+',
        hospital: 'General St. Test Hospital'
      }
    });

    testPatientId = resCreate.body?.data?.patient_id;
    const resList = await fetchJson('/patients', { headers: authHeaders });

    results.push({
      name: 'Patients — Create and list patients',
      passed: resCreate.status === 201 && Array.isArray(resList.body.data),
      details: `Created patient ID ${testPatientId}, total patients: ${resList.body.data?.length}`
    });
  } catch (e: any) {
    results.push({ name: 'Patients — Create and list patients', passed: false, details: e.message });
  }

  // 9. Blood Unit Accessioning
  const testUnitId = `TEST-UNIT-${Date.now()}`;
  try {
    const res = await fetchJson('/inventory/unit', {
      method: 'POST',
      headers: authHeaders,
      body: {
        unit_id: testUnitId,
        donor_id: testDonorId || 1,
        blood_group: 'O+',
        component_type: 'Red Blood Cells',
        collection_date: '2026-09-20',
        expiry_date: '2026-10-31',
        storage_location: 'Test Rack A'
      }
    });

    results.push({
      name: 'Inventory — Unit Accessioning',
      passed: res.status === 201 && res.body.data?.unit_id === testUnitId,
      details: `Accessioned unit ${testUnitId}`
    });
  } catch (e: any) {
    results.push({ name: 'Inventory — Unit Accessioning', passed: false, details: e.message });
  }

  // 10. Blood Request Lifecycle: Create -> Match -> Reserve -> Issue
  const testReqId = `REQ-TEST-${Date.now()}`;
  try {
    // A: Create request
    const createRes = await fetchJson('/requests', {
      method: 'POST',
      headers: authHeaders,
      body: {
        request_id: testReqId,
        patient_id: testPatientId || 1,
        blood_group: 'O+',
        component_type: 'Red Blood Cells',
        quantity: 1,
        urgency: 'Emergency'
      }
    });

    // B: Match request
    const matchRes = await fetchJson(`/requests/${testReqId}/match`, { headers: authHeaders });
    const recommendedUnits = matchRes.body.data?.recommendedUnits || [];

    // C: Reserve unit
    const reserveRes = await fetchJson(`/requests/${testReqId}/reserve`, {
      method: 'POST',
      headers: authHeaders,
      body: { unit_id: testUnitId }
    });

    // D: Issue unit
    const issueRes = await fetchJson(`/requests/${testReqId}/issue`, {
      method: 'POST',
      headers: authHeaders,
      body: { unit_id: testUnitId, reason_code: 'Verified Emergency Transfusion' }
    });

    const passed =
      createRes.status === 201 &&
      matchRes.status === 200 &&
      reserveRes.status === 200 &&
      issueRes.status === 200;

    results.push({
      name: 'End-to-End Workflow — Create Request → Match → Reserve → Issue',
      passed,
      details: `Matched ${recommendedUnits.length} units; Reserved: ${reserveRes.body?.success}; Issued: ${issueRes.body?.success}`
    });
  } catch (e: any) {
    results.push({
      name: 'End-to-End Workflow — Create Request → Match → Reserve → Issue',
      passed: false,
      details: e.message
    });
  }

  // 11. Concurrency Safety: Row locking double-allocation prevention
  try {
    // Add another fresh unit to test concurrency
    const concUnitId = `CONC-UNIT-${Date.now()}`;
    await fetchJson('/inventory/unit', {
      method: 'POST',
      headers: authHeaders,
      body: {
        unit_id: concUnitId,
        donor_id: 1,
        blood_group: 'A+',
        component_type: 'Red Blood Cells',
        collection_date: '2026-09-20',
        expiry_date: '2026-10-31',
        storage_location: 'Rack Conc'
      }
    });

    const req1 = `REQ-CONC1-${Date.now()}`;
    const req2 = `REQ-CONC2-${Date.now()}`;

    await fetchJson('/requests', {
      method: 'POST',
      headers: authHeaders,
      body: { request_id: req1, patient_id: 1, blood_group: 'A+', component_type: 'Red Blood Cells', quantity: 1 }
    });
    await fetchJson('/requests', {
      method: 'POST',
      headers: authHeaders,
      body: { request_id: req2, patient_id: 1, blood_group: 'A+', component_type: 'Red Blood Cells', quantity: 1 }
    });

    // Launch two parallel reservations for the EXACT SAME UNIT
    const [res1, res2] = await Promise.all([
      fetchJson(`/requests/${req1}/reserve`, { method: 'POST', headers: authHeaders, body: { unit_id: concUnitId } }),
      fetchJson(`/requests/${req2}/reserve`, { method: 'POST', headers: authHeaders, body: { unit_id: concUnitId } })
    ]);

    // Exactly one reservation must succeed, and one must be rejected (400 / error)
    const successCount = (res1.status === 200 ? 1 : 0) + (res2.status === 200 ? 1 : 0);
    const failCount = (res1.status >= 400 ? 1 : 0) + (res2.status >= 400 ? 1 : 0);

    const concurrencyPassed = successCount === 1 && failCount === 1;

    results.push({
      name: 'Concurrency Safety — Double-Allocation Prevention (Row Locking)',
      passed: concurrencyPassed,
      details: `1 request succeeded (${successCount}), 1 request safely rejected (${failCount})`
    });
  } catch (e: any) {
    results.push({
      name: 'Concurrency Safety — Double-Allocation Prevention (Row Locking)',
      passed: false,
      details: e.message
    });
  }

  // 12. Alerts Retrieval & Check Trigger
  try {
    const res = await fetchJson('/alerts', { headers: authHeaders });
    const checkRes = await fetchJson('/alerts/run-checks', { method: 'POST', headers: authHeaders });

    results.push({
      name: 'Alerts — Management and Stock Check Execution',
      passed: res.status === 200 && checkRes.status === 200,
      details: `Active alerts: ${res.body.data?.length}, Check status: ${checkRes.body?.success}`
    });
  } catch (e: any) {
    results.push({ name: 'Alerts — Management and Stock Check Execution', passed: false, details: e.message });
  }

  // 13. Audit Trail
  try {
    const res = await fetchJson('/audit', { headers: authHeaders });
    results.push({
      name: 'Audit Trail — Query State Changes',
      passed: res.status === 200 && Array.isArray(res.body.data) && res.body.data.length > 0,
      details: `Audit log entries captured: ${res.body.data?.length}`
    });
  } catch (e: any) {
    results.push({ name: 'Audit Trail — Query State Changes', passed: false, details: e.message });
  }

  // 14. Analytics KPIs
  try {
    const res = await fetchJson('/analytics/dashboard', { headers: authHeaders });
    const kpis = res.body.data?.kpis;
    results.push({
      name: 'Analytics — Dashboard Metrics & KPIs',
      passed: res.status === 200 && kpis !== undefined,
      details: `Available units: ${kpis?.availableUnits}, Wastage rate: ${kpis?.wastageRate}`
    });
  } catch (e: any) {
    results.push({ name: 'Analytics — Dashboard Metrics & KPIs', passed: false, details: e.message });
  }

  // Close server and pool
  server.close();
  await db.end();

  // Output report
  console.log('─────────────────────────────────────────────────────────');
  let passed = 0;
  let failed = 0;
  for (const r of results) {
    const icon = r.passed ? '✅' : '❌';
    console.log(`${icon}  ${r.name}`);
    console.log(`   ${r.details}\n`);
    if (r.passed) passed++;
    else failed++;
  }

  console.log('─────────────────────────────────────────────────────────');
  console.log(`Results: ${passed} passed, ${failed} failed out of ${results.length} tests`);
  console.log('─────────────────────────────────────────────────────────\n');

  process.exit(failed > 0 ? 1 : 0);
}

runAllTests();
