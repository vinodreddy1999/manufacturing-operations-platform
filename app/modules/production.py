from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException

from . import production_models  # noqa: F401 - registers SQLAlchemy tables with Base metadata
from .production_repository import production_repo
from .production_schemas import (
    ApprovalRuleRequest,
    BomRequest,
    CompletionRequest,
    DowntimeRequest,
    LossRequest,
    MachineRequest,
    MaterialConsumptionRequest,
    ProductRequest,
    ProductionApiResult,
    ProductionLineRequest,
    ProductionLogRequest,
    ProductionOrderRequest,
    RoutingRequest,
    ScheduleRequest,
    ShiftRequest,
    WhatIfRequest,
    WipRequest,
    WorkCenterRequest,
)
from .production_service import production_service

router = APIRouter(prefix="/production", tags=["Production Management"])


def result(action: str, message: str, data: dict[str, Any] | list[dict[str, Any]]) -> ProductionApiResult:
    return ProductionApiResult(action=action, message=message, data=data)


def not_found(error: KeyError) -> HTTPException:
    return HTTPException(status_code=404, detail=f"Production record not found: {error.args[0]}")


@router.get("/dashboard", response_model=ProductionApiResult)
def dashboard() -> ProductionApiResult:
    return result("dashboard", "Production dashboard with active orders, risks, utilization, downtime, WIP and output.", production_service.dashboard())


@router.get("/products", response_model=ProductionApiResult)
def list_products() -> ProductionApiResult:
    return result("list_products", "Product master list.", production_repo.snapshot(production_repo.products))


@router.post("/products", response_model=ProductionApiResult)
def create_product(request: ProductRequest) -> ProductionApiResult:
    product = production_repo.add(production_repo.products, request.model_dump(), "prod")
    return result("create_product", "Product created.", product)


@router.put("/products/{product_id}", response_model=ProductionApiResult)
def update_product(product_id: str, request: ProductRequest) -> ProductionApiResult:
    try:
        product = production_repo.update(production_repo.products, product_id, request.model_dump())
    except KeyError as error:
        raise not_found(error) from error
    return result("update_product", "Product updated.", product)


@router.delete("/products/{product_id}", response_model=ProductionApiResult)
def delete_product(product_id: str) -> ProductionApiResult:
    try:
        product = production_repo.delete(production_repo.products, product_id)
    except KeyError as error:
        raise not_found(error) from error
    return result("delete_product", "Product deleted.", product)


@router.get("/bom", response_model=ProductionApiResult)
def list_bom() -> ProductionApiResult:
    return result("list_bom", "Multi-level BOM list with versions and approval status.", production_repo.snapshot(production_repo.boms))


@router.post("/bom", response_model=ProductionApiResult)
def create_bom(request: BomRequest) -> ProductionApiResult:
    bom = production_repo.add(
        production_repo.boms,
        {**request.model_dump(), "approval_workflow": {"status": request.status}},
        "bom",
    )
    return result("create_bom", "BOM created in draft/versioned structure.", bom)


@router.put("/bom/{bom_id}", response_model=ProductionApiResult)
def update_bom(bom_id: str, request: BomRequest) -> ProductionApiResult:
    try:
        bom = production_repo.update(production_repo.boms, bom_id, {**request.model_dump(), "approval_workflow": {"status": request.status}})
    except KeyError as error:
        raise not_found(error) from error
    return result("update_bom", "BOM updated.", bom)


@router.post("/bom/{bom_id}/approve", response_model=ProductionApiResult)
def approve_bom(bom_id: str) -> ProductionApiResult:
    try:
        bom = production_service.approve_bom(bom_id)
    except KeyError as error:
        raise not_found(error) from error
    return result("approve_bom", "BOM approved by workflow.", bom)


@router.get("/routing", response_model=ProductionApiResult)
def list_routing() -> ProductionApiResult:
    return result("list_routing", "Routing list with operations, sequence, work center, line, labor and machine requirements.", production_repo.snapshot(production_repo.routing))


@router.post("/routing", response_model=ProductionApiResult)
def create_routing(request: RoutingRequest) -> ProductionApiResult:
    routing = production_repo.add(production_repo.routing, request.model_dump(), "routing")
    return result("create_routing", "Routing created.", routing)


