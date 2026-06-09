# End-to-End Scheme Diagram

This diagram shows the current Python-only Manufacturing Operations Platform after adding the modular platform foundation, expanded Inventory module, external Customer Portal, external Supplier Portal, Reporting & Analytics, Costing & Profitability, Mobile Operations, and separate `inventory-ai-service/` microservice.

There are two FastAPI services:

- Main platform API: `http://127.0.0.1:8000/docs`
- Inventory AI service: `http://127.0.0.1:8100/docs`

The AI service is recommendation-only. It analyzes risk, creates draft actions, and requires human approval for critical actions. It does not automatically move stock, create purchase orders, change production, write off inventory, or execute supplier actions.

```mermaid
flowchart LR
    User["User / Operator / Manager"] --> Browser["Browser, Swagger, Mobile, or API Client"]
    Browser --> PlatformDocs["Main Platform Swagger /docs :8000"]
    Browser --> AiDocs["Inventory AI Swagger /docs :8100"]

    PlatformDocs --> PlatformAPI["Main FastAPI App app/main.py"]
    AiDocs --> AiAPI["Inventory AI FastAPI inventory-ai-service/app/main.py"]

    PlatformAPI --> Core["Core Platform Router app/core_router.py"]
    PlatformAPI --> Auth["Auth Router app/auth_router.py"]
    PlatformAPI --> CostingRouter["Costing Router app/modules/costing.py"]
    PlatformAPI --> InventoryRouter["Inventory Router app/modules/inventory.py"]
    PlatformAPI --> ProductionRouter["Production Router app/modules/production.py"]
    PlatformAPI --> MaintenanceRouter["Maintenance Router app/modules/maintenance.py"]
    PlatformAPI --> MobileRouter["Mobile Operations Router app/modules/mobile.py"]
    PlatformAPI --> QualityRouter["Quality Router app/modules/quality.py"]
    PlatformAPI --> ReportingRouter["Reporting Router app/modules/reporting.py"]
    PlatformAPI --> SalesRouter["Sales Router app/modules/sales.py"]
    PlatformAPI --> CustomerPortalRouter["Customer Portal Router app/modules/customer_portal.py"]
    PlatformAPI --> SupplierPortalRouter["Supplier Portal Router app/modules/supplier_portal.py"]
    PlatformAPI --> GenericModules["Generic Module Routers"]

    Core --> Companies["Companies"]
    Core --> Plants["Plants"]
    Core --> Departments["Departments"]
    Core --> Users["Users"]
    Core --> Roles["Roles"]
    Core --> Permissions["Permissions"]
    Core --> FeatureFlags["Feature Flags"]
    Core --> Tasks["Tasks"]
    Core --> Approvals["Approvals"]
    Core --> Documents["Documents"]
    Core --> AuditLogs["Audit Logs"]

    Auth --> Jwt["JWT Access Token"]
    Auth --> Passwords["Password Hashing"]
    Jwt --> RBAC["RBAC-ready User / Role / Permission Scope"]

    GenericModules --> Warehouse["Warehouse"]
    GenericModules --> Procurement["Procurement"]

    CostingRouter --> CostCenters["Cost Centers / Cost Elements"]
    CostingRouter --> InventoryCost["Inventory Valuation / Landed Cost"]
    CostingRouter --> ProductionCost["Production / Maintenance / Quality Costing"]
    CostingRouter --> Variance["Standard Cost / Variance"]
    CostingRouter --> Profitability["Product / Customer / Plant Profitability"]
    CostingRouter --> CostReports["Costing Dashboard / Reports"]
    CostingRouter --> CostingAI["Rule-Based Costing AI"]

    ProductionRouter --> ProdMaster["Product Master"]
    ProductionRouter --> ProdBom["BOM and Routing"]
    ProductionRouter --> ProdResources["Work Centers / Lines / Machines"]
    ProductionRouter --> ProdOrders["Production Orders"]
    ProductionRouter --> ProdPlanning["MRP / Reservations / Scheduling"]
    ProductionRouter --> ProdExecution["Logs / Consumption / Downtime / Completion"]
    ProductionRouter --> ProdControl["WIP / Losses / Costing / Reports"]
    ProductionRouter --> ProdAI["Rule-Based Production AI"]

    MaintenanceRouter --> MaintMachines["Machine Registry and Capabilities"]
    MaintenanceRouter --> MaintPlans["Maintenance Plans and Rules"]
    MaintenanceRouter --> MaintWO["Work Orders and Approval Flow"]
    MaintenanceRouter --> MaintSpares["Spare Mapping / Reservation / Consumption"]
    MaintenanceRouter --> MaintDowntime["Downtime / Shutdown Windows"]
    MaintenanceRouter --> MaintDocs["Attachments / Documents / History"]
    MaintenanceRouter --> MaintReports["Dashboard / Reports / MTTR / MTBF"]
    MaintenanceRouter --> MaintAI["Rule-Based Maintenance AI"]

    MobileRouter --> MobileAuth["Mobile Auth / Devices"]
    MobileRouter --> MobileWork["My Work / Tasks / Approvals"]
    MobileRouter --> MobileScan["Barcode / QR Scan Resolver"]
    MobileRouter --> MobileInventory["Inventory Receive / Transfer / Count"]
    MobileRouter --> MobileWarehouse["Warehouse Movement"]
    MobileRouter --> MobileOps["Production / Maintenance / Quality / Dispatch"]
    MobileRouter --> MobileSync["Uploads / Offline Sync / Conflicts"]
    MobileRouter --> MobileAI["Rule-Based Mobile AI"]

    QualityRouter --> QualPlans["Quality Plans / Checklists / Sampling"]
    QualityRouter --> QualLots["Inspection Lots and Execution"]
    QualityRouter --> QualDefects["Defects and Failure Handling"]
    QualityRouter --> QualBlocked["Quarantine / Rework / Rejection / Scrap"]
    QualityRouter --> QualCapa["CAPA and RCA"]
    QualityRouter --> QualMetrics["KPIs / Reports / Cost of Poor Quality"]
    QualityRouter --> QualAI["Rule-Based Quality AI"]

    ReportingRouter --> ReportCatalog["Report Catalog"]
    ReportingRouter --> ReportRun["Scoped Report Run / Export"]
    ReportingRouter --> SavedScheduled["Saved / Scheduled Reports"]
    ReportingRouter --> Dashboards["Dashboards / Widgets"]
    ReportingRouter --> Kpis["KPI Definitions / Snapshots"]
    ReportingRouter --> Analytics["Trends / Cross-Module / Action Insights"]
    ReportingRouter --> ReportingAI["Rule-Based Reporting AI"]

    SalesRouter --> SalesCustomer["Customers / Hierarchy / Regions"]
    SalesRouter --> SalesOrders["Sales Orders and Items"]
    SalesRouter --> SalesAllocation["FG Availability / Reservation / Allocation"]
    SalesRouter --> SalesDispatch["Dispatch / Pick / Pack / Shipments"]
    SalesRouter --> SalesReturns["Returns"]
    SalesRouter --> SalesMetrics["Dashboard / KPIs / Reports"]
    SalesRouter --> SalesAI["Rule-Based Sales AI"]

    CustomerPortalRouter --> PortalAuth["External Customer Auth"]
    CustomerPortalRouter --> PortalProfile["Profile / Address Update Requests"]
    CustomerPortalRouter --> PortalOrders["Customer-Owned Orders"]
    CustomerPortalRouter --> PortalShipments["Customer-Owned Shipments"]
    CustomerPortalRouter --> PortalDocs["Secure Shared Documents"]
    CustomerPortalRouter --> PortalSupport["Support / Returns / Feedback"]
    CustomerPortalRouter --> PortalAI["Rule-Based Customer Portal AI"]

    SupplierPortalRouter --> SupplierAuth["External Supplier Auth"]
    SupplierPortalRouter --> SupplierEnablement["Company Feature Flags / Supplier RBAC"]
    SupplierPortalRouter --> SupplierProfile["Supplier Profile / Update Requests"]
    SupplierPortalRouter --> SupplierPOs["Supplier-Owned Purchase Orders"]
    SupplierPortalRouter --> SupplierDelivery["Acknowledgements / Delivery Confirmations / ASN"]
    SupplierPortalRouter --> SupplierDocs["Documents / Certificates"]
    SupplierPortalRouter --> SupplierMessages["Messages / CAPA / Notifications"]
    SupplierPortalRouter --> SupplierTasks["Performance / Supplier Tasks"]
    SupplierPortalRouter --> SupplierAI["Rule-Based Supplier Portal AI"]

    InventoryRouter --> InvDashboard["Inventory Dashboard"]
    InventoryRouter --> InvItems["Items / Categories / Tracking"]
    InventoryRouter --> InvLocation["Locations / 2D Warehouse Map"]
    InventoryRouter --> InvBatch["Batch and Serial Tracking"]
    InventoryRouter --> InvStatus["Status and Reservations"]
    InventoryRouter --> InvLedger["Movement Ledger and Counts"]
    InventoryRouter --> InvAging["Expiry, Aging, Costs, Reports"]
    InventoryRouter --> InvMobile["Mobile Scan / Offline Sync"]

    Core --> DB["SQLAlchemy Database Layer app/database.py"]
    Auth --> DB
    GenericModules --> DB
    DB --> Models["Platform SQLAlchemy Models app/platform_models.py"]
    Models --> PlatformDB["PostgreSQL in Docker or local SQLite fallback"]
    PlatformDB --> Alembic["Alembic Migration Scaffold"]
    PlatformDB --> Seed["Platform Seed Data app/platform_seed.py"]

    FeatureFlags --> Gate["Module Enable / Disable Gate"]
    Gate --> GenericModules
    Gate --> InventoryRouter

    Core --> Audit["Audit Helper app/audit.py"]
    CostingRouter --> Audit
    GenericModules --> Audit
    InventoryRouter --> Audit
    ProductionRouter --> Audit
    MaintenanceRouter --> Audit
    MobileRouter --> Audit
    QualityRouter --> Audit
    ReportingRouter --> Audit
    SalesRouter --> Audit
    CustomerPortalRouter --> Audit
    SupplierPortalRouter --> Audit
    Audit --> AuditLogs

    PlatformAPI --> Jobs["Celery Jobs app/jobs.py"]
    Jobs --> Redis["Redis Broker"]
    Jobs --> Scheduled["Scheduled Reports / AI Risk Scan / Expiry / Dead Stock Checks"]

    PlatformAPI --> Copilot["AI Copilot Provider Interface app/ai_copilot"]
    Copilot --> MockProvider["Mock Provider by Default"]
    Copilot --> OpenAIProvider["Optional OpenAI Provider Later"]

    AiAPI --> AiRoutes["AI Routes inventory-ai-service/app/routes.py"]
    AiRoutes --> AiEngine["Rule-Based AI Engine app/ai_engine.py"]
    AiEngine --> RiskRules["Risk Rules app/risk_rules.py"]
    AiEngine --> Recommendations["Draft Recommendations app/recommendations.py"]
    AiRoutes --> AiSchemas["AI Pydantic Schemas app/schemas.py"]
    AiRoutes --> AiModels["AI SQLAlchemy Models app/models.py"]
    AiModels --> AiDB["AI PostgreSQL via Docker or SQLite fallback"]
    AiDB --> AiSeed["AI Seed Data app/seed_data.py"]
    AiEngine --> AiJSON["Risk, Recommendation, and Draft Action JSON"]
    AiJSON --> Browser

    InventoryRouter -. "inventory signals and business context" .-> AiAPI
    AiJSON -. "recommendations only, human approval required" .-> Core
```

