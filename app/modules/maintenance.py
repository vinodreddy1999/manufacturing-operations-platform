from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException

from . import maintenance_models  # noqa: F401 - registers SQLAlchemy maintenance tables
from .maintenance_repository import maintenance_repo
from .maintenance_schemas import (
    DowntimeEventRequest,
    MachineDocumentRequest,
    MachineRequest,
    MaintenanceApiResult,
    MaintenanceAttachmentRequest,
    MaintenanceDraftActionRequest,
    MaintenancePlanRequest,
    MaintenanceRuleRequest,
    RuntimeLogRequest,
    ShutdownWindowRequest,
    SparePartRequest,
    SpareReservationRequest,
    VendorRequest,
    WorkOrderAssignRequest,
    WorkOrderCompleteRequest,
    WorkOrderRequest,
)
from .maintenance_service import maintenance_service

router = APIRouter(prefix="/maintenance", tags=["Maintenance Management"])
alias_router = APIRouter(tags=["Maintenance Management"])
ai_router = APIRouter(prefix="/ai/maintenance", tags=["Maintenance AI"])


def result(action: str, message: str, data: dict[str, Any] | list[dict[str, Any]]) -> MaintenanceApiResult:
    return MaintenanceApiResult(action=action, message=message, data=data)


def not_found(error: KeyError) -> HTTPException:
    return HTTPException(status_code=404, detail=f"Maintenance record not found: {error.args[0]}")


def invalid(error: ValueError) -> HTTPException:
    return HTTPException(status_code=400, detail=str(error))


@router.get("/dashboard", response_model=MaintenanceApiResult)
def dashboard() -> MaintenanceApiResult:
    return result("dashboard", "Maintenance dashboard with open work orders, overdue plans, breakdowns, risks, spares, MTTR, MTBF, downtime and cost.", maintenance_service.dashboard())


@router.get("/machines", response_model=MaintenanceApiResult)
@alias_router.get("/machines", response_model=MaintenanceApiResult)
def list_machines() -> MaintenanceApiResult:
    return result("list_machines", "Machine registry with status, criticality, lifecycle and capability context.", maintenance_repo.snapshot(maintenance_repo.machines))


@router.post("/machines", response_model=MaintenanceApiResult)
@alias_router.post("/machines", response_model=MaintenanceApiResult)
def create_machine(request: MachineRequest) -> MaintenanceApiResult:
    machine = maintenance_service.create_machine(request.model_dump())
    return result("create_machine", "Maintenance machine created with capability configuration.", machine)


@router.get("/machines/{machine_id}", response_model=MaintenanceApiResult)
@alias_router.get("/machines/{machine_id}", response_model=MaintenanceApiResult)
def get_machine(machine_id: str) -> MaintenanceApiResult:
    try:
        machine = maintenance_service.machine_record(machine_id)
    except KeyError as error:
        raise not_found(error) from error
    capabilities = maintenance_repo.get(maintenance_repo.capabilities, machine["machine_id"], key="machine_id")
    return result("get_machine", "Machine detail.", {**machine, "capabilities": capabilities})


@router.put("/machines/{machine_id}", response_model=MaintenanceApiResult)
@alias_router.put("/machines/{machine_id}", response_model=MaintenanceApiResult)
def update_machine(machine_id: str, request: MachineRequest) -> MaintenanceApiResult:
    try:
        machine = maintenance_service.update_machine(machine_id, request.model_dump())
    except KeyError as error:
        raise not_found(error) from error
    return result("update_machine", "Machine updated.", machine)


@router.delete("/machines/{machine_id}", response_model=MaintenanceApiResult)
@alias_router.delete("/machines/{machine_id}", response_model=MaintenanceApiResult)
def delete_machine(machine_id: str) -> MaintenanceApiResult:
    try:
        machine = maintenance_repo.delete(maintenance_repo.machines, machine_id)
    except KeyError as error:
        raise not_found(error) from error
    return result("delete_machine", "Machine deleted.", machine)


@router.get("/rules", response_model=MaintenanceApiResult)
def list_rules() -> MaintenanceApiResult:
    return result("list_rules", "Calendar, runtime, production-aware, shutdown-window, manual and breakdown maintenance rules.", maintenance_repo.snapshot(maintenance_repo.rules))


@router.post("/rules", response_model=MaintenanceApiResult)
def create_rule(request: MaintenanceRuleRequest) -> MaintenanceApiResult:
    capability = maintenance_repo.get(maintenance_repo.capabilities, request.machine_id, key="machine_id")
    if request.rule_type == "Runtime-based" and capability and not capability["enable_runtime_tracking"]:
        raise HTTPException(status_code=400, detail="Runtime rule disabled because runtime tracking is not enabled for this machine.")
    rule = maintenance_repo.add(maintenance_repo.rules, request.model_dump(), "rule")
    return result("create_rule", "Maintenance rule created.", rule)


