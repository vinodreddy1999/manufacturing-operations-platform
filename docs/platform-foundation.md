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
- Dedicated Supplier Portal module with external-supplier security, supplier-scoped routes, SQLAlchemy table definitions, seeded repository, service layer, Celery job hooks and rule-based AI
- Dedicated Reporting & Analytics module with report catalog, scoped report execution, exports, saved/scheduled reports, dashboards, KPI snapshots, cross-module analytics, Celery job hooks and rule-based AI
- Dedicated Costing & Profitability module with cost centers/elements, inventory valuation, landed cost, production/maintenance/quality costing, standard costs, variance, profitability, Celery job hooks and rule-based AI
- Dedicated Mobile Operations module with mobile auth, device management, my-work, tasks, approvals, scan resolution, offline sync, uploads, mobile audit, notifications, Celery job hooks and rule-based AI
- Dedicated Integrations module with provider/config registry, masked credentials, webhooks, inbound idempotency, sync jobs, mappings, file import/export, errors, retries, monitoring, Celery job hooks and rule-based AI
- Future Manufacturing Intelligence module with command center, cross-module risks, impact graph, root cause, what-if, bottlenecks, health scores, customer/cost impacts, recommendations, Celery job hooks and draft-only intelligence actions
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

## Supplier Portal Module Depth

Implemented Supplier Portal areas:

- Isolated external supplier portal login and refresh token structure
- Company-level supplier portal enablement flags for disabled, PO-only and full portal modes
- Supplier portal RBAC role and permission structures
- Supplier portal user invitations, updates and disable flow
- Supplier profile view with controlled update request workflow
- Supplier-owned purchase order list/detail and acknowledgement
- Delivery confirmations and advance shipment notices
- Supplier document uploads and review status
- Supplier certificate uploads, verification status and expiry tracking
- Supplier messages, CAPA responses and notifications
- Configurable supplier performance visibility
- Supplier-facing task queue for PO acknowledgement, certificate upload, delivery confirmation, CAPA and document actions
- Supplier-owned purchase order, delivery, document and certificate reports
- Supplier portal audit logs
- Strict supplier-level data filtering so one supplier cannot view another supplier's purchase orders
- Rule-based Supplier Portal AI risk center, delivery risk, document risk, certificate expiry, supplier quality risk, PO acknowledgement risk, message summary and draft actions
- Celery job hooks for supplier portal risk, document, certificate and delivery scans

AI safety boundary:

- AI can analyze, recommend and create draft actions.
- AI cannot approve suppliers or certificates, change purchase orders, accept supplier delivery dates, send purchase orders, commit financial actions or replace suppliers automatically.

## Reporting & Analytics Module Depth

Implemented Reporting & Analytics areas:

- Company-level reporting feature flags for standard reports, custom reports, schedules, exports, dashboards and AI insights
- Standard report catalog across Inventory, Warehouse, Procurement, Production, Maintenance, Quality, Sales, Costing, Executive, Audit and AI Insights
- Role-scoped report execution with tenant/company access-policy markers
- CSV export using Pandas and Excel/PDF-ready export responses
- Saved reports with filters, columns, sorting, grouping, chart config and visibility
- Scheduled email-first report definitions
- Dashboard definitions and widgets for KPI cards, tables, trend lines, risk cards and action cards
- KPI definitions and KPI snapshot calculation
- Trend analysis, cross-module analytics and action-oriented insights
- Rule-based Reporting AI risk center, executive summary, root cause, anomalies, KPI insights, report narrative and draft actions
- Celery job hooks for scheduled report generation, email delivery, KPI calculation, trend recalculation, cross-module insights, AI risk scans and executive summaries

AI safety boundary:

- AI can analyze, summarize, recommend and create draft actions.
- AI cannot approve decisions, change source data, send external email without approval, modify financial records, release inventory or dispatch goods.

## Costing & Profitability Module Depth

Implemented Costing & Profitability areas:

- Company-level costing feature flags for inventory, production, maintenance, quality, profitability and AI
- Cost center and cost element masters
- Inventory costing and valuation with costing method/status
- Landed cost calculation with freight, duty, tax, handling, inspection and other charges
- Production costing with planned/actual cost, variance percent and cost per unit
- Maintenance and quality costing
- Cost allocation rules and standard cost approval workflow
- Cost variance records
- Product, customer and plant profitability views
- Costing dashboard cards and costing reports
- Rule-based Costing AI risk center, cost increase, low-margin product, customer profitability, wastage, production variance, supplier cost and optimization recommendations
- Celery job hooks for inventory valuation, production recalculation, variance analysis, profitability snapshots, wastage scans, margin risk scans, AI risk scans and scheduled costing reports