## Runtime Flow

1. User opens the main platform Swagger at `http://127.0.0.1:8000/docs`.
2. `app/main.py` starts the main FastAPI service, creates SQLAlchemy tables when needed, and seeds demo platform data.
3. Auth requests go through `app/auth_router.py` and return JWT tokens.
4. Core platform requests go through `app/core_router.py`.
5. Company, plant, department, user, role, permission, task, approval, document, and audit data is stored through SQLAlchemy models in `app/platform_models.py`.
6. Feature flags decide whether module APIs are enabled.
7. Generic module routers store warehouse and procurement records in `ModuleRecord`.
8. Costing requests go through `app/modules/costing.py`.
9. Inventory requests go through `app/modules/inventory.py`.
10. Production requests go through `app/modules/production.py`.
11. Maintenance requests go through `app/modules/maintenance.py`.
12. Mobile Operations requests go through `app/modules/mobile.py`.
13. Quality requests go through `app/modules/quality.py`.
14. Reporting requests go through `app/modules/reporting.py`.
15. Sales requests go through `app/modules/sales.py`.
16. Customer Portal requests go through `app/modules/customer_portal.py`.
17. Supplier Portal requests go through `app/modules/supplier_portal.py` and are scoped to the logged-in supplier.
18. Inventory, Costing, Production, Maintenance, Mobile, Quality, Reporting, Sales, Customer Portal and Supplier Portal data are validated with Pydantic schemas and returned as structured JSON.
19. Background jobs are prepared in `app/jobs.py` using Celery and Redis.
20. User opens the Inventory AI service Swagger at `http://127.0.0.1:8100/docs`.
21. Inventory AI requests go through `inventory-ai-service/app/routes.py`.
22. AI routes call rule-based logic in `ai_engine.py`, `risk_rules.py`, and `recommendations.py`.
23. AI returns analysis, risk levels, recommendations, and draft actions only.
24. Human approval is required before any critical operational action.

## Main Platform Modules