@router.get("/maintenance-plans", response_model=MaintenanceApiResult)
@alias_router.get("/maintenance-plans", response_model=MaintenanceApiResult)
def list_plans() -> MaintenanceApiResult:
    return result("list_maintenance_plans", "Preventive, calendar and runtime maintenance plans.", maintenance_repo.snapshot(maintenance_repo.plans))


@router.post("/maintenance-plans", response_model=MaintenanceApiResult)
@alias_router.post("/maintenance-plans", response_model=MaintenanceApiResult)
def create_plan(request: MaintenancePlanRequest) -> MaintenanceApiResult:
    plan = maintenance_repo.add(maintenance_repo.plans, request.model_dump(), "plan")
    return result("create_maintenance_plan", "Maintenance plan created.", plan)


@router.put("/maintenance-plans/{plan_id}", response_model=MaintenanceApiResult)
@alias_router.put("/maintenance-plans/{plan_id}", response_model=MaintenanceApiResult)
def update_plan(plan_id: str, request: MaintenancePlanRequest) -> MaintenanceApiResult:
    try:
        plan = maintenance_repo.update(maintenance_repo.plans, plan_id, request.model_dump())
    except KeyError as error:
        raise not_found(error) from error
    return result("update_maintenance_plan", "Maintenance plan updated.", plan)


@router.get("/work-orders", response_model=MaintenanceApiResult)
@alias_router.get("/work-orders", response_model=MaintenanceApiResult)
def list_work_orders() -> MaintenanceApiResult:
    return result("list_work_orders", "Maintenance work order queue.", maintenance_repo.snapshot(maintenance_repo.work_orders))


@router.post("/work-orders", response_model=MaintenanceApiResult)
@alias_router.post("/work-orders", response_model=MaintenanceApiResult)
def create_work_order(request: WorkOrderRequest) -> MaintenanceApiResult:
    try:
        work_order = maintenance_service.create_work_order(request.model_dump())
    except KeyError as error:
        raise not_found(error) from error
    return result("create_work_order", "Maintenance work order created with risk-based approval model.", work_order)


@router.get("/work-orders/{work_order_id}", response_model=MaintenanceApiResult)
@alias_router.get("/work-orders/{work_order_id}", response_model=MaintenanceApiResult)
def get_work_order(work_order_id: str) -> MaintenanceApiResult:
    try:
        work_order = maintenance_service.work_order(work_order_id)
    except KeyError as error:
        raise not_found(error) from error
    return result("get_work_order", "Maintenance work order detail.", work_order)


@router.put("/work-orders/{work_order_id}", response_model=MaintenanceApiResult)
@alias_router.put("/work-orders/{work_order_id}", response_model=MaintenanceApiResult)
def update_work_order(work_order_id: str, request: WorkOrderRequest) -> MaintenanceApiResult:
    try:
        work_order = maintenance_repo.update(maintenance_repo.work_orders, work_order_id, request.model_dump())
    except KeyError as error:
        raise not_found(error) from error
    return result("update_work_order", "Maintenance work order updated.", work_order)


@router.post("/work-orders/{work_order_id}/assign", response_model=MaintenanceApiResult)
@alias_router.post("/work-orders/{work_order_id}/assign", response_model=MaintenanceApiResult)
def assign_work_order(work_order_id: str, request: WorkOrderAssignRequest) -> MaintenanceApiResult:
    try:
        assignment = maintenance_service.assign_work_order(work_order_id, request.model_dump())
    except KeyError as error:
        raise not_found(error) from error
    return result("assign_work_order", "Technician, team, vendor or contractor assigned.", assignment)


@router.post("/work-orders/{work_order_id}/start", response_model=MaintenanceApiResult)
@alias_router.post("/work-orders/{work_order_id}/start", response_model=MaintenanceApiResult)
def start_work_order(work_order_id: str) -> MaintenanceApiResult:
    try:
        work_order = maintenance_service.start_work_order(work_order_id)
    except KeyError as error:
        raise not_found(error) from error
    return result("start_work_order", "Maintenance work order started and machine moved under maintenance.", work_order)


@router.post("/work-orders/{work_order_id}/complete", response_model=MaintenanceApiResult)
@alias_router.post("/work-orders/{work_order_id}/complete", response_model=MaintenanceApiResult)
def complete_work_order(work_order_id: str, request: WorkOrderCompleteRequest) -> MaintenanceApiResult:
    try:
        work_order = maintenance_service.complete_work_order(work_order_id, request.model_dump())
    except KeyError as error:
        raise not_found(error) from error
    return result("complete_work_order", "Maintenance completed with spare consumption, cost, history and validation state.", work_order)


