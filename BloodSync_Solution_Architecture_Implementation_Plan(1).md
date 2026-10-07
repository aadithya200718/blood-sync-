# BloodSync — Solution Architecture & Implementation Plan

## 1. Executive Summary

**BloodSync** is a web-based, database-driven blood-bank inventory and decision-support platform.

It combines:

- Blood-unit inventory management
- Donor and patient/request management
- Automated expiry monitoring
- Compatibility-aware request matching
- Configurable issuance-policy implementation
- FEFO (First Expire, First Out) inventory prioritization
- Reservation and issuance workflows
- Low-stock and shortage-risk alerts
- End-to-end auditability
- Explainable automated decisions
- AI-assisted inventory intelligence
- Agentic workflow orchestration

### Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Tailwind CSS |
| Backend | Node.js + Express.js + TypeScript |
| Database | MySQL 8 |
| Authentication | JWT + RBAC |
| Charts | Recharts |
| AI/Agent Layer | Python FastAPI service + LLM + tool-calling |
| Background Jobs | Node.js worker / BullMQ + Redis |
| Deployment | Docker + Docker Compose |
| API Documentation | OpenAPI / Swagger |

> **Safety boundary:** BloodSync is a software decision-support and inventory system. Clinical transfusion compatibility, emergency-release decisions, and final blood release must remain governed by validated transfusion-medicine rules and authorized blood-bank personnel. AI agents must not independently make or override clinical decisions.

---

## 2. Product Vision

### Current problem

Existing literature tends to address individual pieces:

1. Issuance optimization
2. Blood-bank database management
3. Inventory optimization
4. Hardware-assisted monitoring
5. ML-based wastage reduction

BloodSync integrates these capabilities into one lightweight software platform.

### Target outcome

> **Turn blood-bank data into safe, explainable, auditable operational workflows rather than using the database only as a storage system.**

---

# 3. Research Gaps → System Features

| Gap | Problem | BloodSync Implementation |
|---|---|---|
| Gap 1 | Issuance policy remains theoretical | `match_request()` stored procedure + policy engine |
| Gap 2 | DBMS has limited automation | MySQL triggers + scheduled jobs |
| Gap 3 | Inventory models remain theoretical | Inventory analytics + configurable target/threshold model |
| Gap 4 | Real-time visibility uses hardware | Software-driven inventory state + event updates + dashboard |
| Gap 5 | ML wastage reduction requires training infrastructure | Explainable FEFO/rule-based prioritization + optional AI forecasting |
| Gap 6 | Capabilities are fragmented | Unified BloodSync platform |
| Gap 7 | Decisions lack explanation | Decision trace + reason codes + AI explanation |
| Gap 8 | Limited auditability | Audit event records |
| Gap 9 | Concurrent allocation can cause double allocation | MySQL transactions, row locking, atomic reservation |

---

# 4. High-Level Solution Architecture

```text
                         ┌───────────────────────────────┐
                         │          USERS                │
                         │ Admin / Technician / Manager  │
                         │ Auditor / Authorized Staff    │
                         └───────────────┬───────────────┘
                                         │
                                         ▼
                         ┌───────────────────────────────┐
                         │     REACT WEB APPLICATION      │
                         │                               │
                         │ Dashboard                     │
                         │ Inventory                     │
                         │ Requests                      │
                         │ Matching                      │
                         │ Reservations                  │
                         │ Issuance                      │
                         │ Alerts                        │
                         │ Audit                         │
                         │ Analytics                     │
                         │ AI Copilot                    │
                         └───────────────┬───────────────┘
                                         │ HTTPS / REST
                                         ▼
                         ┌───────────────────────────────┐
                         │      NODE.JS + EXPRESS        │
                         │                               │
                         │ Authentication                │
                         │ RBAC                          │
                         │ Request Service               │
                         │ Inventory Service             │
                         │ Matching Service              │
                         │ Reservation Service            │
                         │ Issuance Service              │
                         │ Audit Service                 │
                         │ Alert Service                 │
                         │ AI Gateway                    │
                         └───────────────┬───────────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
          ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
          │     MySQL 8     │   │ Redis + Worker  │   │  AI Agent API   │
          │                 │   │                 │   │                 │
          │ Tables          │   │ Scheduled jobs  │   │ FastAPI         │
          │ Procedures      │   │ Expiry checks   │   │ LLM             │
          │ Triggers        │   │ Alerts          │   │ Tool calling    │
          │ Transactions    │   │ Reservations    │   │ Agent workflow  │
          └─────────────────┘   └─────────────────┘   └─────────────────┘
```