| Area | Current Code | Purpose |
| --- | --- | --- |
| Application entry | `app/main.py` | Starts FastAPI, includes routers, initializes database and seed data |
| Database layer | `app/database.py` | SQLAlchemy engine, session, base model and dependency |
| Platform models | `app/platform_models.py` | Company, plant, department, user, role, permission, flags, tasks, approvals, documents, audit logs, module records |
| Platform schemas | `app/platform_schemas.py` | Pydantic request/response models for core platform APIs |
| Auth | `app/auth_router.py`, `app/security.py` | JWT, password hashing, database-backed login structure |
| Core router | `app/core_router.py` | Core APIs and generic module router factory |
| Feature flags | `app/feature_flags.py` | Module enable/disable checks |
| Audit | `app/audit.py` | Audit log writer for platform actions |
| Seed data | `app/platform_seed.py` | Demo company, plant, admin user, roles, permissions and module flags |
| Background jobs | `app/jobs.py` | Celery jobs for reports, AI risk scans, expiry checks and dead stock checks |
| AI copilot | `app/ai_copilot/` | Provider interface with mock provider and optional OpenAI provider |
| Costing module | `app/modules/costing.py` | Dedicated Costing & Profitability APIs |
| Costing service | `app/modules/costing_service.py` | Cost calculations, profitability, reports and Costing AI rules |
| Costing schemas | `app/modules/costing_schemas.py` | Pydantic schemas for cost centers/elements, calculations, standard costs, variances and AI requests |
| Costing models | `app/modules/costing_models.py` | SQLAlchemy table definitions for cost records, variances, profitability, AI risks, recommendations, reports and snapshots |
| Production module | `app/modules/production.py` | Dedicated Production Management APIs |
| Production service | `app/modules/production_service.py` | MRP, reservations, scheduling, costing, reports and Production AI rules |
| Production schemas | `app/modules/production_schemas.py` | Pydantic schemas for Production requests |
| Production models | `app/modules/production_models.py` | SQLAlchemy table definitions for Production Management |
| Maintenance module | `app/modules/maintenance.py` | Dedicated Maintenance Management APIs and root aliases |
| Maintenance service | `app/modules/maintenance_service.py` | Approvals, spares, downtime, health score, reports and Maintenance AI rules |
| Maintenance schemas | `app/modules/maintenance_schemas.py` | Pydantic schemas for Maintenance requests |
| Maintenance models | `app/modules/maintenance_models.py` | SQLAlchemy table definitions for Maintenance Management |
| Mobile Operations module | `app/modules/mobile.py` | Dedicated Mobile Operations APIs |
| Mobile Operations service | `app/modules/mobile_service.py` | Mobile auth, device, workflow, scan, offline sync and Mobile AI rules |
| Mobile Operations schemas | `app/modules/mobile_schemas.py` | Pydantic schemas for mobile auth, workflow actions, uploads, sync and AI requests |
| Mobile Operations models | `app/modules/mobile_models.py` | SQLAlchemy table definitions for devices, sessions, tokens, work queue, sync, scans, uploads, audit, conflicts, notifications and AI |
| Quality module | `app/modules/quality.py` | Dedicated Quality Management APIs |
| Quality service | `app/modules/quality_service.py` | Inspection execution, failure handling, KPIs, reports and Quality AI rules |
| Quality schemas | `app/modules/quality_schemas.py` | Pydantic schemas for Quality requests |
| Quality models | `app/modules/quality_models.py` | SQLAlchemy table definitions for Quality Management |
| Reporting module | `app/modules/reporting.py` | Dedicated Reporting & Analytics APIs |
| Reporting service | `app/modules/reporting_service.py` | Report execution, exports, dashboards, KPIs, analytics and AI rules |
| Reporting schemas | `app/modules/reporting_schemas.py` | Pydantic schemas for report runs, exports, schedules, dashboards, KPIs and AI requests |
| Reporting models | `app/modules/reporting_models.py` | SQLAlchemy table definitions for catalog, saved/scheduled reports, runs, files, recipients, dashboards, KPIs, trends, insights, AI risks, summaries and anomalies |
| Sales module | `app/modules/sales.py` | Dedicated Sales & Distribution APIs |
| Sales service | `app/modules/sales_service.py` | Availability, reservations, allocation, dispatch, KPIs, reports and Sales AI rules |
| Sales schemas | `app/modules/sales_schemas.py` | Pydantic schemas for Sales requests |
| Sales models | `app/modules/sales_models.py` | SQLAlchemy table definitions for Sales & Distribution |
| Customer Portal module | `app/modules/customer_portal.py` | External customer portal APIs |
| Customer Portal service | `app/modules/customer_portal_service.py` | Portal auth, customer-scoped data access, documents, reports and AI rules |
| Customer Portal schemas | `app/modules/customer_portal_schemas.py` | Pydantic schemas for portal auth, support, returns and AI requests |
| Customer Portal models | `app/modules/customer_portal_models.py` | SQLAlchemy table definitions for portal users, support, returns, documents and audit |
| Supplier Portal module | `app/modules/supplier_portal.py` | External supplier portal APIs |
| Supplier Portal service | `app/modules/supplier_portal_service.py` | Portal auth, supplier-scoped data access, PO acknowledgements, reports and AI rules |
| Supplier Portal schemas | `app/modules/supplier_portal_schemas.py` | Pydantic schemas for supplier auth, delivery, ASN, uploads, CAPA and AI requests |
| Supplier Portal models | `app/modules/supplier_portal_models.py` | SQLAlchemy table definitions for supplier users, roles, permissions, sessions, invitations, PO acknowledgements, deliveries, ASN, documents, certificates, messages, CAPA, notifications, document access, audit, AI risks and AI drafts |
| Migrations | `alembic/` | Alembic migration scaffold |
| Docker | `docker-compose.yml` | PostgreSQL, Redis, main API and worker services |

## Generic Backend Applications

| Application | Endpoint Family | Current Behavior |
| --- | --- | --- |
| Warehouse | `/warehouses`, `/warehouse-locations`, `/warehouse-movements`, `/warehouse-occupancy` | Stores module records after feature flag validation |
| Procurement | `/suppliers`, `/purchase-requisitions`, `/purchase-orders` | Stores supplier and purchasing module records |
| Costing | `/costing/*`, `/cost-centers`, `/cost-elements`, `/inventory-costing`, `/landed-cost`, `/production-costing`, `/profitability/*`, `/ai/costing/*` | Dedicated Costing & Profitability module with valuations, costing calculations, profitability and AI |
| Production | `/production/*` | Dedicated Production Management module with planning, execution, costing, reporting and AI |
| Maintenance | `/maintenance/*`, `/machines`, `/maintenance-plans`, `/work-orders`, `/ai/maintenance/*` | Dedicated Maintenance Management module with CMMS/EAM workflows and AI |
| Mobile Operations | `/mobile/*`, `/ai/mobile/*` | Dedicated mobile backend with device auth, my-work, tasks, approvals, scan, inventory, warehouse, production, maintenance, quality, dispatch, uploads and offline sync |
| Quality | `/quality/*`, `/ai/quality/*` | Dedicated Quality Management module with QMS workflows and AI |
| Reporting | `/reports/*`, `/dashboards/*`, `/kpis/*`, `/analytics/*`, `/ai/reporting/*` | Dedicated Reporting & Analytics module with catalog, exports, schedules, dashboards, KPIs, cross-module analytics and AI insights |
| Sales | `/customers`, `/sales-orders`, `/dispatch-orders`, `/shipments`, `/returns`, `/ai/sales/*` | Dedicated Sales & Distribution module with order, allocation, dispatch, returns and AI |
| Customer Portal | `/customer-portal/*`, `/ai/customer-portal/*` | Dedicated external customer portal with customer-scoped order, shipment, document, support and return workflows |
| Supplier Portal | `/supplier-portal/*`, `/ai/supplier-portal/*` | Dedicated external supplier portal with company enablement flags, supplier-scoped purchase order, delivery, ASN, document, certificate, message, CAPA, performance and task workflows |
| Inventory | `/inventory/*` | Expanded dedicated inventory module with operational views |
| Inventory AI | `/inventory-ai/*` | Separate AI/rule-based intelligence service |

## Production Management Views

| View | Endpoint | Output |
| --- | --- | --- |
| Production Dashboard | `GET /production/dashboard` | Active orders, risk count, shortages, utilization, downtime, shift output, planned vs actual, WIP and completed orders |
| Product Master | `GET/POST/PUT/DELETE /production/products` | Finished products, semi-finished products, sub-assemblies and by-products |
| BOM Management | `GET/POST/PUT /production/bom`, `POST /production/bom/{bom_id}/approve` | Multi-level BOM, versioning, approval workflow, material lines and consumption type |
| Routing Management | `GET/POST/PUT /production/routing` | Operations, sequence, work center, line, setup/run time, labor, machine and quality checks |
| Work Centers | `GET/POST /production/work-centers` | Capacity, plant, department, operating calendar and active status |
| Production Lines | `GET/POST /production/lines` | Line capacity, shift calendar and active/maintenance/unavailable status |
| Machines | `GET/POST /production/machines` | Machine registry with status, runtime, downtime and capacity |
| Production Orders | `GET/POST/PUT /production/orders` | Production source, product, BOM/routing, quantity, dates, priority, line, work center and status |
| Material Planning | `POST /production/orders/{order_id}/material-requirements` | Required quantity from BOM and production quantity |
| Reservations | `POST /production/orders/{order_id}/reserve-materials` | Required, available, reserved and shortage quantities |
| Time-Aware Plan | `GET /production/orders/{order_id}/time-aware-plan` | Current inventory, incoming inventory, supplier lead time and procurement requirement |
| Scheduling | `GET/POST /production/schedules` | Schedules with line, machine, maintenance, inventory, capacity and shift conflict detection |
| Shifts | `GET/POST /production/shifts` | Morning, evening, night and custom shifts |
| Daily Logs | `GET/POST /production/logs` | Planned/actual output, material consumed, downtime, wastage and remarks |
| Consumption | `GET/POST /production/material-consumption` | Reserve-first material consumption and variance tracking |
| Downtime | `GET/POST /production/downtime` | Mechanical, electrical, material, operator, quality, maintenance and other downtime |
| Completion | `POST /production/completion` | Final output, consumption finalization, unused reservation release, variance, cost and quality handoff |
| WIP | `GET/POST /production/wip` | Raw material to WIP to finished goods stages |
| Losses | `GET/POST /production/losses` | Waste, scrap, rework, rejection and over-consumption |
| Costing | `GET /production/costing`, `POST /production/orders/{order_id}/costing` | Material, machine, labor, overhead, wastage, rework and cost per unit |
| Reports | `GET /production/reports` | Orders, daily production, shifts, consumption, variance, downtime, capacity, WIP and cost reports |
| Production AI | `/production/ai/*` | Risk, delay, bottleneck, capacity, schedule, what-if, variance, downtime, cost and draft-action recommendations |

