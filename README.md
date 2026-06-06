# Manufacturing Operations Platform (MOP)

MOP is a modular, multi-tenant SaaS foundation for small and mid-sized manufacturers. It is designed as a configurable manufacturing operations platform rather than a monolithic ERP.

## GitHub Quick Start

This repository contains runnable module code for the Manufacturing Operations Platform.

Key guides:

- `GITHUB_SETUP.md` for local, Docker, and GitHub setup.
- `MODULE_RUN_MAP.md` for where each module lives and how output flows through the system.
- `docs/` for architecture, ERD, API, security, deployment, and diagrams.

## Local Bootstrap

```powershell
npm install
Copy-Item .env.example .env
docker compose -f infra/docker/docker-compose.yml up postgres redis
npm run prisma:migrate
npm run prisma:seed
npm run dev:api
npm run dev
```

Open:

- Web app: `http://localhost:3000`
- API: `http://localhost:4000/api/v1`

Seed login:

- Email: `admin@mop.local`
- Password: `ChangeMe123!`
- Tenant slug: `precision-components`
