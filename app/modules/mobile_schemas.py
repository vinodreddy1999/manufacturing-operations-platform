from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class MobileApiResult(BaseModel):
    module: str = "MOBILE"
    action: str
    message: str
    data: dict[str, Any] | list[dict[str, Any]]


class MobileLoginRequest(BaseModel):
    user_id: str = "mobile-user-warehouse"
    password: str = "Mobile123!"
    device_id: str = "device-demo-001"


class MobileRefreshRequest(BaseModel):
    refresh_token: str


class DeviceRegisterRequest(BaseModel):
    device_id: str
    user_id: str = "mobile-user-warehouse"
    company_id: str = "company-c"
    device_name: str
    device_type: str = "Phone"
    os: str = "Android"
    app_version: str = "1.0.0"


class TaskCommentRequest(BaseModel):
    comment: str
    device_id: str = "device-demo-001"


class ApprovalActionRequest(BaseModel):
    comment: str | None = None
    device_id: str = "device-demo-001"


class ScanResolveRequest(BaseModel):
    scanned_value: str
    scan_context: str
    device_id: str = "device-demo-001"
    user_id: str = "mobile-user-warehouse"


class InventoryReceiptRequest(BaseModel):
    purchase_order_id: str
    item_id: str
    received_quantity: float = Field(gt=0)
    batch_number: str | None = None
    serial_numbers: list[str] = Field(default_factory=list)
    warehouse_location_id: str
    idempotency_key: str


class InventoryTransferRequest(BaseModel):
    source_bin_id: str
    destination_bin_id: str
    item_id: str
    quantity: float = Field(gt=0)
    stock_status: str = "Available"
    idempotency_key: str


class CountItemRequest(BaseModel):
    location_id: str
    item_id: str
    counted_quantity: float = Field(ge=0)
    system_quantity: float = Field(ge=0)
    variance_reason: str | None = None
    photo_file_id: str | None = None
    idempotency_key: str


class WarehouseMovementRequest(BaseModel):
    movement_type: str = "Bin to bin"
    source_location_id: str
    destination_location_id: str
    item_id: str
    quantity: float = Field(gt=0)
    idempotency_key: str


class ProductionDailyLogRequest(BaseModel):
    shift: str
    output_quantity: float = Field(ge=0)
    material_consumed: list[dict[str, Any]] = Field(default_factory=list)
    downtime_minutes: float = 0
    remarks: str | None = None
    idempotency_key: str


class MaintenanceCompleteRequest(BaseModel):
    root_cause: str
    spare_usage: list[dict[str, Any]] = Field(default_factory=list)
    downtime_minutes: float = 0
    completion_notes: str
    idempotency_key: str


class QualityCompleteRequest(BaseModel):
    checklist_results: list[dict[str, Any]] = Field(default_factory=list)
    result_status: str = "Passed"
    defect_photos: list[str] = Field(default_factory=list)
    idempotency_key: str


class DispatchConfirmRequest(BaseModel):
    dispatch_order_id: str
    picked_items: list[dict[str, Any]] = Field(default_factory=list)
    proof_file_id: str | None = None
    idempotency_key: str


class UploadRequest(BaseModel):
    related_type: str
    related_id: str
    file_type: str
    uploaded_by: str = "mobile-user-warehouse"
    device_id: str = "device-demo-001"
    offline_reference_id: str | None = None
    sync_status: str = "Synced"


class SyncPushRequest(BaseModel):
    device_id: str
    user_id: str
    last_sync_at: str | None = None
    actions: list[dict[str, Any]] = Field(default_factory=list)


class MobileAIRequest(BaseModel):
    context: dict[str, Any] = Field(default_factory=dict)
    user_id: str = "mobile-user-warehouse"
    device_id: str = "device-demo-001"


class MobileDraftActionRequest(BaseModel):
    action_type: str
    source_type: str | None = None
    source_id: str | None = None
    reason: str
    owner: str = "plant-supervisor"
