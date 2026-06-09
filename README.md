# Manufacturing Operations Platform (Python)

This repository is now a Python-only implementation of the Manufacturing Operations Platform backend.

It uses FastAPI and includes runnable backend modules for manufacturing operations:

- Auth
- Platform
- Inventory
- Warehouse
- Supplier
- Procurement
- Production
- Maintenance
- Quality
- Reporting
- Supply Chain
- AI

It now also includes a modular-monolith platform foundation with:

- PostgreSQL-ready SQLAlchemy 2.0 models
- Alembic migration scaffold
- Tenant/company/plant isolation fields
- JWT/password security helpers
- Role and permission records
- Company-level feature flags
- Tasks, approvals, documents and audit logs
- Redis/Celery background job hooks
- Optional AI provider interface for future LLM copilot integrations

The Production module has been expanded into a dedicated backend package with product master, BOM, routing, work centers, lines, machines, production orders, MRP, reservations, scheduling, logs, downtime, WIP, losses, costing, reports, dashboard, task/notification queues, and rule-based Production AI.

The Maintenance module has also been expanded into a dedicated CMMS/EAM-style backend package with machine registry, capability configuration, maintenance plans, breakdown work orders, spare mapping/reservation/consumption, downtime, shutdown windows, assignments, vendors, documents, machine history, lifecycle, costing, reports, dashboard, MTTR/MTBF, health scoring, and rule-based Maintenance AI.

The Quality module has been expanded into a dedicated QMS-style backend package with quality plans, checklists, sampling rules, inspection lots, inspection execution, defects, quarantine, rework, rejection, scrap, CAPA, KPIs, reports, quality tasks/notifications, and rule-based Quality AI.

The Sales & Distribution module has been expanded into a dedicated ERP-style backend package with customer master, regions, territories, plant representatives, sales orders, finished goods availability, protected customer reservations, partial allocation, dispatch orders, shipments, returns, KPIs, reports, tasks/notifications, and rule-based Sales AI.

The Customer Portal module has been added as a dedicated external-user backend with isolated customer authentication, profile view/update requests, customer-owned order and shipment tracking, secure document downloads, support requests, return requests, notifications, reports, audit logs, and rule-based Customer Portal AI.

The Supplier Portal module has been added as a dedicated external-supplier backend with isolated supplier authentication, company-level portal enablement flags, supplier users/RBAC, supplier-owned purchase orders, acknowledgements, delivery confirmations, ASN, document/certificate uploads, supplier performance visibility, supplier-facing tasks, messages, CAPA responses, notifications, reports, audit logs, and rule-based Supplier Portal AI.

The Reporting & Analytics module has been added as a dedicated BI-style backend with standard report catalog, scoped report execution, CSV/Excel/PDF export flow, saved reports, scheduled email reports, dashboards, KPI definitions/snapshots, trend analytics, cross-module insights, action insights, and rule-based Reporting AI.

## Diagram

See the GitHub-rendered end-to-end scheme diagram here:

[End-to-End Scheme Diagram](docs/end-to-end-scheme.md)

## Run Locally

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Open:

- Health check: `http://localhost:8000/health`
- Swagger API docs: `http://localhost:8000/docs`
- Module registry: `http://localhost:8000/modules`

## Demo Login

Use `POST /auth/login` with:

```json
{
  "tenant_slug": "precision-components",
  "email": "admin@mop.local",
  "password": "ChangeMe123!"
}
```


## Inventory AI Service

A separate Python FastAPI microservice is available here:

```text
inventory-ai-service/
```

It provides rule-based inventory intelligence APIs for:

- risk center
- shortage prediction
- overstock prediction
- procurement recommendations
- expiry intelligence
- dead stock detection
- production impact
- optimization draft actions

Run it with:

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

The AI service is recommendation-only. It creates draft actions and requires human approval for critical actions.

## Project Layout

