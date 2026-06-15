from statistics import mean
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from . import frontend_admin_models  # noqa: F401
from ..database import get_db
from ..platform_models import User
from ..platform_models import Plant
from ..runtime_router import current_user, require_any
from .frontend_admin_repository import frontend_admin_repo
from .frontend_admin_schemas import (
    DataCatalogEntryRequest,
    DataHubConnectionRequest,
    DashboardAccessRequest,
    DataMappingRuleRequest,
    DataMappingPreviewRequest,
    FrontendAdminApiResult,
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


def serialize_connection(row: frontend_admin_models.ManufacturingDataConnection) -> dict[str, Any]:
    return {
        "id": row.id,
        "company_id": row.company_id,
        "system_name": row.system_name,
        "system_type": row.system_type,
        "connection_status": row.connection_status,
        "last_sync": row.last_sync,
        "health_score": row.health_score,
        "record_count": row.record_count,
    }


def serialize_catalog(row: frontend_admin_models.DataCatalogEntry) -> dict[str, Any]:
    return {
        "id": row.id,
        "company_id": row.company_id,
        "data_type": row.data_type,
        "source_system": row.source_system,
        "owner": row.owner,
        "ai_ready": row.ai_ready,
        "quality_score": row.quality_score,
        "lineage": row.lineage or {},
    }


def serialize_mapping(row: frontend_admin_models.DataMappingRule) -> dict[str, Any]:
    return {
        "id": row.id,
        "company_id": row.company_id,
        "source_system": row.source_system,
        "source_field": row.source_field,
        "target_entity": row.target_entity,
        "target_field": row.target_field,
        "transform_rule": row.transform_rule,
        "confidence": row.confidence,
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
    pending_rows = pending_query.all()
    data_quality = round(mean([row.quality_score for row in catalog_rows]), 2) if catalog_rows else 0
    readiness_rows = [
        row.quality_score if row.ai_ready else max(row.quality_score - 20, 0)
        for row in catalog_rows
    ]
    ai_readiness = round(mean(readiness_rows), 2) if readiness_rows else 0
    return result(
        "admin_dashboard",
        "Admin dashboard metrics.",
        {
            "user_count": user_query.count(),
            "active_users": user_query.filter(User.is_active.is_(True)).count(),
            "plants": plant_query.count(),
            "warehouses": len({(row.lineage or {}).get("warehouse") for row in catalog_rows if (row.lineage or {}).get("warehouse")}),
            "integrations": connection_query.count(),
            "data_quality": data_quality,
            "ai_readiness": ai_readiness,
            "open_approvals": len([row for row in pending_rows if row.approval_status == "Pending"]),
            "pending_actions": len(pending_rows),
        },
    )


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
    return result("connected_systems", "Connected systems with status, sync, health and record count.", [serialize_connection(row) for row in rows])


@data_hub_router.post("/connected-systems", response_model=FrontendAdminApiResult)
def create_connected_system(
    request: DataHubConnectionRequest,
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    row = frontend_admin_models.ManufacturingDataConnection(
        id=f"conn-{uuid4()}",
        company_id=actor.company_id or "company-c",
        **request.model_dump(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return result("create_connected_system", "Connected system created for this company.", serialize_connection(row))


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
    for key, value in request.model_dump().items():
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return result("update_connected_system", "Connected system updated.", serialize_connection(row))


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
    return result("data_catalog", "Manufacturing data catalog.", [serialize_catalog(row) for row in rows])


@data_hub_router.post("/catalog", response_model=FrontendAdminApiResult)
def create_data_catalog_entry(
    request: DataCatalogEntryRequest,
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    row = frontend_admin_models.DataCatalogEntry(
        id=f"catalog-{uuid4()}",
        company_id=actor.company_id or "company-c",
        **request.model_dump(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return result("create_data_catalog_entry", "Data catalog entry created.", serialize_catalog(row))


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
    for key, value in request.model_dump().items():
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return result("update_data_catalog_entry", "Data catalog entry updated.", serialize_catalog(row))


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
    return result("mappings", "Data mapping studio rules.", [serialize_mapping(row) for row in rows])


@data_hub_router.post("/mappings", response_model=FrontendAdminApiResult)
def create_mapping(
    request: DataMappingRuleRequest,
    actor: User = Depends(require_any("admin")),
    db: Session = Depends(get_db),
) -> FrontendAdminApiResult:
    row = frontend_admin_models.DataMappingRule(
        id=f"map-{uuid4()}",
        company_id=actor.company_id or "company-c",
        **request.model_dump(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return result("create_mapping", "Data mapping rule created.", serialize_mapping(row))


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
    for key, value in request.model_dump().items():
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return result("update_mapping", "Data mapping rule updated.", serialize_mapping(row))


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
    query = db.query(frontend_admin_models.DataCatalogEntry)
    company_id = scoped_company_id(actor)
    if company_id:
        query = query.filter(frontend_admin_models.DataCatalogEntry.company_id == company_id)
    rows = query.all()
    if not rows:
        return result("ai_readiness", "AI readiness center scores.", {"overall_ai_readiness": 0, "readiness": []})
    readiness = [
        {
            "area": f"{row.data_type} AI Readiness",
            "score": row.quality_score if row.ai_ready else max(row.quality_score - 20, 0),
            "ready": row.ai_ready,
        }
        for row in rows
    ]
    return result("ai_readiness", "AI readiness center scores.", {"overall_ai_readiness": round(mean(item["score"] for item in readiness), 2), "readiness": readiness})


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
