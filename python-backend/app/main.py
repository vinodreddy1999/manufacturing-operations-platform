from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import FastAPI, HTTPException
from jose import jwt

from .schemas import (
    ApiResult,
    ForecastRequest,
    InventoryMovementRequest,
    LoginRequest,
    LoginResponse,
    MaintenanceWorkOrderRequest,
    ModuleKey,
    ProductionOrderRequest,
    PurchaseRequisitionRequest,
    QualityInspectionRequest,
    RecommendationRequest,
)
from .store import MODULES, store

JWT_SECRET = "local-python-demo-secret"
JWT_ALGORITHM = "HS256"

app = FastAPI(
    title="Manufacturing Operations Platform - Python Backend",
    version="0.1.0",
    description="Python/FastAPI implementation of the MOP backend modules.",
)


def result(module: ModuleKey, action: str, message: str, data: dict[str, Any] | list[dict[str, Any]]) -> ApiResult:
    return ApiResult(module=module, action=action, message=message, data=data)


def make_token(user: dict[str, Any], tenant: dict[str, Any]) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            "sub": user["id"],
            "tenant_id": tenant["id"],
            "tenant_slug": tenant["slug"],
            "permissions": user["permissions"],
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(hours=8)).timestamp()),
        },
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "runtime": "python-fastapi", "service": "manufacturing-operations-platform"}


@app.get("/modules")
def list_modules() -> list[dict[str, Any]]:
    return [module.model_dump() for module in MODULES]


@app.post("/auth/login", response_model=LoginResponse)
def login(request: LoginRequest) -> LoginResponse:
    tenant = store.tenants.get(request.tenant_slug)
    user = store.users.get(request.email)
    if not tenant or not user or user["tenant_slug"] != request.tenant_slug or user["password"] != request.password:
        raise HTTPException(status_code=401, detail="Invalid tenant or credentials")
    return LoginResponse(
        access_token=make_token(user, tenant),
        tenant_id=tenant["id"],
        user_id=user["id"],
        enabled_modules=tenant["enabled_modules"],
    )


@app.get("/platform/overview", response_model=ApiResult)
def platform_overview() -> ApiResult:
    return result(
        ModuleKey.PLATFORM,
        "overview",
        "Platform tenant, company, plant and feature flag summary.",
        {
            "tenant": store.snapshot(store.tenants["precision-components"]),
            "companies": store.snapshot(store.companies),
            "plants": store.snapshot(store.plants),
            "enabled_modules": [module.key for module in MODULES],
        },
    )


@app.get("/inventory/items", response_model=ApiResult)
def inventory_items() -> ApiResult:
    return result(ModuleKey.INVENTORY, "list_items", "Inventory item master data.", store.snapshot(store.inventory_items))


@app.get("/inventory/balances", response_model=ApiResult)
def inventory_balances() -> ApiResult:
    return result(ModuleKey.INVENTORY, "stock_balances", "Current physical, reserved and available stock.", store.snapshot(store.balances))


@app.post("/inventory/movements", response_model=ApiResult)
def create_inventory_movement(request: InventoryMovementRequest) -> ApiResult:
    movement = store.create_record(store.movements, request.model_dump())
    return result(ModuleKey.INVENTORY, "create_movement", "Inventory movement recorded and ready for audit.", movement)


@app.get("/warehouse/locations", response_model=ApiResult)
def warehouse_locations() -> ApiResult:
    return result(ModuleKey.WAREHOUSE, "list_locations", "Warehouse hierarchy and bin occupancy.", store.snapshot(store.locations))


@app.get("/supplier/suppliers", response_model=ApiResult)
def suppliers() -> ApiResult:
    return result(ModuleKey.SUPPLIER, "list_suppliers", "Supplier ratings and delivery reliability.", store.snapshot(store.suppliers))


@app.post("/procurement/requisitions", response_model=ApiResult)
def create_requisition(request: PurchaseRequisitionRequest) -> ApiResult:
    requisition = store.create_record(store.requisitions, {**request.model_dump(), "status": "PENDING_APPROVAL"})
    return result(ModuleKey.PROCUREMENT, "create_requisition", "Purchase requisition created for approval.", requisition)