```text
app/
  main.py             FastAPI application and module endpoints
  database.py         SQLAlchemy engine/session
  platform_models.py  Core platform SQLAlchemy models
  core_router.py      Companies, plants, users, roles, feature flags, tasks, approvals, documents and audit APIs
  auth_router.py      Refresh token and database-backed login structure
  schemas.py          Existing Pydantic request/response models
  store.py            Demo inventory/module data store
  modules/            Isolated business module packages
    inventory.py      Inventory operational views
    production.py     Production Management API routes
    production_models.py
                       SQLAlchemy tables for Production Management
    production_schemas.py
                       Pydantic schemas for Production requests and outputs
    production_repository.py
                       Seeded Production repository
    production_service.py
                       MRP, reservations, scheduling, costing, reports and AI rules
    maintenance.py    Maintenance Management API routes
    maintenance_models.py
                       SQLAlchemy tables for Maintenance Management
    maintenance_schemas.py
                       Pydantic schemas for Maintenance requests and outputs
    maintenance_repository.py
                       Seeded Maintenance repository
    maintenance_service.py
                       Approvals, spares, downtime, health, reports and AI rules
    quality.py         Quality Management API routes
    quality_models.py SQLAlchemy tables for Quality Management
    quality_schemas.py
                       Pydantic schemas for Quality requests and outputs
    quality_repository.py
                       Seeded Quality repository
    quality_service.py
                       Inspection execution, failure handling, KPIs, reports and AI rules
    sales.py           Sales & Distribution API routes
    sales_models.py    SQLAlchemy tables for Sales & Distribution
    sales_schemas.py   Pydantic schemas for Sales requests and outputs
    sales_repository.py
                       Seeded Sales repository
    sales_service.py   Availability, allocation, dispatch, KPIs, reports and AI rules
    customer_portal.py Customer Portal API routes
    customer_portal_models.py
                       SQLAlchemy tables for external portal users, support, returns, documents and audit
    customer_portal_schemas.py
                       Pydantic schemas for portal auth, support, returns and AI requests
    customer_portal_repository.py
                       Seeded Customer Portal repository
    customer_portal_service.py
                       Portal auth, customer-scoped data access, documents, reports and AI rules
    supplier_portal.py Supplier Portal API routes
    supplier_portal_models.py
                       SQLAlchemy tables for supplier users, PO acknowledgements, deliveries, ASN, documents, certificates, messages and AI drafts
    supplier_portal_schemas.py
                       Pydantic schemas for supplier auth, deliveries, ASN, uploads, CAPA and AI requests
    supplier_portal_repository.py
                       Seeded Supplier Portal repository
    supplier_portal_service.py
                       Portal auth, supplier-scoped data access, reports and AI rules
    reporting.py       Reporting & Analytics API routes
    reporting_models.py
                       SQLAlchemy tables for catalog, saved/scheduled reports, dashboards, KPIs, trends, insights, AI risks and anomalies
    reporting_schemas.py
                       Pydantic schemas for report runs, exports, schedules, dashboards, KPIs and AI requests
    reporting_repository.py
                       Seeded Reporting repository
    reporting_service.py
                       Report execution, exports, dashboards, KPI calculation, analytics and AI rules
  ai_copilot/         AIProvider, MockAIProvider and optional OpenAIProvider interface
  jobs.py             Celery jobs for reports, AI risk scans, expiry/dead stock checks
alembic/              Migration environment and first foundation migration
requirements.txt
Dockerfile
docker-compose.yml
.github/workflows/ci.yml
```

The current version uses in-memory sample data so every module can run immediately without database setup. A database layer can be added later behind `app/store.py`.

## Production Management Module

Open `http://localhost:8000/docs` and use the `Production Management` tag.

Key endpoint groups:

- Product master: `GET/POST/PUT/DELETE /production/products`
- BOM management: `GET/POST/PUT /production/bom`, `POST /production/bom/{bom_id}/approve`
- Routing: `GET/POST/PUT /production/routing`
- Work centers, lines and machines: `/production/work-centers`, `/production/lines`, `/production/machines`
- Production orders: `GET/POST/PUT /production/orders`
- MRP and reservations: `/production/orders/{order_id}/material-requirements`, `/production/orders/{order_id}/reserve-materials`
- Time-aware planning and scheduling: `/production/orders/{order_id}/time-aware-plan`, `/production/schedules`
- Execution: `/production/logs`, `/production/material-consumption`, `/production/downtime`, `/production/completion`
- WIP, losses, costing and reports: `/production/wip`, `/production/losses`, `/production/costing`, `/production/reports`
- Production AI: `/production/ai/risk-center`, `/production/ai/delay-prediction`, `/production/ai/material-bottlenecks`, `/production/ai/capacity-optimization`, `/production/ai/schedule-optimization`, `/production/ai/what-if`, `/production/ai/bom-variance`, `/production/ai/downtime-impact`, `/production/ai/cost-risk`, `/production/ai/draft-actions`

Production AI is recommendation-only. It can analyze, recommend, and create draft actions; it cannot change schedules, consume inventory, close orders, or approve orders automatically.

## Maintenance Management Module

