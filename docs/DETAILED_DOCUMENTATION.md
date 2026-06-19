# Metam Services - Detailed Documentation

## 1. Purpose

Metam Services is a Python/FastAPI backend for a multi-module manufacturing ERP/operations system. The repository currently implements a Python-only backend with operational modules for platform administration, inventory, warehouse, supplier, procurement, production, maintenance, quality, sales and distribution, customer portal, supplier portal, reporting and analytics, costing and profitability, mobile operations, integrations, AI, and future manufacturing intelligence.

The platform is designed as a modular monolith first, with a separate Inventory AI FastAPI service for inventory intelligence. The current implementation prioritizes runnable APIs, sample/seed data, module separation, and rule-based AI recommendations.

## 2. Repository Summary

Repository: `vinodreddy1999/metam-services`

Default branch: `main`

Visibility: public

Main runtime: Python FastAPI

Primary application entry point: `app/main.py`

Inventory AI service entry point: `inventory-ai-service/app/main.py`

Main API documentation: `http://127.0.0.1:8000/docs`

Inventory AI documentation: `http://127.0.0.1:8100/docs`

## 3. Technology Stack

The backend uses:

- FastAPI for HTTP APIs
- Uvicorn for local ASGI serving
- Pydantic v2 for request/response validation
- SQLAlchemy 2.0 for database models/session handling
- Alembic for migration scaffolding
- PostgreSQL support through `psycopg2-binary`
- SQLite fallback/demo behavior where applicable
- Python-JOSE for JWT handling
- Passlib bcrypt for password hashing support
- Redis and Celery for asynchronous/background job hooks
- Pandas for report/export processing
- Pytest and HTTPX for testing support

## 4. High-Level Runtime Architecture

### 4.1 Main Platform API

The main service is created in `app/main.py`. It initializes the FastAPI app, creates SQLAlchemy tables through `Base.metadata.create_all(bind=engine)`, seeds platform data, and includes all business routers.

Important runtime endpoints:

- `GET /health` - service health check
- `GET /modules` - registered platform modules
- `POST /auth/login` - demo login/JWT issue flow
- `GET /platform/overview` - tenant/company/plant/module overview
- `GET /reporting/kpis` - demo KPI output
- `POST /supply-chain/forecast` - demo demand forecast
- `GET /supply-chain/load-plan` - demo truck-load planning
- `POST /ai/recommendations` - generic draft recommendation output

### 4.2 Inventory AI Microservice

A separate FastAPI service exists under `inventory-ai-service/`. It runs on port `8100` and provides rule-based inventory intelligence APIs for:

- Risk center
- Shortage prediction
- Overstock prediction
- Procurement recommendations
- Expiry intelligence
- Dead stock detection
- Production impact
- Optimization draft actions

The Inventory AI service is recommendation-only. It creates draft actions and requires human approval for critical business operations.

### 4.3 Modular Monolith Pattern

The main app follows a modular-monolith structure. Each mature module has its own route file, schemas, service, repository, and SQLAlchemy model file under `app/modules/`.

Typical mature module structure:

```text
app/modules/<module>.py
app/modules/<module>_models.py
app/modules/<module>_schemas.py
app/modules/<module>_repository.py
app/modules/<module>_service.py
```

Warehouse and Procurement are currently still partly handled through generic module routers. They should be upgraded into dedicated typed packages in the next backend-depth phase.

## 5. Platform Foundation

The platform foundation includes:

- Tenant isolation
- Company isolation
- Plant isolation
- Users
- Roles
- Permissions
- Feature flags
- Tasks
- Approvals
- Documents
- Audit logs
- Generic module record routing
- JWT/password security helpers
- AI provider abstraction
- Celery job declarations
- Docker Compose support for API, PostgreSQL, Redis, and worker

Metam Services is intended for multi-company operations where a super-admin can enable applications/modules and a company admin can manage users, data access, and connected data sources.

## 6. Security and Access Model

### 6.1 Authentication

The current app exposes login through `POST /auth/login`. Demo login credentials in the README are:

```json
{
  "tenant_slug": "precision-components",
  "email": "admin@metam.local",
  "password": "ChangeMe123!"
}
```

The login response returns:

- Access token
- Tenant ID
- User ID
- Enabled modules

### 6.2 JWT

The app creates JWT access tokens with tenant and permission claims. The current demo secret is hardcoded in `app/main.py` and should be moved to environment variables before production use.

### 6.3 RBAC and Feature Flags

The platform foundation contains role and permission records and company/module-level feature flags. These are intended to control which modules are enabled for each company and what each user can access.

