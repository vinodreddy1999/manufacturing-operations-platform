import csv
from datetime import datetime, timezone
from statistics import mean
from typing import Any
from uuid import uuid4
from io import BytesIO, StringIO
from pathlib import Path

import pandas as pd
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from . import frontend_admin_models  # noqa: F401
from ..database import get_db
from ..metadata_store import first_metadata, list_metadata, upsert_metadata
from ..platform_models import AppMetadata, Company, User
from ..platform_models import Plant
from ..runtime_router import current_user, require_any
from .frontend_admin_repository import frontend_admin_repo
from .frontend_admin_schemas import (
    AiReadinessOverrideRequest,
    CloudSourceUploadRequest,
    DataCatalogEntryRequest,
    DataHubConnectionRequest,
    DashboardAccessRequest,
    DataMappingRuleRequest,
    DataMappingPreviewRequest,
    FrontendAdminApiResult,
    GetDataConnectionRequest,
    GetDataFieldMappingRequest,
    GetDataModuleColumnsRequest,
    GetDataRefreshRequest,
    GetDataRelationshipRequest,
    GetDataSelectionRequest,
    GetDataTestConnectionRequest,
    GetDataTransformRequest,
    OperationalFootprintRequest,
    PendingUpdateDecisionRequest,
    WorkflowSimulationRequest,
)
from .frontend_admin_service import frontend_admin_service

frontend_router = APIRouter(prefix="/frontend", tags=["Frontend Contracts"])
admin_router = APIRouter(prefix="/admin", tags=["Admin"])
platform_management_router = APIRouter(prefix="/platform-management", tags=["Platform Management"])
data_hub_router = APIRouter(prefix="/manufacturing-data-hub", tags=["Manufacturing Data Hub"])
planning_router = APIRouter(prefix="/planning", tags=["Planning"])
ai_command_router = APIRouter(prefix="/ai-command-center", tags=["AI Command Center"])
digital_twin_router = APIRouter(prefix="/digital-twin", tags=["Digital Twin"])
digital_ops_router = APIRouter(prefix="/digital-operations-center", tags=["Digital Operations Center"])


def result(action: str, message: str, data: dict[str, Any] | list[dict[str, Any]]) -> FrontendAdminApiResult:
    return FrontendAdminApiResult(action=action, message=message, data=data)


def has_override_scope(user: User) -> bool:
    return (user.role or "user") in {"super_admin", "account_owner"}


def scoped_company_id(user: User) -> str | None:
    return None if has_override_scope(user) else user.company_id


def resolve_datahub_company_id(requested_company_id: str | None, actor: User, db: Session) -> str:
    company_id = requested_company_id if has_override_scope(actor) and requested_company_id else actor.company_id
    if not company_id:
        company_id = "company-c"
    if not has_override_scope(actor) and company_id != actor.company_id:
        raise HTTPException(status_code=403, detail="Cannot manage another company's DataHub metadata")
    if not db.get(Company, company_id):
        raise HTTPException(status_code=404, detail="Selected company not found")
    return company_id


def company_name_map(db: Session) -> dict[str, str]:
    return {company.id: company.name for company in db.query(Company).all()}


def can_edit_executive_metrics(user: User) -> bool:
    return (user.role or "user") in {"admin", "super_admin"}


def require_executive_editor(user: User = Depends(current_user)) -> User:
    if not can_edit_executive_metrics(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin and super admin users can modify executive dashboard metrics",
        )
    return user


def ai_readiness_payload(row: frontend_admin_models.DataCatalogEntry) -> dict[str, Any]:
    return {
        "area": f"{row.data_type} AI Readiness",
        "score": row.quality_score if row.ai_ready else max(row.quality_score - 20, 0),
        "ready": row.ai_ready,
    }


def merged_ai_readiness(actor: User, db: Session) -> dict[str, Any]:
    company_id = scoped_company_id(actor)
    query = db.query(frontend_admin_models.DataCatalogEntry)
    if company_id:
        query = query.filter(frontend_admin_models.DataCatalogEntry.company_id == company_id)
    rows = query.all()
    base_rows = [ai_readiness_payload(row) for row in rows]
    overrides = {
        item["area"]: item
        for item in list_metadata(
            db,
            "ai_readiness_override",
            company_id=actor.company_id,
        )
    }
    readiness = [overrides.get(item["area"], item) for item in base_rows]
    if not readiness:
        readiness = list(overrides.values())
    overall = round(mean(item["score"] for item in readiness), 2) if readiness else 0
    return {"overall_ai_readiness": overall, "readiness": readiness}


def computed_operational_footprint(actor: User, db: Session) -> dict[str, int]:
    user_query = db.query(User)
    plant_query = db.query(Plant)
    connection_query = db.query(frontend_admin_models.ManufacturingDataConnection)
    catalog_query = db.query(frontend_admin_models.DataCatalogEntry)
    pending_query = db.query(frontend_admin_models.PendingErpUpdate)
    company_id = scoped_company_id(actor)
    if company_id:
        user_query = user_query.filter(User.company_id == company_id)
        plant_query = plant_query.filter(Plant.company_id == company_id)
        connection_query = connection_query.filter(frontend_admin_models.ManufacturingDataConnection.company_id == company_id)
        catalog_query = catalog_query.filter(frontend_admin_models.DataCatalogEntry.company_id == company_id)
        pending_query = pending_query.filter(frontend_admin_models.PendingErpUpdate.company_id == company_id)
    catalog_rows = catalog_query.all()
    return {
        "user_count": user_query.count(),
        "active_users": user_query.filter(User.is_active.is_(True)).count(),
        "plants": plant_query.count(),
        "warehouses": len({(row.lineage or {}).get("warehouse") for row in catalog_rows if (row.lineage or {}).get("warehouse")}),
        "integrations": connection_query.count(),
        "open_approvals": len([row for row in pending_query.all() if row.approval_status == "Pending"]),
    }


def merged_operational_footprint(actor: User, db: Session) -> dict[str, int]:
    base = computed_operational_footprint(actor, db)
    override = first_metadata(
        db,
        "operational_footprint_override",
        "dashboard",
        company_id=actor.company_id,
    )
    if override:
        base.update(
            {
                "plants": int(override.get("plants", base["plants"])),
                "warehouses": int(override.get("warehouses", base["warehouses"])),
                "integrations": int(override.get("integrations", base["integrations"])),
                "open_approvals": int(override.get("open_approvals", base["open_approvals"])),
            }
        )
    return base


def upload_manifest_payload(
    *,
    company_id: str | None,
    source: str,
    provider: str,
    resource_name: str,
    file_format: str,
    resource_url: str | None,
    uploaded_by: str,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        "id": f"upload-{uuid4()}",
        "company_id": company_id,
        "source": source,
        "provider": provider,
        "resource_name": resource_name,
        "file_format": file_format,
        "resource_url": resource_url,
        "uploaded_by": uploaded_by,
        "status": "ready",
        "metadata": metadata or {},
    }


def extract_upload_preview(filename: str, content: bytes) -> dict[str, Any]:
    suffix = Path(filename).suffix.lower()
    preview: dict[str, Any] = {"detected_format": suffix.lstrip(".") or "unknown"}
    if suffix in {".csv", ".tsv"}:
        separator = "\t" if suffix == ".tsv" else ","
        frame = pd.read_csv(BytesIO(content), sep=separator, nrows=5)
        preview["columns"] = list(frame.columns)
        preview["sample_rows"] = frame.fillna("").to_dict(orient="records")
    elif suffix in {".xls", ".xlsx", ".xlsm"}:
        frame = pd.read_excel(BytesIO(content), nrows=5)
        preview["columns"] = list(frame.columns)
        preview["sample_rows"] = frame.fillna("").to_dict(orient="records")
    elif suffix in {".json"}:
        frame = pd.read_json(BytesIO(content)).head(5)
        preview["columns"] = list(frame.columns)
        preview["sample_rows"] = frame.fillna("").to_dict(orient="records")
    else:
        preview["columns"] = []
        preview["sample_rows"] = []
    return preview


def connection_details_map(db: Session, connection_ids: list[str]) -> dict[str, dict[str, Any]]:
    if not connection_ids:
        return {}
    rows = (
        db.query(AppMetadata)
        .filter(
            AppMetadata.tenant_id == "tenant-demo-001",
            AppMetadata.category == "datahub_connection_details",
            AppMetadata.record_key.in_(connection_ids),
        )
        .all()
    )
    return {row.record_key: row.payload or {} for row in rows}