Open `http://localhost:8000/docs` and use the `Maintenance Management` and `Maintenance AI` tags.

Key endpoint groups:

- Machine registry: `GET/POST /maintenance/machines`, `GET/PUT/DELETE /maintenance/machines/{machine_id}`
- Root aliases from the prompt: `GET/POST /machines`, `GET/POST/PUT /maintenance-plans`, `GET/POST /work-orders`
- Capability and rule configuration: `/maintenance/rules`
- Preventive plans: `/maintenance/maintenance-plans`
- Breakdown and planned work orders: `/maintenance/work-orders`
- Assignment/start/complete/close workflow: `/maintenance/work-orders/{work_order_id}/assign`, `/start`, `/complete`, `/close`
- Spare mapping and reservation: `/maintenance/spare-parts`, `/maintenance/spare-reservations`, `/maintenance/spare-usage`
- Downtime and shutdown windows: `/maintenance/downtime-events`, `/maintenance/shutdown-windows`
- Documentation: `/maintenance/attachments`, `/maintenance/machine-documents`
- Runtime, vendors, costing, tasks, notifications and reports: `/maintenance/runtime-logs`, `/maintenance/vendors`, `/maintenance/costing`, `/maintenance/tasks`, `/maintenance/notifications`, `/maintenance/reports`
- Maintenance AI: `/ai/maintenance/risk-center`, `/ai/maintenance/failure-prediction`, `/ai/maintenance/downtime-prediction`, `/ai/maintenance/spare-prediction`, `/ai/maintenance/health-score`, `/ai/maintenance/root-cause`, `/ai/maintenance/cost-impact`, `/ai/maintenance/recommendations`, `/ai/maintenance/draft-action`

Maintenance AI is recommendation-only. It can analyze, recommend, and create draft actions; it cannot close work orders, approve maintenance, consume spares, change production schedules, or release a machine as available.

## Quality Management Module

Open `http://localhost:8000/docs` and use the `Quality Management` and `Quality AI` tags.

Key endpoint groups:

- Quality plans: `/quality/plans`
- Checklists and sampling rules: `/quality/checklists`, `/quality/sampling-rules`
- Inspection lots and execution: `/quality/inspection-lots`, `/quality/inspection-lots/{lot_id}/start`, `/submit`, `/approve`, `/reject`
- Defects and failure handling: `/quality/defects`, `/quality/quarantine`, `/quality/rework`, `/quality/rejections`, `/quality/scrap`
- CAPA: `/quality/capa`
- KPIs, reports, tasks and notifications: `/quality/kpis`, `/quality/reports`, `/quality/tasks`, `/quality/notifications`
- Quality AI: `/ai/quality/risk-center`, `/ai/quality/defect-prediction`, `/ai/quality/trends`, `/ai/quality/supplier-risk`, `/ai/quality/production-risk`, `/ai/quality/root-cause`, `/ai/quality/cost-risk`, `/ai/quality/draft-action`

Quality AI is recommendation-only. It can analyze, recommend, and create draft actions; it cannot approve releases, scrap inventory, release quarantine, close CAPA, reject suppliers, or dispatch affected goods.

## Sales & Distribution Module

Open `http://localhost:8000/docs` and use the `Sales & Distribution` and `Sales AI` tags.

Key endpoint groups:

- Customer master: `/customers`
- Regions and territories: `/regions`, `/territories`
- Plant representatives: `/plant-representatives`
- Sales orders: `/sales-orders`, `/sales-orders/{order_id}/submit`, `/approve`, `/reserve`, `/dispatch`, `/close`
- Finished goods allocation: `/allocations`
- Dispatch, shipments and returns: `/dispatch-orders`, `/shipments`, `/returns`
- KPIs, reports, tasks and notifications: `/sales/kpis`, `/sales/reports`, `/sales/tasks`, `/sales/notifications`
- Sales AI: `/ai/sales/risk-center`, `/ai/sales/demand-forecast`, `/ai/sales/order-risk`, `/ai/sales/allocation-recommendation`, `/ai/sales/regional-demand`, `/ai/sales/expiry-aware-sales`, `/ai/sales/customer-profitability`, `/ai/sales/dispatch-optimization`, `/ai/sales/returns-analysis`, `/ai/sales/draft-action`

Sales AI is recommendation-only. It can analyze, recommend, and create draft actions; it cannot confirm sales orders, reassign protected inventory, dispatch goods, approve returns, issue credit, or change customer pricing.

## Customer Portal Module

Open `http://localhost:8000/docs` and use the `Customer Portal` and `Customer Portal AI` tags.

