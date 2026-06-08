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
  ai_copilot/         AIProvider, MockAIProvider and optional OpenAIProvider interface
  jobs.py             Celery jobs for reports, AI risk scans, expiry/dead stock checks
alembic/              Migration environment and first foundation migration
requirements.txt
Dockerfile
docker-compose.yml
.github/workflows/ci.yml
```

The current version uses in-memory sample data so every module can run immediately without database setup. A database layer can be added later behind `app/store.py`.

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