## Maintenance Management Views

| View | Endpoint | Output |
| --- | --- | --- |
| Maintenance Dashboard | `GET /maintenance/dashboard` | Open work orders, overdue plans, breakdown machines, spare shortages, MTTR, MTBF, downtime, cost and upcoming maintenance |
| Machine Registry | `GET/POST /maintenance/machines`, `GET/POST /machines` | Machine master with company, plant, line, work center, status, criticality, capacity, location and capability flags |
| Machine Detail | `GET/PUT/DELETE /maintenance/machines/{machine_id}` | Machine details, lifecycle status and capabilities |
| Rule Engine | `GET/POST /maintenance/rules` | Calendar, runtime, production-aware, shutdown-window, manual and breakdown rules |
| Preventive Plans | `GET/POST/PUT /maintenance/maintenance-plans`, root alias `/maintenance-plans` | Preventive maintenance plans, frequency, due dates, required spares, documents and approval requirement |
| Work Orders | `GET/POST/PUT /maintenance/work-orders`, root alias `/work-orders` | Breakdown, preventive, runtime, inspection, calibration and compliance work orders |
| Assignment | `POST /maintenance/work-orders/{work_order_id}/assign` | Assign technician, team, vendor or contractor |
| Execution | `POST /maintenance/work-orders/{work_order_id}/start`, `/complete`, `/close` | Start, complete and close maintenance with status, validation, cost, history and audit trail |
| Spare Parts | `GET/POST /maintenance/spare-parts` | Machine-specific spare mapping, compatibility, criticality, thresholds and suppliers |
| Spare Reservation | `POST /maintenance/spare-reservations` | Check inventory, reserve spare, create shortage/procurement draft when unavailable |
| Spare Usage | `GET /maintenance/spare-usage` | Spare consumption and cost history |
| Downtime Events | `GET/POST /maintenance/downtime-events` | Manual categorized downtime with root cause, production loss and cost impact |
| Shutdown Windows | `GET/POST /maintenance/shutdown-windows` | Planned shutdown windows for plant, line or machine |
| Documentation | `GET/POST /maintenance/attachments`, `/maintenance/machine-documents` | Work order photos, documents, invoices, manuals, certificates and service reports |
| Runtime Logs | `GET/POST /maintenance/runtime-logs` | Runtime tracking for runtime-based maintenance |
| Vendors | `GET/POST /maintenance/vendors` | External maintenance providers, contracts and service type |
| Costing | `GET /maintenance/costing` | Spare, labor, vendor, downtime, production loss and total maintenance cost |
| Reports | `GET /maintenance/reports` | Schedule, work order, breakdown, downtime, spare, history, cost, MTTR, MTBF and overdue reports |
| Maintenance AI | `/ai/maintenance/*` | Risk center, failure, downtime, spare, health, root cause, cost impact, recommendations and draft actions |

## Quality Management Views

| View | Endpoint | Output |
| --- | --- | --- |
| Quality Dashboard | `GET /quality/dashboard` | Pending inspections, failed inspections, quarantine, rework, rejection rate, defect trend, supplier issues, CAPA, FPY and cost of poor quality |
| Quality Plans | `GET/POST/PUT /quality/plans` | Configurable plans by company, plant, product, material, supplier, customer, process, line, machine and criticality |
| Checklists | `GET/POST /quality/checklists` | Checklist definitions, items, parameters, tolerances, photos and document requirements |
| Sampling Rules | `GET/POST /quality/sampling-rules` | Lot size, sample size, acceptance/rejection quantity, inspection level and severity |
| Inspection Lots | `GET/POST /quality/inspection-lots` | Lots from goods receipt, production completion, WIP, customer return, rework and manual quality requests |
| Inspection Execution | `POST /quality/inspection-lots/{lot_id}/start`, `/submit`, `/approve`, `/reject` | Checklist responses, measurements, pass/fail, defects, comments, signatures and approvals |
| Defects | `GET/POST /quality/defects` | Defect category, severity, source, affected quantity, photos and status |
| Quarantine | `GET/POST /quality/quarantine`, `POST /quality/quarantine/{id}/release` | Failed or blocked inventory movement to quarantine and controlled release |
| Rework | `GET/POST /quality/rework` | Rework workflow from failed inspection through reinspection |
| Rejections | `GET/POST /quality/rejections` | Rejected stock blocked from use with cost impact |
| Scrap | `GET/POST /quality/scrap` | Scrap workflow with estimated loss and approval requirement |
| CAPA | `GET/POST/PUT /quality/capa` | Corrective and preventive action, root cause, owner, due date and effectiveness checks |
| KPIs | `GET /quality/kpis` | FPY, defect rate, rework rate, scrap rate, supplier rejection, customer return, CAPA closure and COPQ |
| Reports | `GET /quality/reports` | Inspection, defect, quarantine, rework, rejection, scrap, CAPA, supplier, production, customer return and COPQ reports |
| Quality AI | `/ai/quality/*` | Risk center, defect prediction, trends, supplier risk, production risk, root cause, cost risk and draft actions |

## Sales & Distribution Views

| View | Endpoint | Output |
| --- | --- | --- |
| Sales Dashboard | `GET /sales/dashboard` | Open orders, approval queue, shortages, production requirement, dispatch delays, regional sales, returns and finished goods availability |
| Customer Master | `GET/POST/PUT/DELETE /customers` | Customer records, region, territory, sales rep, plant assignment and active status |
| Regions and Territories | `GET/POST /regions`, `GET/POST /territories` | Regional sales mapping for demand, allocation and dispatch planning |
| Plant Representatives | `GET/POST /plant-representatives` | Plant representative allocation authority and limits |
| Sales Orders | `GET/POST/PUT /sales-orders` | Customer order header and line items |
| Order Workflow | `POST /sales-orders/{id}/submit`, `/approve`, `/reserve`, `/dispatch`, `/close` | Approval, inventory check, reservation, dispatch and closure |
| Allocation | `GET/POST /allocations` | Customer allocation, protected reservation check and override approval requirement |
| Dispatch Orders | `GET/POST /dispatch-orders` | Dispatch order, pick list, FEFO/FIFO location and packing status |
| Shipments | `GET/POST/PUT /shipments` | Carrier, vehicle, tracking, driver, status, delivery dates and proof of delivery |
| Returns | `GET/POST/PUT /returns` | Return request, approval, received, quality pending, restock, rework, scrap, replace or credit |
| KPIs | `GET /sales/kpis` | Fulfillment, delivery, fill rate, backorder, returns, demand growth, delay and profitability |
| Reports | `GET /sales/reports` | Orders, customers, regional sales, allocation, dispatch, shipment delay, returns, profitability, demand and inventory reports |
| Sales AI | `/ai/sales/*` | Risk center, demand forecast, order risk, allocation, regional demand, expiry-aware sales, profitability, dispatch, returns and draft actions |

## Customer Portal Views