Key endpoint groups:

- Portal auth: `/customer-portal/auth/login`, `/refresh`, `/password-reset`, `/verify-email`
- Portal users: `/customer-portal/users`, `/customer-portal/users/invite`, `/customer-portal/users/{id}/disable`
- Profile and update request: `/customer-portal/profile`, `/customer-portal/profile/update-request`
- Customer-owned order and shipment tracking: `/customer-portal/orders`, `/customer-portal/shipments`
- Secure shared documents: `/customer-portal/documents`, `/customer-portal/documents/{id}/download`
- Support and returns: `/customer-portal/support-requests`, `/customer-portal/returns`
- Notifications and reports: `/customer-portal/notifications`, `/customer-portal/reports/{report_type}`
- Customer Portal AI: `/ai/customer-portal/risk-center`, `/order-risk`, `/support-classification`, `/return-risk`, `/document-risk`, `/satisfaction-risk`, `/draft-action`

Customer Portal AI is recommendation-only. It can draft messages, support responses, return review tasks, document upload tasks and escalations; it cannot approve returns, issue credit, cancel orders, promise delivery dates, release internal information, or send external customer email without approval.

## Supplier Portal Module

Open `http://localhost:8000/docs` and use the `Supplier Portal` and `Supplier Portal AI` tags.

Key endpoint groups:

- Portal auth: `/supplier-portal/auth/login`, `/refresh`, `/password-reset`, `/verify-email`
- Supplier users: `/supplier-portal/users`, `/supplier-portal/users/invite`, `/supplier-portal/users/{id}`, `/supplier-portal/users/{id}/disable`
- Profile and update request: `/supplier-portal/profile`, `/supplier-portal/profile/update-request`
- Enablement and permissions: `/supplier-portal/enablement`
- Supplier-owned purchase orders: `/supplier-portal/purchase-orders`, `/supplier-portal/purchase-orders/{id}`, `/supplier-portal/purchase-orders/{id}/acknowledge`
- Delivery and ASN: `/supplier-portal/delivery-confirmations`, `/supplier-portal/asn`
- Documents and certificates: `/supplier-portal/documents`, `/supplier-portal/documents/upload`, `/supplier-portal/certificates`, `/supplier-portal/certificates/upload`
- Messages, CAPA, notifications, performance, tasks and reports: `/supplier-portal/messages`, `/supplier-portal/capa`, `/supplier-portal/notifications`, `/supplier-portal/performance`, `/supplier-portal/tasks`, `/supplier-portal/reports/{report_type}`
- Supplier Portal AI: `/ai/supplier-portal/risk-center`, `/delivery-risk`, `/document-risk`, `/certificate-expiry`, `/supplier-quality-risk`, `/po-acknowledgement-risk`, `/message-summary`, `/draft-action`

Supplier Portal AI is recommendation-only. It can analyze supplier delay, document, certificate, acknowledgement and quality risks, then create draft follow-ups or review tasks; it cannot approve suppliers or certificates, change purchase orders, accept delivery dates, send POs, commit financial actions, or replace suppliers automatically.

## Reporting & Analytics Module

Open `http://localhost:8000/docs` and use the `Reporting & Analytics` and `Reporting AI` tags.

Key endpoint groups:

- Feature flags and catalog: `/reports/enablement`, `/reports/catalog`, `/reports/catalog/{id}`
- Report execution and exports: `/reports/run`, `/reports/export`
- Saved reports: `/reports/saved`, `/reports/saved/{id}`
- Scheduled reports: `/reports/schedules`, `/reports/schedules/{id}`
- Dashboards: `/dashboards`, `/dashboards/{id}`
- KPIs: `/kpis`, `/kpis/{id}`, `/kpis/{id}/calculate`
- Analytics: `/analytics/trends`, `/analytics/cross-module`, `/analytics/action-insights`
- Reporting AI: `/ai/reporting/risk-center`, `/executive-summary`, `/root-cause`, `/anomalies`, `/kpi-insights`, `/report-narrative`, `/draft-action`

Reporting AI is recommendation-only. It can analyze, summarize, recommend and create draft tasks or report notes; it cannot approve decisions, change source data, send external email without approval, modify financial records, release inventory, or dispatch goods.

## Platform Foundation

See:

[Platform Foundation](docs/platform-foundation.md)

Run with PostgreSQL and Redis:

```bash
docker compose up --build
```

Run migrations locally after setting `DATABASE_URL`:

```bash
alembic upgrade head
```