---

# 5. Frontend Architecture

## React Structure

```text
frontend/
├── src/
│   ├── app/
│   │   ├── router.tsx
│   │   └── providers.tsx
│   ├── components/
│   │   ├── layout/
│   │   ├── tables/
│   │   ├── charts/
│   │   ├── forms/
│   │   ├── alerts/
│   │   └── ai/
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Inventory.tsx
│   │   ├── Donors.tsx
│   │   ├── Patients.tsx
│   │   ├── Requests.tsx
│   │   ├── Matching.tsx
│   │   ├── Reservations.tsx
│   │   ├── Issuance.tsx
│   │   ├── Alerts.tsx
│   │   ├── Audit.tsx
│   │   ├── Analytics.tsx
│   │   └── AICopilot.tsx
│   ├── services/
│   ├── hooks/
│   ├── types/
│   └── utils/
```

## Main UI

### Dashboard

Show:

- Total units
- Available/reserved/issued/expired units
- Units expiring soon
- Low/critical stock
- Pending/unfulfilled requests
- Recent audit events
- AI operational insights

### Inventory

Filters:

- Blood group
- Status
- Expiry window
- Storage location
- Collection date

Actions:

- Add unit
- View unit
- Reserve
- Issue
- Discard
- View audit history

### Request Management

Fields:

- Patient
- Blood group
- Quantity
- Urgency
- Hospital
- Required time
- Clinical authorization/reference

Main action:

**Run Match**

### Matching Result

```text
Request: REQ-10023
Blood group: O+
Quantity: 2

Recommended units:

B102
B103

Why?

✓ Clinically eligible according to configured compatibility rules
✓ Cross-match status acceptable
✓ Available
✓ Earliest eligible expiry
✓ Issuance policy satisfied
```

The UI must distinguish:

- System recommendation
- Clinical authorization
- Final issuance

---

# 6. Backend Architecture

```text
backend/
├── src/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── repositories/
│   ├── middleware/
│   ├── validators/
│   ├── jobs/
│   ├── agents/
│   ├── db/
│   ├── audit/
│   ├── config/
│   └── app.ts
```

Core services:

- **AuthService** — authentication, JWT, RBAC
- **InventoryService** — units, statuses, inventory queries
- **RequestService** — request creation and lifecycle
- **MatchingService** — calls deterministic MySQL matching logic
- **ReservationService** — reserve/release/expire reservations
- **IssuanceService** — authorized issue workflow
- **AuditService** — state-transition logging
- **AlertService** — low-stock and expiry alerts
- **AIService** — controlled AI access and recommendations

---

# 7. MySQL Database Architecture

## Core Tables

### users

```text
user_id
name
email
password_hash
role
status
created_at
```

### donors

```text
donor_id
name
blood_group
phone
last_donation_date
status
created_at
```

### patients

```text
patient_id
name
blood_group
hospital
created_at
```

### blood_units

```text
unit_id
donor_id
blood_group
component_type
collection_date
expiry_date
status
storage_location
created_at
updated_at
```

### blood_requests

```text
request_id
patient_id
blood_group
component_type
quantity
urgency
status
requested_at
```

### cross_matches

```text
crossmatch_id
request_id
unit_id
result
tested_by
tested_at
```

### reservations

```text
reservation_id
request_id
unit_id
reserved_at
expires_at
status
```

### issuances

```text
issuance_id
request_id
unit_id
issued_by
issued_at
reason_code
```

### inventory_targets

```text
blood_group
component_type
critical_level
minimum_level
target_level
```

### alerts

```text
alert_id
type
severity
unit_id
blood_group
message
status
created_at
resolved_at
```

### audit_logs

```text
audit_id
user_id
action
entity_type
entity_id
before_state
after_state
reason
created_at
```

### decision_traces

```text
trace_id
request_id
unit_id
rule_name
rule_result
rule_value
explanation
created_at
```

### ai_insights

```text
insight_id
agent_name
insight_type
severity
summary
evidence
recommendation
created_at
```

---

# 8. Key Database Relationships