| View | Endpoint | Output |
| --- | --- | --- |
| Portal Auth | `POST /customer-portal/auth/login`, `/refresh`, `/password-reset`, `/verify-email` | Isolated external customer authentication and portal JWTs |
| Portal Users | `GET /customer-portal/users`, `POST /customer-portal/users/invite`, `PUT /customer-portal/users/{id}`, `POST /customer-portal/users/{id}/disable` | External customer users, roles, status and invitations |
| Profile | `GET /customer-portal/profile`, `PUT /customer-portal/profile/update-request` | Customer-owned profile and controlled update request |
| Dashboard | `GET /customer-portal/dashboard` | Open orders, production orders, ready dispatch, shipments, delivered orders, support, returns, documents and notifications |
| Order Tracking | `GET /customer-portal/orders`, `GET /customer-portal/orders/{id}` | Customer-owned orders only, portal-friendly statuses and safe line item fields |
| Shipment Tracking | `GET /customer-portal/shipments`, `GET /customer-portal/shipments/{id}` | Customer-owned shipment status and proof of delivery |
| Documents | `GET /customer-portal/documents`, `GET /customer-portal/documents/{id}/download` | Explicitly shared customer documents and secure download token |
| Support | `GET/POST /customer-portal/support-requests`, comments and attachments | Customer support requests and customer-visible updates |
| Returns | `GET/POST /customer-portal/returns`, `GET /customer-portal/returns/{id}` | Customer return requests and tracking |
| Reports | `GET /customer-portal/reports/{report_type}` | Customer-owned order, shipment, return and document reports |
| Customer Portal AI | `/ai/customer-portal/*` | Risk center, order risk, support classification, return risk, document risk, satisfaction risk and draft actions |

## Supplier Portal Views

| View | Endpoint | Output |
| --- | --- | --- |
| Portal Auth | `POST /supplier-portal/auth/login`, `/refresh`, `/password-reset`, `/verify-email` | Isolated external supplier authentication and portal JWTs |
| Portal Users | `GET /supplier-portal/users`, `POST /supplier-portal/users/invite`, `PUT /supplier-portal/users/{id}`, `POST /supplier-portal/users/{id}/disable` | External supplier users, roles, status and invitations |
| Profile | `GET /supplier-portal/profile`, `PUT /supplier-portal/profile/update-request` | Supplier-owned profile and controlled update request |
| Enablement | `GET /supplier-portal/enablement` | Company-level portal feature flags and supplier role permissions |
| Dashboard | `GET /supplier-portal/dashboard` | Open POs, acknowledgements, upcoming delivery, delay, document, certificate, quality, message and CAPA signals |
| Purchase Orders | `GET /supplier-portal/purchase-orders`, `GET /supplier-portal/purchase-orders/{id}` | Supplier-owned purchase orders only, portal-friendly status and safe PO fields |
| PO Acknowledgement | `POST /supplier-portal/purchase-orders/{id}/acknowledge` | Accepted, rejected or partial acknowledgement with confirmed quantity/date |
| Delivery Confirmations | `GET/POST /supplier-portal/delivery-confirmations` | Supplier delivery confirmations and shipment reference details |
| ASN | `GET/POST /supplier-portal/asn` | Advance shipment notices with item, batch, package and document details |
| Documents | `GET /supplier-portal/documents`, `POST /supplier-portal/documents/upload` | Supplier-uploaded documents and review status |
| Certificates | `GET /supplier-portal/certificates`, `POST /supplier-portal/certificates/upload` | Supplier certificates, verification status and expiry dates |
| Messages and CAPA | `GET/POST /supplier-portal/messages`, `GET /supplier-portal/capa`, `POST /supplier-portal/capa/{id}/respond` | Supplier communication and CAPA response workflow |
| Performance and Tasks | `GET /supplier-portal/performance`, `GET /supplier-portal/tasks` | Configurable supplier-visible scorecards and supplier-facing action queue |
| Reports | `GET /supplier-portal/reports/{report_type}` | Supplier-owned purchase order, delivery, document and certificate reports |
| Supplier Portal AI | `/ai/supplier-portal/*` | Risk center, delivery risk, document risk, certificate expiry, supplier quality risk, PO acknowledgement risk, message summary and draft actions |

## Reporting & Analytics Views

| View | Endpoint | Output |
| --- | --- | --- |
| Enablement | `GET /reports/enablement` | Company-level reporting flags for standard, custom, scheduled, export, dashboard and AI capabilities |
| Report Catalog | `GET /reports/catalog`, `GET /reports/catalog/{id}` | Standard reports across Inventory, Warehouse, Procurement, Production, Maintenance, Quality, Sales, Costing, Executive, Audit and AI Insights |
| Report Run | `POST /reports/run` | Role-scoped report rows, selected columns, summary and access-policy marker |
| Report Export | `POST /reports/export` | CSV, Excel or PDF export response with report run file metadata |
| Saved Reports | `GET/POST /reports/saved`, `GET/PUT/DELETE /reports/saved/{id}` | Saved report filters, columns, sorting, grouping, chart config and visibility |
| Scheduled Reports | `GET/POST /reports/schedules`, `PUT/DELETE /reports/schedules/{id}` | Email-first scheduled report definitions and recipients |
| Dashboards | `GET/POST /dashboards`, `GET/PUT /dashboards/{id}` | Dashboard definitions with KPI, trend, risk and action widgets |
| KPIs | `GET/POST /kpis`, `GET /kpis/{id}`, `POST /kpis/{id}/calculate` | KPI definitions and calculated snapshots |
| Analytics | `GET /analytics/trends`, `/cross-module`, `/action-insights` | Trend analysis, cross-module risk chains and owner/action recommendations |
| Reporting AI | `/ai/reporting/*` | Risk center, executive summary, root cause, anomalies, KPI insights, narrative and draft actions |

## Costing & Profitability Views

| View | Endpoint | Output |
| --- | --- | --- |
| Enablement and Dashboard | `GET /costing/enablement`, `GET /costing/dashboard` | Company costing flags, total inventory value, production cost, wastage, rework, scrap, maintenance, COPQ and variance alerts |
| Cost Centers | `GET/POST /cost-centers` | Production, maintenance, quality, warehouse, admin, sales, utility, machine, line and plant cost centers |
| Cost Elements | `GET/POST /cost-elements` | Material, labor, machine, overhead, maintenance, quality, logistics, wastage, rework and scrap elements |
| Inventory Costing | `GET /inventory-costing`, `POST /inventory-costing/calculate` | FIFO/weighted/standard/actual cost valuation by item, batch, status and quantity |
| Landed Cost | `GET /landed-cost`, `POST /landed-cost/calculate` | Purchase cost plus freight, duty, tax, handling, inspection and other charges |
| Production Costing | `GET /production-costing`, `POST /production-costing/calculate` | Planned cost, actual cost, variance percent and cost per unit |
| Maintenance and Quality Costing | `GET/POST /maintenance-costing`, `GET/POST /quality-costing` | Work order, downtime, production loss, COPQ, supplier quality and CAPA costs |
| Allocation and Standard Cost | `GET/POST /cost-allocation-rules`, `GET/POST /standard-costs`, `POST /standard-costs/{id}/approve` | Allocation rules and approval-gated standard cost master |
| Variance and Profitability | `GET/POST /cost-variance`, `/profitability/products`, `/customers`, `/plants` | Cost variances and product, customer and plant profitability |
| Reports | `/costing/reports/*` | Inventory valuation, production cost, wastage cost and profitability reports |
| Costing AI | `/ai/costing/*` | Risk center, cost increase, low margin, customer profitability, wastage, production variance, supplier cost, optimization and draft actions |

## Mobile Operations Views

