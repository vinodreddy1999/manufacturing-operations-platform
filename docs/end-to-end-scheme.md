# End-to-End Scheme Diagram

This diagram shows how the Python-only Manufacturing Operations Platform works from user request to backend module output.

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
    API --> Inventory["Inventory Module"]
    API --> Warehouse["Warehouse Module"]
    API --> Supplier["Supplier Module"]
    API --> Procurement["Procurement Module"]
    API --> Production["Production Module"]
    API --> Maintenance["Maintenance Module"]
    API --> Quality["Quality Module"]
    API --> Reporting["Reporting Module"]
    API --> SupplyChain["Supply Chain Module"]
    API --> AI["AI Module"]

    Platform --> Store["In-Memory Demo Store app/store.py"]
    Inventory --> Store
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

    Inventory --> InvOut["Items, Balances, Movements"]
    Warehouse --> WhOut["Locations and Bin Occupancy"]
    Supplier --> SupOut["Supplier Ratings"]
    Procurement --> ProcOut["Purchase Requisitions"]
    Production --> ProdOut["Production Orders"]
    Maintenance --> MaintOut["Work Orders"]
    Quality --> QualOut["Inspections"]
    Reporting --> RepOut["KPIs"]
    SupplyChain --> ScOut["Forecast and Load Plan"]
    AI --> AiOut["Draft Recommendations"]
```

## Runtime Flow

1. User opens Swagger at `http://localhost:8000/docs` or calls the API from another client.
2. FastAPI receives the request in `app/main.py`.
3. Request data is validated using Pydantic classes from `app/schemas.py`.
4. The selected backend module reads or writes demo data in `app/store.py`.
5. The API returns structured JSON output using the common `ApiResult` response model.

## Code Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as FastAPI app/main.py
    participant S as schemas.py
    participant D as store.py
    participant O as JSON Output

    U->>F: Send API request
    F->>S: Validate request body
    F->>D: Read or update module data
    D-->>F: Return Python dict/list
    F->>S: Format response model
    F-->>O: Return JSON response
    O-->>U: Show output in Swagger/client
```