@router.post("/work-orders/{work_order_id}/close", response_model=MaintenanceApiResult)
@alias_router.post("/work-orders/{work_order_id}/close", response_model=MaintenanceApiResult)
def close_work_order(work_order_id: str) -> MaintenanceApiResult:
    try:
        work_order = maintenance_service.close_work_order(work_order_id)
    except KeyError as error:
        raise not_found(error) from error
    except ValueError as error:
        raise invalid(error) from error
    return result("close_work_order", "Maintenance work order closed.", work_order)


@router.get("/spare-parts", response_model=MaintenanceApiResult)
@alias_router.get("/spare-parts", response_model=MaintenanceApiResult)
def list_spare_parts() -> MaintenanceApiResult:
    return result("list_spare_parts", "Machine-specific spare mappings with inventory linkage and critical spare rules.", maintenance_repo.snapshot(maintenance_repo.spare_parts))


@router.post("/spare-parts", response_model=MaintenanceApiResult)
@alias_router.post("/spare-parts", response_model=MaintenanceApiResult)
def create_spare_part(request: SparePartRequest) -> MaintenanceApiResult:
    spare = maintenance_repo.add(maintenance_repo.spare_parts, request.model_dump(), "spare-map")
    return result("create_spare_part", "Spare part mapping created.", spare)


@router.post("/spare-reservations", response_model=MaintenanceApiResult)
def reserve_spare(request: SpareReservationRequest) -> MaintenanceApiResult:
    reservation = maintenance_service.reserve_spare(request.model_dump())
    return result("reserve_spare", "Spare reservation checked against inventory and shortage/procurement recommendation created when needed.", reservation)


@router.get("/spare-usage", response_model=MaintenanceApiResult)
def spare_usage() -> MaintenanceApiResult:
    return result("spare_usage", "Spare consumption and usage history.", maintenance_repo.snapshot(maintenance_repo.spare_usage))


@router.get("/downtime-events", response_model=MaintenanceApiResult)
@alias_router.get("/downtime-events", response_model=MaintenanceApiResult)
def list_downtime_events() -> MaintenanceApiResult:
    return result("list_downtime_events", "Manual, categorized downtime event history.", maintenance_repo.snapshot(maintenance_repo.downtime_events))


@router.post("/downtime-events", response_model=MaintenanceApiResult)
@alias_router.post("/downtime-events", response_model=MaintenanceApiResult)
def create_downtime_event(request: DowntimeEventRequest) -> MaintenanceApiResult:
    event = maintenance_service.create_downtime(request.model_dump())
    return result("create_downtime_event", "Downtime event recorded.", event)


@router.get("/machine-history/{machine_id}", response_model=MaintenanceApiResult)
@alias_router.get("/machine-history/{machine_id}", response_model=MaintenanceApiResult)
def machine_history(machine_id: str) -> MaintenanceApiResult:
    history = [row for row in maintenance_repo.history if row["machine_id"] == machine_id]
    return result("machine_history", "Full machine timeline.", history)


@router.post("/shutdown-windows", response_model=MaintenanceApiResult)
def create_shutdown_window(request: ShutdownWindowRequest) -> MaintenanceApiResult:
    window = maintenance_repo.add(maintenance_repo.shutdown_windows, request.model_dump(), "shutdown")
    return result("create_shutdown_window", "Planned shutdown window created.", window)


@router.get("/shutdown-windows", response_model=MaintenanceApiResult)
def list_shutdown_windows() -> MaintenanceApiResult:
    return result("list_shutdown_windows", "Approved shutdown windows.", maintenance_repo.snapshot(maintenance_repo.shutdown_windows))


@router.post("/attachments", response_model=MaintenanceApiResult)
def create_attachment(request: MaintenanceAttachmentRequest) -> MaintenanceApiResult:
    attachment = maintenance_repo.add(maintenance_repo.attachments, request.model_dump(), "maint-attach")
    return result("create_attachment", "Maintenance attachment uploaded.", attachment)


@router.get("/attachments", response_model=MaintenanceApiResult)
def list_attachments() -> MaintenanceApiResult:
    return result("list_attachments", "Maintenance work order attachments.", maintenance_repo.snapshot(maintenance_repo.attachments))


@router.post("/machine-documents", response_model=MaintenanceApiResult)
def create_machine_document(request: MachineDocumentRequest) -> MaintenanceApiResult:
    document = maintenance_repo.add(maintenance_repo.machine_documents, request.model_dump(), "machine-doc")
    return result("create_machine_document", "Machine document linked.", document)