| View | Endpoint | Output |
| --- | --- | --- |
| Enablement/Auth/Devices | `/mobile/enablement`, `/mobile/auth/*`, `/mobile/devices/*` | Company mobile flags, mobile JWT flow, refresh/logout, device registration and disable |
| My Work | `GET /mobile/my-work` | Tasks, approvals, work orders, inspections, counts, receipts, production updates, alerts and sync status |
| Tasks and Approvals | `/mobile/tasks/*`, `/mobile/approvals/*` | Start/comment/complete/block tasks and approve/reject approvals |
| Scan Resolver | `POST /mobile/scan/resolve` | Entity type, entity id, display name, allowed actions and warnings |
| Inventory Mobile | `/mobile/inventory/receipts`, `/transfers`, `/counts` | Receiving, transfer, counting, variance and idempotent mobile write flow |
| Warehouse Mobile | `/mobile/warehouse/movements`, `/locations/{id}`, `/search` | Bin movement, location detail and mobile search |
| Production Mobile | `/mobile/production/orders/*` | Start production, daily log, material consumption and completion |
| Maintenance Mobile | `/mobile/maintenance/work-orders/*` | Work order start, spares, photos and completion |
| Quality Mobile | `/mobile/quality/inspections/*` | Checklist result submission, defect photos and completion |
| Dispatch and Uploads | `/mobile/dispatch/*`, `/mobile/uploads` | Pick, pack, online dispatch confirmation and file metadata upload |
| Offline Sync | `/mobile/sync/push`, `/pull`, `/status` | Offline action processing, idempotency, duplicate/conflict/high-risk rejection and pull payload |
| Mobile AI | `/ai/mobile/*` | Risk center, scan validation, count assist, maintenance assist, quality assist, next action and draft actions |

## Main Inventory Module Views

| View | Endpoint | Output |
| --- | --- | --- |
| Inventory Dashboard | `GET /inventory/dashboard` | Total inventory value, available/reserved stock, low-stock risks, expiry risks, blocked stock, warehouse occupancy |
| Inventory Items | `GET /inventory/items` | Raw materials, WIP, finished goods, consumables and spare parts |
| Category View | `GET /inventory/items/by-category` | Items grouped by category |
| Tracking Types | `GET /inventory/tracking-types` | None, batch, serial and batch+serial counts |
| Stock Location | `GET /inventory/locations` | Plant, warehouse, zone, rack, shelf, bin and exact product location |
| 2D Warehouse Map | `GET /inventory/warehouse-map` | Bin occupancy, searched item highlight, empty/full/congested areas |
| Batch and Serial | `GET /inventory/batches` | Batch number, serial number, supplier batch, manufacturing date, expiry date and status |
| Inventory Status | `GET /inventory/status` | Available, reserved, allocated, in transit, quarantine, rejected, expired, consumed, returned and damaged views |
| Reservations | `GET /inventory/reservations`, `POST /inventory/reservations` | Reserved stock for production, customer order, transfer and maintenance |
| Movement Ledger | `GET /inventory/movement-ledger`, `POST /inventory/movements` | Receiving, transfer, adjustment, consumption, return, damage, write-off and scrap audit trail |
| Stock Counting | `GET /inventory/stock-counts`, `POST /inventory/stock-counts` | Manual, cycle, barcode, QR and blind counts with variance/approval |
| Expiry and Aging | `GET /inventory/expiry-aging` | Expiring soon, expired, non-moving, slow-moving and suggested actions |
| Procurement Recommendations | `GET /inventory/procurement-recommendations` | Low stock, reorder level, safety stock, supplier lead time and purchase request draft |
| Supplier Links | `GET /inventory/supplier-links` | Primary, backup and emergency supplier data |
| Inventory Costs | `GET /inventory/costs` | FIFO costing, valuation, wastage, damaged stock cost and expiry loss |
| Reports | `GET /inventory/reports` | Status, aging, valuation, movement, occupancy and supplier performance reports |
| Mobile Inventory | `POST /inventory/mobile/scan` | Receive, move, scan, count, upload photos, offline queue and sync status |

## Inventory AI Service Views

| AI View | Endpoint | Output |
| --- | --- | --- |
| Inventory Risk Center | `GET /inventory-ai/risk-center` | Low stock, stockout, supplier delay, production, expiry and dead stock risks |
| Shortage Prediction | `GET /inventory-ai/shortage-prediction` | Available quantity, days remaining, expected stockout date and risk level |
| Overstock Prediction | `GET /inventory-ai/overstock` | Excess quantity and overstock risk |
| Procurement Recommendation | `GET /inventory-ai/procurement-recommendations` | Recommended order quantity/date, supplier priority and draft action |
| Expiry Intelligence | `GET /inventory-ai/expiry-intelligence` | Days to expiry, quantity at risk and recommended action |
| Dead Stock Detection | `GET /inventory-ai/dead-stock` | Dead stock status, days without movement and financial risk |
| Production Impact | `GET /inventory-ai/production-impact` | Can produce, shortage items and production delay risk |
| Inventory Optimization | `GET /inventory-ai/optimization` | Draft recommendations to increase/reduce safety stock, transfer, reorder or consume expiring batch first |

## Inventory Data Flow

```mermaid
flowchart TD
    Swagger["Swagger / API Client"] --> Route["Inventory Route app/modules/inventory.py"]
    Route --> Validate["Request Validation app/schemas.py"]
    Validate --> Store["Demo Data app/store.py"]
    Store --> Transform["Endpoint Business Logic"]
    Transform --> ApiResult["ApiResult Wrapper"]
    ApiResult --> Output["Final JSON Output"]

    Store --> Items["inventory_items"]
    Store --> Balances["balances"]
    Store --> Locations["locations"]
    Store --> Batches["batches"]
    Store --> Reservations["reservations"]
    Store --> Movements["seed_movements + movements"]
    Store --> Counts["stock_counts"]
    Store --> Suppliers["supplier_links"]
    Store --> Costs["fifo_layers + unit_cost"]
```

## Platform Data Flow

```mermaid
flowchart TD
    Client["Swagger / Client"] --> Router["Core or Module Router"]
    Router --> Schema["Pydantic Request Schema"]
    Schema --> FeatureCheck["Feature Flag / Scope Check"]
    FeatureCheck --> Session["SQLAlchemy Session"]
    Session --> Models["Platform Models"]
    Models --> DB["PostgreSQL or SQLite"]
    Router --> Audit["Audit Log"]
    Router --> Response["Pydantic / JSON Response"]
    Response --> Client
```

## Production Data Flow

```mermaid
flowchart TD
    Client["Swagger / API Client"] --> ProdRoute["Production Router app/modules/production.py"]
    ProdRoute --> ProdSchemas["Pydantic Schemas app/modules/production_schemas.py"]
    ProdSchemas --> ProdRepo["Seeded Repository app/modules/production_repository.py"]
    ProdRepo --> ProdService["Service Layer app/modules/production_service.py"]
    ProdService --> MRP["MRP Calculation"]
    ProdService --> Reservation["Partial Reservation and Shortage Tracking"]
    ProdService --> Schedule["Scheduling and Conflict Detection"]
    ProdService --> Execution["Logs, Consumption, Downtime and Completion"]
    ProdService --> Costing["Costing and Variance"]
    ProdService --> Reports["Reports and Dashboard"]
    ProdService --> ProdAI["Production AI Recommendations"]
    ProdAI --> Approval["Human Approval Required"]
    Reports --> Output["Final JSON Output"]
    Costing --> Output
    Approval --> Output
```

## Maintenance Data Flow

```mermaid
flowchart TD
    Client["Swagger / API Client"] --> MaintRoute["Maintenance Router app/modules/maintenance.py"]
    MaintRoute --> MaintSchemas["Pydantic Schemas app/modules/maintenance_schemas.py"]
    MaintSchemas --> MaintRepo["Seeded Repository app/modules/maintenance_repository.py"]
    MaintRepo --> MaintService["Service Layer app/modules/maintenance_service.py"]
    MaintService --> Approval["Risk-Based Approval Model"]
    MaintService --> Spares["Spare Reservation / Consumption"]
    MaintService --> Downtime["Downtime and Shutdown Window Logic"]
    MaintService --> History["Machine History and Lifecycle"]
    MaintService --> Costing["Maintenance Costing"]
    MaintService --> Reports["Dashboard / Reports / MTTR / MTBF"]
    MaintService --> MaintAI["Maintenance AI Recommendations"]
    MaintAI --> HumanApproval["Human Approval Required"]
    Reports --> Output["Final JSON Output"]
    Costing --> Output
    HumanApproval --> Output
```

