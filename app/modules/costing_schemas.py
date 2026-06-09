from __future__ import annotations

from datetime import date
from typing import Any

from pydantic import BaseModel, Field


class CostingApiResult(BaseModel):
    module: str = "COSTING"
    action: str
    message: str
    data: dict[str, Any] | list[dict[str, Any]]


class CostCenterRequest(BaseModel):
    company_id: str = "company-c"
    plant_id: str = "plant-hyd"
    department_id: str | None = None
    cost_center_code: str
    cost_center_name: str
    cost_center_type: str = "Production"
    active_status: bool = True


class CostElementRequest(BaseModel):
    cost_element_code: str
    cost_element_name: str
    cost_element_type: str = "Material"
    account_code: str | None = None
    active_status: bool = True


class InventoryCostingRequest(BaseModel):
    item_id: str
    batch_id: str | None = None
    quantity: float = Field(gt=0)
    unit_cost: float = Field(ge=0)
    costing_method: str = "FIFO"
    stock_status: str = "Available"


class LandedCostRequest(BaseModel):
    purchase_order_id: str
    quantity: float = Field(gt=0)
    purchase_cost: float = Field(ge=0)
    freight: float = 0
    duty: float = 0
    tax: float = 0
    handling: float = 0
    inspection: float = 0
    other_charges: float = 0
    allocation_method: str = "Quantity"


class ProductionCostingRequest(BaseModel):
    production_order_id: str
    product_id: str
    produced_quantity: float = Field(gt=0)
    planned_material_cost: float
    actual_material_cost: float
    planned_labor_cost: float
    actual_labor_cost: float
    planned_machine_cost: float
    actual_machine_cost: float
    overhead_cost: float = 0
    wastage_cost: float = 0
    rework_cost: float = 0
    quality_cost: float = 0
    maintenance_impact_cost: float = 0


class MaintenanceCostingRequest(BaseModel):
    work_order_id: str
    machine_id: str
    spare_part_cost: float = 0
    labor_cost: float = 0
    vendor_cost: float = 0
    downtime_cost: float = 0
    production_loss_cost: float = 0


class QualityCostingRequest(BaseModel):
    source_id: str
    inspection_cost: float = 0
    rejection_cost: float = 0
    rework_cost: float = 0
    scrap_cost: float = 0
    customer_return_cost: float = 0
    supplier_quality_cost: float = 0
    capa_cost: float = 0


class CostAllocationRuleRequest(BaseModel):
    company_id: str = "company-c"
    plant_id: str = "plant-hyd"
    cost_element_id: str
    allocation_base: str = "Machine hours"
    allocation_method: str = "Per machine hour"
    effective_from: date
    effective_to: date | None = None
    active_status: bool = True


class StandardCostRequest(BaseModel):
    item_id: str | None = None
    product_id: str | None = None
    standard_material_cost: float
    standard_labor_cost: float
    standard_machine_cost: float
    standard_overhead_cost: float
    effective_from: date


class CostVarianceRequest(BaseModel):
    variance_type: str = "Production cost variance"
    source_id: str
    planned_cost: float
    actual_cost: float
    reason: str
    responsible_area: str


class CostingDraftActionRequest(BaseModel):
    action_type: str
    source_type: str | None = None
    source_id: str | None = None
    reason: str
    owner: str = "finance-controller"
