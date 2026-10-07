# BloodSync 2.0 — Agentic Blood Bank Inventory & Compatibility Matching Engine

*Extending the Zeroth Review (relational DB + triggers + pg_cron) with an autonomous agent layer, while keeping the deterministic, explainable core the review already justifies.*

---

## 1. Why "agentic" — and why it doesn't break your original argument

Your Zeroth Review's whole pitch was: **"we get the same automation ML/hardware systems promise, but through pure database logic — explainable, cheap, deployable."** Don't throw that away. The trap most students fall into when adding "AI agents" is bolting on an unpredictable LLM that overrides deterministic safety logic (matching the wrong blood type because an LLM "decided" so is a *fatal* pitch flaw for a blood system).

So the design principle is:

> **The database stays the single source of truth and the only thing allowed to make a compatibility decision. Agents orchestrate, reason over ambiguity, communicate, and act — they never invent a match. Every agent action still ends in a call to the same audited stored procedures your DB layer already defines.**

This is actually a *stronger* pitch than plain agentic-AI hype: "deterministic core, agentic edges" is a real enterprise architecture pattern (agents as orchestrators around a trusted system of record), and it directly answers the panel's likely question — *"why not just use triggers, why do you need agents at all?"*

**Answer to have ready:** Triggers and cron jobs are reactive and rigid — they can only do what was hardcoded (flag expiry, run a fixed match). They can't decide *who* to notify when local stock is short, can't negotiate a redistribution across blood banks, can't parse a hospital's free-text urgent request, and can't decide when a human needs to be pulled in. Agents add the judgement layer above the automation layer.

---

## 2. Layered Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│  LAYER 4 — INTERFACES                                                │
│  Hospital Request Portal (chat/NL) | Blood Bank Staff Dashboard      │
│  SMS/Email/Push notification channel                                 │
└───────────────────────────────┬────────────────────────────────────┘
                                 │
┌───────────────────────────────▼────────────────────────────────────┐
│  LAYER 3 — AGENTIC ORCHESTRATION                                     │
│                                                                        │
│   ┌───────────────┐   supervises   ┌─────────────────────────────┐  │
│   │ Supervisor /   │◄──────────────►│  Specialist Agents:          │  │
│   │ Orchestrator   │                 │  1. Intake Agent             │  │
│   │ Agent          │                 │  2. Emergency Response Agent │  │
│   └───────┬────────┘                 │  3. Inventory Monitor Agent  │  │
│           │                          │  4. Redistribution Agent     │  │
│           │                          │  5. Donor Engagement Agent   │  │
│           │                          │  6. Audit/Compliance Agent   │  │
│           │                          └──────────────┬───────────────┘  │
│           │  every agent action = a tool call, never raw SQL          │
└───────────┼───────────────────────────────────────────┼──────────────┘
            │                                            │
┌───────────▼────────────────────────────────────────────▼─────────────┐
│  LAYER 2 — EVENT BACKBONE                                            │
│  PostgreSQL LISTEN/NOTIFY → Message broker (Redis Pub/Sub)           │
│  Converts DB-level events (new row, trigger fire) into agent-visible │
│  events, and agent decisions back into DB writes                     │
└───────────────────────────────┬────────────────────────────────────┘
                                 │
