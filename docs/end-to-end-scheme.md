# End-to-End Scheme Diagram

This diagram shows the current Python-only Manufacturing Operations Platform after adding the expanded Inventory module and the separate `inventory-ai-service/` microservice.

There are now two FastAPI services:

- Main platform API: `http://127.0.0.1:8000/docs`
- Inventory AI service: `http://127.0.0.1:8100/docs`

The AI service is recommendation-only. It analyzes risk, creates draft actions, and requires human approval for critical actions. It does not automatically move stock, create purchase orders, change production, write off inventory, or execute supplier actions.

```mermaid
flowchart LR
    User["User / Operator"] --> Browser["Browser or API Client"]
    Browser --> PlatformDocs["Platform Swagger /docs :8000"]
    Browser --> AiDocs["Inventory AI Swagger /docs :8100"]

    PlatformDocs --> PlatformAPI["Main FastAPI App app/main.py"]
    AiDocs --> AiAPI["Inventory AI FastAPI inventory-ai-service/app/main.py"]

    PlatformAPI --> Health["Health /health"]
    PlatformAPI --> Modules["Module Registry /modules"]
    PlatformAPI --> Auth["Auth /auth/login"]
    Auth --> Token["JWT Demo Token"]
    Auth --> Tenant["Tenant Context precision-components"]

    PlatformAPI --> Platform["Platform Module"]
    PlatformAPI --> InventoryRouter["Inventory Router app/modules/inventory.py"]
    PlatformAPI --> Warehouse["Warehouse Module"]
    PlatformAPI --> Supplier["Supplier Module"]
    PlatformAPI --> Procurement["Procurement Module"]
    PlatformAPI --> Production["Production Module"]
    PlatformAPI --> Maintenance["Maintenance Module"]
    PlatformAPI --> Quality["Quality Module"]
    PlatformAPI --> Reporting["Reporting Module"]
    PlatformAPI --> SupplyChain["Supply Chain Module"]
    PlatformAPI --> AI["General AI Module"]

    InventoryRouter --> InvDashboard["Dashboard /inventory/dashboard"]
    InventoryRouter --> InvItems["Items and Categories"]
    InventoryRouter --> InvLocation["Locations and Warehouse Map"]
    InventoryRouter --> InvBatch["Batch and Serial Tracking"]
    InventoryRouter --> InvStatus["Status and Reservations"]
    InventoryRouter --> InvLedger["Movement Ledger and Counts"]
    InventoryRouter --> InvAging["Expiry, Aging and Costs"]
    InventoryRouter --> InvReports["Reports and Mobile Scan"]

    Platform --> Store["Platform Demo Store app/store.py"]
    InventoryRouter --> Store
    Warehouse --> Store
    Supplier --> Store
    Procurement --> Store
    Production --> Store
    Maintenance --> Store
    Quality --> Store
    Reporting --> Store
    SupplyChain --> Store
    AI --> Store

    Store --> PlatformSchemas["Platform Pydantic Schemas app/schemas.py"]
    PlatformSchemas --> PlatformJSON["Platform JSON Output"]
    PlatformJSON --> Browser

    AiAPI --> AiRoutes["AI Routes inventory-ai-service/app/routes.py"]
    AiRoutes --> AiEngine["Rule-Based AI Engine app/ai_engine.py"]
    AiEngine --> RiskRules["Risk Rules app/risk_rules.py"]
    AiEngine --> Recommendations["Draft Recommendations app/recommendations.py"]
    AiRoutes --> AiSchemas["AI Pydantic Schemas app/schemas.py"]
    AiRoutes --> AiModels["SQLAlchemy Models app/models.py"]
    AiModels --> AiDB["PostgreSQL via Docker or SQLite local fallback"]
    AiDB --> Seed["Seed Data app/seed_data.py"]
    AiEngine --> AiJSON["AI JSON Output and Draft Actions"]
    AiJSON --> Browser

    InventoryRouter -. "inventory signals / business context" .-> AiAPI
    AiJSON -. "recommendations only" .-> InventoryRouter
```

## Runtime Flow

1. User opens the main platform Swagger at `http://127.0.0.1:8000/docs`.
2. Main FastAPI receives platform requests in `app/main.py`.
3. `app/main.py` forwards Inventory requests to `app/modules/inventory.py`.
4. Inventory request data is validated using `app/schemas.py`.
5. Inventory endpoints read or write demo data in `app/store.py`.
6. Platform endpoints return structured JSON through the common `ApiResult` response model.
7. User opens the Inventory AI service Swagger at `http://127.0.0.1:8100/docs`.
8. Inventory AI requests go through `inventory-ai-service/app/routes.py`.
9. AI routes call rule-based logic in `ai_engine.py`, `risk_rules.py`, and `recommendations.py`.
10. SQLAlchemy models read seed/demo inventory signals from PostgreSQL or the local SQLite fallback.
11. AI returns analysis, risk levels, recommendations, and draft actions only.
12. Human approval is required before any critical operational action.

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
    participant I as Inventory router
    participant S as Platform store.py
    participant A as Inventory AI service :8100
    participant E as AI engine
    participant D as AI database
    participant O as JSON Output

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
