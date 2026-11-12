# BloodSync End-to-End Live Demonstration Guide

This guide describes how to run and demonstrate the complete Patient-to-Technician blood allocation, notification, crossmatch, dispensing, and cancellation workflow in **BloodSync**.

---

## 1. Prerequisites & Environment Setup

Ensure MySQL 8.0 is running on localhost with the active database `bloodsync`.

### 1.1 Startup Commands (Windows PowerShell)

**Terminal 1 — Backend API Server (Port 3000)**
```powershell
cd "d:\blood sync\backend"
npm run build
node dist/src/server.js
```
*Expected log output: `BloodSync Backend API running on port 3000`*

**Terminal 2 — Frontend Application (Port 5173)**
```powershell
cd "d:\blood sync\frontend"
npm run dev
```
*Expected log output: `Local: http://localhost:5173/`*

**Terminal 3 — Synthetic Demo Data Reset / Verification (Optional)**
```powershell
cd "d:\blood sync\backend"
npx ts-node src/scripts/seedDemoData.ts
```
*This idempotently seeds and resets the demo accounts and units in `bloodsync`.*

---

## 2. Real Database-Backed Demo Credentials

| Role | Email | Password | Linked Dossier / Attributes |
| :--- | :--- | :--- | :--- |
| **Patient** | `patient.demo@bloodsync.test` | `password123` | **Aarav Kumar** (ID: 357), Blood Group: **O+ (Verified)**, Hospital: *BloodSync Demo Hospital* |
| **Technician** | `tech.demo@bloodsync.test` | `password123` | **Demo Lab Technician** (ID: 5), Institutional Staff Access |
| **Admin** | `admin@bloodsync.local` | `password123` | System Administrator, Full Audit & Inventory Access |

*(Quick-fill buttons are provided directly on the Login page for convenience).*

---

## 3. Demonstration Scenario 1: Emergency Blood Request to Dispensing

### Step 1: Patient Submits Emergency Request (Browser Session A)
1. Navigate to `http://localhost:5173/login`.
2. Click **Patient (Aarav)** quick-fill button, then click **Authenticate Session**.
3. You are redirected to `/patient-portal`.
4. Observe the Patient Dossier:
   - Name: **Aarav Kumar**
   - Blood Group: **O+** with emerald **Verified** badge.
   - Hospital: **BloodSync Demo Hospital**
5. In the **Emergency Blood Request Card**:
   - Component: **Red Blood Cells**
   - Quantity: **1 Unit**
   - Urgency: **Emergency**
6. Click **REQUEST O+ BLOOD**.
7. The request appears in the **Active Blood Bank Requests** table with status **Pending** and urgency badge **Emergency**.

### Step 2: Real-Time Technician Alert (Browser Session B)
1. Open an Incognito window or second browser profile and navigate to `http://localhost:5173/login`.
2. Click **Lab Technician** quick-fill button, then click **Authenticate Session**.
3. Observe the top header **Notification Bell**:
   - A pulsing red badge indicates a new unread alert.
   - Click the bell to view:
     `EMERGENCY BLOOD REQUEST — Emergency request for Aarav Kumar (O+ Red Blood Cells)`.
   - Click **Open Matching** or **View Request**.

### Step 3: FEFO & ABO/Rh Matching
1. In the **Matching & Allocation** module (`/matching`), select the emergency request.
2. Observe the compatibility screening:
   - System confirms patient O+ recipient rules (eligible donor groups: O+, O-).
   - Incompatible units (A+, B+, AB+) and expired/quarantined units are automatically excluded.
   - Inventory candidates are ordered by **FEFO** (First-Expiry-First-Out).
3. Click **Reserve 48h / Reserve Unit** for the recommended unit (e.g. `DEMO-RBC-OP-01`).
4. Unit status changes to `RESERVED` with a 24h validity hold in the database.

### Step 4: Laboratory Crossmatch (Simulated)
1. On the reservation card, click **Record Test** / **Crossmatch**.
2. Notice the safety guard: Compatibility is **NOT** pre-selected.
3. Select **Compatible**.
4. Tester Name: `Demo Lab Tech`.
5. Check the declaration: `[SIMULATED] Laboratory crossmatch performed under simulated QA protocol`.
6. Click **Sign Off Crossmatch**.

### Step 5: Clinical Release & Dispensing
1. In the **Issuance & Release** module (`/issuance`), locate the request docket.
2. Click **Authorize Clinical Release**.
3. Check the three clinical safety invariants:
   - Patient ABO/RhD confirmed matches blood unit compatibility.
   - Visual inspection intact & unit within valid shelf life.
   - Major crossmatch verified Compatible.
4. Click **Authorize Clinical Release**.
5. The unit transitions to **ISSUED**, an immutable issuance record is logged, and the request status becomes **Fulfilled**.
6. Switch back to Browser Session A (Patient Dashboard):
   - Without pressing refresh, within 2 seconds the request status automatically updates to **Fulfilled**.

---

## 4. Demonstration Scenario 2: Patient Request Cancellation

1. In Browser Session A (Patient Dashboard), click **REQUEST O+ BLOOD** again (after 2 seconds).
2. A new pending request appears.
3. In Browser Session B (Technician), the notification bell alerts the technician.
4. Technician navigates to `/matching` and reserves an eligible unit (e.g. `DEMO-RBC-OP-02`).
5. Switch back to Browser Session A:
   - Patient views the active reservation.
   - Patient clicks **Cancel Request** and confirms in the cancellation modal.
   - Request status transitions to **Cancelled**.
6. In MySQL:
   - The active reservation for `DEMO-RBC-OP-02` is released.
   - The unit is returned to **AVAILABLE** in storage.
7. Switch to Browser Session B (Technician):
   - Notification bell receives **BLOOD REQUEST CANCELLED** alert.
   - Technician confirms unit was returned to active stock.
8. Safety Invariant Check:
   - Try cancelling the previously **ISSUED** request from Scenario 1:
   - The system strictly rejects cancellation with HTTP 400.
   - An issued unit can **never** be automatically returned to available inventory.

---

## 5. Verification Commands via CLI

Run the full acceptance test suite at any time:
```powershell
cd "d:\blood sync\backend"
npx ts-node tests/gates.test.ts
```
Expected result: **11/11 Gates Passed (100.0%)**.

Run system intelligence verification:
```powershell
cd "d:\blood sync"
python verify_system.py
```
Expected result: **74/74 Checks Passed (100.0%)**.