┌───────────────────────────────▼────────────────────────────────────┐
│  LAYER 1 — DETERMINISTIC CORE (your existing Zeroth Review design)   │
│  PostgreSQL: blood_units | hospital_requests | compatibility_rules   │
│             | inventory_events (audit log) | blood_banks | donors    │
│  pg_cron daily expiry job | emergency trigger | matching stored proc │
└────────────────────────────────────────────────────────────────────┘
```

**Golden rule for your defense:** point at Layer 1 and say "this is unchanged from the Zeroth Review — it's still the safety-critical, deterministic core." Point at Layer 3 and say "this is the new judgement layer." That framing alone shows maturity.

---

## 3. The Agents — detailed spec

For each agent: **role, trigger, tools it's allowed to call, and what it must NOT do.**

### 3.1 Supervisor / Orchestrator Agent
- **Role:** Single entry point for all events. Routes to the right specialist agent, resolves conflicts (e.g., two hospitals requesting the last unit), maintains conversation state for the hospital chat interface.
- **Triggered by:** any inbound event (new hospital request, DB NOTIFY, staff query).
- **Tools:** `route_to_agent()`, read-only DB views, escalate_to_human().
- **Must not:** directly issue blood units or write to `blood_units`.

### 3.2 Intake Agent
- **Role:** Accepts hospital requests in natural language ("Need 2 units O-negative, patient in ICU, trauma case") or structured form, extracts blood group, component, quantity, urgency, and normalizes into the `hospital_requests` schema. Classifies urgency using both explicit fields and NL cues, but **the DB's `emergency` flag rule remains the deciding trigger for auto-match** — the agent only proposes the flag; a lightweight rule check confirms it.
- **Triggered by:** new request via portal/API.
- **Tools:** `parse_request()`, `insert_hospital_request()` (calls existing stored procedure, doesn't write raw SQL), `flag_as_emergency()`.
- **Must not:** guess a blood group when the input is ambiguous — must ask a clarifying question instead (critical for a life-safety system; this is a good design point to state in your defense).

### 3.3 Emergency Response Agent
- **Role:** Fires the moment the DB's emergency trigger fires (via LISTEN/NOTIFY). Orchestrates the *response*, not the match — the match is still done by your existing stored procedure. This agent's job is: confirm the match succeeded, notify hospital of unit + ETA, alert on-call staff, and — if the stored procedure returns "no compatible unit available" — immediately hands off to the Redistribution Agent instead of leaving the request stuck.
- **Triggered by:** DB emergency trigger event.
- **Tools:** `call_matching_procedure()`, `notify_hospital()`, `notify_staff()`, `handoff_to_redistribution_agent()`.
- **Must not:** retry matching with relaxed rules on its own — any relaxation of ABO-Rh rules must go through a human override, logged in the audit table.

### 3.4 Inventory Monitor Agent
- **Role:** Watches the daily near-expiry flags and running stock levels per blood type. Where the old design just *logs* a near-expiry event, this agent *decides what to do about it*: below-threshold stock → trigger Donor Engagement Agent; near-expiry surplus → trigger Redistribution Agent to offer units to nearby hospitals/banks before they're wasted.
- **Triggered by:** pg_cron daily job event, or real-time stock-level change.
- **Tools:** `get_inventory_summary()`, `trigger_donor_engagement()`, `trigger_redistribution()`.
- **Must not:** change expiry dates or unit status directly — only the deterministic trigger does that.

### 3.5 Redistribution Agent
- **Role:** When local stock can't fulfil a request or is about to expire unused, this agent reasons over a network of partner blood banks (a `blood_banks` table with contact + inventory-sharing agreements) and decides who to contact and in what order (proximity, current stock, historical reliability).
- **Triggered by:** handoff from Emergency Response Agent or Inventory Monitor Agent.
- **Tools:** `query_partner_inventory()`, `notify_partner_bank()`, `log_redistribution_attempt()`.
- **Must not:** commit a transfer without confirmation from the receiving bank — proposes, doesn't finalize.

### 3.6 Donor Engagement Agent
- **Role:** When a blood type crosses a low-stock threshold, pulls eligible donors (by type, last-donation-date ≥ 90 days) from a `donors` table and sends personalized outreach (SMS/email) with slot booking. Purely rule-based eligibility, no ML — keeps your "no ML dependency" claim intact for this feature too.
- **Triggered by:** Inventory Monitor Agent.
- **Tools:** `get_eligible_donors()`, `send_donor_notification()`, `book_donation_slot()`.

### 3.7 Audit & Compliance Agent
- **Role:** Continuously reviews the `inventory_events` audit log for anomalies (e.g., unusual issuance frequency, a match overridden by a human, repeated failed matches for one blood type) and generates a daily human-readable compliance summary. This directly strengthens your "traceability and dispute resolution" objective from Slide 8 — it turns a passive log into an active report.
- **Triggered by:** scheduled (daily) + anomaly event.
- **Tools:** `query_audit_log()`, `generate_compliance_report()`, `flag_anomaly_to_staff()`.
- **Must not:** modify audit records — read-only by design (non-negotiable for audit integrity).

---

## 4. End-to-end flow example (the one to demo/present)

**Scenario: Emergency O-negative request from a hospital.**

1. Hospital staff types into the portal: *"Trauma patient, need 2 units O-negative urgently."*
2. **Intake Agent** parses this → group=O, Rh=negative, qty=2, urgency=emergency → calls `insert_hospital_request()`.
3. DB insert fires the **existing emergency trigger** (Layer 1, unchanged from your review) → NOTIFY event published.
4. **Emergency Response Agent** picks up the event → calls the **existing matching stored procedure** (ABO-Rh rules, soonest-to-expire-first — unchanged).
5. Case A — match found: unit marked issued, audit log written (all Layer 1, unchanged) → agent notifies hospital ("2 units ready, bay 3, ETA 5 min") and pages the on-call staff.
6. Case B — no local match: stored procedure returns empty → **Emergency Response Agent** hands off to **Redistribution Agent** → queries 3 nearest partner banks' inventory → contacts the one with confirmed stock → staff at that bank confirms → transfer logged.
7. **Audit & Compliance Agent** picks up all of this the next morning, includes it in the daily report, flags it if resolution took longer than a defined SLA.

This flow is a great thing to literally draw as a sequence diagram in your PPT.

---

## 5. Suggested tech stack

| Layer | Technology | Notes |
|---|---|---|
| Core DB | PostgreSQL | as in your original design |
| Scheduling | pg_cron | unchanged |
| Event backbone | PostgreSQL `LISTEN/NOTIFY` + Redis Pub/Sub | translates DB events to agent events |
| Agent framework | LangGraph or CrewAI (Python) | multi-agent orchestration with tool-calling |
| LLM backbone (for NL parsing only) | any hosted LLM API (e.g., Claude via Anthropic API) | used ONLY for Intake Agent's NL understanding and report generation — never for compatibility logic |
| Backend API | FastAPI | exposes endpoints to portal/dashboard |
| Notifications | Twilio (SMS) / SMTP (email) | |
| Frontend | React + Tailwind | hospital portal + staff dashboard |
| Auth | JWT-based role auth (hospital user / bank staff / admin) | important for a healthcare-adjacent system |

Keep emphasizing in your defense: **the LLM touches only natural-language parsing and report writing — it never decides a blood match.** That's the line that will satisfy a panel worried about "AI hallucinating a blood type."

---

## 6. Elaborate step-by-step build plan

### Phase 0 — Finalize scope & schema (Week 1)
- Lock down ER diagram: `blood_units`, `hospital_requests`, `compatibility_rules`, `inventory_events`, plus new tables `blood_banks`, `donors`, `agent_actions_log`.
- Define emergency SLA thresholds (e.g., near-expiry = 3 days, low-stock threshold per blood type).
- Write out the ABO-Rh compatibility rule table explicitly (8 blood types × compatible donor types) — this becomes a seed data script.

### Phase 1 — Deterministic core (Weeks 2–3) — *this is your Zeroth Review deliverable, build it first and get it fully working standalone*
- Create schema + constraints in PostgreSQL.
- Write the daily expiry-flagging job (pg_cron).
- Write the ABO-Rh matching stored procedure (soonest-to-expire-first).
- Write the emergency trigger (fires matching procedure immediately on `emergency=true` insert).
- Write audit logging into every write path (trigger-based, not agent-based, so it can never be bypassed).
- **Test this in isolation first** — seed with fake data, verify matches are always correct, verify expiry flags fire correctly, verify emergency bypass works. Don't touch agents until this is bulletproof.

### Phase 2 — Event backbone (Week 4)
- Set up PostgreSQL `LISTEN/NOTIFY` channels for: new request, emergency fired, near-expiry flagged, low-stock crossed, match failed.
- Bridge these into Redis Pub/Sub (or a simple polling worker if you want to avoid extra infra for a review project).

### Phase 3 — Agent framework & individual agents (Weeks 5–7)
- Set up LangGraph/CrewAI project. Define each agent as a node with a restricted toolset (see Section 3 — tool allowlists are your safety story).
- Build Intake Agent first (it's the most demo-visible).
- Build Emergency Response Agent second (core value prop).
- Build Inventory Monitor + Redistribution + Donor Engagement agents.
- Build Audit & Compliance Agent last (nice-to-have depth for your review, but lowest risk if cut for time).

### Phase 4 — Orchestrator (Week 8)
- Implement Supervisor Agent to route events to the right specialist, handle multi-agent handoffs (e.g., Emergency → Redistribution), and manage conversational state for the portal chat.

### Phase 5 — Interfaces (Weeks 9–10)
- FastAPI backend exposing: submit request, check status, staff dashboard queries, compliance report endpoint.
- React hospital portal (chat-style request submission + status).
- React staff dashboard (live inventory, pending requests, audit feed).

### Phase 6 — Notifications (Week 10, parallel with Phase 5)
- Twilio/SMTP integration for hospital alerts, staff pages, donor outreach.

### Phase 7 — Testing (Weeks 11–12)
- Unit tests for every stored procedure (correctness of matching logic — this is your strongest, easiest-to-defend test suite).
- Integration tests simulating: normal request, emergency request with match, emergency request with no local stock (redistribution path), near-expiry surplus (redistribution path), low stock (donor engagement path).
- Load/failure testing: what happens if an agent times out mid-flow? (Answer: the DB state is always consistent because agents only ever call the same atomic stored procedures — good point to make live in your defense.)

### Phase 8 — Security & compliance pass (Week 12)
- Role-based access control on the API.
- PII handling for donor/patient data (mention this explicitly — panels like to see you've thought about it even at prototype stage).
- Full audit trail review.

### Phase 9 — Demo prep & documentation (Week 13)
- Prepare the exact scenario in Section 4 as your live/recorded demo.
- One-page architecture diagram, ER diagram, and a "what agents do vs. what the DB does" slide — this single slide will likely be the difference-maker in your defense.

---

## 7. Anticipated panel questions (prepare these)

1. **"Why not just use triggers for everything, why agents?"** → triggers are reactive/fixed; agents add judgement (who to notify, which bank to contact, how to phrase an alert, when to escalate to a human) without touching the safety-critical matching logic.
2. **"What if the LLM hallucinates?"** → LLM is scoped only to NL parsing and report text generation; it never writes to `blood_units` or overrides compatibility rules; ambiguous parses trigger a clarifying question, not a guess.
3. **"How is this different from [Reference 2]'s ML-based system]?"** → no training data required, fully explainable/auditable decisions, agents are rule-and-orchestration based, not predictive models.
4. **"What happens if an agent crashes mid-transaction?"** → DB transactions are atomic and independent of agent state; agents are stateless orchestrators re-triggered by DB events, so a crash just delays the workflow, it never corrupts data.
5. **"Isn't this scope creep for a database project?"** → the core deliverable (Phase 1) is a complete, self-contained system on its own; the agent layer is an extension that demonstrates how the deterministic core can plug into a larger operational ecosystem — you can present Phase 1 alone if time-constrained, or the full stack for maximum novelty.

---

## 8. Pitch Script

### 8.1 Full review pitch (~4–5 minutes, for the review panel)

> Good morning. Blood is one of the few resources that literally expires while you're managing it — platelets last five days, red cells about forty-two. Yet most blood banks still track expiry and match compatible units manually. That gap causes two very different failures: wastage, when perfectly good units expire unused, and delays, when a hospital needs a match *right now* and no one can find it fast enough.
>
> We looked at ten papers across this space. What we found is a pattern: the systems that are mathematically sound — the issuance-policy models, the stochastic inventory models — were never actually implemented. One paper says this outright: most blood-inventory models proposed in the literature are never applied in practice. The systems that *are* implemented either need expensive hardware like weight sensors and cameras, or need machine learning models that most blood banks simply don't have the training data to support.
>
> So the question we asked was: can we get the same automation — expiry tracking and compatibility matching — without hardware, without ML, using nothing but well-designed database logic? That's BloodSync.
>
> At its core, BloodSync is a relational database. Every blood unit is tracked by type, component, and expiry date. A scheduled job runs daily, flags anything within three days of expiry, and logs it. When a hospital submits a request, a stored procedure matches it against compatible donor types using ABO-Rh rules, and — critically — always picks the soonest-to-expire compatible unit first, which is what actually drives down wastage. If a request is marked emergency, a trigger fires that matching procedure instantly, no manual review in the loop. Every single step — collection, flag, match, issuance — is written to an audit log for traceability.
>
> That's the deliverable we're presenting today, and it stands completely on its own.
>
> But we've also designed — and are building out — an agentic layer on top of it, because a real deployment needs more than reactive triggers. What happens when the local blood bank doesn't have a match? Right now, that's a dead end. Our extension adds a small set of coordinating agents: one that understands a hospital's natural-language request and validates it before it ever touches the database; one that responds to emergencies by confirming the match, alerting staff, and — if there's no local stock — immediately reaching out to partner blood banks in priority order; one that watches inventory trends and proactively contacts eligible donors before a shortage becomes critical instead of after.
>
> The important design decision here is that these agents never make a compatibility decision themselves. They orchestrate, they communicate, they escalate — but the actual blood-type matching is always the same deterministic, auditable stored procedure from our core system. That's what keeps this safe, explainable, and genuinely deployable, instead of another black-box AI system layered onto a life-critical process.
>
> In short: a working, self-contained database system that solves the core problem today, with a clear, safe path to a fully agentic, self-coordinating blood network. Thank you — happy to take questions.

### 8.2 60-second elevator version (for casual pitching / intro slide)

> Blood banks manage a resource that expires while they're tracking it, and most still do that tracking manually. Existing fixes either need expensive sensors or machine learning most blood banks can't support. BloodSync solves it with pure database logic — triggers that flag near-expiry units automatically, and a stored procedure that matches compatible blood by ABO-Rh rules, always issuing the soonest-to-expire unit first, with instant automatic matching for emergencies. On top of that deterministic core, we've architected an agent layer that handles the harder judgement calls — coordinating with partner blood banks when local stock runs out, and proactively reaching out to donors before a shortage happens — without ever letting AI touch the actual blood-matching decision. It's automation that's explainable, auditable, and doesn't need a single sensor or training dataset to deploy.

---

## 9. What to cut if you're short on build time

Priority order if the timeline gets tight — build top-down, present what you finish:

1. **Must have:** Phase 1 (deterministic core) — this alone is your original Zeroth Review scope and a complete deliverable.
2. **High value, demo-friendly:** Intake Agent + Emergency Response Agent (Sections 3.2, 3.3) — this is the flow in Section 4, the one to actually demo.
3. **Good depth, cuttable:** Redistribution Agent, Donor Engagement Agent.
4. **Nice-to-have:** Audit & Compliance Agent, full dashboard UI — mention as "designed, in progress" if not built.

If you only build #1 and #2, you already have a coherent, demo-able story: "deterministic core (fully working) + one intelligent orchestration layer on top (fully working) + the rest architected and specified (Section 3, this document)."
