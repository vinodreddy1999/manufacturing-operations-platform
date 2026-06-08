from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException

from . import quality_models  # noqa: F401 - registers SQLAlchemy tables
from .quality_repository import quality_repo
from .quality_schemas import (
    CapaRequest,
    ChecklistRequest,
    DefectRequest,
    InspectionLotRequest,
    InspectionSubmitRequest,
    QualityApiResult,
    QualityDraftActionRequest,
    QualityPlanRequest,
    QuarantineRequest,
    RejectionRequest,
    ReworkRequest,
    SamplingRuleRequest,
    ScrapRequest,
)
from .quality_service import quality_service

router = APIRouter(prefix="/quality", tags=["Quality Management"])
ai_router = APIRouter(prefix="/ai/quality", tags=["Quality AI"])


def result(action: str, message: str, data: dict[str, Any] | list[dict[str, Any]]) -> QualityApiResult:
    return QualityApiResult(action=action, message=message, data=data)


def not_found(error: KeyError) -> HTTPException:
    return HTTPException(status_code=404, detail=f"Quality record not found: {error.args[0]}")


@router.get("/dashboard", response_model=QualityApiResult)
def dashboard() -> QualityApiResult:
    return result("dashboard", "Quality dashboard with pending inspections, failures, quarantine, rework, trends, CAPA, FPY and cost of poor quality.", quality_service.dashboard())


@router.get("/plans", response_model=QualityApiResult)
def list_plans() -> QualityApiResult:
    return result("list_plans", "Quality plans.", quality_repo.snapshot(quality_repo.plans))


@router.post("/plans", response_model=QualityApiResult)
def create_plan(request: QualityPlanRequest) -> QualityApiResult:
    return result("create_plan", "Quality plan created.", quality_repo.add(quality_repo.plans, request.model_dump(), "qplan"))


@router.get("/plans/{plan_id}", response_model=QualityApiResult)
def get_plan(plan_id: str) -> QualityApiResult:
    plan = quality_repo.get(quality_repo.plans, plan_id)
    if not plan:
        raise not_found(KeyError(plan_id))
    return result("get_plan", "Quality plan detail.", plan)


@router.put("/plans/{plan_id}", response_model=QualityApiResult)
def update_plan(plan_id: str, request: QualityPlanRequest) -> QualityApiResult:
    try:
        plan = quality_repo.update(quality_repo.plans, plan_id, request.model_dump())
    except KeyError as error:
        raise not_found(error) from error
    return result("update_plan", "Quality plan updated.", plan)


@router.get("/checklists", response_model=QualityApiResult)
def list_checklists() -> QualityApiResult:
    return result("list_checklists", "Checklist-based inspection definitions.", quality_repo.snapshot(quality_repo.checklists))


@router.post("/checklists", response_model=QualityApiResult)
def create_checklist(request: ChecklistRequest) -> QualityApiResult:
    return result("create_checklist", "Quality checklist created.", quality_repo.add(quality_repo.checklists, request.model_dump(), "chk"))


@router.get("/sampling-rules", response_model=QualityApiResult)
def list_sampling_rules() -> QualityApiResult:
    return result("list_sampling_rules", "Sampling rules.", quality_repo.snapshot(quality_repo.sampling_rules))


@router.post("/sampling-rules", response_model=QualityApiResult)
def create_sampling_rule(request: SamplingRuleRequest) -> QualityApiResult:
    return result("create_sampling_rule", "Sampling rule created.", quality_repo.add(quality_repo.sampling_rules, request.model_dump(), "sample"))


@router.get("/inspection-lots", response_model=QualityApiResult)
def list_inspection_lots() -> QualityApiResult:
    return result("list_inspection_lots", "Inspection lots from goods receipt, production, WIP, returns, rework and manual requests.", quality_repo.snapshot(quality_repo.inspection_lots))


