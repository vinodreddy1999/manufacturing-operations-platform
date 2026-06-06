# GitHub Setup and Run Guide

## Run Locally

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

## Docker

```powershell
docker compose -f infra/docker/docker-compose.yml up --build
```

## GitHub Actions

CI runs install, Prisma generation, lint, tests, and workspace builds on pushes and pull requests to `main`.