@router.put("/routing/{routing_id}", response_model=ProductionApiResult)
def update_routing(routing_id: str, request: RoutingRequest) -> ProductionApiResult:
    try:
        routing = production_repo.update(production_repo.routing, routing_id, request.model_dump())
    except KeyError as error:
        raise not_found(error) from error
    return result("update_routing", "Routing updated.", routing)


@router.get("/work-centers", response_model=ProductionApiResult)
def list_work_centers() -> ProductionApiResult:
    return result("list_work_centers", "Work center capacity and calendar view.", production_repo.snapshot(production_repo.work_centers))


@router.post("/work-centers", response_model=ProductionApiResult)
def create_work_center(request: WorkCenterRequest) -> ProductionApiResult:
    work_center = production_repo.add(production_repo.work_centers, request.model_dump(), "wc")
    return result("create_work_center", "Work center created.", work_center)


@router.get("/lines", response_model=ProductionApiResult)
def list_lines() -> ProductionApiResult:
    return result("list_lines", "Production line capacity, shift calendar and status view.", production_repo.snapshot(production_repo.production_lines))


@router.post("/lines", response_model=ProductionApiResult)
def create_line(request: ProductionLineRequest) -> ProductionApiResult:
    line = production_repo.add(production_repo.production_lines, request.model_dump(), "line")
    return result("create_line", "Production line created.", line)


@router.get("/machines", response_model=ProductionApiResult)
def list_machines() -> ProductionApiResult:
    return result("list_machines", "Production machine registry with maintenance integration-ready status.", production_repo.snapshot(production_repo.machines))


@router.post("/machines", response_model=ProductionApiResult)
def create_machine(request: MachineRequest) -> ProductionApiResult:
    machine = production_repo.add(production_repo.machines, request.model_dump(), "machine")
    return result("create_machine", "Production machine created.", machine)


@router.get("/orders", response_model=ProductionApiResult)
def list_orders() -> ProductionApiResult:
    return result("list_orders", "Production order queue.", production_repo.snapshot(production_repo.orders))


@router.post("/orders", response_model=ProductionApiResult)
def create_order(request: ProductionOrderRequest) -> ProductionApiResult:
    order = production_repo.add(production_repo.orders, {**request.model_dump(), "status": request.status}, "po")
    if request.priority in {"HIGH", "CRITICAL"} or request.target_quantity > 500:
        production_service.create_task("Production Review", order["id"], "Production order requires approval review.")
        production_service.create_notification("Production Created", order["id"], "Production order created and queued for review.")
    return result("create_order", "Production order created.", order)


@router.put("/orders/{order_id}", response_model=ProductionApiResult)
def update_order(order_id: str, request: ProductionOrderRequest) -> ProductionApiResult:
    try:
        order = production_repo.update(production_repo.orders, order_id, request.model_dump())
    except KeyError as error:
        raise not_found(error) from error
    return result("update_order", "Production order updated.", order)


@router.post("/orders/{order_id}/material-requirements", response_model=ProductionApiResult)
def calculate_material_requirements(order_id: str) -> ProductionApiResult:
    try:
        requirements = production_service.material_requirements(order_id)
    except KeyError as error:
        raise not_found(error) from error
    return result("material_requirements", "MRP calculated from BOM and production quantity.", requirements)


@router.post("/orders/{order_id}/reserve-materials", response_model=ProductionApiResult)
def reserve_materials(order_id: str) -> ProductionApiResult:
    try:
        reservation = production_service.reserve_materials(order_id)
    except KeyError as error:
        raise not_found(error) from error
    return result("reserve_materials", "Materials reserved with partial reservation and shortage tracking.", reservation)


@router.get("/orders/{order_id}/time-aware-plan", response_model=ProductionApiResult)
def time_aware_plan(order_id: str) -> ProductionApiResult:
    try:
        plan = production_service.time_aware_material_plan(order_id)
    except KeyError as error:
        raise not_found(error) from error
    return result("time_aware_material_plan", "Inventory, incoming stock, supplier lead time and production dates analyzed.", plan)