### 6.4 External Portal Isolation

Customer Portal and Supplier Portal are designed with isolated external-user authentication and scoped data access:

- Customers should only see their own orders, shipments, documents, support requests, and returns.
- Suppliers should only see their own purchase orders, deliveries, ASN, documents, certificates, messages, CAPA, and performance records.

## 7. Module Documentation

## 7.1 Auth Module

Purpose: handles login, token refresh structure, and database-backed authentication expansion.

Key responsibilities:

- Tenant-aware login
- JWT token issue
- Permission claim support
- Future refresh-token support

## 7.2 Platform Module

Purpose: manages core SaaS/platform objects.

Implemented areas:

- Companies
- Plants
- Departments
- Users
- Roles
- Permissions
- Feature flags
- Tasks
- Approvals
- Documents
- Audit logs

Recommended next work:

- Enforce permissions on all module endpoints
- Add super-admin vs company-admin policies
- Add company-level dashboard access control
- Add explicit data-source connection management for ERP/SAP/API/file integrations

## 7.3 Inventory Module

Purpose: manages operational inventory visibility and movement data.

Implemented/defined areas:

- Inventory dashboard
- Items/categories/tracking
- Locations and 2D warehouse map
- Batch and serial tracking
- Stock status and reservations
- Movement ledger and stock counts
- Expiry, aging, costs, reports
- Mobile scan and offline sync integration

AI capability:

- Main inventory intelligence is handled by the separate Inventory AI service.

## 7.4 Warehouse Module

Purpose: supports warehouse locations, zones, maps, locations, movements, and occupancy.

Current status:

- Warehouse is currently routed through generic module routers.

Existing generic endpoints include:

- `/warehouses`
- `/warehouses/{warehouse_id}/zones`
- `/warehouses/{warehouse_id}/map`
- `/warehouse-locations`
- `/warehouse-movements`
- `/warehouse-occupancy`

Recommended next work:

- Create dedicated `warehouse_models.py`
- Create dedicated `warehouse_schemas.py`
- Create dedicated `warehouse_repository.py`
- Create dedicated `warehouse_service.py`
- Add bin capacity, putaway, picking, replenishment, FEFO/FIFO, cycle count, and warehouse labor logic

## 7.5 Supplier Module

Purpose: maintains supplier master and supplier reliability signals.

Current generic/direct support:

- `/supplier/suppliers`
- `/suppliers`

Recommended next work:

- Separate internal supplier master from external Supplier Portal users
- Add qualification, approval, scorecard, risk, contract, and compliance logic

## 7.6 Procurement Module

Purpose: handles purchase requisitions and purchase orders.

Current status:

- Procurement is partly implemented through generic routers and simple requisition endpoints.

Existing endpoints include:

- `POST /procurement/requisitions`
- `GET /procurement/requisitions`
- `/purchase-requisitions`
- `/purchase-orders`

Recommended next work:

- Create dedicated Procurement package
- Add PR approval workflow
- Add PO creation/approval/change control
- Add supplier quotation comparison
- Add inbound delivery integration
- Add procurement AI for shortage-to-PO recommendations

## 7.7 Production Module

Purpose: controls manufacturing planning, execution, scheduling, costing, and production AI.

Implemented areas:

- Product master
- Multi-level/versioned BOM
- BOM approval
- Routing operations
- Work centers
- Production lines
- Machine registry
- Production orders
- Approval rules
- MRP
- Material reservations
- Partial reservations and shortage tracking
- Time-aware material planning
- Scheduling and conflict detection
- Shift management
- Daily production logs
- Material consumption and variance
- Downtime management
- Completion workflow
- WIP tracking
- Production losses
- Production costing
- Reports and dashboard
- Tasks and notifications

Production AI capabilities:

- Risk center
- Delay prediction
- Material bottlenecks
- Capacity optimization
- Schedule optimization
- What-if simulation
- BOM variance analysis
- Downtime impact
- Cost risk
- Draft actions

AI boundary:

Production AI can analyze, recommend, and create drafts. It must not automatically change schedules, consume inventory, close production orders, or approve orders.

## 7.8 Maintenance Module

Purpose: CMMS/EAM-style asset and maintenance management.

Implemented areas:

- Machine/asset registry
- Capability configuration
- Maintenance rules/types
- Preventive maintenance plans
- Breakdown work orders
- Emergency post-review flow
- Runtime-aware maintenance logic
- Risk-based approvals
- Spare part mapping
- Spare reservation
- Spare usage/consumption history
- Downtime tracking
- Scheduling conflict checks
- Shutdown windows
- Technician/team/vendor assignment
- Work order attachments
- Machine documents
- Machine history and lifecycle
- Maintenance costing
- Tasks and notifications
- Reports and dashboard
- MTTR/MTBF
- Machine health score

