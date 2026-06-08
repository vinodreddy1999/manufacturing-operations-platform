# End-to-End Scheme Diagram

This diagram shows how the Python-only Manufacturing Operations Platform works after the Inventory module expansion. The API still starts in `app/main.py`, but Inventory now has its own router in `app/modules/inventory.py`.

```mermaid
flowchart LR
    User["User / Operator"] --> Browser["Browser or API Client"]
    Browser --> Docs["Swagger UI /docs"]
    Browser --> API["FastAPI App app/main.py"]

    API --> Health["Health Check /health"]
    API --> Modules["Module Registry /modules"]
    API --> Auth["Auth /auth/login"]

    Auth --> Token["JWT Demo Token"]
    Auth --> Tenant["Tenant Context precision-components"]

    API --> Platform["Platform Module"]
    API --> InventoryRouter["Inventory Router app/modules/inventory.py"]
    API --> Warehouse["Warehouse Module"]
    API --> Supplier["Supplier Module"]
    API --> Procurement["Procurement Module"]
    API --> Production["Production Module"]
    API --> Maintenance["Maintenance Module"]
    API --> Quality["Quality Module"]
    API --> Reporting["Reporting Module"]
    API --> SupplyChain["Supply Chain Module"]
    API --> AI["AI Module"]

    InventoryRouter --> InvDashboard["Dashboard /inventory/dashboard"]
    InventoryRouter --> InvItems["Items and Categories /inventory/items"]
    InventoryRouter --> InvLocation["Locations /inventory/locations"]
    InventoryRouter --> InvMap["2D Warehouse Map /inventory/warehouse-map"]
    InventoryRouter --> InvBatch["Batch and Serial /inventory/batches"]
    InventoryRouter --> InvStatus["Status /inventory/status"]
    InventoryRouter --> InvReserve["Reservations /inventory/reservations"]
    InventoryRouter --> InvLedger["Movement Ledger /inventory/movement-ledger"]
    InventoryRouter --> InvCounts["Stock Counts /inventory/stock-counts"]
    InventoryRouter --> InvAging["Expiry and Aging /inventory/expiry-aging"]
    InventoryRouter --> InvProc["Procurement Recommendations /inventory/procurement-recommendations"]
    InventoryRouter --> InvSupplier["Supplier Links /inventory/supplier-links"]
    InventoryRouter --> InvCost["Costs /inventory/costs"]
    InventoryRouter --> InvReports["Reports /inventory/reports"]
    InventoryRouter --> InvMobile["Mobile Scan /inventory/mobile/scan"]

    Platform --> Store["In-Memory Demo Store app/store.py"]
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

    Store --> Response["Pydantic Response Models app/schemas.py"]
    Response --> JSON["JSON API Output"]
    JSON --> Browser
```

## Runtime Flow

1. User opens Swagger at `http://localhost:8000/docs` or calls the API from another client.
2. FastAPI receives the request in `app/main.py`.
3. `app/main.py` forwards Inventory requests to `app/modules/inventory.py`.
4. Request data is validated using Pydantic classes from `app/schemas.py`.
5. The selected endpoint reads or writes demo data in `app/store.py`.
6. The API returns structured JSON output using the common `ApiResult` response model.

## Inventory Module Views

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

## Code Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as FastAPI app/main.py
    participant I as Inventory router
    participant S as schemas.py
    participant D as store.py
    participant O as JSON Output

    U->>F: Send Inventory API request
    F->>I: Route /inventory/* request
    I->>S: Validate request body if POST
    I->>D: Read or update inventory data
    D-->>I: Return item, balance, batch, location or ledger data
    I->>S: Format ApiResult response
    I-->>O: Return JSON response
    O-->>U: Show output in Swagger/client
```
