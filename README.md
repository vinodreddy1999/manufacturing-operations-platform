# Manufacturing Operations Platform (MOP)

MOP is a modular, multi-tenant SaaS foundation for small and mid-sized manufacturers. It is designed as a configurable manufacturing operations platform rather than a monolithic ERP.

## GitHub Quick Start

This copy is prepared as a GitHub-ready repository. See:

- `GITHUB_SETUP.md` for upload, clone, Docker, and local run steps.
- `MODULE_RUN_MAP.md` for where each module lives and how module output flows through the system.
- `python-backend/README.md` for the Python/FastAPI backend version.

## Workspace Layout

- `docs/` - architecture, ERD, API specification, roadmap, deployment guide
- `apps/api/` - NestJS backend skeleton
- `apps/web/` - Next.js frontend skeleton
- `python-backend/` - Python/FastAPI backend implementation of the same business modules
- `packages/domain/` - shared domain constants and module definitions
- `prisma/` - Prisma schema and seed plan
- `infra/` - Docker, Kubernetes-ready, monitoring, and CI/CD artifacts

## Python Backend

A runnable Python backend is available in `python-backend/`. It includes Auth, Platform, Inventory, Warehouse, Supplier, Procurement, Production, Maintenance, Quality, Reporting, AI, and Supply Chain endpoints.

```bash
cd python-backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Open Swagger docs at `http://localhost:8000/docs`.

## Product Principles

- Company, plant, machine, and rule driven
- Module-based licensing and feature flags
- AI-assisted, not AI-controlled
- Email-first automation
- Mobile-first operations
- Configurable workflows
- Multi-tenant SaaS with strict isolation

## Implemented Foundation

This workspace now contains a modular monolith foundation with tenant-scoped feature flags, RBAC metadata, guarded NestJS module APIs, a broad Prisma data model, Docker/Kubernetes assets, documentation, and a responsive Next.js operations console.

Included bounded contexts:

- Core platform: companies, plants, departments, business units, users, roles, permissions, feature flags, tasks, approvals, notifications, documents, audit, and reporting
- Inventory and warehouse: item tracking, movement, reservation, allocation, warehouse hierarchy, bin states, barcode/QR-ready location search
- Supplier and procurement: suppliers, contacts, ratings, requisitions, purchase orders, approval workflow touchpoints
- Production: BOMs, BOM versions, routings, work centers, production orders, capacity and scheduling surfaces
- Maintenance and quality: machines, maintenance plans, work orders, breakdowns, inspections, CAPA, quarantine
- AI framework: recommendation and draft-action surfaces that require human approval for critical actions

## Module Enablement

Modules are attached per company or tenant through feature flags. The API guard pipeline is:

1. JWT auth context
2. Tenant context
3. Module feature flag
4. Permission guard
5. Service-level business rules and audit recording

Set `FEATURE_FLAGS_MODE=open` for local demos without seed data. In production, flags are read from the `FeatureFlag` table.

The supply-chain optimizer remains available as an additional operations module. See `docs/supply-chain-optimizer.md` for endpoint details and algorithm rules.

## Local Bootstrap

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set `DATABASE_URL`.
3. Start PostgreSQL and Redis with `docker compose -f infra/docker/docker-compose.yml up postgres redis`.
4. Run `npm run prisma:migrate`, then `npm run prisma:seed`.
5. Start the API with `npm run dev:api` and the web console with `npm run dev`.

Seed login: `admin@mop.local` / `ChangeMe123!` for tenant slug `precision-components`.