def serialize_connection(
    row: frontend_admin_models.ManufacturingDataConnection,
    companies: dict[str, str] | None = None,
    details: dict[str, Any] | None = None,
) -> dict[str, Any]:
    detail_payload = details or {}
    return {
        "id": row.id,
        "company_id": row.company_id,
        "company_name": (companies or {}).get(row.company_id, row.company_id),
        "system_name": row.system_name,
        "system_type": row.system_type,
        "connection_status": row.connection_status,
        "last_sync": row.last_sync,
        "health_score": row.health_score,
        "record_count": row.record_count,
        "source_category": detail_payload.get("source_category"),
        "auth_method": detail_payload.get("auth_method"),
        "connection_details": detail_payload.get("connection_details", {}),
    }


def serialize_catalog(row: frontend_admin_models.DataCatalogEntry, companies: dict[str, str] | None = None) -> dict[str, Any]:
    return {
        "id": row.id,
        "company_id": row.company_id,
        "company_name": (companies or {}).get(row.company_id, row.company_id),
        "data_type": row.data_type,
        "source_system": row.source_system,
        "owner": row.owner,
        "ai_ready": row.ai_ready,
        "quality_score": row.quality_score,
        "lineage": row.lineage or {},
    }


def serialize_mapping(row: frontend_admin_models.DataMappingRule, companies: dict[str, str] | None = None) -> dict[str, Any]:
    return {
        "id": row.id,
        "company_id": row.company_id,
        "company_name": (companies or {}).get(row.company_id, row.company_id),
        "source_system": row.source_system,
        "source_field": row.source_field,
        "target_entity": row.target_entity,
        "target_field": row.target_field,
        "transform_rule": row.transform_rule,
        "confidence": row.confidence,
    }


GET_DATA_CONNECTOR_GROUPS: list[dict[str, Any]] = [
    {
        "category": "File Sources",
        "description": "Load local exports, report files, and folder-based extracts.",
        "connectors": [
            {"key": "excel", "name": "Excel", "auth_methods": ["File upload", "OneDrive OAuth", "SharePoint OAuth"], "required_fields": ["file_name"], "supports_transform": True},
            {"key": "csv", "name": "CSV", "auth_methods": ["File upload", "Folder permission"], "required_fields": ["file_name", "delimiter"], "supports_transform": True},
            {"key": "json", "name": "JSON", "auth_methods": ["File upload", "Web URL", "API key"], "required_fields": ["file_name_or_url"], "supports_transform": True},
            {"key": "xml", "name": "XML", "auth_methods": ["File upload", "Web URL"], "required_fields": ["file_name_or_url"], "supports_transform": True},
            {"key": "pdf", "name": "PDF", "auth_methods": ["File upload"], "required_fields": ["file_name"], "supports_transform": True},
            {"key": "folder_upload", "name": "Folder upload", "auth_methods": ["Folder permission"], "required_fields": ["folder_path"], "supports_transform": True},
        ],
    },
    {
        "category": "Database Sources",
        "description": "Connect read-only to operational or warehouse databases.",
        "connectors": [
            {"key": "sql_server", "name": "SQL Server", "auth_methods": ["Database credentials", "Azure AD"], "required_fields": ["host", "database"], "supports_transform": True},
            {"key": "mysql", "name": "MySQL", "auth_methods": ["Database credentials"], "required_fields": ["host", "database"], "supports_transform": True},
            {"key": "postgresql", "name": "PostgreSQL", "auth_methods": ["Database credentials"], "required_fields": ["host", "database"], "supports_transform": True},
            {"key": "oracle", "name": "Oracle", "auth_methods": ["Database credentials", "Wallet"], "required_fields": ["host", "service_name"], "supports_transform": True},
            {"key": "mongodb", "name": "MongoDB", "auth_methods": ["Connection string"], "required_fields": ["connection_string"], "supports_transform": True},
            {"key": "sqlite", "name": "SQLite", "auth_methods": ["Database file"], "required_fields": ["file_name"], "supports_transform": True},
        ],
    },
    {
        "category": "Cloud and Online Sources",
        "description": "Import cloud sheets, files, feeds, APIs, and web tables.",
        "connectors": [
            {"key": "sharepoint", "name": "SharePoint", "auth_methods": ["Microsoft OAuth"], "required_fields": ["site_url"], "supports_transform": True},
            {"key": "google_sheets", "name": "Google Sheets", "auth_methods": ["Google OAuth", "Service account"], "required_fields": ["spreadsheet_url"], "supports_transform": True},
            {"key": "onedrive", "name": "OneDrive", "auth_methods": ["Microsoft OAuth"], "required_fields": ["resource_url"], "supports_transform": True},
            {"key": "rest_api", "name": "REST API", "auth_methods": ["API key", "Bearer token", "OAuth2", "Basic Auth"], "required_fields": ["base_url"], "supports_transform": True},
            {"key": "web_url", "name": "Web URL", "auth_methods": ["No Auth", "Header auth"], "required_fields": ["url"], "supports_transform": True},
            {"key": "odata", "name": "OData feed", "auth_methods": ["OAuth2", "Basic Auth", "API key"], "required_fields": ["feed_url"], "supports_transform": True},
        ],
    },
    {
        "category": "Application Sources",
        "description": "Operational systems that feed platform modules.",
        "connectors": [
            {"key": "erp", "name": "ERP systems", "auth_methods": ["API", "OData", "Database", "File export"], "required_fields": ["system_url"], "supports_transform": True},
            {"key": "crm", "name": "CRM systems", "auth_methods": ["OAuth2", "API key"], "required_fields": ["system_url"], "supports_transform": True},
            {"key": "inventory_system", "name": "Inventory systems", "auth_methods": ["API", "Database", "File export"], "required_fields": ["system_url"], "supports_transform": True},
            {"key": "maintenance_system", "name": "Maintenance systems", "auth_methods": ["API", "Database", "File export"], "required_fields": ["system_url"], "supports_transform": True},
            {"key": "production_system", "name": "Production systems", "auth_methods": ["API", "MES database", "OPC bridge"], "required_fields": ["system_url"], "supports_transform": True},
            {"key": "planning_system", "name": "Planning systems", "auth_methods": ["API", "File export"], "required_fields": ["system_url"], "supports_transform": True},
        ],
    },
]

GET_DATA_TRANSFORMS = [
    "Remove columns",
    "Rename columns",
    "Change data type",
    "Filter rows",
    "Sort rows",
    "Merge tables",
    "Append tables",
    "Replace values",
    "Split columns",
    "Group by",
    "Remove duplicates",
    "Create calculated columns",
]

GET_DATA_DESTINATIONS = ["Inventory", "Planning", "Production", "Maintenance", "Finance", "Reports", "Admin master data"]

# Baseline column set offered as a downloadable template for each destination module.
# Companies can override this per module via PUT .../destination-modules/{module}/columns;
# a company override always wins over these shared defaults.
DEFAULT_MODULE_COLUMNS: dict[str, list[dict[str, Any]]] = {
    "Inventory": [
        {"column_name": "item_code", "required": True},
        {"column_name": "item_name", "required": True},
        {"column_name": "category", "required": False},
        {"column_name": "uom", "required": False},
        {"column_name": "quantity", "required": True},
        {"column_name": "unit_cost", "required": False},
        {"column_name": "warehouse_location", "required": False},
        {"column_name": "reorder_point", "required": False},
        {"column_name": "batch_number", "required": False},
        {"column_name": "expiry_date", "required": False},
    ],
    "Planning": [
        {"column_name": "plan_id", "required": True},
        {"column_name": "material_code", "required": True},
        {"column_name": "demand_quantity", "required": True},
        {"column_name": "plan_period", "required": False},
        {"column_name": "planning_unit", "required": False},
        {"column_name": "supply_source", "required": False},
        {"column_name": "safety_stock", "required": False},
        {"column_name": "planner_name", "required": False},
    ],
    "Production": [
        {"column_name": "order_id", "required": True},
        {"column_name": "material_code", "required": True},
        {"column_name": "planned_qty", "required": True},
        {"column_name": "work_center", "required": False},
        {"column_name": "start_date", "required": False},
        {"column_name": "end_date", "required": False},
        {"column_name": "actual_qty", "required": False},
        {"column_name": "scrap_qty", "required": False},
        {"column_name": "status", "required": False},
    ],
    "Maintenance": [
        {"column_name": "work_order", "required": True},
        {"column_name": "asset_id", "required": True},
        {"column_name": "status", "required": True},
        {"column_name": "asset_name", "required": False},
        {"column_name": "maintenance_type", "required": False},
        {"column_name": "priority", "required": False},
        {"column_name": "scheduled_date", "required": False},
        {"column_name": "completed_date", "required": False},
        {"column_name": "technician", "required": False},
        {"column_name": "downtime_hours", "required": False},
    ],
    "Finance": [
        {"column_name": "account", "required": True},
        {"column_name": "amount", "required": True},
        {"column_name": "currency", "required": True},
        {"column_name": "transaction_date", "required": False},
        {"column_name": "cost_center", "required": False},
        {"column_name": "description", "required": False},
        {"column_name": "vendor_name", "required": False},
        {"column_name": "invoice_number", "required": False},
    ],
    "Reports": [
        {"column_name": "metric_name", "required": True},
        {"column_name": "metric_value", "required": True},
        {"column_name": "period", "required": False},
        {"column_name": "unit", "required": False},
        {"column_name": "category", "required": False},
        {"column_name": "source_system", "required": False},
    ],
    "Admin master data": [
        {"column_name": "name", "required": True},
        {"column_name": "status", "required": True},
        {"column_name": "code", "required": False},
        {"column_name": "description", "required": False},
        {"column_name": "owner", "required": False},
        {"column_name": "effective_date", "required": False},
    ],
}