@router.post("/inspection-lots", response_model=QualityApiResult)
def create_inspection_lot(request: InspectionLotRequest) -> QualityApiResult:
    lot = quality_repo.add(quality_repo.inspection_lots, request.model_dump(), "lot")
    quality_service.create_task("Perform inspection", lot["id"], "Inspection lot created.")
    return result("create_inspection_lot", "Inspection lot created.", lot)


@router.get("/inspection-lots/{lot_id}", response_model=QualityApiResult)
def get_inspection_lot(lot_id: str) -> QualityApiResult:
    try:
        lot = quality_service.lot(lot_id)
    except KeyError as error:
        raise not_found(error) from error
    return result("get_inspection_lot", "Inspection lot detail.", lot)


@router.post("/inspection-lots/{lot_id}/start", response_model=QualityApiResult)
def start_inspection(lot_id: str) -> QualityApiResult:
    try:
        lot = quality_service.start_inspection(lot_id)
    except KeyError as error:
        raise not_found(error) from error
    return result("start_inspection", "Inspection started.", lot)


@router.post("/inspection-lots/{lot_id}/submit", response_model=QualityApiResult)
def submit_inspection(lot_id: str, request: InspectionSubmitRequest) -> QualityApiResult:
    try:
        submitted = quality_service.submit_inspection(lot_id, request.model_dump())
    except KeyError as error:
        raise not_found(error) from error
    return result("submit_inspection", "Inspection submitted with checklist results and failure handling.", submitted)


@router.post("/inspection-lots/{lot_id}/approve", response_model=QualityApiResult)
def approve_inspection(lot_id: str) -> QualityApiResult:
    try:
        lot = quality_service.approve_lot(lot_id)
    except KeyError as error:
        raise not_found(error) from error
    return result("approve_inspection", "Inspection approved.", lot)


@router.post("/inspection-lots/{lot_id}/reject", response_model=QualityApiResult)
def reject_inspection(lot_id: str) -> QualityApiResult:
    try:
        lot = quality_service.reject_lot(lot_id)
    except KeyError as error:
        raise not_found(error) from error
    return result("reject_inspection", "Inspection rejected.", lot)


@router.get("/defects", response_model=QualityApiResult)
def list_defects() -> QualityApiResult:
    return result("list_defects", "Defect management records.", quality_repo.snapshot(quality_repo.defects))


@router.post("/defects", response_model=QualityApiResult)
def create_defect(request: DefectRequest) -> QualityApiResult:
    return result("create_defect", "Defect captured.", quality_service.create_defect(request.model_dump()))


@router.get("/quarantine", response_model=QualityApiResult)
def list_quarantine() -> QualityApiResult:
    return result("list_quarantine", "Quarantine records.", quality_repo.snapshot(quality_repo.quarantine))


@router.post("/quarantine", response_model=QualityApiResult)
def create_quarantine(request: QuarantineRequest) -> QualityApiResult:
    return result("create_quarantine", "Quarantine record created.", quality_repo.add(quality_repo.quarantine, request.model_dump(), "quarantine"))


@router.post("/quarantine/{quarantine_id}/release", response_model=QualityApiResult)
def release_quarantine(quarantine_id: str) -> QualityApiResult:
    try:
        record = quality_service.release_quarantine(quarantine_id)
    except KeyError as error:
        raise not_found(error) from error
    return result("release_quarantine", "Quarantine released with approval trail.", record)


@router.get("/rework", response_model=QualityApiResult)
def list_rework() -> QualityApiResult:
    return result("list_rework", "Rework workflows.", quality_repo.snapshot(quality_repo.rework))


@router.post("/rework", response_model=QualityApiResult)
def create_rework(request: ReworkRequest) -> QualityApiResult:
    return result("create_rework", "Rework order created.", quality_repo.add(quality_repo.rework, request.model_dump(), "rework"))


@router.get("/rejections", response_model=QualityApiResult)
def list_rejections() -> QualityApiResult:
    return result("list_rejections", "Rejected stock records blocked from use.", quality_repo.snapshot(quality_repo.rejections))