@router.get("/machine-documents", response_model=MaintenanceApiResult)
def list_machine_documents() -> MaintenanceApiResult:
    return result("list_machine_documents", "Manuals, SOPs, drawings, certificates and warranty files.", maintenance_repo.snapshot(maintenance_repo.machine_documents))


@router.post("/runtime-logs", response_model=MaintenanceApiResult)
def create_runtime_log(request: RuntimeLogRequest) -> MaintenanceApiResult:
    log = maintenance_repo.add(maintenance_repo.runtime_logs, request.model_dump(), "runtime")
    return result("create_runtime_log", "Machine runtime logged.", log)


@router.get("/runtime-logs", response_model=MaintenanceApiResult)
def list_runtime_logs() -> MaintenanceApiResult:
    return result("list_runtime_logs", "Machine runtime logs.", maintenance_repo.snapshot(maintenance_repo.runtime_logs))


@router.post("/vendors", response_model=MaintenanceApiResult)
def create_vendor(request: VendorRequest) -> MaintenanceApiResult:
    vendor = maintenance_repo.add(maintenance_repo.vendors, request.model_dump(), "vendor")
    return result("create_vendor", "Vendor maintenance provider created.", vendor)


@router.get("/vendors", response_model=MaintenanceApiResult)
def list_vendors() -> MaintenanceApiResult:
    return result("list_vendors", "External service providers.", maintenance_repo.snapshot(maintenance_repo.vendors))


@router.get("/costing", response_model=MaintenanceApiResult)
def costing() -> MaintenanceApiResult:
    return result("costing", "Maintenance costing records.", maintenance_repo.snapshot(maintenance_repo.costing))


@router.get("/tasks", response_model=MaintenanceApiResult)
def tasks() -> MaintenanceApiResult:
    return result("tasks", "Maintenance task queue.", maintenance_repo.snapshot(maintenance_repo.tasks))


@router.get("/notifications", response_model=MaintenanceApiResult)
def notifications() -> MaintenanceApiResult:
    return result("notifications", "Maintenance email-first notification queue.", maintenance_repo.snapshot(maintenance_repo.notifications))


@router.get("/reports", response_model=MaintenanceApiResult)
def reports() -> MaintenanceApiResult:
    return result("reports", "Maintenance schedule, work order, breakdown, downtime, spare, history, cost, MTTR, MTBF and overdue reports.", maintenance_service.reports())


@ai_router.get("/risk-center", response_model=MaintenanceApiResult)
def ai_risk_center() -> MaintenanceApiResult:
    return result("ai_risk_center", "Maintenance AI risk center.", maintenance_service.risk_center())


@ai_router.get("/failure-prediction", response_model=MaintenanceApiResult)
def ai_failure_prediction() -> MaintenanceApiResult:
    return result("ai_failure_prediction", "Rule-based failure prediction.", maintenance_service.failure_prediction())


@ai_router.get("/downtime-prediction", response_model=MaintenanceApiResult)
def ai_downtime_prediction() -> MaintenanceApiResult:
    return result("ai_downtime_prediction", "Future downtime, availability and line impact prediction.", maintenance_service.downtime_prediction())


@ai_router.get("/spare-prediction", response_model=MaintenanceApiResult)
def ai_spare_prediction() -> MaintenanceApiResult:
    return result("ai_spare_prediction", "Upcoming spare demand, shortage and reorder recommendation.", maintenance_service.spare_prediction())


@ai_router.get("/health-score", response_model=MaintenanceApiResult)
def ai_health_score() -> MaintenanceApiResult:
    return result("ai_health_score", "Rule-based machine health score.", maintenance_service.health_scores())


@ai_router.get("/root-cause", response_model=MaintenanceApiResult)
def ai_root_cause() -> MaintenanceApiResult:
    return result("ai_root_cause", "Root cause analysis across repeated failures and downtime patterns.", maintenance_service.root_cause_ai())


@ai_router.get("/cost-impact", response_model=MaintenanceApiResult)
def ai_cost_impact() -> MaintenanceApiResult:
    return result("ai_cost_impact", "Downtime, maintenance cost trend and repair-vs-replace impact.", maintenance_service.cost_impact_ai())


@ai_router.get("/recommendations", response_model=MaintenanceApiResult)
def ai_recommendations() -> MaintenanceApiResult:
    return result("ai_recommendations", "Maintenance recommendation AI.", maintenance_service.recommendations())


@ai_router.post("/draft-action", response_model=MaintenanceApiResult)
def ai_draft_action(request: MaintenanceDraftActionRequest) -> MaintenanceApiResult:
    draft = maintenance_service.draft_action(request.model_dump())
    return result("ai_draft_action", "Maintenance AI draft action created. Human approval required.", draft)
