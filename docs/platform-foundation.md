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
- Dedicated Maintenance Management module with typed routes, schemas, SQLAlchemy table definitions, seeded repository, service layer, Celery job hooks and rule-based AI
- JWT/password security helpers
- Optional AI provider interface: `AIProvider`, `MockAIProvider`, `OpenAIProvider`
- Celery job declarations for reports, AI scans, expiry checks and dead-stock checks
- Docker Compose with PostgreSQL, Redis, API and Celery worker

The existing expanded Inventory module and separate Inventory AI service remain intact. Production has now moved beyond the generic record layer into a dedicated module package under `app/modules/`.

Next module-depth phases should replace the remaining generic `ModuleRecord` endpoints with dedicated typed models/services for Warehouse, Procurement, Quality and Sales.

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

## Maintenance Module Depth

Implemented Maintenance Management areas:

- Machine/asset registry
- Machine capability configuration
- Maintenance rules and maintenance types
- Preventive maintenance plans
- Breakdown work orders with emergency post-review flow
- Runtime-aware maintenance rule support
- Risk-based approval model
- Spare part mapping
- Spare reservation with inventory shortage and procurement recommendation draft
- Spare consumption and usage history
- Downtime event tracking
- Maintenance scheduling conflict checks
- Shutdown windows
- Technician/team/vendor assignment
- Vendor maintenance provider records
- Work order attachments and machine documents
- Machine history and lifecycle timeline
- Maintenance costing
- Maintenance tasks and email-first notification queue
- Maintenance reports
- Dashboard with open orders, overdue maintenance, breakdowns, spares, MTTR, MTBF, downtime and cost
- Rule-based machine health score
- Maintenance AI risk center, failure prediction, downtime prediction, spare prediction, root cause, cost impact and draft actions
- Celery job hooks for maintenance risk, overdue, spare and cost scans

AI safety boundary:

- AI can analyze, recommend and create draft actions.
- AI cannot close work orders, approve maintenance, consume spares, change production schedules or release machines as available.
