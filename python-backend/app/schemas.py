from enum import Enum
from typing import Any
from pydantic import BaseModel, Field


class ModuleKey(str, Enum):
    AUTH = "AUTH"
    PLATFORM = "PLATFORM"
    INVENTORY = "INVENTORY"
    WAREHOUSE = "WAREHOUSE"
    SUPPLIER = "SUPPLIER"
    PROCUREMENT = "PROCUREMENT"
    PRODUCTION = "PRODUCTION"
    MAINTENANCE = "MAINTENANCE"
    QUALITY = "QUALITY"
    REPORTING = "REPORTING"
    AI = "AI"
    SUPPLY_CHAIN = "SUPPLY_CHAIN"


class LoginRequest(BaseModel):
    tenant_slug: str
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    tenant_id: str
    user_id: str
    enabled_modules: list[ModuleKey]


class ModuleDefinition(BaseModel):
    key: ModuleKey
    name: str
    description: str
    permissions: list[str]
    dependencies: list[ModuleKey] = Field(default_factory=list)


class ApiResult(BaseModel):
    module: ModuleKey
    action: str
    message: str
    data: dict[str, Any] | list[dict[str, Any]]


class InventoryMovementRequest(BaseModel):
    item_id: str
    quantity: float
    movement_type: str
    from_location_id: str | None = None
    to_location_id: str | None = None
    reason: str | None = None


class PurchaseRequisitionRequest(BaseModel):
    item_id: str
    quantity: float
    needed_by: str
    justification: str


class ProductionOrderRequest(BaseModel):
    item_id: str
    quantity: float
    due_date: str
    work_center: str


class MaintenanceWorkOrderRequest(BaseModel):
    machine_id: str
    issue: str
    priority: str = "MEDIUM"


class QualityInspectionRequest(BaseModel):
    item_id: str
    batch_number: str
    result: str
    notes: str | None = None


class ForecastRequest(BaseModel):
    item_id: str
    periods: int = Field(default=4, ge=1, le=12)


class RecommendationRequest(BaseModel):
    business_context: str
    risk_level: str = "LOW"