@router.post("/schedules", response_model=ProductionApiResult)
def create_schedule(request: ScheduleRequest) -> ProductionApiResult:
    try:
        schedule = production_service.schedule(request.model_dump())
    except KeyError as error:
        raise not_found(error) from error
    return result("create_schedule", "Production schedule created with conflict detection.", schedule)


@router.get("/schedules", response_model=ProductionApiResult)
def list_schedules() -> ProductionApiResult:
    return result("list_schedules", "Production schedule list.", production_repo.snapshot(production_repo.schedules))


@router.get("/shifts", response_model=ProductionApiResult)
def list_shifts() -> ProductionApiResult:
    return result("list_shifts", "Morning, evening, night and custom shift definitions.", production_repo.snapshot(production_repo.shifts))


@router.post("/shifts", response_model=ProductionApiResult)
def create_shift(request: ShiftRequest) -> ProductionApiResult:
    shift = production_repo.add(production_repo.shifts, request.model_dump(), "shift")
    return result("create_shift", "Shift created.", shift)


@router.get("/logs", response_model=ProductionApiResult)
def list_logs() -> ProductionApiResult:
    return result("list_logs", "Daily production logs.", production_repo.snapshot(production_repo.logs))


@router.post("/logs", response_model=ProductionApiResult)
def create_log(request: ProductionLogRequest) -> ProductionApiResult:
    log = production_repo.add(production_repo.logs, request.model_dump(), "log")
    if request.downtime > 0:
        production_service.create_task("Downtime Investigation", request.production_order_id, "Downtime recorded in daily production log.")
    return result("create_log", "Daily production log captured.", log)


@router.post("/material-consumption", response_model=ProductionApiResult)
def consume_material(request: MaterialConsumptionRequest) -> ProductionApiResult:
    consumption = production_service.consume_material(request.model_dump())
    return result("material_consumption", "Material consumed with reserve-first and variance tracking.", consumption)


@router.get("/material-consumption", response_model=ProductionApiResult)
def list_consumption() -> ProductionApiResult:
    return result("list_material_consumption", "Material consumption ledger.", production_repo.snapshot(production_repo.consumption))


@router.get("/downtime", response_model=ProductionApiResult)
def list_downtime() -> ProductionApiResult:
    return result("list_downtime", "Downtime event history.", production_repo.snapshot(production_repo.downtime_events))


@router.post("/downtime", response_model=ProductionApiResult)
def create_downtime(request: DowntimeRequest) -> ProductionApiResult:
    event = production_repo.add(production_repo.downtime_events, request.model_dump(), "downtime")
    if request.production_order_id:
        production_service.create_task("Downtime Investigation", request.production_order_id, f"{request.downtime_type} downtime requires review.")
    return result("create_downtime", "Downtime event recorded.", event)


@router.post("/completion", response_model=ProductionApiResult)
def complete_order(request: CompletionRequest) -> ProductionApiResult:
    try:
        completion = production_service.complete_order(request.model_dump())
    except KeyError as error:
        raise not_found(error) from error
    production_service.create_notification("Production Completed", request.production_order_id, "Production completion captured.")
    return result("complete_order", "Production completed with variance, costing, unused reservation release and quality handoff.", completion)


@router.get("/wip", response_model=ProductionApiResult)
def list_wip() -> ProductionApiResult:
    return result("list_wip", "WIP inventory across stages, status and locations.", production_repo.snapshot(production_repo.wip))


@router.post("/wip", response_model=ProductionApiResult)
def create_wip(request: WipRequest) -> ProductionApiResult:
    wip = production_repo.add(production_repo.wip, request.model_dump(), "wip")
    return result("create_wip", "WIP inventory recorded.", wip)


@router.get("/losses", response_model=ProductionApiResult)
def list_losses() -> ProductionApiResult:
    return result("list_losses", "Production losses including waste, scrap, rework, rejection and over-consumption.", production_repo.snapshot(production_repo.losses))


@router.post("/losses", response_model=ProductionApiResult)
def create_loss(request: LossRequest) -> ProductionApiResult:
    loss = production_repo.add(production_repo.losses, request.model_dump(), "loss")
    return result("create_loss", "Production loss recorded.", loss)


