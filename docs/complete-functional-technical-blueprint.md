# Metam Services - Complete Functional Specification and Technical Blueprint

Review date: 2026-06-29  
Application name: Metam Services  
Repository path: `C:\Users\vinod\metam-services`  
GitHub repository: `vinodreddy1999/manufacturing-operations-platform`  
Frontend URL: `http://localhost:8080`  
Backend/API URL: `http://localhost:8000`  
pgAdmin URL: `http://localhost:5050`  

This document explains the application as if the reader has never seen it before. It covers what the platform does, who can use it, what each role can see, how navigation works, which frontend screens exist, which backend APIs exist, what data is stored, where gaps remain, and how the system is deployed.

## 1. Plain-English Product Overview

Metam Services is a multi-tenant manufacturing operations platform.

In simple terms:

- A tenant is the top-level customer/account using the system.
- A client/company is a business inside the tenant.
- A module is a business capability such as Inventory, Planning, Production, Maintenance, Quality, Procurement, Sales, or Reporting.
- A role controls what a person can see or do.
- A permission is a smaller rule inside a role, such as `data.write` or `audit.read`.
- A platform user can be assigned to a company, applications, and modules.

The goal of the application is to let manufacturing organizations manage operational data, access control, modules, business impact, AI readiness, DataHub integrations, and module-specific work from one platform.

## 2. System Architecture

```mermaid
flowchart TD
    U["User in browser"] --> F["React frontend on port 8080"]
    F --> A["FastAPI backend on port 8000"]
    A --> DB["PostgreSQL database"]
    A --> R["Redis"]
    W["Celery worker"] --> R
    W --> DB
    N["Nginx on port 80"] --> F
    S["Seed enterprise data job"] --> A
    PG["pgAdmin on port 5050"] --> DB
```

### Runtime Services

Docker Compose defines:

| Service | Purpose | Port |
|---|---|---:|
| `postgres` | Main database | 5432 |
| `redis` | Queue/broker/cache support | 6379 |
| `pgadmin` | Browser-based database admin | 5050 |
| `platform-api` | FastAPI backend only | 8000 |
| `fullstack-app` | Combined backend/frontend app | 8080 |
| `frontend` | Standalone frontend image | 8081 |
| `worker` | Celery background worker | internal |
| `seed-enterprise-data` | One-time demo data seed | internal |
| `nginx` | Reverse proxy | 80 |

Network: `metam-network` bridge network.  
Database URL inside containers: `postgresql+psycopg2://metam:metam@postgres:5432/metam`.

## 3. Source Code Structure

### Backend

| Folder/File | Purpose |
|---|---|
| `app/main.py` | Main FastAPI application, root routes, health, module registration |
| `app/database.py` | SQLAlchemy database engine and session |
| `app/security.py` | Password hashing/token security helpers |
| `app/runtime_router.py` | Runtime login, users, records, analytics, audit APIs |
| `app/core_router.py` | Core companies, plants, departments, roles, feature flags, tasks, approvals, documents |
| `app/auth_router.py` | Additional auth refresh/db-login route |
| `app/platform_models.py` | Core platform database tables |
| `app/platform_schemas.py` | Core Pydantic request schemas |
| `app/platform_seed.py` | Seed data helpers |
| `app/jobs.py` | Celery worker setup |
| `app/modules/*` | Module-specific backend routers, models, services, repositories, schemas |

### Frontend

| Folder/File | Purpose |
|---|---|
| `frontend/src/app/App.tsx` | Main React app, login, layout, routing, protected routes |
| `frontend/src/services/api.ts` | Axios API client and frontend/backend API contract |
| `frontend/src/lib/rbac.ts` | Frontend role-based access control |
| `frontend/src/platform/*` | Platform demo state, client/user/module model, platform context |
| `frontend/src/components/*` | Reusable components such as panels, tables, badges, platform workspace |
| `frontend/src/pages/*` | Full application pages |
| `frontend/src/inventory/data.ts` | Inventory demo data |
| `frontend/src/planning/data.ts` | Planning demo data |
| `frontend/src/warehouse/data.ts` | Warehouse demo data |
| `frontend/src/production/data.ts` | Production demo data |
| `frontend/src/maintenance/data.ts` | Maintenance demo data |
| `frontend/src/impact/*` | Business impact dashboards and calculations |

## 4. Authentication and Session Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant DB

    User->>Frontend: Enters email and password
    Frontend->>Backend: POST /runtime/auth/login
    Backend->>DB: Finds user and verifies password hash
    Backend-->>Frontend: access_token + user profile
    Frontend->>Frontend: Stores token in localStorage
    Frontend->>Backend: GET /runtime/auth/me with Bearer token
    Backend-->>Frontend: Current user and permissions
    Frontend->>Frontend: Builds allowed navigation