def connector_lookup() -> dict[str, dict[str, Any]]:
    return {
        connector["key"]: {**connector, "category": group["category"]}
        for group in GET_DATA_CONNECTOR_GROUPS
        for connector in group["connectors"]
    }


def mask_sensitive(value: Any) -> Any:
    if value in (None, ""):
        return value
    text = str(value)
    return f"{text[:2]}{'*' * max(len(text) - 4, 4)}{text[-2:]}" if len(text) > 4 else "****"


def masked_credentials(credentials: dict[str, Any]) -> dict[str, Any]:
    sensitive_terms = ("password", "secret", "token", "key", "credential", "connection_string")
    return {
        key: mask_sensitive(value) if any(term in key.lower() for term in sensitive_terms) else value
        for key, value in credentials.items()
    }


def connection_required_errors(connector_key: str, details: dict[str, Any]) -> list[str]:
    connector = connector_lookup().get(connector_key)
    if not connector:
        return [f"Unknown connector '{connector_key}'"]
    return [f"{field} is required for {connector['name']}" for field in connector.get("required_fields", []) if not details.get(field)]


def datahub_audit(db: Session, actor: User, company_id: str, action: str, entity_type: str, entity_id: str, details: dict[str, Any]) -> None:
    db.add(
        frontend_admin_models.DataHubAuditEvent(
            id=f"dha-{uuid4()}",
            company_id=company_id,
            actor_email=actor.email,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
        )
    )


def demo_discovery_assets(connector_key: str) -> list[dict[str, Any]]:
    prefix = connector_key.replace("_", " ").title()
    return [
        {
            "name": f"{prefix} Inventory",
            "type": "table",
            "row_count": 12480,
            "columns": ["item_code", "item_name", "quantity", "plant", "status", "updated_at"],
            "primary_key": "item_code",
        },
        {
            "name": f"{prefix} Production",
            "type": "table",
            "row_count": 4230,
            "columns": ["order_id", "material_code", "planned_qty", "completed_qty", "line", "status"],
            "primary_key": "order_id",
        },
        {
            "name": f"{prefix} Maintenance",
            "type": "table",
            "row_count": 980,
            "columns": ["work_order", "asset_id", "priority", "planned_date", "status", "technician"],
            "primary_key": "work_order",
        },
    ]


def demo_preview_rows(asset_name: str | None = None) -> list[dict[str, Any]]:
    return [
        {"item_code": "RM-STEEL-001", "item_name": "Steel Coil", "quantity": 680, "plant": "Plant 01", "status": "Available", "updated_at": "2026-06-22"},
        {"item_code": "FG-PUMP-041", "item_name": "Pump Assembly", "quantity": 94, "plant": "Plant 01", "status": "Reserved", "updated_at": "2026-06-22"},
        {"item_code": "SP-BEAR-009", "item_name": "Bearing Kit", "quantity": 12, "plant": "Plant 02", "status": "Low Stock", "updated_at": "2026-06-21"},
    ]


def infer_type(value: Any) -> str:
    if isinstance(value, bool):
        return "Boolean"
    if isinstance(value, int):
        return "Whole number"
    if isinstance(value, float):
        return "Decimal number"
    if isinstance(value, str) and len(value) == 10 and value[4] == "-" and value[7] == "-":
        return "Date"
    return "Text"