```text
DONOR
  │
  └──< BLOOD_UNIT

PATIENT
  │
  └──< BLOOD_REQUEST
             │
             ├──< CROSS_MATCH >── BLOOD_UNIT
             ├──< RESERVATION >── BLOOD_UNIT
             └──< ISSUANCE >───── BLOOD_UNIT

USER
  │
  ├──< ISSUANCE
  ├──< AUDIT_LOG
  └──< CROSS_MATCH
```

---

# 9. Core Database Automation

## 9.1 Expiry Automation

A scheduled worker checks:

```text
expiry_date <= today
```

Then:

```text
AVAILABLE → EXPIRED
```

For near expiry:

```text
expiry_date <= today + configured warning period
```

Create:

```text
EXPIRING_SOON
```

> Use a scheduled job for calendar-driven expiry. A MySQL trigger only fires when a database event occurs.

## 9.2 Low-Stock Automation

After an inventory-changing transaction:

```text
Current stock
      ↓
Compare with inventory_targets
      ↓
Critical / Low / Normal
      ↓
Create or update alert
```

---

# 10. Core `match_request()` Procedure

This is the centerpiece of the SQL implementation.

Conceptual flow:

```text
CALL match_request(request_id)

        ↓
Load request
        ↓
Validate request
        ↓
Load clinically eligible compatibility candidates
        ↓
Filter AVAILABLE units
        ↓
Verify required cross-match status
        ↓
Remove expired units
        ↓
Apply configured issuance policy
        ↓
Prioritize eligible units
        ↓
FEFO / configured inventory policy
        ↓
Return ranked candidates
        ↓
Store decision trace
```

Example ranking:

```text
1. Clinically eligible
2. Cross-match acceptable
3. Available
4. Policy compliant
5. Earliest eligible expiry
6. Additional configured inventory rules
```

Do **not** let the LLM decide this ranking.

---

# 11. Concurrency-Safe Reservation

Use MySQL transactions and row locking.

Conceptually:

```sql
START TRANSACTION;

SELECT ...
FROM blood_units
WHERE ...
FOR UPDATE;

-- verify status

UPDATE blood_units
SET status = 'RESERVED'
WHERE unit_id = ?;

INSERT INTO reservations (...);

COMMIT;
```

If two requests arrive simultaneously, row-level locking prevents both requests from successfully reserving the same unit.

---

# 12. Reservation Expiration

```text
RESERVED
    │
    ├── collected → ISSUED
    │
    └── timeout → AVAILABLE
```

A background worker:

1. Finds expired reservations
2. Releases units
3. Updates reservation status
4. Creates an audit event

---

# 13. Audit & Explainability

Every important action creates an audit event:

```text
USER_LOGIN
DONOR_CREATED
UNIT_CREATED
UNIT_STATUS_CHANGED
REQUEST_CREATED
MATCH_EXECUTED
UNIT_SELECTED
RESERVATION_CREATED
RESERVATION_EXPIRED
UNIT_ISSUED
UNIT_DISCARDED
LOW_STOCK_ALERT
EXPIRY_ALERT
AI_RECOMMENDATION_CREATED
```

For matching decisions, store:

```text
Rule
Input
Result
Reason
Timestamp
Actor/System
```

Example:

```text
Selected Unit: B102

Reasons:
- Compatible according to configured clinical rules
- Cross-match acceptable
- Available
- Not expired
- Earliest eligible expiry
- Issuance policy satisfied
```

---

# 14. AI / Agentic Layer

## Recommended approach

Yes, add AI — but use it as a **supervised operational intelligence layer**, not as the clinical source of truth.

Do **not** build:

```text
LLM → decides blood compatibility → issues blood
```

Build:

```text
Deterministic rules + MySQL
          ↓
    Source of truth
          ↓
       AI Agents
          ↓
Recommendations / explanations
          ↓
   Human authorization
          ↓
Controlled backend API
          ↓
       MySQL transaction
          ↓
       Audit log
```

---

# 15. Agent Architecture

```text
                         ┌───────────────────┐
                         │   BloodSync UI    │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │   AI Copilot      │
                         └─────────┬─────────┘
                                   │
                           Agent Orchestrator
                                   │
              ┌────────────────────┼──────────────────┐
              │                    │                  │
              ▼                    ▼                  ▼
       Inventory Agent       Waste Agent        Operations Agent
              │                    │                  │
              └────────────────────┼──────────────────┘
                                   ▼
                            Recommendation
                                   │
                                   ▼
                         Human Authorization
                                   │
                                   ▼
                           BloodSync APIs
                                   │
                                   ▼
                                MySQL
```

