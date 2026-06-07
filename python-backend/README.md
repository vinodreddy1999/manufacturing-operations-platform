# Python Backend

This folder contains a Python/FastAPI backend version of the Manufacturing Operations Platform modules.

It is added alongside the existing TypeScript/NestJS backend so you can run and inspect the platform modules in Python.

## Modules Included

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
- AI
- Supply Chain

## Run Locally

```bash
cd python-backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Open:

- API health: `http://localhost:8000/health`
- Swagger docs: `http://localhost:8000/docs`
- Module registry: `http://localhost:8000/modules`

## Demo Login

Use this JSON with `POST /auth/login`:

```json
{
  "tenant_slug": "precision-components",
  "email": "admin@mop.local",
  "password": "ChangeMe123!"
}
```

The app uses in-memory sample data so it runs without PostgreSQL. For production, replace `app/store.py` with a database-backed repository layer.
