# BloodSync — Phase-Wise Implementation Plan

This document outlines the structured, phase-wise development roadmap for the BloodSync platform, broken down by focus areas, tasks, and estimated timelines.

## Phase 1: Architecture & Database Foundation
**Duration:** Days 1–3  
**Focus:** Establishing the core data structures, relationships, and business rules at the database level.

### Tasks
- [x] Requirements gathering and finalization
- [x] Design ER diagrams and define data models
- [x] Create MySQL database schema and tables
- [x] Implement constraints (Primary Keys, Foreign Keys, Enums)
- [x] Define and insert seed data for testing
- [x] Configure blood compatibility rules
- [x] Set up inventory targets (critical/minimum/target levels)

---

## Phase 2: SQL Intelligence & Automation
**Duration:** Days 4–7  
**Focus:** Implementing the deterministic rules engine and automated database processes.

### Tasks
- [x] Write stored procedures (e.g., `match_request()`)
- [x] Create database functions for repeated logic
- [x] Implement triggers for automated status updatesnp
- [x] Develop scheduled jobs for expiry checks
- [x] Set up alert generation mechanisms (low stock, expiring soon)
- [x] Build audit logging for all critical state changes
- [x] Implement transactions and concurrency control (row locking)

---

## Phase 3: Node.js Backend API
**Duration:** Days 8–11  
**Focus:** Building the secure API layer to interface with the database and handle business logic.

### Tasks
- [x] Initialize Node.js + Express + TypeScript project
- [x] Implement JWT Authentication and password hashing (Argon2/bcrypt)
- [x] Establish Role-Based Access Control (RBAC) middleware
- [x] Develop RESTful APIs for all core entities (Users, Inventory, Requests)
- [x] Build the service layer connecting routes to database procedures
- [x] Create the repository layer for database interactions
- [x] Implement global error handling and input validation

---

## Phase 4: React Frontend Application
**Duration:** Days 12–17  
**Focus:** Developing the user interface for staff to interact with the system.

### Tasks
- [x] Scaffold React + TypeScript + Tailwind CSS application
- [x] Build secure Login and Authentication flow
- [x] Develop Dashboard with high-level metrics and alerts
- [x] Create Inventory management views (filters, add, discard, reserve)
- [x] Implement Request management and Matching interface
- [x] Build Reservations and Issuance workflows
- [x] Develop Audit logs and Analytics views
- [x] Integrate charts and data visualization (Recharts)

---

## Phase 5: Agentic AI Layer
**Duration:** Days 18–22  
**Focus:** Adding the AI Copilot and intelligent operational agents without compromising clinical safety.

### Tasks
- [x] Set up Python FastAPI service for AI Agents
- [x] Define and implement read-only tool definitions for the LLM
- [x] Develop **Inventory Intelligence Agent**
- [x] Develop **Waste Reduction Agent**
- [x] Develop **ML-Guided Issuance Agent** (Paper 10 — arXiv:2411.14939)
- [x] Develop **Audit/Compliance Agent**
- [x] Build the conversational AI Copilot interface in the frontend
- [x] Implement the human-in-the-loop approval workflow

---

## Phase 6: Testing & Polish
**Duration:** Days 23–26  
**Focus:** Ensuring system reliability, security, and safety.

### Tasks
- [x] Write backend unit tests (inventory math, expiry calculations)
- [x] Develop integration tests for the full issuance workflow
- [x] Execute database concurrency tests (preventing double allocations)
- [x] Perform security testing and vulnerability scanning
- [x] Conduct AI safety testing (hallucination checks, tool boundaries)
- [x] Refine and polish UI/UX elements

---

## Phase 7: Deployment & Documentation
**Duration:** Days 27–30  
**Focus:** Preparing the application for production and handing over deliverables.

### Tasks
- [ ] Containerize applications using Docker and Docker Compose
- [ ] Configure production environments for MySQL and Redis
- [ ] Deploy Backend API and Frontend App
- [ ] Deploy AI FastAPI service
- [ ] Generate Swagger/OpenAPI documentation
- [ ] Finalize architecture diagrams and technical documentation
- [ ] Prepare final report and project handover
- [ ] Setup high-impact demo scenarios

> [!IMPORTANT]
> **Safety Boundary Reminder:** Throughout all phases, ensure that AI agents remain as a decision-support tool. Final blood release and compatibility checks must always require human authorization and deterministic SQL rules.