---

# 16. Recommended Agents

## Agent 1 — Inventory Intelligence Agent

Monitors:

- Current stock
- Minimum/target levels
- Expiring units
- Pending requests
- Historical demand

Example:

> O+ inventory is 18 units versus a configured minimum of 25 and target of 60. Nine requests are pending. Review replenishment options.

## Agent 2 — Waste Reduction Agent

Identifies potential expiry/wastage.

Example:

> 12 A+ units expire within 3 days. Based on current recorded demand, approximately 3 may remain unused before expiry. Review eligible near-expiry inventory and redistribution options according to applicable policy.

## Agent 3 — Operations Agent

Produces an operational brief:

```text
CRITICAL
• O- below critical level
• 4 units expire within 48 hours
• 2 requests remain unfulfilled

REVIEW
• Reservation backlog increased
• O+ demand increased over the last 24 hours
```

## Agent 4 — Audit/Compliance Agent

Flags unusual patterns:

- Large number of manual status changes
- Repeated reservation cancellations
- Multiple failed matching attempts
- Unusual issuance patterns

It should flag activity for review, not make accusations.

## Agent 5 — Natural-Language Analytics Agent

Authorized managers can ask:

> Why is O+ inventory low?

The agent retrieves structured data through read-only tools and explains the result.

---

# 17. Agent Tools

Default AI tools should be **read-only**:

```text
get_inventory()
get_expiring_units()
get_low_stock()
get_pending_requests()
get_request_history()
get_issuance_statistics()
get_audit_events()
get_inventory_targets()
```

For actions:

```text
AI recommendation
       ↓
Human approval
       ↓
Controlled backend API
       ↓
Validated operation
       ↓
Database transaction
       ↓
Audit log
```

Never allow:

```text
LLM → raw SQL → production database
```

---

# 18. Event-Driven Agentic Workflow

Important system events:

```text
BLOOD_UNIT_ISSUED
BLOOD_UNIT_EXPIRED
REQUEST_CREATED
REQUEST_UNFULFILLED
STOCK_THRESHOLD_CROSSED
RESERVATION_EXPIRED
```

Example:

```text
UNIT_ISSUED
     │
     ├── Update inventory
     ├── Create audit event
     ├── Check stock threshold
     └── Notify Inventory Agent
              │
              ▼
       Gather evidence
              │
              ▼
       Generate insight
              │
              ▼
       Human review
```

This makes the application genuinely **agentic** rather than merely adding a chatbot.

---

# 19. Security & Safety

Implement:

- HTTPS
- Argon2/bcrypt password hashing
- JWT authentication
- RBAC
- Input validation
- Parameterized SQL
- Rate limiting
- CORS/security headers
- Environment-based secrets
- Audit logging
- Least-privilege database access

For the AI layer:

- Read-only tools by default
- No arbitrary SQL
- No direct inventory mutation
- No compatibility decisions by LLM
- No bypass of cross-match requirements
- Human approval for consequential actions
- Full AI action/recommendation logging

For real-world deployment, apply relevant medical-data privacy, security, retention, and regulatory requirements.

---

# 20. Testing Strategy

## Unit Tests

- Inventory calculations
- Expiry calculations
- Request validation
- Policy rules

## Integration Tests

```text
Request
→ Matching
→ Reservation
→ Issuance
→ Inventory update
→ Audit
```

## Database Tests

- Stored procedures
- Triggers
- Constraints
- Rollbacks
- Transactions
- Concurrent requests
- Double-allocation prevention

## AI Tests

- Hallucination resistance
- Tool permission boundaries
- Prompt-injection resistance
- Incorrect-data handling
- No unauthorized writes
- Explanation consistency

---

# 21. High-Impact Demo Scenarios

### Demo 1 — Expiry automation

```text
Unit expires tomorrow
       ↓
Scheduled job
       ↓
EXPIRING_SOON
       ↓
Dashboard alert
```

### Demo 2 — Automatic matching

```text
Patient requests O+
       ↓
match_request()
       ↓
Eligible units
       ↓
Policy + FEFO
       ↓
Explainable recommendation
```

### Demo 3 — Reservation

```text
AVAILABLE
    ↓
RESERVED
    ↓
ISSUED
```

### Demo 4 — Concurrent requests