def serialize_saved_connection(row: frontend_admin_models.DataHubSavedConnection, companies: dict[str, str] | None = None) -> dict[str, Any]:
    return {
        "id": row.id,
        "company_id": row.company_id,
        "company_name": (companies or {}).get(row.company_id, row.company_id),
        "connector_key": row.connector_key,
        "connector_name": row.connector_name,
        "connector_category": row.connector_category,
        "connection_name": row.connection_name,
        "auth_method": row.auth_method,
        "connection_details": row.connection_details or {},
        "credential_summary": row.credential_summary or {},
        "status": row.status,
        "last_test_status": row.last_test_status,
        "last_test_message": row.last_test_message,
        "refresh_mode": row.refresh_mode,
        "destination_module": row.destination_module,
        "selected_assets": row.selected_assets or [],
        "selected_columns": row.selected_columns or [],
        "field_mappings": row.field_mappings or [],
        "validation_results": row.validation_results or [],
        "created_by": row.created_by,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


@frontend_router.get("/navigation", response_model=FrontendAdminApiResult)
def navigation() -> FrontendAdminApiResult:
    return result("navigation", "Frontend navigation blueprint for modular React screens.", frontend_admin_repo.snapshot(frontend_admin_repo.navigation))


@frontend_router.get("/folder-structure", response_model=FrontendAdminApiResult)
def folder_structure() -> FrontendAdminApiResult:
    return result(
        "folder_structure",
        "Recommended frontend folder structure.",
        {
            "src": ["app", "components", "layouts", "routes", "services", "hooks", "types", "data"],
            "modules": ["dashboard", "admin", "planning", "inventory", "production", "maintenance", "quality", "procurement", "sales", "costing", "compliance", "customer-portal", "supplier-portal", "ai-command-center", "digital-twin", "digital-operations-center"],
            "reusable_components": ["AppLayout", "Sidebar", "Header", "PageHeader", "StatCard", "ChartCard", "DataTable", "KPIWidget", "DashboardBuilder", "PermissionGuard", "NotificationCenter", "AuditViewer", "IntegrationCard"],
        },
    )


@admin_router.get("/dashboard", response_model=FrontendAdminApiResult)
def admin_dashboard(
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    user_query = db.query(User)
    catalog_query = db.query(frontend_admin_models.DataCatalogEntry)
    pending_query = db.query(frontend_admin_models.PendingErpUpdate)
    company_id = scoped_company_id(actor)
    if company_id:
        user_query = user_query.filter(User.company_id == company_id)
        catalog_query = catalog_query.filter(frontend_admin_models.DataCatalogEntry.company_id == company_id)
        pending_query = pending_query.filter(frontend_admin_models.PendingErpUpdate.company_id == company_id)
    catalog_rows = catalog_query.all()
    pending_rows = pending_query.all()
    data_quality = round(mean([row.quality_score for row in catalog_rows]), 2) if catalog_rows else 0
    ai_readiness = merged_ai_readiness(actor, db)["overall_ai_readiness"]
    footprint = merged_operational_footprint(actor, db)
    return result(
        "admin_dashboard",
        "Admin dashboard metrics.",
        {
            "user_count": user_query.count(),
            "active_users": user_query.filter(User.is_active.is_(True)).count(),
            "plants": footprint["plants"],
            "warehouses": footprint["warehouses"],
            "integrations": footprint["integrations"],
            "data_quality": data_quality,
            "ai_readiness": ai_readiness,
            "open_approvals": footprint["open_approvals"],
            "pending_actions": len(pending_rows),
        },
    )


@admin_router.get("/operational-footprint", response_model=FrontendAdminApiResult)
def operational_footprint(
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    return result("operational_footprint", "Operational footprint metrics.", merged_operational_footprint(actor, db))


@admin_router.put("/operational-footprint", response_model=FrontendAdminApiResult)
def update_operational_footprint(
    request: OperationalFootprintRequest,
    actor: User = Depends(require_executive_editor),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    payload = request.model_dump()
    upsert_metadata(
        db,
        category="operational_footprint_override",
        record_key="dashboard",
        row_id=f"footprint-{actor.company_id or 'platform'}",
        company_id=actor.company_id,
        payload=payload,
        name="Operational Footprint Override",
    )
    db.commit()
    return result("update_operational_footprint", "Operational footprint updated.", payload)


@admin_router.get("/company-setup", response_model=FrontendAdminApiResult)
def company_setup() -> FrontendAdminApiResult:
    return result("company_setup", "Company setup contract for locations, plants, fiscal settings and warehouses.", frontend_admin_service.company_setup())


@admin_router.get("/users-roles", response_model=FrontendAdminApiResult)
def users_roles() -> FrontendAdminApiResult:
    return result("users_roles", "Supported roles and permission matrix.", frontend_admin_service.access_control())


@admin_router.get("/access-control", response_model=FrontendAdminApiResult)
def access_control() -> FrontendAdminApiResult:
    return result("access_control", "RBAC, dashboard access and data scope policies.", frontend_admin_service.access_control())


@admin_router.post("/access-control/evaluate-dashboard", response_model=FrontendAdminApiResult)
def evaluate_dashboard_access(request: DashboardAccessRequest) -> FrontendAdminApiResult:
    return result("evaluate_dashboard_access", "Dashboard visibility evaluated from tenant, role, user and data scope permissions.", frontend_admin_service.evaluate_dashboard_access(request.model_dump()))


@admin_router.get("/data-scopes", response_model=FrontendAdminApiResult)
def data_scopes() -> FrontendAdminApiResult:
    return result("data_scopes", "Company, plant, warehouse, line and department data scopes.", frontend_admin_repo.snapshot(frontend_admin_repo.data_scopes))


@admin_router.get("/workflows", response_model=FrontendAdminApiResult)
def workflows() -> FrontendAdminApiResult:
    return result("workflows", "No-code workflow designer definitions.", frontend_admin_repo.snapshot(frontend_admin_repo.workflows))


@admin_router.post("/workflows/simulate", response_model=FrontendAdminApiResult)
def simulate_workflow(request: WorkflowSimulationRequest) -> FrontendAdminApiResult:
    return result("simulate_workflow", "Workflow path simulated for frontend workflow designer.", frontend_admin_service.workflow_simulation(request.model_dump()))


@admin_router.get("/kpis", response_model=FrontendAdminApiResult)
def kpis() -> FrontendAdminApiResult:
    return result("kpis", "Company-defined KPI framework.", frontend_admin_repo.snapshot(frontend_admin_repo.kpis))


@admin_router.get("/alerts", response_model=FrontendAdminApiResult)
def alerts() -> FrontendAdminApiResult:
    return result("alerts", "Alert and escalation rules.", frontend_admin_repo.snapshot(frontend_admin_repo.alert_rules))


@admin_router.get("/notifications", response_model=FrontendAdminApiResult)
def notifications() -> FrontendAdminApiResult:
    return result("notifications", "Notification center channels.", {"channels": frontend_admin_repo.snapshot(frontend_admin_repo.notification_channels)})


@admin_router.get("/security", response_model=FrontendAdminApiResult)
def security_center() -> FrontendAdminApiResult:
    return result("security_center", "Security center contract.", frontend_admin_repo.snapshot(frontend_admin_repo.security_center))


@admin_router.get("/documents", response_model=FrontendAdminApiResult)
def document_management() -> FrontendAdminApiResult:
    return result("document_management", "Document management contract.", frontend_admin_repo.snapshot(frontend_admin_repo.document_management))


@admin_router.get("/compliance", response_model=FrontendAdminApiResult)
def compliance_center() -> FrontendAdminApiResult:
    return result("compliance_center", "Compliance center contract.", frontend_admin_repo.snapshot(frontend_admin_repo.compliance_center))


@platform_management_router.get("/overview", response_model=FrontendAdminApiResult)
def platform_management_overview() -> FrontendAdminApiResult:
    return result("platform_management_overview", "Super Admin platform management overview.", frontend_admin_repo.snapshot(frontend_admin_repo.platform_management))


@data_hub_router.get("/get-data/connectors", response_model=FrontendAdminApiResult)
def get_data_connectors(_: User = Depends(require_any("admin"))) -> FrontendAdminApiResult:
    return result(
        "get_data_connectors",
        "Power BI-style connector catalog grouped by source category.",
        {
            "groups": GET_DATA_CONNECTOR_GROUPS,
            "transform_operations": GET_DATA_TRANSFORMS,
            "destination_modules": GET_DATA_DESTINATIONS,
            "refresh_modes": ["One-time import", "Manual refresh", "Scheduled refresh", "Incremental refresh", "Real-time webhook update", "Retry failed refresh"],
        },
    )


@data_hub_router.get("/get-data/saved-connections", response_model=FrontendAdminApiResult)
def get_data_saved_connections(
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    query = db.query(frontend_admin_models.DataHubSavedConnection)
    company_id = scoped_company_id(actor)
    if company_id:
        query = query.filter(frontend_admin_models.DataHubSavedConnection.company_id == company_id)
    rows = query.order_by(frontend_admin_models.DataHubSavedConnection.updated_at.desc()).all()
    return result("get_data_saved_connections", "Saved Power BI-style source connections.", [serialize_saved_connection(row, company_name_map(db)) for row in rows])


@data_hub_router.post("/get-data/saved-connections", response_model=FrontendAdminApiResult)
def create_get_data_saved_connection(
    request: GetDataConnectionRequest,
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    payload = request.model_dump()
    company_id = resolve_datahub_company_id(payload.pop("company_id", None), actor, db)
    details = payload.get("connection_details") or {}
    errors = connection_required_errors(payload["connector_key"], details)
    if errors:
        raise HTTPException(status_code=422, detail={"message": "Connection details are incomplete", "errors": errors})
    credentials = payload.pop("credentials", {})
    row = frontend_admin_models.DataHubSavedConnection(
        id=f"gd-conn-{uuid4()}",
        company_id=company_id,
        credential_summary={
            "masked": masked_credentials(credentials),
            "credential_keys": sorted(credentials.keys()),
            "storage": "masked metadata only; production should use vault or KMS",
        },
        status="Saved",
        last_test_status="Not Tested",
        created_by=actor.email,
        **payload,
    )
    db.add(row)
    datahub_audit(db, actor, company_id, "create_connection", "get_data_connection", row.id, {"connector": row.connector_name, "destination_module": row.destination_module})
    db.commit()
    db.refresh(row)
    return result("create_get_data_saved_connection", "Get Data connection saved with masked credentials.", serialize_saved_connection(row, company_name_map(db)))


@data_hub_router.delete("/get-data/saved-connections/{connection_id}", response_model=FrontendAdminApiResult)
def delete_get_data_saved_connection(
    connection_id: str,
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    row = db.get(frontend_admin_models.DataHubSavedConnection, connection_id)
    if not row:
        raise HTTPException(status_code=404, detail="Saved connection not found")
    if not has_override_scope(actor) and row.company_id != actor.company_id:
        raise HTTPException(status_code=403, detail="Cannot delete another company's saved connection")
    company_id = row.company_id
    db.delete(row)
    datahub_audit(db, actor, company_id, "delete_connection", "get_data_connection", connection_id, {"connection_id": connection_id})
    db.commit()
    return result("delete_get_data_saved_connection", "Saved connection deleted.", {"id": connection_id})


@data_hub_router.post("/get-data/test-connection", response_model=FrontendAdminApiResult)
def test_get_data_connection(
    request: GetDataTestConnectionRequest,
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    payload = request.model_dump()
    company_id = resolve_datahub_company_id(payload.pop("company_id", None), actor, db)
    errors = connection_required_errors(payload["connector_key"], payload.get("connection_details") or {})
    status_text = "Failed" if errors else "Succeeded"
    response = {
        "status": status_text,
        "latency_ms": 84 if not errors else None,
        "message": "Connection test succeeded in read-only preview mode." if not errors else "Connection test failed because required fields are missing.",
        "errors": errors,
        "credential_summary": masked_credentials(payload.get("credentials") or {}),
        "read_only": True,
    }
    datahub_audit(db, actor, company_id, "test_connection", "get_data_connection", payload["connector_key"], response)
    if errors:
        db.add(
            frontend_admin_models.DataHubErrorLog(
                id=f"dhe-{uuid4()}",
                company_id=company_id,
                connection_id=payload["connector_key"],
                severity="Error",
                error_code="CONNECTION_VALIDATION_FAILED",
                message="; ".join(errors),
                resolution_hint="Fill all required connection fields before testing again.",
            )
        )
    db.commit()
    return result("test_get_data_connection", "Connection test completed.", response)


@data_hub_router.get("/get-data/connections/{connection_id}/metadata", response_model=FrontendAdminApiResult)
def get_data_metadata(
    connection_id: str,
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    row = db.get(frontend_admin_models.DataHubSavedConnection, connection_id)
    if not row:
        raise HTTPException(status_code=404, detail="Saved connection not found")
    if not has_override_scope(actor) and row.company_id != actor.company_id:
        raise HTTPException(status_code=403, detail="Cannot inspect another company's saved connection")
    return result("get_data_metadata", "Discovered tables, files, or endpoints for the selected connection.", {"connection_id": connection_id, "assets": demo_discovery_assets(row.connector_key)})


@data_hub_router.post("/get-data/connections/{connection_id}/selection", response_model=FrontendAdminApiResult)
def save_get_data_selection(
    connection_id: str,
    request: GetDataSelectionRequest,
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    row = db.get(frontend_admin_models.DataHubSavedConnection, connection_id)
    if not row:
        raise HTTPException(status_code=404, detail="Saved connection not found")
    if not has_override_scope(actor) and row.company_id != actor.company_id:
        raise HTTPException(status_code=403, detail="Cannot update another company's saved connection")
    row.selected_assets = request.selected_assets
    row.selected_columns = request.selected_columns
    datahub_audit(db, actor, row.company_id, "select_assets", "get_data_connection", row.id, request.model_dump())
    db.commit()
    db.refresh(row)
    return result("save_get_data_selection", "Selected tables/files/endpoints and columns saved.", serialize_saved_connection(row, company_name_map(db)))


@data_hub_router.get("/get-data/connections/{connection_id}/preview", response_model=FrontendAdminApiResult)
def get_data_preview(
    connection_id: str,
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    row = db.get(frontend_admin_models.DataHubSavedConnection, connection_id)
    if not row:
        raise HTTPException(status_code=404, detail="Saved connection not found")
    if not has_override_scope(actor) and row.company_id != actor.company_id:
        raise HTTPException(status_code=403, detail="Cannot preview another company's saved connection")
    rows = demo_preview_rows((row.selected_assets or [None])[0])
    columns = list(rows[0].keys()) if rows else []
    detected_types = [{"column": column, "detected_type": infer_type(rows[0][column])} for column in columns]
    return result("get_data_preview", "Preview rows generated before loading data.", {"connection_id": connection_id, "columns": columns, "detected_types": detected_types, "rows": rows})


@data_hub_router.post("/get-data/transform-preview", response_model=FrontendAdminApiResult)
def get_data_transform_preview(
    request: GetDataTransformRequest,
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    payload = request.model_dump()
    company_id = resolve_datahub_company_id(payload.pop("company_id", None), actor, db)
    connection = db.get(frontend_admin_models.DataHubSavedConnection, request.connection_id)
    if not connection:
        raise HTTPException(status_code=404, detail="Saved connection not found")
    if not has_override_scope(actor) and connection.company_id != actor.company_id:
        raise HTTPException(status_code=403, detail="Cannot transform another company's saved connection")
    preview = demo_preview_rows()
    operations = request.operations
    operation_names = [item.get("operation") or item.get("name") for item in operations]
    if "Remove duplicates" in operation_names:
        preview = list({row["item_code"]: row for row in preview}.values())
    if "Remove columns" in operation_names:
        preview = [{key: value for key, value in row.items() if key != "updated_at"} for row in preview]
    row = frontend_admin_models.DataHubTransformRecipe(
        id=f"gd-tr-{uuid4()}",
        company_id=company_id,
        connection_id=request.connection_id,
        recipe_name=request.recipe_name,
        operations=operations,
        preview_rows=preview,
        created_by=actor.email,
    )
    db.add(row)
    datahub_audit(db, actor, company_id, "transform_preview", "get_data_transform", row.id, {"operations": operations})
    db.commit()
    return result("get_data_transform_preview", "Power Query-style transformation preview generated and saved.", {"id": row.id, "operations": operations, "preview_rows": preview})


def resolve_module_columns(db: Session, destination_module: str, company_id: str | None) -> list[dict[str, Any]]:
    """Column list for a destination module: a company's own override if it has one,
    else the shared tenant-wide override if set, else the built-in defaults."""
    for scope in ([company_id] if company_id else []) + [None]:
        rows = (
            db.query(frontend_admin_models.DataHubModuleColumn)
            .filter(
                frontend_admin_models.DataHubModuleColumn.destination_module == destination_module,
                frontend_admin_models.DataHubModuleColumn.company_id == scope,
            )
            .order_by(frontend_admin_models.DataHubModuleColumn.display_order)
            .all()
        )
        if rows:
            return [{"column_name": row.column_name, "required": row.required} for row in rows]
    return DEFAULT_MODULE_COLUMNS.get(destination_module, [])


@data_hub_router.get("/get-data/destination-modules/{destination_module}/columns", response_model=FrontendAdminApiResult)
def get_destination_module_columns(
    destination_module: str,
    company_id: str | None = None,
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    if destination_module not in GET_DATA_DESTINATIONS:
        raise HTTPException(status_code=404, detail="Unknown destination module")
    resolved_company_id = resolve_datahub_company_id(company_id, actor, db)
    columns = resolve_module_columns(db, destination_module, resolved_company_id)
    return result("get_data_module_columns", "Expected columns for the destination module.", {"destination_module": destination_module, "columns": columns})


@data_hub_router.get("/get-data/destination-modules/{destination_module}/template.csv")
def download_destination_module_template(
    destination_module: str,
    company_id: str | None = None,
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> Response:
    if destination_module not in GET_DATA_DESTINATIONS:
        raise HTTPException(status_code=404, detail="Unknown destination module")
    resolved_company_id = resolve_datahub_company_id(company_id, actor, db)
    columns = resolve_module_columns(db, destination_module, resolved_company_id)
    buffer = StringIO()
    csv.writer(buffer).writerow([column["column_name"] for column in columns])
    file_name = f"{destination_module.lower().replace(' ', '_')}_column_template.csv"
    return Response(
        content=buffer.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{file_name}"'},
    )


@data_hub_router.put("/get-data/destination-modules/{destination_module}/columns", response_model=FrontendAdminApiResult)
def set_destination_module_columns(
    destination_module: str,
    request: GetDataModuleColumnsRequest,
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    if destination_module not in GET_DATA_DESTINATIONS:
        raise HTTPException(status_code=404, detail="Unknown destination module")
    if request.shared_default:
        if not has_override_scope(actor):
            raise HTTPException(status_code=403, detail="Only a super admin or account owner can set the shared default columns")
        target_company_id = None
    else:
        target_company_id = resolve_datahub_company_id(request.company_id, actor, db)
    db.query(frontend_admin_models.DataHubModuleColumn).filter(
        frontend_admin_models.DataHubModuleColumn.destination_module == destination_module,
        frontend_admin_models.DataHubModuleColumn.company_id == target_company_id,
    ).delete()
    for index, column in enumerate(request.columns):
        db.add(
            frontend_admin_models.DataHubModuleColumn(
                id=f"dhc-{uuid4()}",
                company_id=target_company_id,
                destination_module=destination_module,
                column_name=column.column_name,
                display_order=index,
                required=column.required,
            )
        )
    audit_scope_id = target_company_id or "shared-default"
    datahub_audit(db, actor, target_company_id or "shared-default", "set_module_columns", "get_data_module_columns", f"{destination_module}:{audit_scope_id}", {"destination_module": destination_module, "columns": [c.model_dump() for c in request.columns]})
    db.commit()
    columns = resolve_module_columns(db, destination_module, target_company_id)
    return result("set_get_data_module_columns", "Destination module columns updated.", {"destination_module": destination_module, "columns": columns})


@data_hub_router.post("/get-data/field-mapping/validate", response_model=FrontendAdminApiResult)
def validate_get_data_mapping(
    request: GetDataFieldMappingRequest,
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    payload = request.model_dump()
    company_id = resolve_datahub_company_id(payload.pop("company_id", None), actor, db)
    required_fields = [column["column_name"] for column in resolve_module_columns(db, request.destination_module, company_id) if column["required"]]
    mapped_targets = {item.get("target_field") for item in request.mappings}
    missing = [field for field in required_fields if field not in mapped_targets]
    validation = [
        {"rule": "Required destination fields mapped", "status": "Failed" if missing else "Passed", "severity": "Error" if missing else "Info", "details": missing},
        {"rule": "Preview before load", "status": "Passed", "severity": "Info", "details": "Preview generated from selected assets."},
        {"rule": "Approval before critical import", "status": "Required", "severity": "Approval", "details": "Human approval is required before writing into platform modules."},
    ]
    if request.connection_id:
        connection = db.get(frontend_admin_models.DataHubSavedConnection, request.connection_id)
        if connection and (has_override_scope(actor) or connection.company_id == actor.company_id):
            connection.destination_module = request.destination_module
            connection.field_mappings = request.mappings
            connection.validation_results = validation
    datahub_audit(db, actor, company_id, "validate_mapping", "get_data_mapping", request.connection_id or request.destination_module, {"destination_module": request.destination_module, "validation": validation})
    db.commit()
    return result("validate_get_data_mapping", "Field mapping validated before import.", {"valid": not missing, "validation_results": validation})


@data_hub_router.post("/get-data/model/relationships", response_model=FrontendAdminApiResult)
def create_get_data_relationship(
    request: GetDataRelationshipRequest,
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    payload = request.model_dump()
    company_id = resolve_datahub_company_id(payload.pop("company_id", None), actor, db)
    row = frontend_admin_models.DataHubModelRelationship(id=f"gd-rel-{uuid4()}", company_id=company_id, created_by=actor.email, **payload)
    db.add(row)
    datahub_audit(db, actor, company_id, "create_relationship", "get_data_model_relationship", row.id, payload)
    db.commit()
    return result("create_get_data_relationship", "Data model relationship created.", {"id": row.id, **payload, "company_id": company_id})


@data_hub_router.get("/get-data/model", response_model=FrontendAdminApiResult)
def get_data_model(
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    company_id = scoped_company_id(actor)
    relationship_query = db.query(frontend_admin_models.DataHubModelRelationship)
    connection_query = db.query(frontend_admin_models.DataHubSavedConnection)
    if company_id:
        relationship_query = relationship_query.filter(frontend_admin_models.DataHubModelRelationship.company_id == company_id)
        connection_query = connection_query.filter(frontend_admin_models.DataHubSavedConnection.company_id == company_id)
    connections = connection_query.all()
    relationships = relationship_query.order_by(frontend_admin_models.DataHubModelRelationship.created_at.desc()).all()
    tables = []
    for connection in connections:
        for asset in connection.selected_assets or [f"{connection.connector_name} Dataset"]:
            tables.append(
                {
                    "table": asset,
                    "source": connection.connection_name,
                    "columns": connection.selected_columns or ["item_code", "item_name", "quantity", "status"],
                    "primary_key": (connection.selected_columns or ["item_code"])[0],
                    "measures": [{"name": "Record Count", "expression": "COUNTROWS()"}],
                    "calculated_columns": [{"name": "Status Group", "expression": "IF([status] = 'Low Stock', 'Risk', 'Normal')"}],
                }
            )
    return result(
        "get_data_model",
        "Power BI-style model view with tables, columns, measures and relationships.",
        {
            "tables": tables,
            "relationships": [
                {
                    "id": row.id,
                    "company_id": row.company_id,
                    "left_table": row.left_table,
                    "left_column": row.left_column,
                    "right_table": row.right_table,
                    "right_column": row.right_column,
                    "cardinality": row.cardinality,
                    "direction": row.direction,
                    "active": row.active,
                }
                for row in relationships
            ],
            "validation": {"status": "Valid" if tables else "No model tables yet", "issues": [] if tables else ["Save a connection and select assets to build a model."]},
        },
    )


@data_hub_router.post("/get-data/refresh", response_model=FrontendAdminApiResult)
def run_get_data_refresh(
    request: GetDataRefreshRequest,
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    connection = db.get(frontend_admin_models.DataHubSavedConnection, request.connection_id)
    if not connection:
        raise HTTPException(status_code=404, detail="Saved connection not found")
    company_id = resolve_datahub_company_id(request.company_id, actor, db) if has_override_scope(actor) else actor.company_id
    if not has_override_scope(actor) and connection.company_id != actor.company_id:
        raise HTTPException(status_code=403, detail="Cannot refresh another company's saved connection")
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    success = connection.last_test_status in {"Succeeded", "Not Tested"}
    row = frontend_admin_models.DataHubRefreshRun(
        id=f"gd-rf-{uuid4()}",
        company_id=company_id or connection.company_id,
        connection_id=connection.id,
        refresh_mode=request.refresh_mode,
        status="Completed" if success else "Failed",
        rows_processed=12480 if success else 0,
        started_at=now,
        completed_at=now,
        failure_reason=None if success else "Connection test failed before refresh. Re-test credentials and required fields.",
    )
    connection.refresh_mode = request.refresh_mode
    connection.status = "Loaded" if success else "Refresh Failed"
    db.add(row)
    if not success:
        db.add(
            frontend_admin_models.DataHubErrorLog(
                id=f"dhe-{uuid4()}",
                company_id=row.company_id,
                connection_id=connection.id,
                severity="Error",
                error_code="REFRESH_FAILED",
                message=row.failure_reason or "Refresh failed.",
                resolution_hint="Open the saved connection, test credentials, and run refresh again.",
            )
        )
    datahub_audit(db, actor, row.company_id, "refresh", "get_data_refresh", row.id, {"connection_id": connection.id, "mode": request.refresh_mode, "status": row.status})
    db.commit()
    return result("run_get_data_refresh", "Refresh run recorded.", {"id": row.id, "status": row.status, "rows_processed": row.rows_processed, "failure_reason": row.failure_reason})


@data_hub_router.get("/get-data/refresh-history", response_model=FrontendAdminApiResult)
def get_data_refresh_history(
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    query = db.query(frontend_admin_models.DataHubRefreshRun)
    company_id = scoped_company_id(actor)
    if company_id:
        query = query.filter(frontend_admin_models.DataHubRefreshRun.company_id == company_id)
    rows = query.order_by(frontend_admin_models.DataHubRefreshRun.started_at.desc()).all()
    return result(
        "get_data_refresh_history",
        "Manual, scheduled, incremental and webhook refresh history.",
        [
            {
                "id": row.id,
                "company_id": row.company_id,
                "connection_id": row.connection_id,
                "refresh_mode": row.refresh_mode,
                "status": row.status,
                "rows_processed": row.rows_processed,
                "started_at": row.started_at,
                "completed_at": row.completed_at,
                "failure_reason": row.failure_reason,
            }
            for row in rows
        ],
    )


@data_hub_router.get("/get-data/errors", response_model=FrontendAdminApiResult)
def get_data_errors(
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    query = db.query(frontend_admin_models.DataHubErrorLog)
    company_id = scoped_company_id(actor)
    if company_id:
        query = query.filter(frontend_admin_models.DataHubErrorLog.company_id == company_id)
    rows = query.order_by(frontend_admin_models.DataHubErrorLog.created_at.desc()).all()
    return result(
        "get_data_errors",
        "Failed refresh and connection error logs.",
        [
            {
                "id": row.id,
                "company_id": row.company_id,
                "connection_id": row.connection_id,
                "severity": row.severity,
                "error_code": row.error_code,
                "message": row.message,
                "resolution_hint": row.resolution_hint,
                "created_at": row.created_at.isoformat() if row.created_at else None,
            }
            for row in rows
        ],
    )


@data_hub_router.get("/get-data/audit", response_model=FrontendAdminApiResult)
def get_data_audit(
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    query = db.query(frontend_admin_models.DataHubAuditEvent)
    company_id = scoped_company_id(actor)
    if company_id:
        query = query.filter(frontend_admin_models.DataHubAuditEvent.company_id == company_id)
    rows = query.order_by(frontend_admin_models.DataHubAuditEvent.created_at.desc()).limit(100).all()
    return result(
        "get_data_audit",
        "Audit trail for connector, preview, transform, model, refresh and credential actions.",
        [
            {
                "id": row.id,
                "company_id": row.company_id,
                "actor_email": row.actor_email,
                "action": row.action,
                "entity_type": row.entity_type,
                "entity_id": row.entity_id,
                "details": row.details,
                "created_at": row.created_at.isoformat() if row.created_at else None,
            }
            for row in rows
        ],
    )


@data_hub_router.get("/connected-systems", response_model=FrontendAdminApiResult)
def connected_systems(
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    query = db.query(frontend_admin_models.ManufacturingDataConnection)
    company_id = scoped_company_id(actor)
    if company_id:
        query = query.filter(frontend_admin_models.ManufacturingDataConnection.company_id == company_id)
    rows = query.order_by(frontend_admin_models.ManufacturingDataConnection.system_name).all()
    companies = company_name_map(db)
    details = connection_details_map(db, [row.id for row in rows])
    return result("connected_systems", "Connected systems with status, sync, health and record count.", [serialize_connection(row, companies, details.get(row.id)) for row in rows])


@data_hub_router.post("/connected-systems", response_model=FrontendAdminApiResult)
def create_connected_system(
    request: DataHubConnectionRequest,
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    payload = request.model_dump()
    company_id = resolve_datahub_company_id(payload.pop("company_id", None), actor, db)
    connection_details = payload.pop("connection_details", {})
    source_category = payload.pop("source_category", None)
    auth_method = payload.pop("auth_method", None)
    system_type = payload.pop("system_type")
    if source_category or auth_method or connection_details:
        system_type = f"{system_type} | {source_category or 'General'} | {auth_method or 'No Auth'}"
    row = frontend_admin_models.ManufacturingDataConnection(
        id=f"conn-{uuid4()}",
        company_id=company_id,
        system_type=system_type,
        **payload,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    if connection_details:
        upsert_metadata(
            db,
            category="datahub_connection_details",
            record_key=row.id,
            row_id=f"details-{row.id}",
            company_id=company_id,
            payload={
                "connection_id": row.id,
                "source_category": source_category,
                "auth_method": auth_method,
                "connection_details": connection_details,
            },
            name=row.system_name,
        )
        db.commit()
    details = connection_details_map(db, [row.id])
    return result("create_connected_system", "Connected system created for the selected company.", serialize_connection(row, company_name_map(db), details.get(row.id)))


@data_hub_router.put("/connected-systems/{connection_id}", response_model=FrontendAdminApiResult)
def update_connected_system(
    connection_id: str,
    request: DataHubConnectionRequest,
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    row = db.get(frontend_admin_models.ManufacturingDataConnection, connection_id)
    if not row:
        raise HTTPException(status_code=404, detail="Connected system not found")
    if not has_override_scope(actor) and row.company_id != actor.company_id:
        raise HTTPException(status_code=403, detail="Cannot modify another company's DataHub connection")
    payload = request.model_dump()
    requested_company_id = payload.pop("company_id", None)
    if has_override_scope(actor) and requested_company_id:
        row.company_id = resolve_datahub_company_id(requested_company_id, actor, db)
    connection_details = payload.pop("connection_details", {})
    source_category = payload.pop("source_category", None)
    auth_method = payload.pop("auth_method", None)
    if source_category or auth_method or connection_details:
        payload["system_type"] = f"{payload['system_type']} | {source_category or 'General'} | {auth_method or 'No Auth'}"
    for key, value in payload.items():
        setattr(row, key, value)
    if connection_details:
        upsert_metadata(
            db,
            category="datahub_connection_details",
            record_key=row.id,
            row_id=f"details-{row.id}",
            company_id=row.company_id,
            payload={
                "connection_id": row.id,
                "source_category": source_category,
                "auth_method": auth_method,
                "connection_details": connection_details,
            },
            name=row.system_name,
        )
    db.commit()
    db.refresh(row)
    details = connection_details_map(db, [row.id])
    return result("update_connected_system", "Connected system updated.", serialize_connection(row, company_name_map(db), details.get(row.id)))


@data_hub_router.delete("/connected-systems/{connection_id}", response_model=FrontendAdminApiResult)
def delete_connected_system(
    connection_id: str,
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    row = db.get(frontend_admin_models.ManufacturingDataConnection, connection_id)
    if not row:
        raise HTTPException(status_code=404, detail="Connected system not found")
    if not has_override_scope(actor) and row.company_id != actor.company_id:
        raise HTTPException(status_code=403, detail="Cannot delete another company's DataHub connection")
    db.delete(row)
    db.commit()
    return result("delete_connected_system", "Connected system deleted.", {"id": connection_id})


@data_hub_router.get("/catalog", response_model=FrontendAdminApiResult)
def data_catalog(
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    query = db.query(frontend_admin_models.DataCatalogEntry)
    company_id = scoped_company_id(actor)
    if company_id:
        query = query.filter(frontend_admin_models.DataCatalogEntry.company_id == company_id)
    rows = query.order_by(frontend_admin_models.DataCatalogEntry.data_type).all()
    companies = company_name_map(db)
    return result("data_catalog", "Manufacturing data catalog.", [serialize_catalog(row, companies) for row in rows])


@data_hub_router.post("/catalog", response_model=FrontendAdminApiResult)
def create_data_catalog_entry(
    request: DataCatalogEntryRequest,
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    payload = request.model_dump()
    company_id = resolve_datahub_company_id(payload.pop("company_id", None), actor, db)
    row = frontend_admin_models.DataCatalogEntry(
        id=f"catalog-{uuid4()}",
        company_id=company_id,
        **payload,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return result("create_data_catalog_entry", "Data catalog entry created for the selected company.", serialize_catalog(row, company_name_map(db)))


@data_hub_router.put("/catalog/{entry_id}", response_model=FrontendAdminApiResult)
def update_data_catalog_entry(
    entry_id: str,
    request: DataCatalogEntryRequest,
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    row = db.get(frontend_admin_models.DataCatalogEntry, entry_id)
    if not row:
        raise HTTPException(status_code=404, detail="Catalog entry not found")
    if not has_override_scope(actor) and row.company_id != actor.company_id:
        raise HTTPException(status_code=403, detail="Cannot modify another company's DataHub catalog")
    payload = request.model_dump()
    requested_company_id = payload.pop("company_id", None)
    if has_override_scope(actor) and requested_company_id:
        row.company_id = resolve_datahub_company_id(requested_company_id, actor, db)
    for key, value in payload.items():
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return result("update_data_catalog_entry", "Data catalog entry updated.", serialize_catalog(row, company_name_map(db)))


@data_hub_router.delete("/catalog/{entry_id}", response_model=FrontendAdminApiResult)
def delete_data_catalog_entry(
    entry_id: str,
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    row = db.get(frontend_admin_models.DataCatalogEntry, entry_id)
    if not row:
        raise HTTPException(status_code=404, detail="Catalog entry not found")
    if not has_override_scope(actor) and row.company_id != actor.company_id:
        raise HTTPException(status_code=403, detail="Cannot delete another company's DataHub catalog")
    db.delete(row)
    db.commit()
    return result("delete_data_catalog_entry", "Data catalog entry deleted.", {"id": entry_id})


@data_hub_router.get("/mappings", response_model=FrontendAdminApiResult)
def mappings(
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    query = db.query(frontend_admin_models.DataMappingRule)
    company_id = scoped_company_id(actor)
    if company_id:
        query = query.filter(frontend_admin_models.DataMappingRule.company_id == company_id)
    rows = query.order_by(frontend_admin_models.DataMappingRule.source_system, frontend_admin_models.DataMappingRule.source_field).all()
    companies = company_name_map(db)
    return result("mappings", "Data mapping studio rules.", [serialize_mapping(row, companies) for row in rows])


@data_hub_router.post("/mappings", response_model=FrontendAdminApiResult)
def create_mapping(
    request: DataMappingRuleRequest,
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    payload = request.model_dump()
    company_id = resolve_datahub_company_id(payload.pop("company_id", None), actor, db)
    row = frontend_admin_models.DataMappingRule(
        id=f"map-{uuid4()}",
        company_id=company_id,
        **payload,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return result("create_mapping", "Data mapping rule created for the selected company.", serialize_mapping(row, company_name_map(db)))


@data_hub_router.put("/mappings/{mapping_id}", response_model=FrontendAdminApiResult)
def update_mapping(
    mapping_id: str,
    request: DataMappingRuleRequest,
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    row = db.get(frontend_admin_models.DataMappingRule, mapping_id)
    if not row:
        raise HTTPException(status_code=404, detail="Mapping rule not found")
    if not has_override_scope(actor) and row.company_id != actor.company_id:
        raise HTTPException(status_code=403, detail="Cannot modify another company's DataHub mapping")
    payload = request.model_dump()
    requested_company_id = payload.pop("company_id", None)
    if has_override_scope(actor) and requested_company_id:
        row.company_id = resolve_datahub_company_id(requested_company_id, actor, db)
    for key, value in payload.items():
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return result("update_mapping", "Data mapping rule updated.", serialize_mapping(row, company_name_map(db)))


@data_hub_router.delete("/mappings/{mapping_id}", response_model=FrontendAdminApiResult)
def delete_mapping(
    mapping_id: str,
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    row = db.get(frontend_admin_models.DataMappingRule, mapping_id)
    if not row:
        raise HTTPException(status_code=404, detail="Mapping rule not found")
    if not has_override_scope(actor) and row.company_id != actor.company_id:
        raise HTTPException(status_code=403, detail="Cannot delete another company's DataHub mapping")
    db.delete(row)
    db.commit()
    return result("delete_mapping", "Data mapping rule deleted.", {"id": mapping_id})


@data_hub_router.post("/mappings/preview", response_model=FrontendAdminApiResult)
def mapping_preview(
    request: DataMappingPreviewRequest,
    _: User = Depends(require_any("admin")),
) -> FrontendAdminApiResult:
    return result("mapping_preview", "Field mapping preview with transform output.", frontend_admin_service.mapping_preview(request.model_dump()))


@data_hub_router.get("/data-quality", response_model=FrontendAdminApiResult)
def data_quality(
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    query = db.query(frontend_admin_models.DataCatalogEntry)
    company_id = scoped_company_id(actor)
    if company_id:
        query = query.filter(frontend_admin_models.DataCatalogEntry.company_id == company_id)
    rows = query.all()
    if not rows:
        return result("data_quality", "Data quality center scores.", {"overall_score": 0, "scores": []})
    scores = [
        {
            "data_type": row.data_type,
            "accuracy": row.quality_score,
            "completeness": max(row.quality_score - 3, 0),
            "consistency": max(row.quality_score - 5, 0),
            "timeliness": max(row.quality_score - 7, 0),
        }
        for row in rows
    ]
    return result("data_quality", "Data quality center scores.", {"overall_score": round(mean(item["accuracy"] for item in scores), 2), "scores": scores})


@data_hub_router.get("/ai-readiness", response_model=FrontendAdminApiResult)
def ai_readiness(
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    return result("ai_readiness", "AI readiness center scores.", merged_ai_readiness(actor, db))


@data_hub_router.put("/ai-readiness", response_model=FrontendAdminApiResult)
def update_ai_readiness(
    request: AiReadinessOverrideRequest,
    actor: User = Depends(require_executive_editor),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    rows = []
    for item in request.readiness:
        payload = item.model_dump()
        upsert_metadata(
            db,
            category="ai_readiness_override",
            record_key=item.area,
            row_id=f"air-{uuid4()}",
            company_id=actor.company_id,
            payload=payload,
            name=item.area,
        )
        rows.append(payload)
    db.commit()
    overall = round(mean(item["score"] for item in rows), 2) if rows else 0
    return result("update_ai_readiness", "AI readiness overrides updated.", {"overall_ai_readiness": overall, "readiness": rows})


@data_hub_router.get("/uploads", response_model=FrontendAdminApiResult)
def uploads(
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    company_id = scoped_company_id(actor)
    if company_id:
        rows = list_metadata(db, "datahub_upload", company_id=company_id)
    else:
        rows = [
            row.payload
            for row in db.query(AppMetadata)
            .filter(AppMetadata.tenant_id == "tenant-demo-001", AppMetadata.category == "datahub_upload")
            .order_by(AppMetadata.record_key.asc())
            .all()
        ]
    companies = company_name_map(db)
    for row in rows:
        row["company_name"] = companies.get(row.get("company_id"), row.get("company_id"))
    return result("uploads", "Stored DataHub upload manifests.", rows)


@data_hub_router.post("/uploads", response_model=FrontendAdminApiResult)
async def create_upload(
    file: UploadFile = File(...),
    company_id: str | None = Form(default=None),
    plant_id: str | None = Form(default=None),
    plant_name: str | None = Form(default=None),
    actor: User = Depends(require_executive_editor),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    content = await file.read()
    preview = extract_upload_preview(file.filename or "upload", content)
    target_company_id = resolve_datahub_company_id(company_id, actor, db)
    payload = upload_manifest_payload(
        company_id=target_company_id,
        source="local_upload",
        provider="Local Computer",
        resource_name=file.filename or "upload",
        file_format=preview["detected_format"],
        resource_url=None,
        uploaded_by=actor.email,
        metadata={
            "content_type": file.content_type,
            "size_bytes": len(content),
            "preview": preview,
            "plant_id": plant_id,
            "plant_name": plant_name,
        },
    )
    upsert_metadata(
        db,
        category="datahub_upload",
        record_key=payload["id"],
        row_id=payload["id"],
        company_id=target_company_id,
        payload=payload,
        name=payload["resource_name"],
    )
    db.commit()
    return result("create_upload", "DataHub file uploaded and profiled.", payload)


@data_hub_router.post("/cloud-sources", response_model=FrontendAdminApiResult)
def create_cloud_source(
    request: CloudSourceUploadRequest,
    actor: User = Depends(require_executive_editor),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    payload_request = request.model_dump()
    target_company_id = resolve_datahub_company_id(payload_request.pop("company_id", None), actor, db)
    payload = upload_manifest_payload(
        company_id=target_company_id,
        source="cloud_link",
        provider=payload_request["provider"],
        resource_name=payload_request["resource_name"],
        file_format=payload_request["file_format"],
        resource_url=payload_request["resource_url"],
        uploaded_by=actor.email,
        metadata={
            "sync_mode": payload_request["sync_mode"],
            "auth_method": payload_request.get("auth_method"),
            "connection_details": payload_request.get("connection_details", {}),
        },
    )
    upsert_metadata(
        db,
        category="datahub_upload",
        record_key=payload["id"],
        row_id=payload["id"],
        company_id=target_company_id,
        payload=payload,
        name=payload["resource_name"],
    )
    db.commit()
    return result("create_cloud_source", "Cloud storage source linked for DataHub intake.", payload)


@data_hub_router.get("/lineage", response_model=FrontendAdminApiResult)
def lineage(
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    query = db.query(frontend_admin_models.DataCatalogEntry)
    company_id = scoped_company_id(actor)
    if company_id:
        query = query.filter(frontend_admin_models.DataCatalogEntry.company_id == company_id)
    rows = query.all()
    return result("lineage", "Data lineage center.", {"lineage": [{"source_system": item.source_system, "data_type": item.data_type, "transformation": "mapped and validated", "ai_usage": "risk scoring"} for item in rows]})


@data_hub_router.get("/event-streaming", response_model=FrontendAdminApiResult)
def event_streaming(_: User = Depends(require_any("admin"))) -> FrontendAdminApiResult:
    return result("event_streaming", "Event streaming hub sources.", {"sources": ["PLC", "MES", "IoT", "Sensors", "RFID"], "mode": "ingestion-ready"})


@data_hub_router.get("/pending-updates", response_model=FrontendAdminApiResult)
def pending_updates(
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    query = db.query(frontend_admin_models.PendingErpUpdate)
    company_id = scoped_company_id(actor)
    if company_id:
        query = query.filter(frontend_admin_models.PendingErpUpdate.company_id == company_id)
    rows = query.order_by(frontend_admin_models.PendingErpUpdate.id).all()
    data = [
        {
            "id": row.id,
            "company_id": row.company_id,
            "recommendation": row.recommendation,
            "entity_type": row.entity_type,
            "entity_id": row.entity_id,
            "current_value": row.current_value,
            "recommended_value": row.recommended_value,
            "approval_status": row.approval_status,
            "erp_status": row.erp_status,
        }
        for row in rows
    ]
    return result("pending_updates", "Read-only ERP pending update center.", data)


@data_hub_router.post("/pending-updates/{update_id}/decision", response_model=FrontendAdminApiResult)
def pending_update_decision(
    update_id: str,
    request: PendingUpdateDecisionRequest,
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    row = db.get(frontend_admin_models.PendingErpUpdate, update_id)
    if not row:
        raise HTTPException(status_code=404, detail="Pending update not found")
    if not has_override_scope(actor) and row.company_id != actor.company_id:
        raise HTTPException(status_code=403, detail="Cannot decide another company's pending ERP updates")
    row.approval_status = request.decision
    row.erp_status = "Export Ready" if request.decision == "Approved" else "Rejected"
    db.commit()
    return result(
        "pending_update_decision",
        "Pending ERP update decision captured for export workflow.",
        {
            "id": row.id,
            "company_id": row.company_id,
            "recommendation": row.recommendation,
            "entity_type": row.entity_type,
            "entity_id": row.entity_id,
            "current_value": row.current_value,
            "recommended_value": row.recommended_value,
            "approval_status": row.approval_status,
            "erp_status": row.erp_status,
            "decided_by": request.decided_by,
            "decision_comment": request.comment,
        },
    )


@data_hub_router.get("/action-center", response_model=FrontendAdminApiResult)
def action_center(_: User = Depends(require_any("admin"))) -> FrontendAdminApiResult:
    return result("action_center", "Action center grouped by operational module.", frontend_admin_service.action_center())


@data_hub_router.get("/erp-feedback", response_model=FrontendAdminApiResult)
def erp_feedback(_: User = Depends(require_any("admin"))) -> FrontendAdminApiResult:
    return result("erp_feedback", "ERP feedback center.", frontend_admin_service.erp_feedback())


@data_hub_router.get("/reconciliation", response_model=FrontendAdminApiResult)
def reconciliation(_: User = Depends(require_any("admin"))) -> FrontendAdminApiResult:
    return result("reconciliation", "ERP value vs platform recommendation reconciliation.", frontend_admin_service.reconciliation())


@data_hub_router.get("/synchronization-dashboard", response_model=FrontendAdminApiResult)
def synchronization_dashboard(_: User = Depends(require_any("admin"))) -> FrontendAdminApiResult:
    return result("synchronization_dashboard", "Synchronization dashboard metrics and write modes.", frontend_admin_service.synchronization_dashboard())


@planning_router.get("/overview", response_model=FrontendAdminApiResult)
def planning_overview() -> FrontendAdminApiResult:
    return result("planning_overview", "Planning module blueprint.", frontend_admin_service.planning_overview())


@ai_command_router.get("/overview", response_model=FrontendAdminApiResult)
def ai_command_center() -> FrontendAdminApiResult:
    return result("ai_command_center", "AI command center blueprint.", frontend_admin_service.ai_command_center())


@digital_twin_router.get("/overview", response_model=FrontendAdminApiResult)
def digital_twin() -> FrontendAdminApiResult:
    return result("digital_twin", "Digital twin and knowledge graph blueprint.", frontend_admin_service.digital_twin())


@digital_ops_router.get("/overview", response_model=FrontendAdminApiResult)
def digital_operations_center() -> FrontendAdminApiResult:
    return result("digital_operations_center", "Digital operations center executive layer.", frontend_admin_service.digital_operations_center())
