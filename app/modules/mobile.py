from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException

from . import mobile_models  # noqa: F401
from .mobile_repository import mobile_repo
from .mobile_schemas import (
    ApprovalActionRequest,
    CountItemRequest,
    DeviceRegisterRequest,
    DispatchConfirmRequest,
    InventoryReceiptRequest,
    InventoryTransferRequest,
    MaintenanceCompleteRequest,
    MobileAIRequest,
    MobileApiResult,
    MobileDraftActionRequest,
    MobileLoginRequest,
    MobileRefreshRequest,
    ProductionDailyLogRequest,
    QualityCompleteRequest,
    ScanResolveRequest,
    SyncPushRequest,
    TaskCommentRequest,
    UploadRequest,
    WarehouseMovementRequest,
)
from .mobile_service import mobile_service

router = APIRouter(prefix="/mobile", tags=["Mobile Operations"])
ai_router = APIRouter(prefix="/ai/mobile", tags=["Mobile AI"])


def result(action: str, message: str, data: dict[str, Any] | list[dict[str, Any]]) -> MobileApiResult:
    return MobileApiResult(action=action, message=message, data=data)


@router.get("/enablement", response_model=MobileApiResult)
def enablement(company_id: str = "company-c") -> MobileApiResult:
    return result("enablement", "Mobile Operations feature flags.", {"company_id": company_id, "feature_flags": mobile_repo.feature_flags.get(company_id, {})})


@router.post("/auth/login", response_model=MobileApiResult)
def login(request: MobileLoginRequest) -> MobileApiResult:
    try:
        data = mobile_service.login(request.model_dump())
    except PermissionError as error:
        raise HTTPException(status_code=401, detail=str(error)) from error
    return result("login", "Mobile login successful.", data)


@router.post("/auth/refresh", response_model=MobileApiResult)
def refresh(request: MobileRefreshRequest) -> MobileApiResult:
    try:
        data = mobile_service.refresh(request.refresh_token)
    except PermissionError as error:
        raise HTTPException(status_code=401, detail=str(error)) from error
    return result("refresh", "Mobile token refreshed.", data)


@router.post("/auth/logout", response_model=MobileApiResult)
def logout(device_id: str = "device-demo-001") -> MobileApiResult:
    return result("logout", "Device sessions logged out.", mobile_service.logout(device_id))


@router.post("/devices/register", response_model=MobileApiResult)
def register_device(request: DeviceRegisterRequest) -> MobileApiResult:
    return result("register_device", "Mobile device registered.", mobile_service.register_device(request.model_dump()))


@router.post("/devices/{device_id}/disable", response_model=MobileApiResult)
def disable_device(device_id: str) -> MobileApiResult:
    try:
        data = mobile_service.disable_device(device_id)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=f"Device not found: {error.args[0]}") from error
    return result("disable_device", "Mobile device disabled and sessions invalidated.", data)


@router.get("/my-work", response_model=MobileApiResult)
def my_work(user_id: str = "mobile-user-warehouse") -> MobileApiResult:
    return result("my_work", "Mobile my-work dashboard.", mobile_service.my_work(user_id))


@router.get("/tasks", response_model=MobileApiResult)
def tasks(user_id: str = "mobile-user-warehouse") -> MobileApiResult:
    return result("tasks", "Mobile task queue.", [row for row in mobile_repo.work_queue if row["user_id"] == user_id])