```text
Two requests
     ↓
One unit
     ↓
Transaction locking
     ↓
Only one reservation succeeds
```

### Demo 5 — Audit

```text
Request
→ Match
→ Selection
→ Reservation
→ Issuance
→ Inventory update
```

### Demo 6 — AI Agent

Ask:

> What are the most urgent inventory issues right now?

Agent returns:

```text
1. O- below critical level
2. 5 A+ units expire within 48 hours
3. 3 requests remain unfulfilled

Evidence:
...
```

The agent cannot directly issue blood.

---

# 22. Development Roadmap

## Phase 1 — Architecture & Database

**Days 1–3**

- Requirements
- ER diagram
- Schema
- Constraints
- Seed data
- Compatibility configuration
- Inventory targets

## Phase 2 — SQL Intelligence

**Days 4–7**

- Stored procedures
- Functions
- Triggers
- Expiry jobs
- Alerts
- Audit logging
- Transactions
- Concurrency control

## Phase 3 — Node Backend

**Days 8–11**

- Express setup
- Authentication
- RBAC
- REST APIs
- Service layer
- Repository layer
- Error handling

## Phase 4 — React Frontend

**Days 12–17**

- Login
- Dashboard
- Inventory
- Requests
- Matching
- Reservations
- Issuance
- Alerts
- Audit
- Analytics

## Phase 5 — Agentic AI

**Days 18–22**

- FastAPI AI service
- Tool definitions
- Inventory Agent
- Waste Agent
- Operations Agent
- Audit Agent
- AI Copilot
- Human approval workflow

## Phase 6 — Testing & Polish

**Days 23–26**

- Unit tests
- Integration tests
- Database concurrency tests
- Security testing
- AI safety testing
- UI polish

## Phase 7 — Deployment & Documentation

**Days 27–30**

- Docker
- MySQL
- Redis
- Backend
- Frontend
- AI service
- Swagger/OpenAPI
- Architecture diagrams
- Final report
- Demo preparation

---

# 23. Repository Structure

```text
bloodsync/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── jobs/
│   │   └── db/
│   └── package.json
│
├── ai-service/
│   ├── agents/
│   │   ├── inventory_agent.py
│   │   ├── waste_agent.py
│   │   ├── operations_agent.py
│   │   └── audit_agent.py
│   ├── tools/
│   ├── workflows/
│   └── main.py
│
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   ├── procedures.sql
│   ├── functions.sql
│   ├── triggers.sql
│   └── views.sql
│
├── docs/
│   ├── architecture.md
│   ├── api.md
│   └── research-gaps.md
│
├── docker-compose.yml
└── README.md
```

---

# 24. Final System Workflow

```text
                    ┌─────────────┐
                    │    USER     │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ React Web   │
                    │ Application │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ Node/Express│
                    └──────┬──────┘
                           │
                ┌──────────┴──────────┐
                ▼                     ▼
        ┌──────────────┐      ┌──────────────┐
        │    MySQL     │      │ AI Agent     │
        │ Decision     │      │ Intelligence │
        │ Engine       │      │ Layer        │
        └──────┬───────┘      └──────┬───────┘
               │                     │
        ┌──────▼───────┐      ┌──────▼───────┐
        │ Transactions │      │ Read-only    │
        │ Procedures   │      │ Tools        │
        │ Triggers     │      │ Reasoning    │
        │ Audit        │      │ Recommendations│
        └──────┬───────┘      └──────┬───────┘
               │                     │
               └──────────┬──────────┘
                          ▼
                   HUMAN APPROVAL
                          │
                          ▼
                   VALIDATED API
                          │
                          ▼
                     DB UPDATE
                          │
                          ▼
                      AUDIT LOG
```

---

# 25. Final Project Positioning

BloodSync should be presented as:

> **A lightweight, database-driven and AI-assisted blood-bank decision-support platform that integrates inventory automation, compatibility-aware request matching, expiry and wastage management, concurrency-safe reservation, explainable decision traces, and end-to-end auditability.**

### Architectural principle

**MySQL** = transactional source of truth  
**Node.js** = controlled business/API layer  
**React** = operational interface  
**Stored procedures/rules** = deterministic decision layer  
**AI agents** = intelligence and recommendation layer  
**Human authorization** = clinical safety boundary

This gives BloodSync both an **advanced SQL foundation** and a **modern agentic AI/web architecture**, while keeping the LLM away from unsafe autonomous clinical decisions.