## Quality Data Flow

```mermaid
flowchart TD
    Client["Swagger / API Client"] --> QualRoute["Quality Router app/modules/quality.py"]
    QualRoute --> QualSchemas["Pydantic Schemas app/modules/quality_schemas.py"]
    QualSchemas --> QualRepo["Seeded Repository app/modules/quality_repository.py"]
    QualRepo --> QualService["Service Layer app/modules/quality_service.py"]
    QualService --> Plans["Plans / Checklists / Sampling"]
    QualService --> Inspection["Inspection Execution"]
    Inspection --> Decision["Pass / Fail Decision"]
    Decision --> Release["Approve / Release"]
    Decision --> Blocked["Quarantine / Rework / Reject / Scrap"]
    QualService --> Capa["CAPA / RCA"]
    QualService --> Metrics["KPIs / Reports / Cost of Poor Quality"]
    QualService --> QualAI["Quality AI Recommendations"]
    QualAI --> HumanApproval["Human Approval Required"]
    Metrics --> Output["Final JSON Output"]
    Blocked --> Output
    HumanApproval --> Output
```

## Sales Data Flow

```mermaid
flowchart TD
    Client["Swagger / API Client"] --> SalesRoute["Sales Router app/modules/sales.py"]
    SalesRoute --> SalesSchemas["Pydantic Schemas app/modules/sales_schemas.py"]
    SalesSchemas --> SalesRepo["Seeded Repository app/modules/sales_repository.py"]
    SalesRepo --> SalesService["Service Layer app/modules/sales_service.py"]
    SalesService --> Availability["Finished Goods Availability Formula"]
    Availability --> Reservation["Customer Reservation / Protected Allocation"]
    Reservation --> Partial["Partial Allocation / Production Recommendation"]
    SalesService --> Dispatch["Dispatch Order / Pick List / Shipment"]
    SalesService --> Returns["Returns / Quality Inspection Link"]
    SalesService --> Metrics["KPIs / Reports / Dashboard"]
    SalesService --> SalesAI["Sales AI Recommendations"]
    SalesAI --> HumanApproval["Human Approval Required"]
    Metrics --> Output["Final JSON Output"]
    Dispatch --> Output
    HumanApproval --> Output
```

## Customer Portal Data Flow

```mermaid
flowchart TD
    ExternalUser["External Customer User"] --> PortalRoute["Customer Portal Router app/modules/customer_portal.py"]
    PortalRoute --> PortalSchemas["Pydantic Schemas app/modules/customer_portal_schemas.py"]
    PortalSchemas --> PortalService["Service Layer app/modules/customer_portal_service.py"]
    PortalService --> Scope["Tenant / Company / Customer Scope Check"]
    Scope --> SalesData["Sales Orders / Shipments / Returns"]
    Scope --> Docs["Shared Customer Documents Only"]
    Scope --> Support["Support / Return Requests"]
    PortalService --> Audit["Customer Portal Audit Log"]
    PortalService --> PortalAI["Customer Portal AI Recommendations"]
    PortalAI --> HumanApproval["Human Approval Required"]
    SalesData --> SafeOutput["Customer-Safe JSON Output"]
    Docs --> SafeOutput
    Support --> SafeOutput
    HumanApproval --> SafeOutput
```

## Supplier Portal Data Flow

```mermaid
flowchart TD
    ExternalSupplier["External Supplier User"] --> SupplierRoute["Supplier Portal Router app/modules/supplier_portal.py"]
    SupplierRoute --> SupplierSchemas["Pydantic Schemas app/modules/supplier_portal_schemas.py"]
    SupplierSchemas --> SupplierService["Service Layer app/modules/supplier_portal_service.py"]
    SupplierService --> Enablement["Company Feature Flags / Supplier RBAC"]
    Enablement --> Scope["Company / Supplier Scope Check"]
    Scope --> POs["Supplier-Owned Purchase Orders"]
    Scope --> Deliveries["Acknowledgements / Delivery Confirmations / ASN"]
    Scope --> Docs["Supplier Documents / Certificates"]
    Scope --> Messages["Messages / CAPA / Notifications"]
    Scope --> ScoreTasks["Performance / Supplier Tasks"]
    SupplierService --> Audit["Supplier Portal Audit Log"]
    SupplierService --> SupplierAI["Supplier Portal AI Recommendations"]
    SupplierAI --> HumanApproval["Human Approval Required"]
    POs --> SafeOutput["Supplier-Safe JSON Output"]
    Deliveries --> SafeOutput
    Docs --> SafeOutput
    Messages --> SafeOutput
    ScoreTasks --> SafeOutput
    HumanApproval --> SafeOutput
```

## Reporting & Analytics Data Flow

```mermaid
flowchart TD
    Client["Swagger / API Client"] --> ReportingRoute["Reporting Router app/modules/reporting.py"]
    ReportingRoute --> ReportingSchemas["Pydantic Schemas app/modules/reporting_schemas.py"]
    ReportingSchemas --> ReportingService["Service Layer app/modules/reporting_service.py"]
    ReportingService --> FeatureFlags["Company Reporting Feature Flags"]
    FeatureFlags --> Access["Tenant / Company / Role Access Check"]
    Access --> Catalog["Report Catalog"]
    Access --> Runner["Report Run Engine"]
    Runner --> Export["CSV / Excel / PDF Export Flow"]
    Runner --> Saved["Saved / Scheduled Reports"]
    ReportingService --> Dashboards["Dashboards / Widgets"]
    ReportingService --> Kpis["KPI Calculation / Snapshots"]
    ReportingService --> Analytics["Trends / Cross-Module / Action Insights"]
    ReportingService --> ReportingAI["Reporting AI Recommendations"]
    ReportingAI --> HumanApproval["Human Approval Required"]
    Catalog --> Output["Final JSON Output"]
    Export --> Output
    Kpis --> Output
    Analytics --> Output
    HumanApproval --> Output
```

## Costing & Profitability Data Flow

```mermaid
flowchart TD
    Client["Swagger / API Client"] --> CostRoute["Costing Router app/modules/costing.py"]
    CostRoute --> CostSchemas["Pydantic Schemas app/modules/costing_schemas.py"]
    CostSchemas --> CostService["Service Layer app/modules/costing_service.py"]
    CostService --> FeatureFlags["Company Costing Feature Flags"]
    FeatureFlags --> SensitiveAccess["Company / Plant / Role Cost Access"]
    SensitiveAccess --> Masters["Cost Centers / Cost Elements"]
    SensitiveAccess --> InventoryValuation["Inventory Valuation / Landed Cost"]
    SensitiveAccess --> ProductionCosting["Production / Maintenance / Quality Costing"]
    SensitiveAccess --> Variance["Standard Cost / Actual Cost / Variance"]
    SensitiveAccess --> Profitability["Product / Customer / Plant Profitability"]
    CostService --> Reports["Costing Dashboard / Reports"]
    CostService --> CostAI["Costing AI Recommendations"]
    CostAI --> HumanApproval["Human Approval Required"]
    Masters --> Output["Final JSON Output"]
    InventoryValuation --> Output
    ProductionCosting --> Output
    Variance --> Output
    Profitability --> Output
    Reports --> Output
    HumanApproval --> Output
```

## Mobile Operations Data Flow