```

Frontend token storage key: `metam.runtime.token`.

Login payload:

```json
{
  "email": "super@metam.local",
  "password": "SuperAdmin123!"
}
```

Login response envelope:

```json
{
  "action": "login",
  "message": "Login successful",
  "data": {
    "access_token": "jwt-token",
    "token_type": "bearer",
    "user": {
      "id": "user-id",
      "tenant_id": "tenant-demo-001",
      "company_id": null,
      "plant_id": null,
      "email": "super@metam.local",
      "name": "Metam Administrator",
      "role": "super_admin",
      "is_active": true,
      "permissions": ["platform.super_admin", "data.write", "audit.read"]
    }
  }
}
```

Failure states:

- Wrong password: backend rejects login.
- Missing token: frontend shows login screen.
- Invalid/expired token: frontend shows login screen.
- Disabled user: user should not proceed; backend has `is_active`.

## 5. Roles and Permissions

### Runtime Roles

The backend supports:

- `super_admin`
- `account_owner`
- `organization_admin`
- `team_manager`
- `supervisor`
- `operator`
- `auditor`
- `qa_tester`
- `custom`
- `admin`
- `user`

### Frontend Section Access

| Role | Dashboard | Admin | Data Hub | Operations | Intelligence |
|---|---:|---:|---:|---:|---:|
| super_admin | Yes | Yes | Yes | Yes | Yes |
| account_owner | Yes | Yes | Yes | Yes | Yes |
| organization_admin | Yes | Yes | Yes | Yes | Yes |
| admin | Yes | Yes | Yes | Yes | Yes |
| team_manager | Yes | No | No | Yes | Yes |
| supervisor | Yes | No | No | Yes | Yes |
| auditor | Yes | No | No | Yes | Yes |
| qa_tester | Yes | No | No | Yes | Yes |
| operator | Yes | No | No | Yes | No |
| custom | Yes | No | No | Yes | No |
| user | Yes | No | No | Yes | No |

### Key Permission Helpers

| Helper | Rule | Meaning |
|---|---|---|
| `canAccessSection` | role must include section | Controls sidebar navigation |
| `canCreateCompanies` | `super_admin`, `account_owner` | Only top-level roles can create companies |
| `canWriteOperationalData` | user has `data.write` | Enables create/edit/delete runtime records |
| `canReadAuditLogs` | user has `audit.read` | Allows audit visibility |
| `canEditExecutiveMetrics` | `admin`, `super_admin` | Allows AI readiness/footprint edit |
| `canUseDataHubUploads` | `admin`, `super_admin` | Allows DataHub upload box |

## 6. Navigation Map

### Main Frontend Routes

| URL | Screen | Protection |
|---|---|---|
| `/` | Platform dashboard or company dashboard | logged in |
| `/platform` | Platform dashboard | platform-only |
| `/platform/modules/:moduleName` | Platform module allocation detail | platform-only |
| `/platform/widgets` | Redirects to module workspace | platform-only |
| `/admin` | Redirects to `/admin/company` | admin role |
| `/admin/company` | Admin company profile | admin role |
| `/admin/roles` | Admin roles | admin role |
| `/admin/access` | Admin dashboard/access control | admin role |
| `/admin/modules` | Admin modules | admin role |
| `/admin/dashboards` | Admin dashboards | admin role |
| `/admin/data-scope` | Admin data scope | admin role |
| `/admin/audit` | Admin audit | admin role |
| `/admin/business-impact` | Admin business impact | admin role |
| `/admin/recommendations` | Admin recommendations | admin role |
| `/admin/settings` | Admin settings | admin role |
| `/admin/clients*` | Redirects to `/platform?workspace=clients` | platform-only flow |
| `/admin/users*` | Redirects to `/platform?workspace=users` | platform-only flow |
| `/data-hub` | DataHub | data-hub role |
| `/operations` | Operations overview | operations role |
| `/intelligence` | Intelligence page | intelligence role |
| `/planning/*` | Planning module | operations + module assignment |
| `/inventory/*` | Inventory module | operations + module assignment |
| `/warehouse/*` | Warehouse module | operations + module assignment |
| `/production/*` | Production module | operations + module assignment |
| `/maintenance/*` | Maintenance module | operations + module assignment |
| `/quality` | Generic backend module workspace | operations + module assignment |
| `/procurement` | Generic backend module workspace | operations + module assignment |
| `/sales` | Generic backend module workspace | operations + module assignment |
| `/costing` | Generic backend module workspace | operations + module assignment |
| `/compliance` | Generic backend module workspace | operations + module assignment |
| `/customer-portal` | Generic backend module workspace | operations + module assignment |
| `/supplier-portal` | Generic backend module workspace | operations + module assignment |
| `/reports` | Business Impact Dashboard | operations |
| `/documents` | Generic backend module workspace | operations |
| `/impact/:module/:metric` | Business impact drilldown | operations |

## 7. Role-Wise User Journeys

### 7.1 Super Admin

Purpose: Supreme platform owner. Sees all clients, users, modules, subscriptions, integrations, audit, and impact.

Login journey:

1. Open `http://localhost:8080`.
2. Login with Super Admin credentials.
3. Backend validates `/runtime/auth/login`.
4. Frontend loads `/runtime/auth/me`.
5. Platform context allows `Platform View`.
6. Sidebar shows `Platform` and `Admin`.
7. Top-left selector defaults to Platform View.

What Super Admin can access:

- Platform View
- Platform Management Services
- Admin center
- All clients
- All users
- All modules
- Module health
- Subscription health
- Integration health
- Audit activity
- Business impact
- DataHub if navigating through full access
- Operations and intelligence

What Super Admin cannot access:

- No intentional functional restriction found except route/module checks still apply.

Important clicks:

| Click | What Happens | Backend/API | State/Table Affected |
|---|---|---|---|
| Client selector -> Platform View | Switches to platform context | none directly | frontend platform state |
| Platform card -> Clients | Opens embedded clients workspace | none directly | frontend platform state |
| Add Client | Opens create client drawer | none currently for platform workspace | platform state/local storage; expected future DB |
| Create Client | Validates name, applications, modules, reason; creates client; audit log added | none currently for platform workspace | platform state/local storage |
| Edit Client | Opens drawer with profile, market, apps, modules, users | none currently | platform state/local storage |
| Save Client | Updates client and reassigned users; writes audit | none currently | platform state/local storage |
| Disable Client | Requires reason, toggles status to Suspended | none currently | platform state/local storage |
| Users tab | Shows user management | none currently | platform state/local storage |
| Edit User | Updates client, roles, modules, applications, status | none currently | platform state/local storage |
| Modules tab | Shows module allocation and health | none currently | platform state/local storage |
| Audit tab | Filters local platform audit | none currently | platform audit state |

Validation rules:

- Client name required.
- Client name unique.
- Assignment reason required.
- At least one application required.
- At least one module required.
- Region changes available markets.
- Market auto-fills currency/timezone.

States:

- Loading: session loading state.
- Empty: filtered tables can show zero count.
- Permission denied: non-platform user trying `/platform` receives access denied.
- Success: update notice/audit entry.
- Failure: form validation error message.

### 7.2 Admin / Company Admin

Purpose: Company-scoped administrator.

What Admin can access:

- Company Dashboard
- Admin center
- Data Hub
- Operations
- Intelligence
- Modules assigned to their company and user

What Admin cannot access:

- Other companies' data.
- Platform-wide client creation unless role is elevated.
- Modules disabled for the selected company.
- Modules not assigned to the platform user.

Important clicks:

| Click | What Happens | Backend/API | Tables/State |
|---|---|---|---|
| Admin -> Company | Shows company profile/access summary | mostly frontend platform context | platform state |
| Admin -> Modules | Shows module usage and company enablement | `/feature-flags` may be used in admin sections | `feature_flags` |
| Data Hub -> Upload | Allows drag/drop/manual upload for Admin/Super Admin | `POST /manufacturing-data-hub/uploads` | `manufacturing_data_connections`, catalog/upload metadata |
| Data Hub -> Add Cloud Source | Saves provider/resource/auth metadata | `POST /manufacturing-data-hub/cloud-sources` | upload/source metadata |
| Module nav item | Opens only if client/module/user assignment allows it | none before page load | frontend route guard |

### 7.3 Managers

Manager-like roles include:

- `team_manager`
- Planning Manager
- Inventory Manager
- Warehouse Manager
- Production Manager
- Maintenance Manager
- Quality Manager
- Procurement Manager
- Sales Manager
- Finance Manager

What managers can access:

- Dashboard.
- Operations.
- Intelligence if runtime role allows it.
- Assigned modules only.

What managers cannot access:

- Admin.
- DataHub.
- Platform management.
- Other client/company data.
- Unassigned modules.

Expected work behavior:

- Managers should review records, risks, approvals, reports, and module dashboards.
- Backend has tasks/approvals/notifications.
- The frontend does not yet provide a central "Manager Inbox".

### 7.4 Operators / Technicians / Users

What they can access:

- Dashboard.
- Operations.
- Assigned modules.
- Read-only or limited write based on permissions.

What they cannot access:

- Admin.
- DataHub.
- Platform View.
- Intelligence if role is `operator`, `custom`, or `user`.
- Runtime record create/edit/delete unless `data.write` exists.

Generic module behavior:

- If they have no write permission, create buttons become read-only or disabled.
- Backend records may display but cannot be mutated.

### 7.5 Auditor

What Auditor can access:

- Dashboard.
- Operations.
- Intelligence.
- Audit data if `audit.read` exists.

What Auditor cannot access:

- Admin/DataHub unless explicitly promoted.
- Write operations unless `data.write` exists.

### 7.6 QA Tester

What QA Tester can access:

- Dashboard.
- Operations.
- Intelligence.
- Quality-related backend permissions may include quality write plus data read.

Gap:

- Quality backend is rich, but frontend currently uses generic module workspace rather than a dedicated QA cockpit.

## 8. Platform Management Services Functional Spec

Platform Management Services is embedded inside the platform page. It is not a separate page.

Tabs:

- Clients
- Markets
- Users
- Modules
- Subscriptions
- Integrations
- Audit
- Business Impact

### Clients Tab

Purpose: Create, view, edit, enable, and disable clients.

Controls:

- Search client name or ID.
- Region dropdown.
- Status dropdown.
- Add Client button.
- Reason for enable/disable input.
- View button.
- Edit button.
- Enable/Disable button.

Click behavior:

- Search: filters client table locally.
- Region/status filter: narrows visible client rows.
- Add Client: opens drawer.
- View: opens client detail drawer.
- Edit: opens edit drawer.
- Enable/Disable: requires reason, changes status, creates audit entry.

### Create Client Drawer

Fields:

- Client Name
- Industry
- Region
- Market
- Currency
- Timezone
- Language
- Status
- Assigned Applications
- Assigned Modules
- Assignment Reason

Validation:

- Client name required.
- Client name must be unique.
- At least one application.
- At least one module.
- Business reason required.

### Users Tab

Purpose: Create and edit platform users.

Expected operations:

- Add user.
- Edit user.
- Assign client.
- Assign role(s).
- Assign applications.
- Assign modules.
- Enable/disable user.
- Record audit reason.

### Modules Tab

Purpose: See and manage module availability and assignment.

Expected operations:

- Search module.
- Filter by availability.
- Filter by health status.
- Filter by client.
- View module allocation.
- Add/remove clients.
- Add/remove users.
- Record audit reason.

### Subscriptions Tab

Purpose: Manage commercial/service access per client.

Expected operations:

- View client subscription.
- Edit plan.
- Edit cycle.
- Edit renewal dates/limits/status.
- Audit changes.

### Audit Tab

Purpose: Show who changed what and why.

Filters:

- Client.
- Module.
- Action.
- Search text.

## 9. Admin Center Functional Spec

Admin section routes:

- Company
- Roles
- Access
- Modules
- Dashboards
- Data Scope
- Audit
- Business Impact
- Recommendations
- Settings

Admin pages use company context. Super Admin can open platform workspace from company admin where relevant.

Common states:

- Loading: React suspense/loading components.
- Permission denied: `AccessDeniedState`.
- Empty: table/card empty states.
- Error: API failures use `ErrorState` on data-backed pages.

## 10. DataHub Functional Spec

Purpose: Connect business systems and upload operational data.

Frontend API calls:

| Action | API |
|---|---|
| Data quality | `GET /manufacturing-data-hub/data-quality` |
| AI readiness | `GET /manufacturing-data-hub/ai-readiness` |
| Update AI readiness | `PUT /manufacturing-data-hub/ai-readiness` |
| Connected systems | `GET /manufacturing-data-hub/connected-systems` |
| Create connected system | `POST /manufacturing-data-hub/connected-systems` |
| Update connected system | `PUT /manufacturing-data-hub/connected-systems/{id}` |
| Delete connected system | `DELETE /manufacturing-data-hub/connected-systems/{id}` |
| Data catalog | `GET /manufacturing-data-hub/catalog` |
| Create catalog entry | `POST /manufacturing-data-hub/catalog` |
| Update catalog entry | `PUT /manufacturing-data-hub/catalog/{id}` |
| Delete catalog entry | `DELETE /manufacturing-data-hub/catalog/{id}` |
| Data mappings | `GET /manufacturing-data-hub/mappings` |
| Upload file | `POST /manufacturing-data-hub/uploads` |
| Add cloud source | `POST /manufacturing-data-hub/cloud-sources` |

Supported upload/source direction:

- ERP exports.
- SAP files.
- Excel sheets.
- Google Sheets-like sources.
- Table/data formats.
- Google Drive/OneDrive-style cloud source metadata.

Current gap:

- The UI captures source details, but deep OAuth/authentication flows per provider are not yet fully implemented.

## 11. Dedicated Module Specifications

### 11.1 Planning

Purpose: Turn demand into feasible plans across inventory, production, capacity, materials, workforce, procurement, and maintenance.

Frontend sections:

- Planning Dashboard
- Demand Planning
- Inventory Planning
- Production Planning
- Capacity Planning
- Material Planning
- Procurement Planning
- Workforce Planning
- Maintenance Planning
- Scenario Planning
- Planning Approvals
- Planning Reports
- Planning Audit

Common controls:

- Sidebar section links.
- Search field.
- Status filter.
- Clear button.
- Create button.
- Drawer form.
- Tables.
- Charts.
- Impact cards.

Business journey:

1. Company Admin opens Planning.
2. Dashboard shows demand, planned production, material shortages, coverage, capacity, workforce, risks, and accuracy.
3. User clicks a card or sidebar item.
4. Section table opens.
5. User searches/filter rows.
6. User clicks create to draft a new plan item.
7. Approvals and audit track governance.

Backend linkage:

- Planning page is currently frontend demo-data driven.
- Related backend concepts exist through tasks, approvals, procurement, production, inventory, maintenance, and runtime records.
- Full planning-specific DB persistence is a future gap.

### 11.2 Inventory

Purpose: Manage what stock exists, where it exists, its availability, valuation, movement, traceability, and risks.

Frontend sections:

- Inventory Dashboard
- Inventory Overview
- Goods Receipts
- Goods Issues
- Stock Transfers
- Inventory Adjustments
- Cycle Counts
- Physical Inventory
- Inventory Aging
- Dead Stock
- Slow Moving Stock
- Reorder Management
- Lot Management
- Serial Tracking
- Inventory Valuation
- Inventory Audit
- Inventory Reports

Backend APIs:

- `GET /inventory/dashboard`
- `GET /inventory/items`
- `GET /inventory/items/by-category`
- `GET /inventory/tracking-types`
- `GET /inventory/balances`
- `GET /inventory/locations`
- `GET /inventory/warehouse-map`
- `GET /inventory/batches`
- `GET /inventory/status`
- `GET /inventory/reservations`
- `POST /inventory/reservations`
- `GET /inventory/movement-ledger`
- `POST /inventory/movements`
- `GET /inventory/stock-counts`
- `POST /inventory/stock-counts`
- `GET /inventory/expiry-aging`
- `GET /inventory/procurement-recommendations`
- `GET /inventory/supplier-links`
- `GET /inventory/costs`
- `GET /inventory/reports`
- `POST /inventory/mobile/scan`

Current frontend state:

- Dedicated and rich.
- Uses seeded frontend inventory data for many screens.
- Also frontend API client can call `GET /inventory/dashboard`.

Gap:

- The full dedicated Inventory UI and backend inventory APIs need one unified source of truth.

### 11.3 Warehouse

Purpose: Manage physical warehouse execution: receiving, putaway, bins, picking, packing, dispatch, movement, cycle counts, utilization, and labor.

Frontend sections:

- Warehouse Dashboard
- Receiving
- Putaway
- Bin Management
- Picking
- Packing
- Dispatch
- Internal Movements
- Cycle Counts
- Warehouse Utilization
- Warehouse Labor
- Warehouse Reports
- Warehouse Audit

Current frontend state:

- Dedicated and rich.
- Uses seeded frontend warehouse data.

Gap:

- Needs full backend persistence and task assignment workflow.

### 11.4 Production

Purpose: Manage manufacturing execution: products, BOM, routing, orders, schedules, machines, material reservation, logs, downtime, OEE, yield, scrap, costing, AI risks.

Frontend sections:

- Production Dashboard
- Production Orders
- Production Schedule
- Work Orders
- Shift Management
- Production Lines
- Machine Monitoring
- Production Tracking
- Downtime Management
- OEE Dashboard
- Yield Analysis
- Scrap Analysis
- Production Reports
- Production Audit

Backend APIs include:

- Products CRUD.
- BOM CRUD and approval.
- Routing CRUD.
- Work centers.
- Lines.
- Machines.
- Orders CRUD.
- Material requirements and reservations.
- Time-aware plan.
- Schedules.
- Shifts.
- Logs.
- Material consumption.
- Downtime.
- Completion.
- WIP.
- Losses.
- Costing.
- Reports.
- Tasks.
- Notifications.
- Approval rules.
- AI risk/delay/material/capacity/schedule/cost/draft action endpoints.

Gap:

- UI is dedicated but largely seeded; not every backend production endpoint is wired to every frontend button.

### 11.5 Maintenance

Purpose: Manage assets, machines, maintenance plans, work orders, spares, downtime, shutdown windows, documents, logs, vendors, costs, health, tasks, notifications, and reports.

Frontend sections:

- Maintenance Dashboard
- Asset Register
- Asset Hierarchy
- Work Orders
- Preventive Maintenance
- Corrective Maintenance
- Breakdown Maintenance
- Maintenance Calendar
- Spare Parts
- Maintenance Cost
- Asset Health
- Maintenance Reports
- Maintenance Audit

Backend APIs include:

- Dashboard.
- Machines CRUD.
- Rules.
- Maintenance plans CRUD.
- Work orders CRUD.
- Work order assign/start/complete/close.
- Spare parts and reservations.
- Spare usage.
- Downtime events.
- Machine history.
- Shutdown windows.
- Attachments.
- Machine documents.
- Runtime logs.
- Vendors.
- Costing.
- Tasks.
- Notifications.
- Reports.

Gap:

- Dedicated frontend exists, but backend assignment/actions are not fully wired end to end.

## 12. Generic Module Workspace Specification

The following modules currently use the generic `ModuleWorkspacePage`:

- Quality
- Procurement
- Sales
- Costing
- Compliance
- Customer Portal
- Supplier Portal
- Documents

Generic screen capabilities:

- Loads backend records with `GET /runtime/records?module_key=<module>`.
- Shows fallback sample rows when backend has no data.
- Shows backend record count, open items, and feature count.
- Allows record creation if user has `data.write`.
- Allows status/quantity update if rows are backend rows and user can write.
- Allows delete if rows are backend rows and user can write.
- Shows a chart from record quantities.

Create record payload:

```json
{
  "tenant_id": "tenant-demo-001",
  "company_id": "company-c",
  "plant_id": "plant-north",
  "module_key": "quality",
  "record_type": "phase1_record",
  "record_code": "QUALITY-001",
  "name": "Incoming inspection",
  "status": "Open",
  "quantity": 10,
  "payload": {
    "owner": "admin",
    "source": "phase1_frontend"
  }
}
```

Gap:

- These modules have backend-specific APIs and database tables, but the frontend experience is not yet module-specific.

## 13. Backend API Catalogue

### Core Runtime APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/runtime/auth/login` | Login and receive token |
| GET | `/runtime/auth/me` | Current logged-in user |
| GET | `/runtime/users` | List runtime users |
| POST | `/runtime/users` | Create runtime user |
| PUT | `/runtime/users/{user_id}` | Update runtime user |
| GET | `/runtime/records` | List module records |
| POST | `/runtime/records` | Create module record |
| PUT | `/runtime/records/{record_id}` | Update module record |
| DELETE | `/runtime/records/{record_id}` | Delete module record |
| GET | `/runtime/inventory/items` | Runtime inventory items |
| GET | `/runtime/analytics/summary` | Runtime analytics summary |
| GET | `/runtime/audit-logs` | Runtime audit logs |

### Core Platform APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/modules` | Registered modules |
| POST | `/companies` | Create company |
| GET | `/companies` | List companies |
| POST | `/plants` | Create plant |
| GET | `/plants` | List plants |
| POST | `/departments` | Create department |
| GET | `/departments` | List departments |
| POST | `/users` | Create platform user |
| GET | `/users` | List platform users |
| POST | `/roles` | Create role |
| GET | `/roles` | List roles |
| POST | `/permissions` | Create permission |
| GET | `/permissions` | List permissions |
| POST | `/feature-flags` | Create/update feature flag |
| GET | `/feature-flags` | List feature flags |
| POST | `/feature-flags/{module_key}/enable` | Enable module |
| POST | `/feature-flags/{module_key}/disable` | Disable module |
| POST | `/tasks` | Create task |
| GET | `/tasks` | List tasks |
| POST | `/approvals/{approval_id}/decision` | Approve/reject decision |
| GET | `/approvals` | List approvals |
| POST | `/documents` | Add document |
| GET | `/documents` | List documents |
| GET | `/audit-logs` | List audit logs |

### Module API Groups

| Module | API Coverage |
|---|---|
| Inventory | Dashboard, items, balances, locations, warehouse map, batches, status, reservations, movements, stock counts, expiry, procurement recommendations, supplier links, costs, reports, mobile scan |
| Production | Products, BOM, routing, work centers, lines, machines, orders, schedules, shifts, logs, material consumption, downtime, completion, WIP, losses, costing, reports, tasks, notifications, AI endpoints |
| Maintenance | Machines, rules, plans, work orders, spare parts, reservations, downtime, history, shutdowns, attachments, documents, runtime logs, vendors, costing, tasks, notifications, reports |
| Quality | Plans, checklists, sampling rules, inspection lots, start/submit/approve/reject, defects, quarantine/release, rework, rejections, scrap, CAPA, KPIs, reports, tasks, notifications |
| Sales | Customers, regions, territories, representatives, sales orders, submit/approve/reserve/dispatch/close, allocations, dispatch orders, shipments, returns, reports, KPIs, tasks, notifications |
| Costing | Cost centers, cost elements, inventory costing, landed cost, production cost, maintenance cost, quality cost, allocation rules, standard costs, variance, profitability, reports |
| Reporting | Report catalog, run/export, saved reports, schedules, dashboards, KPIs, analytics trends, cross-module insights, action insights |
| Integrations | Providers, configs, credentials, webhooks, inbound events, sync jobs, mappings, imports, exports, errors, monitoring, reports |
| Customer Portal | Login, users, profile, dashboard, orders, shipments, documents, support, returns, notifications, reports, feedback |
| Supplier Portal | Login, users, profile, dashboard, purchase orders, acknowledgements, delivery confirmations, ASN, documents, certificates, messages, CAPA, notifications, performance, tasks, reports |
| Mobile | Devices, sessions, work queue, scans, inventory, warehouse, production, maintenance, quality, dispatch, uploads, sync push/pull/status |
| Manufacturing Intelligence | Command center, risks, impact graph, root cause, what-if, bottlenecks, health score, customer impact, cost impact, recommendations, draft action |

## 14. Database Schema and Data Dictionary

### Core Platform Tables

| Table | Purpose | Key Fields |
|---|---|---|
| `companies` | Client/company master | `id`, `tenant_id`, `name`, `code`, `is_active`, `created_at` |
| `plants` | Plant master under company | `id`, `tenant_id`, `company_id`, `name`, `code`, `timezone`, `created_at` |
| `departments` | Department master | `id`, `tenant_id`, `company_id`, `plant_id`, `name`, `code` |
| `users` | Runtime/platform login users | `id`, `tenant_id`, `company_id`, `plant_id`, `email`, `name`, `password_hash`, `role`, `is_active` |
| `roles` | Role definitions | `id`, `tenant_id`, `company_id`, `name`, `permissions` |
| `permissions` | Permission dictionary | `id`, `key`, `description` |
| `feature_flags` | Company-module enablement | `id`, `tenant_id`, `company_id`, `module_key`, `enabled`, `rules` |
| `tasks` | Work/task records | `id`, `tenant_id`, `company_id`, `plant_id`, `title`, `status`, `assigned_to_id`, `payload`, `created_at` |
| `approvals` | Approval workflow records | `id`, `tenant_id`, `company_id`, `plant_id`, `entity_type`, `entity_id`, `status`, `requested_by_id`, `decided_by_id`, `reason` |
| `notifications` | User notifications | `id`, `tenant_id`, `company_id`, `plant_id`, `user_id`, `title`, `body`, `read` |
| `documents` | Attached documents | `id`, `tenant_id`, `company_id`, `plant_id`, `entity_type`, `entity_id`, `filename`, `url`, `metadata_json` |
| `audit_logs` | Backend audit history | `id`, `tenant_id`, `company_id`, `plant_id`, `actor_id`, `action`, `entity_type`, `entity_id`, `old_value`, `new_value`, `created_at` |
| `custom_fields` | Configurable fields | `id`, `entity_type`, `field_key`, `field_type`, `required` plus tenant/company/plant scope |
| `business_rules` | Configurable rules | `id`, `rule_key`, `module_key`, `expression`, `enabled` plus scope |
| `module_records` | Generic module runtime records | `id`, `module_key`, `record_type`, `record_code`, `name`, `status`, `quantity`, `payload`, `created_at` plus scope |
| `app_metadata` | General metadata storage | `id`, `category`, `record_key`, `name`, `payload`, `created_at` plus scope |

Important constraints/indexes:

- `companies`: unique `tenant_id + code`.
- `feature_flags`: unique `tenant_id + company_id + module_key`.
- `app_metadata`: unique `tenant_id + company_id + plant_id + category + record_key`.
- Many tenant/company/plant fields are indexed to support tenant isolation.

### Frontend Admin/DataHub Tables

| Table | Purpose |
|---|---|
| `platform_subscriptions` | Client subscription plan, status, enabled modules, usage limits |
| `dashboard_access_policies` | Dashboard access by company, roles, users, data scope |
| `data_scope_policies` | Plant/warehouse/line/department access by role |
| `workflow_definitions` | Workflow steps and triggers |
| `manufacturing_data_connections` | DataHub connected systems |
| `data_catalog_entries` | Data catalog records |
| `data_mapping_rules` | Source-to-target mapping rules |
| `pending_erp_updates` | Recommended ERP updates awaiting approval/export |
| `digital_twin_nodes` | Digital twin entities and telemetry |

### Production Tables

| Table | Purpose |
|---|---|
| `products` | Product master |
| `bom_headers`, `bom_versions`, `bom_items` | Bill of material structure |
| `routing_headers`, `routing_operations` | Manufacturing routing/process steps |
| `work_centers` | Work center capacity |
| `production_lines` | Production line master |
| `machines` | Production machine status/capacity |
| `production_orders` | Manufacturing orders |
| `production_schedules` | Scheduled execution windows |
| `material_requirements` | Required/available/short material |
| `material_reservations` | Reserved materials for orders |
| `material_consumption` | Actual material use |
| `production_logs` | Daily/shift production logs |
| `downtime_events` | Machine downtime |
| `wip_inventory` | Work-in-process inventory |
| `production_costing` | Production cost rollup |
| `production_variance` | Production variance records |

### Maintenance Tables

| Table | Purpose |
|---|---|
| `maintenance_machines` | Maintenance asset/machine master |
| `machine_capabilities` | Machine capabilities |
| `maintenance_plans` | Maintenance plan setup |
| `maintenance_rules` | Trigger/rule setup |
| `maintenance_work_orders` | Maintenance work orders |
| `spare_part_mappings` | Asset-to-spare mapping |
| `spare_part_usage` | Spare consumption |
| `maintenance_downtime_events` | Maintenance downtime |
| `shutdown_windows` | Planned shutdown windows |
| `maintenance_attachments` | Work order attachments |
| `machine_documents` | Machine documents |
| `machine_history` | Asset history |
| `machine_runtime_logs` | Runtime telemetry logs |
| `maintenance_costing` | Maintenance cost records |
| `machine_health_scores` | Asset health scores |
| `maintenance_recommendations` | Maintenance recommendations |

### Quality Tables

| Table | Purpose |
|---|---|
| `quality_plans` | Quality plan master |
| `quality_checklists`, `quality_checklist_items` | Inspection checklist setup |
| `sampling_rules` | Sampling rules |
| `inspection_lots` | Inspection lot records |
| `inspection_results` | Inspection measurement/result records |
| `defects` | Defect records |
| `quarantine_records` | Quarantine stock/process records |
| `rework_orders` | Rework actions |
| `rejections` | Rejected materials/products |
| `scrap_records` | Scrap records |
| `capa_records` | Corrective/preventive action records |
| `quality_recommendations` | Quality recommendations |

### Costing Tables

Costing includes cost centers, elements, inventory cost, purchase cost, landed cost, production cost, material/labor/machine/overhead cost, wastage, rework, scrap, maintenance cost, quality cost, logistics cost, allocation rules, standard/actual costs, variances, product/customer/plant profitability, AI risks, recommendations, reports, and snapshots.

### Sales Tables

Sales includes customers, hierarchy, regions, territories, plant representatives, sales orders/items, finished goods reservations, dispatch orders, shipments, returns, and recommendations.

### Reporting Tables

Reporting includes report catalog, columns, filters, saved reports, schedules, report runs/files/recipients, dashboard definitions/widgets, KPI definitions/snapshots, analytics snapshots, trend analysis, cross-module insights, action insights, AI risks, recommendations, executive summaries, and anomalies.

### Integration Tables

Integration tables cover providers, configs, credentials, webhooks, events, sync jobs/items, mappings, transform rules, file import/export jobs, error/retry logs, idempotency keys, email provider/template/delivery logs, machine integration configs, IoT events, AI risks, and recommendations.

### Portal and Mobile Tables

Customer portal, supplier portal, and mobile tables cover portal users/sessions, invitations, profile update requests, documents, notifications, audit logs, support/returns/CAPA, mobile devices, sessions, tokens, work queues, offline actions, sync batches/results, scans, uploads, conflicts, notifications, preferences, AI risks, and recommendations.

## 15. ER Diagram

```mermaid
erDiagram
    companies ||--o{ plants : owns
    companies ||--o{ users : has
    companies ||--o{ feature_flags : enables
    companies ||--o{ tasks : creates
    companies ||--o{ approvals : governs
    companies ||--o{ documents : stores
    companies ||--o{ audit_logs : records
    companies ||--o{ module_records : contains
    users ||--o{ tasks : assigned
    users ||--o{ audit_logs : performs
    products ||--o{ bom_headers : has
    bom_headers ||--o{ bom_versions : versions
    bom_versions ||--o{ bom_items : contains
    products ||--o{ production_orders : ordered
    production_orders ||--o{ material_requirements : requires
    production_orders ||--o{ material_reservations : reserves
    production_orders ||--o{ production_logs : logs
    production_orders ||--o{ production_costing : costs
    production_orders ||--o{ production_variance : variances
    maintenance_machines ||--o{ maintenance_work_orders : receives
    inspection_lots ||--o{ inspection_results : records
    sales_orders ||--o{ sales_order_items : contains
```

## 16. Work Allocation and Notification Blueprint

Current implemented pattern:

1. Super Admin assigns client, roles, applications, and modules to users.
2. Navigation is filtered by assignment.
3. Module pages show operational records and actions.
4. Backend has task, approval, notification tables and APIs.

Ideal end-to-end work allocation:

```mermaid
flowchart TD
    A["Manager creates work item"] --> B["Task record created"]
    B --> C["Assigned user gets notification"]
    C --> D["User opens My Work inbox"]
    D --> E["User starts/completes task"]
    E --> F["Manager receives completion notification"]
    F --> G["Manager approves/rejects"]
    G --> H["Audit log records full lifecycle"]
```

Gap:

- A central My Work inbox and notification UI is not yet fully implemented.

## 17. Validation, Error, Empty, Loading, and Permission States

| State | Current Handling |
|---|---|
| Loading session | "Checking secure session..." |
| Lazy route loading | `LoadingState` |
| API error | `ErrorState` where used |
| Empty table | `EmptyState`/table count patterns |
| Permission denied | `AccessDeniedState` |
| Missing module assignment | Module-specific "not enabled" panel |
| Create validation | Forms show error text where implemented |
| Write denied | Generic module create button becomes read-only |

## 18. Security Review

Strengths:

- Password hashes are stored, not plain passwords.
- JWT/Bearer token pattern exists.
- Frontend route protection exists.
- Backend permission concepts exist.
- Tenant/company/plant scoping exists on many tables.

Concerns:

- Some platform management actions are frontend-state based and should be persisted/authorized by backend.
- Frontend RBAC is not enough by itself; backend must enforce every sensitive write.
- Demo credentials are visible on login screen and should not be used in production.
- Cloud source credentials need secure encrypted storage.
- Audit logging should be enforced server-side for critical actions.

## 19. Performance and Scalability Review

Strengths:

- Postgres is used for persistent storage.
- Redis and Celery worker are available.
- Tenant/company indexes exist on many tables.
- Docker Compose separates database, API, worker, frontend, and proxy.

Concerns:

- Some frontend pages use seeded in-memory data, which does not scale to real operational volume.
- Generic runtime records can become too flexible without module-specific constraints.
- Tables with JSON payloads need indexing strategy if heavily queried.
- Long module tables need server-side pagination/filtering as data grows.

## 20. Missing Functionality and Technical Debt

### Missing Dedicated Frontend Screens

- Quality dedicated cockpit.
- Procurement dedicated cockpit.
- Sales & Distribution dedicated cockpit.
- Costing & Profitability dedicated cockpit.
- Compliance cockpit.
- Customer Portal UX.
- Supplier Portal UX.
- Document Management UX.
- Integration Hub operations console.
- Mobile UI.

### Missing Workflow Links

- Central My Work inbox.
- Notification panel.
- Manager approval lifecycle.
- Full assignment-to-completion workflow.
- Full audit for every click/action.

### Missing Backend-Frontend Wiring

- Dedicated Planning/Inventory/Warehouse/Production/Maintenance pages need deeper persistence to module APIs.
- Platform embedded workspace should persist to backend tables.
- DataHub cloud authentication needs real provider flows.
- AI recommendations need to be surfaced per module.

### UI/UX Inconsistencies

- Some modules have premium dedicated pages.
- Some modules still use generic backend record workspace.
- Some admin actions are summaries or placeholder-style.

### API Inconsistencies

- Some APIs return direct arrays/objects.
- Many newer APIs return envelope shape `{ action, message, data }`.
- Frontend handles both patterns, but a unified API contract would be cleaner.

## 21. QA Test Blueprint

### Smoke Tests

1. Open `/`.
2. Login as Super Admin.
3. Verify Platform View loads.
4. Open Clients workspace.
5. Open Users workspace.
6. Open Modules workspace.
7. Switch to a client.
8. Open Planning, Inventory, Warehouse, Production, Maintenance.
9. Logout.
10. Login as Admin.
11. Verify Admin and DataHub are visible.
12. Login as User.
13. Verify Admin/DataHub are hidden.

### RBAC Tests

| Test | Expected |
|---|---|
| User opens `/admin` | Access denied or hidden navigation |
| Operator opens `/intelligence` | Not available |
| Admin opens disabled module | Module not enabled message |
| User without `data.write` creates record | Button disabled/read-only |
| Super Admin opens platform | Allowed |
| Company user opens platform | Denied unless platform context allowed |

### Module Tests

For every dedicated module:

1. Open dashboard.
2. Click every sidebar section.
3. Search table.
4. Filter status.
5. Clear filter.
6. Click create.
7. Verify drawer opens.
8. Close drawer.
9. Verify report/audit page loads.

### API Tests

Minimum backend checks:

- `GET /health`
- `GET /modules`
- `POST /runtime/auth/login`
- `GET /runtime/auth/me`
- `GET /runtime/users`
- `GET /runtime/records`
- `POST /runtime/records`
- `PUT /runtime/records/{id}`
- `DELETE /runtime/records/{id}`
- `GET /runtime/audit-logs`
- Module dashboard endpoints for Inventory, Production, Maintenance, Quality, Costing, Sales, Reporting, Integrations, Intelligence.

## 22. Deployment Blueprint

Build and run with Docker Compose:

```bash
docker compose up -d --build
```

Verify:

```bash
docker ps
curl http://localhost:8080/health
curl http://localhost:8000/health
```

Expected running ports:

- App: `8080`
- API: `8000`
- Frontend-only: `8081`
- Postgres: `5432`
- Redis: `6379`
- pgAdmin: `5050`
- Nginx: `80`

## 23. Final Implementation Status

Implemented strongly:

- Login/session.
- Role-based frontend navigation.
- Platform View.
- Embedded Platform Management Services.
- Client/user/module/subscription/audit/impact management in frontend state.
- Dedicated Planning module UI.
- Dedicated Inventory module UI.
- Dedicated Warehouse module UI.
- Dedicated Production module UI.
- Dedicated Maintenance module UI.
- Runtime record CRUD.
- Backend module APIs for many business areas.
- Docker Compose deployment.

Partially implemented:

- Admin workflows.
- DataHub provider-specific authentication.
- Module API-to-dedicated-UI wiring.
- Server-side audit for every platform action.
- Notification and task lifecycle.
- AI recommendation integration.

Not yet complete:

- Dedicated frontend for all backend-rich modules.
- Central work inbox.
- Complete manager/user notification flow.
- Full DB persistence for platform embedded workspace.
- Production-grade provider credential vaulting.
- Unified API response contract.

## 24. Recommended Build Order

1. Persist Platform Management Services to backend tables.
2. Build My Work inbox and notifications.
3. Connect dedicated module create/edit drawers to backend APIs.
4. Build dedicated Quality UI.
5. Build dedicated Procurement UI.
6. Build dedicated Sales UI.
7. Build dedicated Costing UI.
8. Build dedicated Compliance, Documents, Customer Portal, Supplier Portal.
9. Add AI recommendations into each module as draft-only actions.
10. Add automated E2E tests for all roles and module flows.

