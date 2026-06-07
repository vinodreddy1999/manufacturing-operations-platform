# Python Backend Module Run Map

Run the Python backend from `python-backend`:

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

| Backend Application | Python Endpoint | Output |
| --- | --- | --- |
| Auth | `POST /auth/login` | JWT demo token and tenant context |
| Platform | `GET /platform/overview` | Tenant, company, plant and enabled modules |
| Inventory | `GET /inventory/items`, `GET /inventory/balances`, `POST /inventory/movements` | Item master, stock balance and stock movement output |
| Warehouse | `GET /warehouse/locations` | Warehouse bin/location occupancy |
| Supplier | `GET /supplier/suppliers` | Supplier ratings and reliability |
| Procurement | `POST /procurement/requisitions`, `GET /procurement/requisitions` | Purchase requisition workflow |
| Production | `POST /production/orders`, `GET /production/orders` | Production order schedule |
| Maintenance | `POST /maintenance/work-orders`, `GET /maintenance/work-orders` | Maintenance work order queue |
| Quality | `POST /quality/inspections`, `GET /quality/inspections` | Inspection history and results |
| Reporting | `GET /reporting/kpis` | Operational KPI output |
| Supply Chain | `POST /supply-chain/forecast`, `GET /supply-chain/load-plan` | Demand forecast and truck-load plan |
| AI | `POST /ai/recommendations` | Human-approved draft recommendations |

Swagger UI is available at `http://localhost:8000/docs`.
