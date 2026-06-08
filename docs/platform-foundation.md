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
- Dedicated Quality Management module with typed routes, schemas, SQLAlchemy table definitions, seeded repository, service layer, Celery job hooks and rule-based AI
- Dedicated Sales & Distribution module with typed routes, schemas, SQLAlchemy table definitions, seeded repository, service layer, Celery job hooks and rule-based AI
- Dedicated Customer Portal module with external-user security, customer-scoped routes, SQLAlchemy table definitions, seeded repository, service layer, Celery job hooks and rule-based AI
- JWT/password security helpers
- Optional AI provider interface: `AIProvider`, `MockAIProvider`, `OpenAIProvider`
- Celery job declarations for reports, AI scans, expiry checks and dead-stock checks
- Docker Compose with PostgreSQL, Redis, API and Celery worker

The existing expanded Inventory module and separate Inventory AI service remain intact. Production has now moved beyond the generic record layer into a dedicated module package under `app/modules/`.

Next module-depth phases should replace the remaining generic `ModuleRecord` endpoints with dedicated typed models/services for Warehouse and Procurement.

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

## Quality Module Depth

Implemented Quality Management areas:

- Optional quality module behavior documented through service output
- Quality plans
- Checklist-based inspections
- Sampling rules
- Inspection lots from receiving, production, WIP, returns, rework and manual requests
- Inspection execution with checklist responses, measurements, pass/fail, defects, comments and signatures
- Defect management
- Configurable failure handling to quarantine or rework
- Quarantine, rework, rejection and scrap workflows
- Quality approval trail for inspection/quarantine decisions
- CAPA management
- Supplier quality metrics
- Production quality metrics
- Customer return quality report structure
- Cost of poor quality calculation
- Quality task and notification queues
- Dashboard, reports and KPIs
- Rule-based Quality AI risk center, defect prediction, trends, supplier risk, production risk, root cause and cost risk
- Draft-only Quality AI actions
- Celery job hooks for quality risk, CAPA overdue, supplier and cost scans

AI safety boundary:

- AI can analyze, recommend and create draft actions.
- AI cannot approve releases, scrap inventory, release quarantine, close CAPA, reject suppliers or dispatch affected goods.

## Sales & Distribution Module Depth

Implemented Sales & Distribution areas:

- Customer master
- Customer hierarchy seed data
- Region and territory management
- Plant representative allocation model
- Sales order and sales order items
- Finished goods availability formula
- Customer reservation and protected allocation rules
- Partial allocation with production recommendation
- Dispatch order and FEFO/FIFO pick list
- Shipment tracking
- Customer returns
- Credit profile structure
- Sales tasks and email-first notification queue
- Dashboard, reports and KPIs
- Rule-based Sales AI risk center, demand forecast, order risk, allocation recommendation, regional demand, expiry-aware sales, customer profitability, dispatch optimization and returns analysis
- Draft-only Sales AI actions
- Celery job hooks for sales risk, demand forecast, dispatch and returns scans

AI safety boundary:

- AI can analyze, recommend and create draft actions.
- AI cannot confirm sales orders, reassign protected inventory, dispatch goods, approve returns, issue credit or change customer pricing.

## Customer Portal Module Depth

Implemented Customer Portal areas:

- Isolated external customer portal login and refresh token structure
- Customer portal user invitations and disable flow
- Customer profile view with restricted fields
- Profile update request workflow
- Customer-owned order tracking with portal-friendly statuses
- Customer-owned shipment tracking
- Secure document listing and download token generation
- Support requests, comments and attachments
- Return requests with quality-required status
- Notifications, reports and feedback
- Customer portal audit logs
- Strict customer-level data filtering
- No internal inventory, costing, supplier or production detail leakage
- Rule-based Customer Portal AI risk center, order risk, support classification, return risk, document risk, satisfaction risk and draft actions
- Celery job hooks for portal risk, document and support scans

AI safety boundary:

- AI can analyze, recommend and create draft actions.
- AI cannot approve returns, issue credit, cancel orders, promise delivery dates, release internal information or send external customer emails without approval.
