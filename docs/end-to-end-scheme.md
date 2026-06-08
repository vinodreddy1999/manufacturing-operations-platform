# End-to-End Scheme Diagram

This diagram shows the current Python-only Manufacturing Operations Platform after adding the modular platform foundation, expanded Inventory module, and separate `inventory-ai-service/` microservice.

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
    PlatformAPI --> InventoryRouter["Inventory Router app/modules/inventory.py"]
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
    GenericModules --> Production["Production"]
    GenericModules --> Maintenance["Maintenance"]
    GenericModules --> Quality["Quality"]
    GenericModules --> Sales["Sales"]

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
    GenericModules --> Audit
    InventoryRouter --> Audit
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
7. Generic module routers store warehouse, procurement, production, maintenance, quality, and sales records in `ModuleRecord`.
8. Inventory requests go through `app/modules/inventory.py`.
9. Inventory data is validated with Pydantic schemas and returned as structured JSON.
10. Background jobs are prepared in `app/jobs.py` using Celery and Redis.
11. User opens the Inventory AI service Swagger at `http://127.0.0.1:8100/docs`.
12. Inventory AI requests go through `inventory-ai-service/app/routes.py`.
13. AI routes call rule-based logic in `ai_engine.py`, `risk_rules.py`, and `recommendations.py`.
14. AI returns analysis, risk levels, recommendations, and draft actions only.
15. Human approval is required before any critical operational action.

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
| Migrations | `alembic/` | Alembic migration scaffold |
| Docker | `docker-compose.yml` | PostgreSQL, Redis, main API and worker services |

## Generic Backend Applications

| Application | Endpoint Family | Current Behavior |
| --- | --- | --- |
| Warehouse | `/warehouses`, `/warehouse-locations`, `/warehouse-movements`, `/warehouse-occupancy` | Stores module records after feature flag validation |
| Procurement | `/suppliers`, `/purchase-requisitions`, `/purchase-orders` | Stores supplier and purchasing module records |
| Production | `/products`, `/bom`, `/routing`, `/production-orders`, `/production-schedules` | Stores manufacturing planning and execution records |
| Maintenance | `/machines`, `/maintenance-plans`, `/work-orders` | Stores equipment and maintenance records |
| Quality | `/quality/inspections`, `/quality/quarantine`, `/quality/rework`, `/quality/capa` | Stores inspection, quarantine, rework and corrective action records |
| Sales | `/customers`, `/sales-orders` | Stores customer and order records |
| Inventory | `/inventory/*` | Expanded dedicated inventory module with operational views |
| Inventory AI | `/inventory-ai/*` | Separate AI/rule-based intelligence service |

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
    participant I as Inventory Router
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

    U->>P: Request /inventory/dashboard
    P->>I: Route inventory request
    I->>S: Read inventory data
    S-->>I: Return balances, batches, locations
    I-->>O: Return inventory JSON

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
