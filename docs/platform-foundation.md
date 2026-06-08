# Platform Foundation

This phase adds the modular-monolith foundation requested in the Codex prompt.

Implemented now:

- SQLAlchemy 2.0 database layer
- Alembic migration scaffold
- Tenant/company/plant scoped models
- Companies, plants, departments, users, roles, permissions
- Feature flags per company/module
- Tasks, approvals, documents, audit logs
- Generic module-record routers for warehouse, procurement, production, maintenance, quality and sales endpoints
- JWT/password security helpers
- Optional AI provider interface: `AIProvider`, `MockAIProvider`, `OpenAIProvider`
- Celery job declarations for reports, AI scans, expiry checks and dead-stock checks
- Docker Compose with PostgreSQL, Redis, API and Celery worker

The existing expanded Inventory module and separate Inventory AI service remain intact.

Next module-depth phases should replace generic `ModuleRecord` endpoints with dedicated typed models/services for each module.

