from typing import Any

from fastapi import APIRouter, HTTPException

from . import frontend_admin_models  # noqa: F401
from .frontend_admin_repository import frontend_admin_repo
from .frontend_admin_schemas import (
    DashboardAccessRequest,
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
def admin_dashboard() -> FrontendAdminApiResult:
    return result("admin_dashboard", "Admin dashboard metrics.", frontend_admin_service.admin_dashboard())


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
def connected_systems() -> FrontendAdminApiResult:
    return result("connected_systems", "Connected systems with status, sync, health and record count.", frontend_admin_repo.snapshot(frontend_admin_repo.connections))


@data_hub_router.get("/catalog", response_model=FrontendAdminApiResult)
def data_catalog() -> FrontendAdminApiResult:
    return result("data_catalog", "Manufacturing data catalog.", frontend_admin_repo.snapshot(frontend_admin_repo.catalog))


@data_hub_router.get("/mappings", response_model=FrontendAdminApiResult)
def mappings() -> FrontendAdminApiResult:
    return result("mappings", "Data mapping studio rules.", frontend_admin_repo.snapshot(frontend_admin_repo.mappings))


@data_hub_router.post("/mappings/preview", response_model=FrontendAdminApiResult)
def mapping_preview(request: DataMappingPreviewRequest) -> FrontendAdminApiResult:
    return result("mapping_preview", "Field mapping preview with transform output.", frontend_admin_service.mapping_preview(request.model_dump()))


@data_hub_router.get("/data-quality", response_model=FrontendAdminApiResult)
def data_quality() -> FrontendAdminApiResult:
    return result("data_quality", "Data quality center scores.", frontend_admin_service.data_quality())


@data_hub_router.get("/ai-readiness", response_model=FrontendAdminApiResult)
def ai_readiness() -> FrontendAdminApiResult:
    return result("ai_readiness", "AI readiness center scores.", frontend_admin_service.ai_readiness())


@data_hub_router.get("/lineage", response_model=FrontendAdminApiResult)
def lineage() -> FrontendAdminApiResult:
    return result("lineage", "Data lineage center.", {"lineage": [{"source_system": item["source_system"], "data_type": item["data_type"], "transformation": "mapped and validated", "ai_usage": "risk scoring"} for item in frontend_admin_repo.catalog]})


@data_hub_router.get("/event-streaming", response_model=FrontendAdminApiResult)
def event_streaming() -> FrontendAdminApiResult:
    return result("event_streaming", "Event streaming hub sources.", {"sources": ["PLC", "MES", "IoT", "Sensors", "RFID"], "mode": "ingestion-ready"})


@data_hub_router.get("/pending-updates", response_model=FrontendAdminApiResult)
def pending_updates() -> FrontendAdminApiResult:
    return result("pending_updates", "Read-only ERP pending update center.", frontend_admin_repo.snapshot(frontend_admin_repo.pending_updates))


@data_hub_router.post("/pending-updates/{update_id}/decision", response_model=FrontendAdminApiResult)
def pending_update_decision(update_id: str, request: PendingUpdateDecisionRequest) -> FrontendAdminApiResult:
    try:
        data = frontend_admin_service.approve_pending_update(update_id, request.model_dump())
    except KeyError as error:
        raise HTTPException(status_code=404, detail=f"Pending update not found: {error.args[0]}") from error
    return result("pending_update_decision", "Pending ERP update decision captured for export workflow.", data)


@data_hub_router.get("/action-center", response_model=FrontendAdminApiResult)
def action_center() -> FrontendAdminApiResult:
    return result("action_center", "Action center grouped by operational module.", frontend_admin_service.action_center())


@data_hub_router.get("/erp-feedback", response_model=FrontendAdminApiResult)
def erp_feedback() -> FrontendAdminApiResult:
    return result("erp_feedback", "ERP feedback center.", frontend_admin_service.erp_feedback())


@data_hub_router.get("/reconciliation", response_model=FrontendAdminApiResult)
def reconciliation() -> FrontendAdminApiResult:
    return result("reconciliation", "ERP value vs platform recommendation reconciliation.", frontend_admin_service.reconciliation())


@data_hub_router.get("/synchronization-dashboard", response_model=FrontendAdminApiResult)
def synchronization_dashboard() -> FrontendAdminApiResult:
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