Maintenance AI capabilities:

- Risk center
- Failure prediction
- Downtime prediction
- Spare prediction
- Health score
- Root cause
- Cost impact
- Recommendations
- Draft action

AI boundary:

Maintenance AI must not close work orders, approve maintenance, consume spares, change production schedules, or release unavailable machines automatically.

## 7.9 Quality Module

Purpose: QMS-style inspection, defect, quarantine, CAPA, and quality-cost control.

Implemented areas:

- Quality plans
- Checklists
- Sampling rules
- Inspection lots
- Inspection execution
- Defects
- Quarantine
- Rework
- Rejection
- Scrap
- CAPA
- Supplier quality metrics
- Production quality metrics
- Customer return quality reports
- Cost of poor quality
- Quality tasks and notifications
- Dashboard, reports, and KPIs

Quality AI capabilities:

- Risk center
- Defect prediction
- Trends
- Supplier risk
- Production risk
- Root cause
- Cost risk
- Draft action

AI boundary:

Quality AI must not approve releases, scrap inventory, release quarantine, close CAPA, reject suppliers, or dispatch affected goods automatically.

## 7.10 Sales & Distribution Module

Purpose: manages customer sales, reservations, dispatch, shipment, returns, and revenue-side intelligence.

Implemented areas:

- Customer master
- Customer hierarchy
- Regions
- Territories
- Plant representatives
- Sales orders and items
- Finished goods availability
- Customer reservations
- Protected allocation rules
- Partial allocation
- Dispatch orders
- FEFO/FIFO pick list
- Shipment tracking
- Customer returns
- Credit profile structure
- Tasks and notifications
- Dashboard, reports, and KPIs

Sales AI capabilities:

- Risk center
- Demand forecast
- Order risk
- Allocation recommendation
- Regional demand
- Expiry-aware sales
- Customer profitability
- Dispatch optimization
- Returns analysis
- Draft action

AI boundary:

Sales AI must not confirm orders, reassign protected inventory, dispatch goods, approve returns, issue credit, or change pricing automatically.

## 7.11 Customer Portal Module

Purpose: external customer-facing backend for order visibility, shipments, documents, support, returns, and AI-assisted support.

Implemented areas:

- Customer portal login/refresh structure
- Portal user invitations
- Disable flow
- Restricted profile view
- Profile update requests
- Customer-owned order tracking
- Customer-owned shipment tracking
- Secure document listing/download token generation
- Support requests
- Comments and attachments
- Return requests
- Notifications
- Reports
- Feedback
- Audit logs
- Strict customer-level filtering

Customer Portal AI capabilities:

- Risk center
- Order risk
- Support classification
- Return risk
- Document risk
- Satisfaction risk
- Draft action

AI boundary:

Customer Portal AI must not approve returns, issue credit, cancel orders, promise delivery dates, leak internal information, or send external emails without approval.

## 7.12 Supplier Portal Module

Purpose: external supplier-facing backend for PO visibility, delivery confirmations, ASN, documents, certificates, CAPA, messages, and supplier performance.

Implemented areas:

- Supplier portal login/refresh structure
- Company-level enablement modes
- Supplier portal RBAC
- Supplier user invitations/updates/disable flow
- Supplier profile and update requests
- Supplier-owned purchase order list/detail
- PO acknowledgement
- Delivery confirmations
- Advance shipment notices
- Document uploads
- Certificate uploads and expiry tracking
- Messages
- CAPA responses
- Notifications
- Supplier performance visibility
- Supplier task queue
- Supplier reports
- Supplier audit logs
- Strict supplier-level filtering

Supplier Portal AI capabilities:

- Risk center
- Delivery risk
- Document risk
- Certificate expiry
- Supplier quality risk
- PO acknowledgement risk
- Message summary
- Draft action

AI boundary:

Supplier Portal AI must not approve suppliers/certificates, change purchase orders, accept delivery dates, send purchase orders, commit financial actions, or replace suppliers automatically.

## 7.13 Reporting & Analytics Module

Purpose: BI-style reporting, dashboards, KPI snapshots, analytics, exports, schedules, and report AI.

Implemented areas:

- Reporting feature flags
- Standard report catalog
- Scoped report execution
- CSV export
- Excel/PDF-ready export responses
- Saved reports
- Scheduled reports
- Dashboards
- Dashboard widgets
- KPI definitions
- KPI snapshot calculation
- Trend analytics
- Cross-module analytics
- Action insights