@router.get("/tasks/{task_id}", response_model=MobileApiResult)
def task_detail(task_id: str) -> MobileApiResult:
    task = mobile_repo.get(mobile_repo.work_queue, task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task not found: {task_id}")
    return result("task_detail", "Mobile task detail.", task)


@router.post("/tasks/{task_id}/start", response_model=MobileApiResult)
def start_task(task_id: str) -> MobileApiResult:
    return result("start_task", "Task started.", mobile_service.task_action(task_id, "start"))


@router.post("/tasks/{task_id}/comment", response_model=MobileApiResult)
def comment_task(task_id: str, request: TaskCommentRequest) -> MobileApiResult:
    return result("comment_task", "Task comment added.", mobile_service.task_action(task_id, "comment", request.model_dump()))


@router.post("/tasks/{task_id}/complete", response_model=MobileApiResult)
def complete_task(task_id: str) -> MobileApiResult:
    return result("complete_task", "Task completed.", mobile_service.task_action(task_id, "complete"))


@router.post("/tasks/{task_id}/block", response_model=MobileApiResult)
def block_task(task_id: str) -> MobileApiResult:
    return result("block_task", "Task blocked.", mobile_service.task_action(task_id, "block"))


@router.get("/approvals", response_model=MobileApiResult)
def approvals(user_id: str = "mobile-user-warehouse") -> MobileApiResult:
    return result("approvals", "Mobile pending approvals.", [row for row in mobile_repo.approvals if row["user_id"] == user_id])


@router.get("/approvals/{approval_id}", response_model=MobileApiResult)
def approval_detail(approval_id: str) -> MobileApiResult:
    approval = mobile_repo.get(mobile_repo.approvals, approval_id)
    if not approval:
        raise HTTPException(status_code=404, detail=f"Approval not found: {approval_id}")
    return result("approval_detail", "Mobile approval detail.", approval)


@router.post("/approvals/{approval_id}/approve", response_model=MobileApiResult)
def approve(approval_id: str, request: ApprovalActionRequest) -> MobileApiResult:
    return result("approve", "Approval approved from mobile.", mobile_service.approval_action(approval_id, "approve", request.model_dump()))


@router.post("/approvals/{approval_id}/reject", response_model=MobileApiResult)
def reject(approval_id: str, request: ApprovalActionRequest) -> MobileApiResult:
    return result("reject", "Approval rejected from mobile.", mobile_service.approval_action(approval_id, "reject", request.model_dump()))


@router.post("/scan/resolve", response_model=MobileApiResult)
def resolve_scan(request: ScanResolveRequest) -> MobileApiResult:
    return result("resolve_scan", "Scanned value resolved.", mobile_service.resolve_scan(request.model_dump()))


@router.get("/inventory/receipts/pending", response_model=MobileApiResult)
def pending_receipts() -> MobileApiResult:
    return result("pending_receipts", "Pending mobile inventory receipts.", mobile_repo.snapshot(mobile_repo.receipts))


@router.post("/inventory/receipts", response_model=MobileApiResult)
def create_receipt(request: InventoryReceiptRequest) -> MobileApiResult:
    return result("create_receipt", "Mobile receipt draft created.", mobile_service.create_idempotent(mobile_repo.receipts, request.model_dump(), "mob-rec", "inventory_receipt"))


@router.post("/inventory/receipts/{receipt_id}/submit", response_model=MobileApiResult)
def submit_receipt(receipt_id: str) -> MobileApiResult:
    receipt = mobile_repo.get(mobile_repo.receipts, receipt_id)
    if not receipt:
        raise HTTPException(status_code=404, detail=f"Receipt not found: {receipt_id}")
    receipt["status"] = "Submitted"
    return result("submit_receipt", "Mobile receipt submitted.", receipt)


@router.post("/inventory/transfers", response_model=MobileApiResult)
def create_transfer(request: InventoryTransferRequest) -> MobileApiResult:
    if request.stock_status in {"Rejected", "Quarantine"}:
        return result("create_transfer", "Transfer requires supervisor review.", {"status": "Requires Review", "reason": "Cannot transfer rejected/quarantine stock without permission"})
    return result("create_transfer", "Mobile transfer draft created.", mobile_service.create_idempotent(mobile_repo.transfers, request.model_dump(), "mob-transfer", "inventory_transfer"))


@router.post("/inventory/transfers/{transfer_id}/submit", response_model=MobileApiResult)
def submit_transfer(transfer_id: str) -> MobileApiResult:
    transfer = mobile_repo.get(mobile_repo.transfers, transfer_id)
    if not transfer:
        raise HTTPException(status_code=404, detail=f"Transfer not found: {transfer_id}")
    transfer["status"] = "Submitted"
    return result("submit_transfer", "Mobile transfer submitted.", transfer)


@router.get("/inventory/counts", response_model=MobileApiResult)
def counts() -> MobileApiResult:
    return result("counts", "Assigned mobile inventory counts.", mobile_repo.snapshot(mobile_repo.counts))


@router.get("/inventory/counts/{count_id}", response_model=MobileApiResult)
def count_detail(count_id: str) -> MobileApiResult:
    count = mobile_repo.get(mobile_repo.counts, count_id)
    if not count:
        raise HTTPException(status_code=404, detail=f"Count not found: {count_id}")
    return result("count_detail", "Mobile count detail.", count)


@router.post("/inventory/counts/{count_id}/submit-item", response_model=MobileApiResult)
def submit_count_item(count_id: str, request: CountItemRequest) -> MobileApiResult:
    return result("submit_count_item", "Mobile count item submitted.", mobile_service.submit_count_item(count_id, request.model_dump()))


@router.post("/inventory/counts/{count_id}/complete", response_model=MobileApiResult)
def complete_count(count_id: str) -> MobileApiResult:
    count = mobile_repo.get(mobile_repo.counts, count_id)
    if not count:
        raise HTTPException(status_code=404, detail=f"Count not found: {count_id}")
    count["status"] = "Completed"
    return result("complete_count", "Mobile count completed.", count)


@router.post("/warehouse/movements", response_model=MobileApiResult)
def warehouse_movement(request: WarehouseMovementRequest) -> MobileApiResult:
    return result("warehouse_movement", "Warehouse movement captured from mobile.", mobile_service.create_idempotent(mobile_repo.warehouse_movements, request.model_dump(), "mob-wh-move", "warehouse_movement"))


@router.get("/warehouse/locations/{location_id}", response_model=MobileApiResult)
def warehouse_location(location_id: str) -> MobileApiResult:
    return result("warehouse_location", "Mobile warehouse location detail.", {"location_id": location_id, "occupancy": "72%", "allowed_actions": ["count", "move", "receive"]})


@router.get("/warehouse/search", response_model=MobileApiResult)
def warehouse_search(q: str = "bin") -> MobileApiResult:
    return result("warehouse_search", "Mobile warehouse search.", [{"entity_type": "Bin", "entity_id": "bin-a-01-01", "display_name": "Bin A-01-01", "match": q}])


@router.get("/production/orders", response_model=MobileApiResult)
def production_orders() -> MobileApiResult:
    return result("production_orders", "Assigned mobile production orders.", mobile_repo.snapshot(mobile_repo.production_orders))


@router.get("/production/orders/{order_id}", response_model=MobileApiResult)
def production_order(order_id: str) -> MobileApiResult:
    order = mobile_repo.get(mobile_repo.production_orders, order_id)
    if not order:
        raise HTTPException(status_code=404, detail=f"Production order not found: {order_id}")
    return result("production_order", "Mobile production order detail.", order)


@router.post("/production/orders/{order_id}/start", response_model=MobileApiResult)
def start_production(order_id: str) -> MobileApiResult:
    order = mobile_repo.get(mobile_repo.production_orders, order_id)
    if not order:
        raise HTTPException(status_code=404, detail=f"Production order not found: {order_id}")
    order["status"] = "In Progress"
    return result("start_production", "Production order started from mobile.", order)


@router.post("/production/orders/{order_id}/daily-log", response_model=MobileApiResult)
def production_daily_log(order_id: str, request: ProductionDailyLogRequest) -> MobileApiResult:
    return result("production_daily_log", "Production daily log captured from mobile.", {"production_order_id": order_id, **request.model_dump(), "status": "Submitted"})


@router.post("/production/orders/{order_id}/consume-material", response_model=MobileApiResult)
def consume_material(order_id: str, request: ProductionDailyLogRequest) -> MobileApiResult:
    return result("consume_material", "Production material consumption captured from mobile.", {"production_order_id": order_id, "material_consumed": request.material_consumed, "status": "Submitted"})


@router.post("/production/orders/{order_id}/complete", response_model=MobileApiResult)
def complete_production(order_id: str) -> MobileApiResult:
    order = mobile_repo.get(mobile_repo.production_orders, order_id)
    if not order:
        raise HTTPException(status_code=404, detail=f"Production order not found: {order_id}")
    order["status"] = "Completed"
    return result("complete_production", "Production order completed from mobile.", order)


@router.get("/maintenance/work-orders", response_model=MobileApiResult)
def maintenance_work_orders() -> MobileApiResult:
    return result("maintenance_work_orders", "Assigned mobile maintenance work orders.", mobile_repo.snapshot(mobile_repo.maintenance_work_orders))


@router.get("/maintenance/work-orders/{work_order_id}", response_model=MobileApiResult)
def maintenance_work_order(work_order_id: str) -> MobileApiResult:
    work_order = mobile_repo.get(mobile_repo.maintenance_work_orders, work_order_id)
    if not work_order:
        raise HTTPException(status_code=404, detail=f"Work order not found: {work_order_id}")
    return result("maintenance_work_order", "Mobile maintenance work order detail.", work_order)


@router.post("/maintenance/work-orders/{work_order_id}/start", response_model=MobileApiResult)
def start_work_order(work_order_id: str) -> MobileApiResult:
    work_order = mobile_repo.get(mobile_repo.maintenance_work_orders, work_order_id)
    if not work_order:
        raise HTTPException(status_code=404, detail=f"Work order not found: {work_order_id}")
    work_order["status"] = "In Progress"
    return result("start_work_order", "Maintenance work order started from mobile.", work_order)


@router.post("/maintenance/work-orders/{work_order_id}/spares", response_model=MobileApiResult)
def work_order_spares(work_order_id: str, request: MaintenanceCompleteRequest) -> MobileApiResult:
    return result("work_order_spares", "Maintenance spare usage captured.", {"work_order_id": work_order_id, "spare_usage": request.spare_usage, "status": "Submitted"})


@router.post("/maintenance/work-orders/{work_order_id}/photos", response_model=MobileApiResult)
def work_order_photos(work_order_id: str, request: UploadRequest) -> MobileApiResult:
    upload = mobile_repo.add(mobile_repo.uploads, {**request.model_dump(), "related_type": "Work Order", "related_id": work_order_id}, "mob-upload")
    return result("work_order_photos", "Maintenance photos uploaded.", upload)


@router.post("/maintenance/work-orders/{work_order_id}/complete", response_model=MobileApiResult)
def complete_work_order(work_order_id: str, request: MaintenanceCompleteRequest) -> MobileApiResult:
    work_order = mobile_repo.get(mobile_repo.maintenance_work_orders, work_order_id)
    if not work_order:
        raise HTTPException(status_code=404, detail=f"Work order not found: {work_order_id}")
    work_order.update({"status": "Completed", **request.model_dump()})
    return result("complete_work_order", "Maintenance work order completed from mobile.", work_order)


@router.get("/quality/inspections", response_model=MobileApiResult)
def quality_inspections() -> MobileApiResult:
    return result("quality_inspections", "Assigned mobile quality inspections.", mobile_repo.snapshot(mobile_repo.quality_inspections))


@router.get("/quality/inspections/{inspection_id}", response_model=MobileApiResult)
def quality_inspection(inspection_id: str) -> MobileApiResult:
    inspection = mobile_repo.get(mobile_repo.quality_inspections, inspection_id)
    if not inspection:
        raise HTTPException(status_code=404, detail=f"Inspection not found: {inspection_id}")
    return result("quality_inspection", "Mobile inspection detail.", inspection)


@router.post("/quality/inspections/{inspection_id}/submit-result", response_model=MobileApiResult)
def submit_quality_result(inspection_id: str, request: QualityCompleteRequest) -> MobileApiResult:
    return result("submit_quality_result", "Quality inspection result submitted from mobile.", {"inspection_id": inspection_id, **request.model_dump(), "status": "Submitted"})


@router.post("/quality/inspections/{inspection_id}/complete", response_model=MobileApiResult)
def complete_quality_inspection(inspection_id: str, request: QualityCompleteRequest) -> MobileApiResult:
    inspection = mobile_repo.get(mobile_repo.quality_inspections, inspection_id)
    if not inspection:
        raise HTTPException(status_code=404, detail=f"Inspection not found: {inspection_id}")
    inspection.update({"status": "Completed", **request.model_dump()})
    return result("complete_quality_inspection", "Quality inspection completed from mobile.", inspection)


@router.get("/dispatch/pick-lists", response_model=MobileApiResult)
def pick_lists() -> MobileApiResult:
    return result("pick_lists", "Mobile dispatch pick lists.", mobile_repo.snapshot(mobile_repo.pick_lists))


@router.post("/dispatch/pick-lists/{pick_list_id}/pick", response_model=MobileApiResult)
def pick_item(pick_list_id: str, request: DispatchConfirmRequest) -> MobileApiResult:
    return result("pick_item", "Pick list item captured.", {"pick_list_id": pick_list_id, **request.model_dump(), "status": "Picked"})


@router.post("/dispatch/packing", response_model=MobileApiResult)
def packing(request: DispatchConfirmRequest) -> MobileApiResult:
    return result("packing", "Packing captured from mobile.", {**request.model_dump(), "status": "Packed"})


@router.post("/dispatch/confirm", response_model=MobileApiResult)
def dispatch_confirm(request: DispatchConfirmRequest) -> MobileApiResult:
    return result("dispatch_confirm", "Dispatch confirmation requires online approval path.", {**request.model_dump(), "status": "Submitted Online", "offline_allowed": False})


@router.post("/uploads", response_model=MobileApiResult)
def upload(request: UploadRequest) -> MobileApiResult:
    return result("upload", "Mobile upload metadata captured.", mobile_repo.add(mobile_repo.uploads, request.model_dump(), "mob-upload"))


@router.post("/sync/push", response_model=MobileApiResult)
def sync_push(request: SyncPushRequest) -> MobileApiResult:
    return result("sync_push", "Offline mobile actions processed.", mobile_service.sync_push(request.model_dump()))


@router.get("/sync/pull", response_model=MobileApiResult)
def sync_pull(user_id: str = "mobile-user-warehouse") -> MobileApiResult:
    return result("sync_pull", "Mobile pull sync payload.", mobile_service.my_work(user_id))


@router.get("/sync/status", response_model=MobileApiResult)
def sync_status() -> MobileApiResult:
    return result("sync_status", "Mobile sync status.", mobile_service.sync_status())


@ai_router.get("/risk-center", response_model=MobileApiResult)
def ai_risk_center() -> MobileApiResult:
    return result("ai_risk_center", "Mobile AI risk center.", mobile_service.risk_center())


@ai_router.post("/scan-validation", response_model=MobileApiResult)
def ai_scan_validation(request: MobileAIRequest) -> MobileApiResult:
    return result("ai_scan_validation", "Mobile scan context validation.", {"warning": "Check item against task before proceeding.", "reason": "Scan context may not match assigned work.", "suggested_correct_item_location": "bin-a-01-01"})


@ai_router.post("/count-assist", response_model=MobileApiResult)
def ai_count_assist(request: MobileAIRequest) -> MobileApiResult:
    return result("ai_count_assist", "Mobile count assistance.", {"recommendation": "Recount and attach photo proof for high-value variance.", "requires_supervisor_review": True})


@ai_router.post("/maintenance-assist", response_model=MobileApiResult)
def ai_maintenance_assist(request: MobileAIRequest) -> MobileApiResult:
    return result("ai_maintenance_assist", "Mobile maintenance assistance.", {"likely_root_cause": "Bearing wear", "required_spare": "spare-spindle-bearing", "safety_checklist": ["Lockout", "Verify isolation"]})


@ai_router.post("/quality-assist", response_model=MobileApiResult)
def ai_quality_assist(request: MobileAIRequest) -> MobileApiResult:
    return result("ai_quality_assist", "Mobile quality assistance.", {"defect_category": "Visual defect", "severity": "Major", "quarantine_recommendation": "Draft only"})


@ai_router.post("/suggest-next-action", response_model=MobileApiResult)
def ai_suggest_next_action(request: MobileAIRequest) -> MobileApiResult:
    return result("ai_suggest_next_action", "Mobile next action suggested.", {"next_action": "Complete high-priority cycle count before starting transfer.", "reason": "Count task is overdue"})


@ai_router.post("/draft-action", response_model=MobileApiResult)
def ai_draft_action(request: MobileDraftActionRequest) -> MobileApiResult:
    return result("ai_draft_action", "Mobile AI draft action created. Human approval required.", mobile_service.draft_action(request.model_dump()))
