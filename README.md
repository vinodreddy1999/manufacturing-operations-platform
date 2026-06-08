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