@router.post("/rejections", response_model=QualityApiResult)
def create_rejection(request: RejectionRequest) -> QualityApiResult:
    return result("create_rejection", "Rejection recorded.", quality_repo.add(quality_repo.rejections, request.model_dump(), "reject"))


@router.get("/scrap", response_model=QualityApiResult)
def list_scrap() -> QualityApiResult:
    return result("list_scrap", "Scrap workflow records.", quality_repo.snapshot(quality_repo.scrap))


@router.post("/scrap", response_model=QualityApiResult)
def create_scrap(request: ScrapRequest) -> QualityApiResult:
    return result("create_scrap", "Scrap record created for approval/write-off.", quality_repo.add(quality_repo.scrap, request.model_dump(), "scrap"))


@router.get("/capa", response_model=QualityApiResult)
def list_capa() -> QualityApiResult:
    return result("list_capa", "CAPA records.", quality_repo.snapshot(quality_repo.capa))


@router.post("/capa", response_model=QualityApiResult)
def create_capa(request: CapaRequest) -> QualityApiResult:
    return result("create_capa", "CAPA created.", quality_service.create_capa(request.model_dump()))


@router.put("/capa/{capa_id}", response_model=QualityApiResult)
def update_capa(capa_id: str, request: CapaRequest) -> QualityApiResult:
    try:
        capa = quality_repo.update(quality_repo.capa, capa_id, request.model_dump())
    except KeyError as error:
        raise not_found(error) from error
    return result("update_capa", "CAPA updated.", capa)


@router.get("/kpis", response_model=QualityApiResult)
def kpis() -> QualityApiResult:
    return result("kpis", "Quality KPIs.", quality_service.kpis())


@router.get("/reports", response_model=QualityApiResult)
def reports() -> QualityApiResult:
    return result("reports", "Quality reports.", quality_service.reports())


@router.get("/tasks", response_model=QualityApiResult)
def tasks() -> QualityApiResult:
    return result("tasks", "Quality task queue.", quality_repo.snapshot(quality_repo.tasks))


@router.get("/notifications", response_model=QualityApiResult)
def notifications() -> QualityApiResult:
    return result("notifications", "Quality email-first notification queue.", quality_repo.snapshot(quality_repo.notifications))


@ai_router.get("/risk-center", response_model=QualityApiResult)
def ai_risk_center() -> QualityApiResult:
    return result("ai_risk_center", "Quality AI risk center.", quality_service.risk_center())


@ai_router.get("/defect-prediction", response_model=QualityApiResult)
def ai_defect_prediction() -> QualityApiResult:
    return result("ai_defect_prediction", "Rule-based defect prediction.", quality_service.defect_prediction())


@ai_router.get("/trends", response_model=QualityApiResult)
def ai_trends() -> QualityApiResult:
    return result("ai_trends", "Quality trend AI.", quality_service.trends())


@ai_router.get("/supplier-risk", response_model=QualityApiResult)
def ai_supplier_risk() -> QualityApiResult:
    return result("ai_supplier_risk", "Supplier quality AI.", quality_service.supplier_risk())


@ai_router.get("/production-risk", response_model=QualityApiResult)
def ai_production_risk() -> QualityApiResult:
    return result("ai_production_risk", "Production quality AI.", quality_service.production_risk())


@ai_router.get("/root-cause", response_model=QualityApiResult)
def ai_root_cause() -> QualityApiResult:
    return result("ai_root_cause", "Root cause AI.", quality_service.root_cause_ai())


@ai_router.get("/cost-risk", response_model=QualityApiResult)
def ai_cost_risk() -> QualityApiResult:
    return result("ai_cost_risk", "Quality cost AI.", quality_service.cost_risk())


@ai_router.post("/draft-action", response_model=QualityApiResult)
def ai_draft_action(request: QualityDraftActionRequest) -> QualityApiResult:
    return result("ai_draft_action", "Quality AI draft action created. Human approval required.", quality_service.draft_action(request.model_dump()))
