from __future__ import annotations

from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, Field


class MachineCapabilityRequest(BaseModel):
    enable_runtime_tracking: bool = True
    enable_downtime_tracking: bool = True
    enable_maintenance_tracking: bool = True
    enable_iot_tracking: bool = False
    enable_spare_tracking: bool = True
    enable_documentation: bool = True
    enable_approval_workflow: bool = True


class MachineRequest(BaseModel):
    machine_id: str
    machine_code: str
    machine_name: str
    company_id: str = "company-c"
    plant_id: str = "plant-hyd"
    department_id: str = "dept-maintenance"
    production_line_id: str | None = None
    work_center_id: str | None = None
    machine_type: str = "Production Equipment"
    manufacturer: str | None = None
    model_number: str | None = None
    serial_number: str | None = None
    installed_date: date | None = None
    status: str = "Active"
    criticality: str = "Medium"
    capacity: float | None = None
    location: str | None = None
    active_status: bool = True
    capabilities: MachineCapabilityRequest = Field(default_factory=MachineCapabilityRequest)


class MaintenanceRuleRequest(BaseModel):
    machine_id: str
    rule_type: str = "Calendar-based"
    rule_value: str
    active_status: bool = True


class MaintenancePlanRequest(BaseModel):
    machine_id: str
    plan_name: str
    frequency_type: str = "Monthly"
    frequency_value: int = Field(default=1, ge=1)
    next_due_date: date
    last_completed_date: date | None = None
    expected_duration: float = Field(default=0, ge=0)
    required_spares: list[str] = Field(default_factory=list)
    required_documents: list[str] = Field(default_factory=list)
    approval_required: bool = False
    active_status: bool = True


class WorkOrderRequest(BaseModel):
    work_order_number: str
    machine_id: str
    maintenance_type: str = "Preventive Maintenance"
    category: str = "Planned"
    priority: str = "MEDIUM"
    status: str = "Open"
    issue_description: str
    root_cause: str | None = None
    assigned_to: str | None = None
    planned_start: datetime | None = None
    planned_end: datetime | None = None
    actual_start: datetime | None = None
    actual_end: datetime | None = None
    downtime_minutes: float = Field(default=0, ge=0)
    production_impact: str | None = None
    estimated_cost: float = Field(default=0, ge=0)
    compliance_required: bool = False
    approval_status: str = "Not Required"
    closure_notes: str | None = None


class WorkOrderAssignRequest(BaseModel):
    assigned_user_id: str | None = None
    assigned_team_id: str | None = None
    vendor_id: str | None = None
    skill_required: str | None = None
    assignment_status: str = "Assigned"


class WorkOrderCompleteRequest(BaseModel):
    root_cause: str
    closure_notes: str
    spare_parts_used: list[dict[str, Any]] = Field(default_factory=list)
    documents_uploaded: list[str] = Field(default_factory=list)
    actual_end: datetime | None = None
    quality_validation_required: bool = False


class SparePartRequest(BaseModel):
    spare_part_id: str
    inventory_item_id: str
    machine_id: str
    compatibility: str = "Compatible"
    criticality: str = "Medium"
    replacement_interval: str | None = None
    runtime_threshold: float | None = None
    minimum_stock: float = Field(default=0, ge=0)
    preferred_supplier: str | None = None
    active_status: bool = True


class SpareReservationRequest(BaseModel):
    work_order_id: str
    spare_part_id: str
    required_quantity: float = Field(gt=0)


class DowntimeEventRequest(BaseModel):
    machine_id: str
    production_line_id: str | None = None
    work_order_id: str | None = None
    start_time: datetime
    end_time: datetime
    reason_category: str
    root_cause: str | None = None
    production_loss: float = Field(default=0, ge=0)
    cost_impact: float = Field(default=0, ge=0)


class ShutdownWindowRequest(BaseModel):
    plant_id: str
    line_id: str | None = None
    machine_id: str | None = None
    start_time: datetime
    end_time: datetime
    reason: str
    approved_by: str | None = None


class MaintenanceAttachmentRequest(BaseModel):
    work_order_id: str
    document_type: str
    file_url: str
    uploaded_by: str
    description: str | None = None


class MachineDocumentRequest(BaseModel):
    machine_id: str
    document_type: str
    file_url: str
    description: str | None = None


class RuntimeLogRequest(BaseModel):
    machine_id: str
    runtime_hours: float = Field(gt=0)


class VendorRequest(BaseModel):
    vendor_id: str
    vendor_name: str
    contract_reference: str | None = None
    service_type: str
    contact_details: dict[str, Any] = Field(default_factory=dict)


class MaintenanceDraftActionRequest(BaseModel):
    action_type: str
    machine_id: str | None = None
    work_order_id: str | None = None
    reason: str


class MaintenanceApiResult(BaseModel):
    module: str = "MAINTENANCE"
    action: str
    message: str
    data: dict[str, Any] | list[dict[str, Any]]
