from __future__ import annotations

from datetime import date
from typing import Any

from pydantic import BaseModel, Field


class QualityPlanRequest(BaseModel):
    plan_code: str
    plan_name: str
    company_id: str = "company-c"
    plant_id: str = "plant-hyd"
    applies_to_type: str = "Product"
    applies_to_id: str
    inspection_type: str = "Incoming Inspection"
    checklist_id: str | None = None
    sampling_rule_id: str | None = None
    approval_required: bool = False
    active_status: bool = True
    effective_from: date | None = None
    effective_to: date | None = None


class ChecklistItemRequest(BaseModel):
    parameter_name: str
    parameter_type: str = "Measurement"
    expected_value: str | None = None
    min_value: float | None = None
    max_value: float | None = None
    tolerance: float | None = None
    uom: str | None = None
    mandatory: bool = True
    critical_parameter: bool = False
    photo_required: bool = False
    document_required: bool = False


class ChecklistRequest(BaseModel):
    checklist_code: str
    checklist_name: str
    inspection_type: str
    product_id: str | None = None
    material_id: str | None = None
    version: int = 1
    status: str = "Active"
    items: list[ChecklistItemRequest] = Field(default_factory=list)


class SamplingRuleRequest(BaseModel):
    rule_name: str
    lot_size_from: int = Field(ge=1)
    lot_size_to: int = Field(ge=1)
    sample_size: int = Field(ge=1)
    acceptance_quantity: int = Field(ge=0)
    rejection_quantity: int = Field(ge=1)
    inspection_level: str = "Normal"
    severity_level: str = "Normal"


class InspectionLotRequest(BaseModel):
    lot_number: str
    source_type: str = "Goods Receipt"
    source_id: str
    company_id: str = "company-c"
    plant_id: str = "plant-hyd"
    product_id: str | None = None
    material_id: str | None = None
    batch_id: str | None = None
    production_order_id: str | None = None
    supplier_id: str | None = None
    customer_id: str | None = None
    quantity: float = Field(gt=0)
    sample_size: int = Field(default=1, ge=1)
    status: str = "Created"
    created_by: str = "qa-user"


class InspectionResultItemRequest(BaseModel):
    checklist_item_id: str
    measured_value: str | None = None
    result_status: str = "Passed"
    defect_code: str | None = None
    comments: str | None = None


class InspectionSubmitRequest(BaseModel):
    inspected_by: str
    inspector_comments: str | None = None
    supervisor_comments: str | None = None
    signature: str | None = None
    results: list[InspectionResultItemRequest]


class DefectRequest(BaseModel):
    defect_code: str
    defect_name: str
    defect_category: str = "Process"
    severity: str = "Major"
    source_type: str
    source_id: str
    product_id: str | None = None
    material_id: str | None = None
    batch_id: str | None = None
    machine_id: str | None = None
    production_line_id: str | None = None
    supplier_id: str | None = None
    quantity_affected: float = Field(gt=0)
    description: str
    photos: list[str] = Field(default_factory=list)
    status: str = "Open"


class QuarantineRequest(BaseModel):
    item_id: str
    batch_id: str | None = None
    quantity: float = Field(gt=0)
    source_type: str
    source_id: str
    reason: str
    quarantine_location_id: str = "quarantine-zone-a"
    status: str = "Active"
    created_by: str = "qa-user"


class ReworkRequest(BaseModel):
    source_inspection_lot_id: str
    product_id: str | None = None
    batch_id: str | None = None
    quantity: float = Field(gt=0)
    reason: str
    assigned_to: str | None = None
    status: str = "Open"
    rework_cost: float = 0
    reinspection_required: bool = True


class RejectionRequest(BaseModel):
    source_type: str
    source_id: str
    item_id: str
    batch_id: str | None = None
    quantity: float = Field(gt=0)
    rejection_reason: str
    rejected_by: str = "qa-user"
    cost_impact: float = 0
    status: str = "Rejected"


class ScrapRequest(BaseModel):
    source_type: str
    source_id: str
    item_id: str
    batch_id: str | None = None
    quantity: float = Field(gt=0)
    scrap_reason: str
    estimated_loss: float = 0
    approval_required: bool = True
    approved_by: str | None = None
    status: str = "Pending Approval"


class CapaRequest(BaseModel):
    capa_number: str
    source_type: str
    source_id: str
    problem_statement: str
    root_cause: str | None = None
    corrective_action: str | None = None
    preventive_action: str | None = None
    owner_id: str
    due_date: date
    status: str = "Open"
    effectiveness_check_required: bool = True


class QualityDraftActionRequest(BaseModel):
    action_type: str
    source_type: str | None = None
    source_id: str | None = None
    reason: str


class QualityApiResult(BaseModel):
    module: str = "QUALITY"
    action: str
    message: str
    data: dict[str, Any] | list[dict[str, Any]]
