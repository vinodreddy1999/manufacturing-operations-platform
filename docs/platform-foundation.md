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
- Dedicated Production Management module with typed routes, schemas, SQLAlchemy table definitions, seeded repository, service layer and rule-based AI
- JWT/password security helpers
- Optional AI provider interface: `AIProvider`, `MockAIProvider`, `OpenAIProvider`
- Celery job declarations for reports, AI scans, expiry checks and dead-stock checks
- Docker Compose with PostgreSQL, Redis, API and Celery worker

The existing expanded Inventory module and separate Inventory AI service remain intact. Production has now moved beyond the generic record layer into a dedicated module package under `app/modules/`.

Next module-depth phases should replace the remaining generic `ModuleRecord` endpoints with dedicated typed models/services for Warehouse, Procurement, Maintenance, Quality and Sales.

## Production Module Depth

Implemented Production Management areas:

- Product master
- Multi-level/versioned BOM with approval endpoint
- Routing operations
- Work centers, production lines and machine registry
- Production order management
- Dynamic approval rule records
- Material requirement planning
- Inventory reservation interface with partial reservation and shortage tracking
- Time-aware material planning using current, incoming and lead-time signals
- Scheduling and conflict detection
- Shift management
- Daily production logs
- BOM/material consumption with variance tracking
- Downtime management
- Production completion workflow
- WIP tracking
- Production losses
- Production costing
- Production reports and dashboard
- Production tasks and notification queues
- Rule-based Production AI for risks, delays, bottlenecks, capacity, schedule, what-if, variance, downtime and cost

AI safety boundary:

- AI can analyze, recommend and create draft actions.
- AI cannot change schedules, consume inventory, close orders or approve orders.