AI safety boundary:

- AI can analyze, recommend and create draft actions.
- AI cannot change product prices, change supplier contracts, approve cost allocation, write off inventory, change standard cost or modify financial records.

## Mobile Operations Module Depth

Implemented Mobile Operations areas:

- Company-level mobile feature flags for inventory, warehouse, production, maintenance, quality, sales, offline sync, barcode/QR, photo uploads and approvals
- Isolated mobile login, refresh, logout and device registration/disable flow
- Mobile device/session/token-ready model structure
- Mobile my-work dashboard with tasks, approvals, work orders, inspections, counts, receipts, alerts and sync status
- Task start, comment, complete and block actions
- Mobile approval approve/reject actions
- Barcode/QR scan resolver with entity type, allowed actions and warnings
- Inventory receiving, transfer and count workflows with idempotency keys and variance handling
- Warehouse movement and location/search APIs
- Production daily log, material consumption and completion endpoints
- Maintenance work order execution, spare usage, photos and completion endpoints
- Quality inspection result and completion endpoints
- Dispatch pick, packing and online dispatch confirmation flow
- Upload metadata capture for photos/documents/evidence
- Offline sync push/pull/status, duplicate idempotency detection and high-risk offline action rejection
- Mobile audit logs, conflicts and notifications
- Rule-based Mobile AI risk center, scan validation, count assist, maintenance assist, quality assist, next action and draft action endpoints
- Celery job hooks for sync processing, failed retry, notification delivery, upload processing, photo compression, AI risk scan, stale work and device inactivity

AI safety boundary:

- AI can suggest, warn, summarize and create draft actions.
- AI cannot approve, release inventory, close critical work orders, dispatch goods, override reservations or write off inventory.

## Integrations Module Depth

Implemented Integrations areas:

- Company-level integration feature flags for APIs, webhooks, file import/export, ERP, accounting, machine/IoT, email and AI monitoring
- Integration provider registry and company integration configs
- Masked credential storage and rotation structure
- Inbound and outbound webhook records with retry/security fields
- Integration event log with idempotency keys
- Sync job and sync job item logs with retry queue support
- Configurable field mappings and transform-rule table structure
- File import workflow: upload, parse/validate, preview, approve and commit
- File export workflow for CSV/Excel/JSON-style exports
- Integration error logs, retry logs and resolution workflow
- Email provider, template and delivery log structures
- Machine/IoT future-ready configuration and event tables
- Monitoring dashboard and integration report outputs
- Rule-based Integration AI risk center, data quality, sync failure, anomaly, mapping suggestion and draft action endpoints
- Celery job hooks for scheduled sync, webhook delivery/retry, file import/export, email delivery, failed record retry, data quality scan and AI risk scan

AI safety boundary:

- AI can analyze, recommend and create draft actions.
- AI cannot commit high-risk imports, change credentials, send external data without approval, modify financial records, delete records or override tenant security.

## Manufacturing Intelligence Module Depth

Implemented Manufacturing Intelligence areas:

- Company-level intelligence feature flags for risk center, root cause, what-if, command center, draft actions, LLM summary and digital-twin future mode
- Cross-module risk registry connecting procurement, inventory, production, maintenance, quality, sales and costing signals
- Business impact graph with nodes for suppliers, purchase orders, inventory items, production orders, machines, sales orders, customers and cost centers
- Rule-based root cause analysis with evidence and confidence
- What-if simulation framework for supplier delays, machine downtime, demand changes, rejected batches, warehouse fullness and priority changes
- Bottleneck detection for material and machine constraints
- Operational and plant health scores
- Customer impact and cost impact analysis
- Recommendation and draft action engines
- Mock LLM provider interface for future natural-language summaries
- Executive summary generation
- Celery job hooks for risk scan, health score calculation, bottleneck detection, customer/cost impact scans, executive summary generation, stale risk cleanup and recommendation generation

AI safety boundary:

- AI can analyze, explain, simulate, recommend and create draft actions.
- AI cannot approve purchase orders, transfer inventory, change production schedules, release quarantine, dispatch goods, send external email without approval, write off inventory, change pricing or modify financial records.