@router.get("/costing", response_model=ProductionApiResult)
def list_costing() -> ProductionApiResult:
    return result("list_costing", "Production costing list.", production_repo.snapshot(production_repo.costing))


@router.post("/orders/{order_id}/costing", response_model=ProductionApiResult)
def calculate_costing(order_id: str) -> ProductionApiResult:
    try:
        cost = production_service.calculate_cost(order_id)
    except KeyError as error:
        raise not_found(error) from error
    return result("calculate_costing", "Material, machine, labor, overhead, wastage, rework and cost per unit calculated.", cost)


@router.get("/reports", response_model=ProductionApiResult)
def reports() -> ProductionApiResult:
    return result("reports", "Production reports generated.", production_service.reports())


@router.get("/tasks", response_model=ProductionApiResult)
def tasks() -> ProductionApiResult:
    return result("tasks", "Production task queue.", production_repo.snapshot(production_repo.tasks))


@router.get("/notifications", response_model=ProductionApiResult)
def notifications() -> ProductionApiResult:
    return result("notifications", "Production notification queue.", production_repo.snapshot(production_repo.notifications))


@router.post("/approval-rules", response_model=ProductionApiResult)
def create_approval_rule(request: ApprovalRuleRequest) -> ProductionApiResult:
    rule = production_repo.add(production_repo.approval_rules, request.model_dump(), "approval")
    return result("create_approval_rule", "Dynamic approval rule created.", rule)


@router.get("/approval-rules", response_model=ProductionApiResult)
def list_approval_rules() -> ProductionApiResult:
    return result("list_approval_rules", "Dynamic approval rules.", production_repo.snapshot(production_repo.approval_rules))


@router.get("/ai/risk-center", response_model=ProductionApiResult)
def ai_risk_center() -> ProductionApiResult:
    return result("ai_risk_center", "Rule-based Production Risk Center.", production_service.risk_center())


@router.get("/ai/delay-prediction", response_model=ProductionApiResult)
def ai_delay_prediction() -> ProductionApiResult:
    return result("ai_delay_prediction", "Production delay prediction with duration and root cause.", production_service.delay_prediction())


@router.get("/ai/material-bottlenecks", response_model=ProductionApiResult)
def ai_material_bottlenecks() -> ProductionApiResult:
    return result("ai_material_bottlenecks", "Shortage, delayed and quality-hold material bottlenecks.", production_service.material_bottlenecks())


@router.get("/ai/capacity-optimization", response_model=ProductionApiResult)
def ai_capacity_optimization() -> ProductionApiResult:
    return result("ai_capacity_optimization", "Recommended line, work center and schedule capacity improvement.", production_service.capacity_optimization())


@router.get("/ai/schedule-optimization", response_model=ProductionApiResult)
def ai_schedule_optimization() -> ProductionApiResult:
    return result("ai_schedule_optimization", "Recommended sequence, changeover and balanced schedule.", production_service.schedule_optimization())


@router.post("/ai/what-if", response_model=ProductionApiResult)
def ai_what_if(request: WhatIfRequest) -> ProductionApiResult:
    return result("ai_what_if", "What-if simulation impact analysis.", production_service.what_if(request.model_dump()))


@router.get("/ai/bom-variance", response_model=ProductionApiResult)
def ai_bom_variance() -> ProductionApiResult:
    return result("ai_bom_variance", "BOM variance AI detects excess and repeated material variance.", production_service.bom_variance_ai())


@router.get("/ai/downtime-impact", response_model=ProductionApiResult)
def ai_downtime_impact() -> ProductionApiResult:
    return result("ai_downtime_impact", "Downtime cost, output and delivery impact.", production_service.downtime_impact_ai())


@router.get("/ai/cost-risk", response_model=ProductionApiResult)
def ai_cost_risk() -> ProductionApiResult:
    return result("ai_cost_risk", "Production cost AI detects overrun, waste and low-margin risk.", production_service.production_cost_ai())


@router.get("/ai/draft-actions", response_model=ProductionApiResult)
def ai_draft_actions() -> ProductionApiResult:
    return result("ai_draft_actions", "AI draft actions that require human approval.", production_service.draft_actions())