```mermaid
flowchart TD
    MobileUser["Shop-floor / Warehouse / Technician Mobile User"] --> MobileRoute["Mobile Router app/modules/mobile.py"]
    MobileRoute --> MobileSchemas["Pydantic Schemas app/modules/mobile_schemas.py"]
    MobileSchemas --> MobileService["Service Layer app/modules/mobile_service.py"]
    MobileService --> Flags["Company Mobile Feature Flags"]
    Flags --> DeviceAuth["Mobile Auth / Device Session"]
    DeviceAuth --> Work["My Work / Tasks / Approvals"]
    DeviceAuth --> Scan["Barcode / QR Scan Resolver"]
    DeviceAuth --> Workflow["Inventory / Warehouse / Production / Maintenance / Quality / Dispatch Actions"]
    DeviceAuth --> Uploads["Photo / Document Upload Metadata"]
    DeviceAuth --> Offline["Offline Sync Push / Pull / Status"]
    Offline --> Idempotency["Idempotency / Duplicate Detection"]
    Offline --> Conflicts["Conflict Detection / High-Risk Offline Rejection"]
    MobileService --> Audit["Mobile Audit Log"]
    MobileService --> MobileAI["Mobile AI Recommendations"]
    MobileAI --> HumanApproval["Human Approval Required"]
    Work --> Output["Final JSON Output"]
    Scan --> Output
    Workflow --> Output
    Uploads --> Output
    Conflicts --> Output
    HumanApproval --> Output
```

## Inventory AI Data Flow

```mermaid
flowchart TD
    Client["Swagger / API Client"] --> AIRoute["AI Route inventory-ai-service/app/routes.py"]
    AIRoute --> AISchemas["Validate Query Parameters and Response Schemas"]
    AIRoute --> DB["SQLAlchemy Session"]
    DB --> Signals["InventorySignal Rows"]
    Signals --> Engine["Rule-Based AI Engine"]
    Engine --> Rules["Risk Rules"]
    Engine --> Drafts["Draft Recommendations"]
    Drafts --> HumanApproval["Human Approval Required"]
    Engine --> AIOutput["Risk and Recommendation JSON"]
    AIOutput --> Client
```

## Code Flow

```mermaid
sequenceDiagram
    participant U as User
    participant P as Platform API :8000
    participant C as Core Router
    participant K as Costing Router
    participant I as Inventory Router
    participant R as Production Router
    participant M as Maintenance Router
    participant MO as Mobile Router
    participant Q as Quality Router
    participant B as Reporting Router
    participant X as Sales Router
    participant CP as Customer Portal Router
    participant SP as Supplier Portal Router
    participant S as Store / SQLAlchemy
    participant A as Inventory AI Service :8100
    participant E as AI Engine
    participant D as AI Database
    participant O as JSON Output

    U->>P: Login or request platform data
    P->>C: Route core/module request
    C->>S: Validate, check feature flag, read/write records
    S-->>C: Return platform data
    C-->>O: Return platform JSON

    U->>P: Request /production-costing/calculate
    P->>K: Route costing request
    K->>S: Read seeded cost masters and transactional cost signals
    S-->>K: Return inventory, production, maintenance, quality and profitability cost data
    K-->>O: Return cost calculation, variance and profitability JSON

    U->>P: Request /inventory/dashboard
    P->>I: Route inventory request
    I->>S: Read inventory data
    S-->>I: Return balances, batches, locations
    I-->>O: Return inventory JSON

    U->>P: Request /production/orders/po-demo-001/material-requirements
    P->>R: Route production request
    R->>S: Read order, BOM and inventory signals
    S-->>R: Return production seed data
    R-->>O: Return MRP and shortage JSON

    U->>P: Request /maintenance/dashboard
    P->>M: Route maintenance request
    M->>S: Read machines, plans, work orders, spares and downtime
    S-->>M: Return maintenance seed data
    M-->>O: Return dashboard, MTTR, MTBF and risk JSON

    U->>P: Request /mobile/sync/push
    P->>MO: Route mobile sync request
    MO->>S: Read device, offline actions, idempotency keys and conflicts
    S-->>MO: Return mobile seed data and sync rules
    MO-->>O: Return accepted, rejected, duplicate or review sync results

    U->>P: Request /quality/inspection-lots/lot-incoming-001/submit
    P->>Q: Route quality request
    Q->>S: Read lot, checklist, defects and quality rules
    S-->>Q: Return quality seed data
    Q-->>O: Return inspection decision and quarantine/rework JSON

    U->>P: Request /reports/run
    P->>B: Route reporting request
    B->>S: Read catalog, feature flags, KPIs and analytics data
    S-->>B: Return scoped reporting seed data
    B-->>O: Return report rows, summary and export metadata

    U->>P: Request /sales-orders/so-001/reserve
    P->>X: Route sales request
    X->>S: Read order, line items, finished goods and protected reservations
    S-->>X: Return sales seed data
    X-->>O: Return reservation, partial allocation and production recommendation JSON

    U->>P: Request /customer-portal/orders
    P->>CP: Route customer portal request
    CP->>S: Read portal user and customer-owned sales orders
    S-->>CP: Return scoped portal data
    CP-->>O: Return customer-safe order tracking JSON

    U->>P: Request /supplier-portal/purchase-orders
    P->>SP: Route supplier portal request
    SP->>S: Read portal user and supplier-owned purchase orders
    S-->>SP: Return scoped supplier portal data
    SP-->>O: Return supplier-safe purchase order JSON

    U->>A: Request /inventory-ai/risk-center
    A->>D: Load inventory signals
    D-->>A: Return SQLAlchemy rows
    A->>E: Run rule-based analysis
    E-->>A: Risks and draft actions
    A-->>O: Return AI recommendation JSON
    O-->>U: Show output in Swagger/client
```

## Human Approval Boundary

```mermaid
flowchart LR
    AI["AI / Rule Engine"] --> Draft["Draft Recommendation"]
    Draft --> Review["Human Review"]
    Review --> Approve["Approve"]
    Review --> Reject["Reject"]
    Approve --> Execute["Operational Module Executes Action"]
    Reject --> Archive["Keep Audit Trail"]
```

Maintenance-specific AI safety:

- AI can create draft work orders, spare purchase requests, schedule changes, investigation tasks and vendor service requests.
- AI cannot close work orders, approve maintenance, consume spares, change production schedules or release machines as available.

Quality-specific AI safety:

- AI can create draft CAPA, defect investigation tasks, supplier quality reviews, rework tasks, quarantine reviews and customer quality responses.
- AI cannot approve releases, scrap inventory, release quarantine, close CAPA, reject suppliers or dispatch affected goods.

Sales-specific AI safety:

- AI can create draft production requests, inventory transfer requests, customer delay emails, dispatch priority tasks, return investigation tasks and demand forecast reports.
- AI cannot confirm sales orders, reassign protected inventory, dispatch goods, approve returns, issue credit or change customer pricing.

Customer Portal-specific AI safety:

- AI can create draft customer delay emails, support responses, return review tasks, quality complaint investigations, document upload tasks and escalation tasks.
- AI cannot approve returns, issue credit, cancel orders, promise delivery dates, release internal information or send external customer emails without approval.

Supplier Portal-specific AI safety:

- AI can create draft supplier follow-ups, document reminders, certificate renewal reminders, CAPA review tasks, delivery escalation tasks and message summaries.
- AI cannot approve suppliers or certificates, change purchase orders, accept supplier delivery dates, send purchase orders, commit financial actions or replace suppliers automatically.

Reporting-specific AI safety:

- AI can create draft tasks, draft approval requests, draft investigations, draft email summaries and draft report notes.
- AI cannot approve decisions, change source data, send external email without approval, modify financial records, release inventory or dispatch goods.

Costing-specific AI safety:

- AI can create draft cost review tasks, supplier price reviews, product pricing reviews, wastage investigations, maintenance cost reviews and margin alert emails.
- AI cannot change product prices, change supplier contracts, approve cost allocation, write off inventory, change standard cost or modify financial records.

Mobile-specific AI safety:

- AI can suggest next actions, warn about wrong scans, explain task priority, suggest maintenance/quality guidance, summarize work orders and create draft notes or escalations.
- AI cannot approve, release inventory, close critical work orders, dispatch goods, override reservations or write off inventory.
