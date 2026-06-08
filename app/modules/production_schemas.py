from __future__ import annotations

from datetime import date, datetime, time
from typing import Any

from pydantic import BaseModel, Field


class ProductRequest(BaseModel):
    product_code: str
    product_name: str
    product_type: str = "Finished Product"
    unit_of_measure: str = "EA"
    category: str = "Manufacturing"
    default_bom_id: str | None = None
    default_routing_id: str | None = None
    quality_required: bool = True
    active_status: bool = True


class BomItemRequest(BaseModel):
    material_item: str
    quantity_required: float = Field(gt=0)
    uom: str = "EA"
    scrap_allowance_percent: float = Field(default=0, ge=0)
    substitute_allowed: bool = False
    critical_material: bool = False
    consumption_type: str = "Auto"


class BomRequest(BaseModel):
    bom_code: str
    product_id: str
    version_number: int = 1
    status: str = "Draft"
    items: list[BomItemRequest]


class RoutingOperationRequest(BaseModel):
    operation_name: str
    sequence_number: int = Field(ge=1)
    work_center: str
    production_line: str
    setup_time: float = Field(default=0, ge=0)
    run_time: float = Field(default=0, ge=0)
    labor_requirement: float = Field(default=1, ge=0)
    machine_requirement: str
    quality_check_required: bool = False


class RoutingRequest(BaseModel):
    routing_code: str
    product_id: str
    version_number: int = 1
    active_status: bool = True
    operations: list[RoutingOperationRequest]


class WorkCenterRequest(BaseModel):
    work_center_code: str
    work_center_name: str
    plant: str
    department: str
    capacity_per_hour: float = Field(gt=0)
    operating_calendar: str = "Default"
    active_status: bool = True


class ProductionLineRequest(BaseModel):
    line_code: str
    line_name: str
    plant: str
    department: str
    capacity: float = Field(gt=0)
    shift_calendar: str = "Default"
    status: str = "Active"


class MachineRequest(BaseModel):
    machine_id: str
    machine_name: str
    machine_status: str = "Available"
    runtime: float = Field(default=0, ge=0)
    downtime: float = Field(default=0, ge=0)
    capacity: float = Field(gt=0)


class ProductionOrderRequest(BaseModel):
    production_order_number: str
    company: str = "Precision Components Ltd"
    plant: str = "Hyderabad Plant"
    product_id: str
    bom_version: str
    routing_version: str
    target_quantity: float = Field(gt=0)
    planned_start_date: date
    planned_end_date: date
    priority: str = "MEDIUM"
    assigned_line: str
    assigned_work_center: str
    source: str = "Manual"
    status: str = "Draft"


class ApprovalRuleRequest(BaseModel):
    name: str
    quantity_threshold: float = 1000
    material_value_threshold: float = 100000
    priorities: list[str] = Field(default_factory=lambda: ["HIGH", "CRITICAL"])


class ShiftRequest(BaseModel):
    shift_name: str
    start_time: time
    end_time: time


class ProductionLogRequest(BaseModel):
    production_order_id: str
    log_date: date
    shift: str
    line: str
    machine: str
    planned_output: float = Field(ge=0)
    actual_output: float = Field(ge=0)
    material_consumed: float = Field(ge=0)
    downtime: float = Field(default=0, ge=0)
    wastage: float = Field(default=0, ge=0)
    remarks: str | None = None


class DowntimeRequest(BaseModel):
    production_order_id: str | None = None
    machine_id: str
    downtime_type: str
    duration_minutes: float = Field(gt=0)
    root_cause: str | None = None


class WipRequest(BaseModel):
    production_order_id: str
    quantity_in_process: float = Field(ge=0)
    stage: str
    status: str = "In Process"
    location: str


class LossRequest(BaseModel):
    production_order_id: str
    loss_type: str
    quantity: float = Field(gt=0)
    reason: str


class MaterialConsumptionRequest(BaseModel):
    production_order_id: str
    material_item: str
    consumed_quantity: float = Field(gt=0)
    expected_quantity: float = Field(gt=0)
    consumption_type: str = "Manual"


class ScheduleRequest(BaseModel):
    production_order_id: str
    scheduled_start: datetime
    scheduled_end: datetime
    line_id: str
    work_center_id: str


class CompletionRequest(BaseModel):
    production_order_id: str
    final_output_quantity: float = Field(ge=0)
    accepted_quantity: float = Field(ge=0)
    rejected_quantity: float = Field(default=0, ge=0)
    trigger_quality_workflow: bool = True


class WhatIfRequest(BaseModel):
    production_increase_percent: float = 0
    unavailable_machine_id: str | None = None
    supplier_delay_days: int = 0


class ProductionApiResult(BaseModel):
    module: str = "PRODUCTION"
    action: str
    message: str
    data: dict[str, Any] | list[dict[str, Any]]