@app.get("/procurement/requisitions", response_model=ApiResult)
def list_requisitions() -> ApiResult:
    return result(ModuleKey.PROCUREMENT, "list_requisitions", "Purchase requisition work queue.", store.snapshot(store.requisitions))


@app.post("/production/orders", response_model=ApiResult)
def create_production_order(request: ProductionOrderRequest) -> ApiResult:
    order = store.create_record(store.production_orders, {**request.model_dump(), "status": "SCHEDULED"})
    return result(ModuleKey.PRODUCTION, "create_order", "Production order scheduled for the requested work center.", order)


@app.get("/production/orders", response_model=ApiResult)
def list_production_orders() -> ApiResult:
    return result(ModuleKey.PRODUCTION, "list_orders", "Production order schedule.", store.snapshot(store.production_orders))


@app.post("/maintenance/work-orders", response_model=ApiResult)
def create_work_order(request: MaintenanceWorkOrderRequest) -> ApiResult:
    work_order = store.create_record(store.work_orders, {**request.model_dump(), "status": "OPEN"})
    return result(ModuleKey.MAINTENANCE, "create_work_order", "Maintenance work order opened.", work_order)


@app.get("/maintenance/work-orders", response_model=ApiResult)
def list_work_orders() -> ApiResult:
    return result(ModuleKey.MAINTENANCE, "list_work_orders", "Maintenance work order queue.", store.snapshot(store.work_orders))


@app.post("/quality/inspections", response_model=ApiResult)
def create_quality_inspection(request: QualityInspectionRequest) -> ApiResult:
    inspection = store.create_record(store.inspections, request.model_dump())
    return result(ModuleKey.QUALITY, "create_inspection", "Quality inspection result captured.", inspection)


@app.get("/quality/inspections", response_model=ApiResult)
def list_quality_inspections() -> ApiResult:
    return result(ModuleKey.QUALITY, "list_inspections", "Quality inspection history.", store.snapshot(store.inspections))


@app.get("/reporting/kpis", response_model=ApiResult)
def reporting_kpis() -> ApiResult:
    kpis = {
        "inventory_value": 18400000,
        "pending_approvals": len(store.requisitions),
        "open_maintenance_work_orders": len(store.work_orders),
        "warehouse_occupancy_percent": 76,
        "quality_inspections": len(store.inspections),
    }
    return result(ModuleKey.REPORTING, "kpis", "Operational KPI dashboard output.", kpis)


@app.post("/supply-chain/forecast", response_model=ApiResult)
def supply_chain_forecast(request: ForecastRequest) -> ApiResult:
    base_demand = 1200 if request.item_id == "item-steel" else 18
    forecast = [
        {"period": period, "forecast_quantity": round(base_demand * (1 + period * 0.035), 2)}
        for period in range(1, request.periods + 1)
    ]
    return result(ModuleKey.SUPPLY_CHAIN, "forecast", "Demand forecast generated from demo trend logic.", forecast)


@app.get("/supply-chain/load-plan", response_model=ApiResult)
def supply_chain_load_plan() -> ApiResult:
    plan = {
        "truck_capacity_kg": 24000,
        "loads": [
            {"truck": "TRUCK-01", "item_id": "item-steel", "quantity_kg": 18000, "utilization_percent": 75},
            {"truck": "TRUCK-02", "item_id": "item-steel", "quantity_kg": 22000, "utilization_percent": 91.7},
        ],
    }
    return result(ModuleKey.SUPPLY_CHAIN, "load_plan", "Truck-load plan calculated for available supply.", plan)


@app.post("/ai/recommendations", response_model=ApiResult)
def ai_recommendation(request: RecommendationRequest) -> ApiResult:
    recommendation = {
        "recommendation_id": "rec-demo-001",
        "summary": "Create a purchase requisition and review safety stock before approving production release.",
        "risk_level": request.risk_level,
        "requires_human_approval": True,
        "draft_actions": [
            {"type": "CREATE_REQUISITION", "status": "DRAFT"},
            {"type": "ADJUST_SAFETY_STOCK", "status": "DRAFT"},
        ],
    }
    return result(ModuleKey.AI, "recommendation", "AI recommendation generated as draft actions only.", recommendation)
