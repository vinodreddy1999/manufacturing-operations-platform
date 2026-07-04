# Metam Services Get Data Module

## Purpose

The Get Data module is the Metam Services equivalent of Power BI "Get Data". It lets an admin connect to operational data sources, preview rows, transform data, model relationships, validate mappings, and create approval-safe import drafts for platform modules.

No critical import is executed automatically. The module analyzes, prepares, validates, logs, and creates draft actions that require human approval before data is written into operational modules.

## User Journey

1. Open **Admin > Data Hub**.
2. Click **Get data** or choose a source shortcut such as Excel, SQL Server, Web URL, OData, PostgreSQL, Google Sheets, or Manual Entry.
3. Search connector categories and select a source.
4. Enter connection details and credentials.
5. Test the connection.
6. Save the connection.
7. Select tables, files, endpoints, and columns.
8. Preview sample data.
9. Apply Power Query-style transformations.
10. Map source fields to platform fields.
11. Validate required destination fields.
12. Build or review the data model.
13. Choose refresh mode.
14. Create an import draft for approval.

## Connector Categories

| Category | Connectors |
| --- | --- |
| File Sources | Excel, CSV, JSON, XML, PDF, Folder upload |
| Database Sources | SQL Server, MySQL, PostgreSQL, Oracle, MongoDB, SQLite |
| Cloud and Online Sources | SharePoint, Google Sheets, OneDrive, REST API, Web URL, OData feed |
| Application Sources | ERP systems, CRM systems, Inventory systems, Maintenance systems, Production systems, Planning systems |

## Transformation Operations

The backend exposes these Power Query-style operations:

| Operation | Business meaning |
| --- | --- |
| Remove columns | Drop unwanted fields before loading. |
| Rename columns | Align source names to platform names. |
| Change data type | Convert text, dates, numbers, and booleans. |
| Filter rows | Remove irrelevant records. |
| Sort rows | Order data for review. |
| Merge tables | Join related datasets. |
| Append tables | Stack similar datasets. |
| Replace values | Standardize statuses and codes. |
| Split columns | Break combined values into separate fields. |
| Group by | Aggregate records. |
| Remove duplicates | Deduplicate source rows. |
| Create calculated columns | Add derived values before mapping. |

## Destination Modules

Imports can be routed to:

- Inventory
- Planning
- Production
- Maintenance
- Finance
- Reports
- Admin master data

## Backend APIs

Base path: `/manufacturing-data-hub/get-data`

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/connectors` | Returns connector categories, transforms, refresh modes, and destination modules. |
| GET | `/saved-connections` | Lists saved source connections, scoped by company for non-platform users. |
| POST | `/saved-connections` | Saves a connection with masked credential metadata. |
| DELETE | `/saved-connections/{connection_id}` | Deletes a saved connection. |
| POST | `/test-connection` | Validates required fields and returns connection status. |
| GET | `/connections/{connection_id}/metadata` | Discovers tables, files, endpoints, columns, and primary keys. |
| POST | `/connections/{connection_id}/selection` | Saves selected assets and columns. |
| GET | `/connections/{connection_id}/preview` | Returns preview rows and inferred data types. |
| POST | `/transform-preview` | Saves a transform recipe and returns transformed preview rows. |
| POST | `/field-mapping/validate` | Validates mappings against destination module requirements. |
| GET | `/model` | Returns model tables, columns, measures, calculated columns, relationships, and validation. |
| POST | `/model/relationships` | Creates a table relationship. |
| POST | `/refresh` | Records a one-time, manual, scheduled, incremental, webhook, or retry refresh run. |
| GET | `/refresh-history` | Lists refresh outcomes and failed refresh reasons. |
| GET | `/errors` | Lists connection and refresh error logs. |
| GET | `/audit` | Lists audit events for connector, preview, transform, mapping, model, and refresh actions. |

## Database Tables

| Table | Purpose |
| --- | --- |
| `datahub_saved_connections` | Stores saved source connections, source metadata, masked credential summary, selected assets, mappings, validation results, refresh mode, and destination module. |
| `datahub_transform_recipes` | Stores Power Query-style operations and preview rows. |
| `datahub_model_relationships` | Stores model relationships, cardinality, direction, and active state. |
| `datahub_refresh_runs` | Stores refresh run status, rows processed, timestamps, and failed refresh reasons. |
| `datahub_audit_events` | Stores every important Get Data action with actor, entity, details, and timestamp. |
| `datahub_error_logs` | Stores validation, connection, and refresh errors with resolution hints. |

## Validation Rules

- Admin access is required.
- Company Admin users can only manage their own company data.
- Super Admin and Account Owner users may choose a target company.
- Required connection fields vary by connector.
- Credentials are masked in the API response and UI.
- Database connections are treated as read-only.
- Preview is generated before load.
- Destination field mapping must include required fields for the target module.
- Critical imports stay in draft/approval mode and do not update module records automatically.

## Error Messages

| Scenario | Error |
| --- | --- |
| Missing connector field | `Connection details are incomplete` |
| Unknown connector | `Unknown connector` |
| Unauthorized company access | `Cannot manage another company's DataHub metadata` |
| Missing saved connection | `Saved connection not found` |
| Refresh before fixing credentials | `Connection test failed before refresh` |

## Security

- Credentials are represented as masked metadata in the current implementation.
- Production deployment should store real credentials in a vault or KMS.
- API keys, passwords, tokens, and secrets are masked before returning to the UI.
- All actions are recorded in audit logs.
- Imports are approval-first; the module does not directly overwrite operational data.

## Frontend Screens

The Data Hub page includes:

- Power BI-like Home ribbon
- Get data dropdown
- Connector search
- Connector category cards
- Guided 10-step import flow
- Saved connections list
- Backend preview grid
- Data type detection chips
- Power Query-style transform checklist
- Field mapping view
- Validation panel
- Data model panel
- Refresh history table
- Error log table
- Audit trail table

## Current Implementation Notes

The module is fully wired to backend endpoints and database tables. External systems are simulated for safe demo behavior, so metadata discovery and preview rows are deterministic. The next production step is to plug connector-specific adapters into the same API contracts.