Reporting AI capabilities:

- Risk center
- Executive summary
- Root cause
- Anomaly detection
- KPI insights
- Report narrative
- Draft action

AI boundary:

Reporting AI must not approve decisions, change source data, send external emails without approval, modify financial records, release inventory, or dispatch goods.

## 7.14 Costing & Profitability Module

Purpose: cost intelligence across inventory, landed cost, production, maintenance, quality, allocation, variance, profitability, and cost AI.

Implemented areas:

- Cost centers
- Cost elements
- Inventory valuation
- Landed cost
- Production costing
- Maintenance costing
- Quality costing
- Allocation rules
- Standard costs
- Standard cost approval
- Variance analysis
- Product profitability
- Customer profitability
- Plant profitability
- Costing reports
- Dashboard cards

Costing AI capabilities:

- Risk center
- Cost increase analysis
- Low-margin products
- Customer profitability risk
- Wastage cost risk
- Production variance
- Supplier cost risk
- Cost optimization
- Draft action

AI boundary:

Costing AI must not change prices, supplier contracts, cost allocations, inventory write-offs, standard costs, or financial records automatically.

## 7.15 Mobile Operations Module

Purpose: shop-floor/mobile backend for operators, approvals, scanning, offline sync, and mobile AI assistance.

Implemented areas:

- Mobile login/refresh/logout
- Device registration/disable
- My-work dashboard
- Tasks
- Approvals
- Scan resolver
- Inventory receipts
- Inventory transfers
- Inventory counts
- Warehouse movements
- Production order updates
- Maintenance work orders
- Quality inspections
- Dispatch pick lists
- Dispatch confirmation
- Uploads
- Offline sync push/pull/status
- Conflict tracking
- Audit logs
- Notifications

Mobile AI capabilities:

- Risk center
- Scan validation
- Count assist
- Maintenance assist
- Quality assist
- Suggested next action
- Draft action

AI boundary:

Mobile AI must not approve critical actions, release inventory, close critical work orders, dispatch goods, override reservations, or write off inventory automatically.

## 7.16 Integrations Module

Purpose: API/file/webhook/email/IoT integration foundation for external systems such as ERP, SAP, supplier systems, customer systems, email, and machine data sources.

Implemented areas:

- Integration enablement
- Provider registry
- Company configs
- Masked credential storage
- Webhooks
- Inbound provider events
- Idempotency
- Sync jobs
- Mappings
- File import/export
- Error and retry tracking
- Monitoring
- Reports
- Email hooks
- Machine/IoT hooks

Integrations AI capabilities:

- Risk center
- Data quality analysis
- Sync failure analysis
- Anomaly detection
- Mapping suggestions
- Draft action

AI boundary:

Integrations AI must not commit high-risk imports, change credentials, send external data without approval, modify financial records, delete records, or override tenant security.

## 7.17 Manufacturing Intelligence Module

Purpose: future command-center backend that connects risks across modules and explains business impact.

Implemented/defined areas:

- Command center
- Cross-module risks
- Impact graph
- Root cause analysis
- What-if simulation
- Bottlenecks
- Health scores
- Plant health score
- Customer impact
- Cost impact
- Recommendations
- Draft actions
- Executive summaries

AI boundary:

Manufacturing Intelligence can analyze, simulate, recommend, explain, and create draft actions. It must not approve purchase orders, transfer inventory, change production schedules, release quarantine, dispatch goods, send external email without approval, write off inventory, change pricing, or modify financial records automatically.

## 8. AI Governance Model

Across all AI features, the system follows a consistent safety rule:

AI can:

- Analyze risks
- Generate insights
- Predict likely problems
- Recommend actions
- Create draft tasks/actions/messages
- Support human decision-making

AI cannot:

- Approve critical transactions
- Modify financial records
- Change production schedules automatically
- Move, consume, release, scrap, or write off inventory automatically
- Dispatch goods automatically
- Send external emails without approval
- Override tenant/company security
- Replace admin/manager approval workflows

This is the correct model for manufacturing because the AI layer should be decision-support and workflow-drafting first, not autonomous execution.

## 9. Data and Persistence

The repository includes SQLAlchemy models, Alembic migration scaffolding, and PostgreSQL-ready configuration. The README also states that the current version uses in-memory sample data so modules can run immediately without database setup.

Recommended production data strategy:

- PostgreSQL as system of record
- Tenant/company/plant columns on all business tables
- Row-level access enforced in services and queries
- Audit logs for every critical mutation
- Immutable ledgers for inventory, costing, and approvals
- File storage abstraction for documents/certificates/uploads
- Background jobs for reports, alerts, and AI scans

## 10. Local Run Guide

### 10.1 Main API

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Open:

```text
http://localhost:8000/health
http://localhost:8000/docs
http://localhost:8000/modules
```

### 10.2 Inventory AI Service

```bash
cd inventory-ai-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8100
```

Open:

```text
http://127.0.0.1:8100/docs
```

### 10.3 Docker Compose

```bash
docker compose up --build
```

### 10.4 Alembic Migration

After setting `DATABASE_URL`:

```bash
alembic upgrade head
```

## 11. Current Strengths

- Broad module coverage for Metam Services
- FastAPI backend is runnable locally
- Modular-monolith structure is suitable for early-stage development
- Many modules already have typed routes/schemas/services/repositories/models
- Clear AI safety boundary: recommendation-only and draft-only
- Separate Inventory AI service allows future independent scaling
- Docker, PostgreSQL, Redis, Celery, and Alembic are already scaffolded
- External Customer and Supplier Portals are separated from internal modules
- Reporting, costing, mobile, integrations, and command-center concepts are included

## 12. Current Gaps and Risks

### 12.1 Warehouse and Procurement Still Need Dedicated Depth

Warehouse and Procurement are still generic compared with Production, Maintenance, Quality, Sales, Customer Portal, Supplier Portal, Reporting, Costing, Mobile, Integrations, and Manufacturing Intelligence.

### 12.2 Demo Security Must Be Hardened

The JWT secret is currently hardcoded for local/demo use. Production must use environment variables and secret management.

### 12.3 In-Memory Sample Data Is Not Production-Ready

The current version runs immediately with sample/in-memory data. Production requires real database-backed persistence and migration discipline.

### 12.4 RBAC Must Be Enforced Everywhere

The foundation contains roles/permissions, but every endpoint should enforce tenant/company/plant/module permissions consistently.

### 12.5 AI Is Rule-Based Today

The AI capabilities are currently rule-based/draft-oriented. A future LLM/copilot integration can be added through the AI provider interface, but business-critical actions should remain approval-gated.

## 13. Recommended Next Development Sequence

1. Finalize platform access model
   - Super admin
   - Company admin
   - Plant admin
   - Department manager
   - Operator
   - Customer portal user
   - Supplier portal user

2. Complete Warehouse dedicated module
   - Models, schemas, repository, service, router
   - Bin, zone, movement, pick/pack, count, replenishment, occupancy

3. Complete Procurement dedicated module
   - PR, RFQ, quotation comparison, PO, approval, inbound delivery, supplier performance

4. Harden security
   - Environment secrets
   - Password hashing enforcement
   - Token refresh
   - Endpoint-level permission guards

5. Replace demo/in-memory flows with database-backed services

6. Add full test coverage
   - Unit tests for services
   - API tests for routers
   - RBAC tests
   - Tenant isolation tests
   - AI boundary tests

7. Build frontend/admin portal
   - Super-admin module enablement
   - Company admin user/data integration setup
   - Dashboard access control
   - Data sync monitoring

8. Add production integration adapters
   - ERP/SAP
   - CSV/Excel import
   - Webhooks
   - Machine/IoT signals
   - Email ingestion

9. Add observability
   - Structured logs
   - Request tracing
   - Job monitoring
   - Error dashboards

10. Prepare deployment
   - Docker hardening
   - CI pipeline
   - Environment-specific config
   - Database migrations
   - Backup/restore plan

## 14. Suggested Documentation Files To Add Next

- `docs/API_REFERENCE.md`
- `docs/RBAC_AND_TENANCY.md`
- `docs/DATABASE_SCHEMA.md`
- `docs/AI_GOVERNANCE.md`
- `docs/MODULE_ROADMAP.md`
- `docs/DEPLOYMENT_GUIDE.md`
- `docs/FRONTEND_REQUIREMENTS.md`
- `docs/ADMIN_PORTAL_REQUIREMENTS.md`
- `docs/INTEGRATION_STRATEGY.md`
- `docs/TESTING_STRATEGY.md`

## 15. Final Notes

This repository is a strong backend foundation for the AI-assisted Metam Services platform. The immediate priority should not be adding more modules. The priority should be making the existing modules production-grade by completing Warehouse/Procurement depth, enforcing RBAC, moving demo data to real persistence, adding tests, and documenting API/data contracts clearly.
