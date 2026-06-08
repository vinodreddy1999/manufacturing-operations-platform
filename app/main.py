from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import FastAPI, HTTPException
from jose import jwt

from .auth_router import router as auth_router
from .core_router import create_module_router, router as core_router
from .database import Base, SessionLocal, engine
from .modules.customer_portal import ai_router as customer_portal_ai_router
from .modules.customer_portal import router as customer_portal_router
from .modules.inventory import router as inventory_router
from .modules.maintenance import ai_router as maintenance_ai_router
from .modules.maintenance import alias_router as maintenance_alias_router
from .modules.maintenance import router as maintenance_router
from .modules.production import router as production_router
from .modules.quality import ai_router as quality_ai_router
from .modules.quality import router as quality_router
from .modules.sales import ai_router as sales_ai_router
from .modules.sales import router as sales_router
from .modules.supplier_portal import ai_router as supplier_portal_ai_router
from .modules.supplier_portal import router as supplier_portal_router
from .platform_seed import seed_platform
from .schemas import (
    ApiResult,
    ForecastRequest,
    LoginRequest,
    LoginResponse,
    ModuleKey,
    PurchaseRequisitionRequest,
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

Base.metadata.create_all(bind=engine)
with SessionLocal() as bootstrap_db:
    seed_platform(bootstrap_db)

app.include_router(auth_router)
app.include_router(core_router)
app.include_router(customer_portal_router)
app.include_router(customer_portal_ai_router)
app.include_router(inventory_router)
app.include_router(production_router)
app.include_router(maintenance_router)
app.include_router(maintenance_alias_router)
app.include_router(maintenance_ai_router)
app.include_router(quality_router)
app.include_router(quality_ai_router)
app.include_router(sales_router)
app.include_router(sales_ai_router)
app.include_router(supplier_portal_router)
app.include_router(supplier_portal_ai_router)
app.include_router(create_module_router("warehouse", "/warehouses"))
app.include_router(create_module_router("warehouse_zones", "/warehouses/{warehouse_id}/zones"))
app.include_router(create_module_router("warehouse_map", "/warehouses/{warehouse_id}/map"))
app.include_router(create_module_router("warehouse_locations", "/warehouse-locations"))
app.include_router(create_module_router("warehouse_movements", "/warehouse-movements"))
app.include_router(create_module_router("warehouse_occupancy", "/warehouse-occupancy"))
app.include_router(create_module_router("suppliers", "/suppliers"))
app.include_router(create_module_router("purchase_requisitions", "/purchase-requisitions"))
app.include_router(create_module_router("purchase_orders", "/purchase-orders"))
app.include_router(create_module_router("products", "/products"))
app.include_router(create_module_router("bom", "/bom"))
app.include_router(create_module_router("routing", "/routing"))
app.include_router(create_module_router("production_orders", "/production-orders"))
app.include_router(create_module_router("production_schedules", "/production-schedules"))


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
