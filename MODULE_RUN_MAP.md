# Module Run Map

| Module | Code Location | Main Output |
| --- | --- | --- |
| Auth | `apps/api/src/modules/auth` | Login, refresh token, logout, JWT context |
| Platform/Core | `apps/api/src/modules/platform` | Companies, plants, users, roles, feature flags |
| Inventory | `apps/api/src/modules/inventory` | Items, movements, reservations, allocations |
| Warehouse | `apps/api/src/modules/warehouse` | Warehouse hierarchy and bin/location data |
| Supplier | `apps/api/src/modules/supplier` | Supplier records, contacts, ratings |
| Procurement | `apps/api/src/modules/procurement` | Purchase requisition and PO workflow foundation |
| Production | `apps/api/src/modules/production` | BOM, routing, work center, production order foundation |
| Maintenance | `apps/api/src/modules/maintenance` | Machine, maintenance plan, work order foundation |
| Quality | `apps/api/src/modules/quality` | Inspection, CAPA, quarantine foundation |
| Reporting | `apps/api/src/modules/reporting` | Report definitions and export workflow foundation |
| AI | `apps/api/src/modules/ai` | Recommendation and draft-action framework |
| Supply Chain | `apps/api/src/modules/supply-chain` | Forecasting and optimization sample logic |

All modules run through the same NestJS API. Feature flags decide which modules are enabled per tenant/company.
