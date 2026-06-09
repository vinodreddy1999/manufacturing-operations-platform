from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException

from . import costing_models  # noqa: F401
from .costing_repository import costing_repo
from .costing_schemas import (
    CostAllocationRuleRequest,
    CostCenterRequest,
    CostElementRequest,
    CostingApiResult,
    CostingDraftActionRequest,
    CostVarianceRequest,
    InventoryCostingRequest,
    LandedCostRequest,
    MaintenanceCostingRequest,
    ProductionCostingRequest,
    QualityCostingRequest,
    StandardCostRequest,
)
from .costing_service import costing_service

router = APIRouter(tags=["Costing & Profitability"])
ai_router = APIRouter(prefix="/ai/costing", tags=["Costing AI"])


def result(action: str, message: str, data: dict[str, Any] | list[dict[str, Any]]) -> CostingApiResult:
    return CostingApiResult(action=action, message=message, data=data)


@router.get("/costing/enablement", response_model=CostingApiResult)
def enablement(company_id: str = "company-c") -> CostingApiResult:
    return result("enablement", "Costing feature flags by company.", costing_service.enablement(company_id))


@router.get("/costing/dashboard", response_model=CostingApiResult)
def dashboard() -> CostingApiResult:
    return result("dashboard", "Costing dashboard cards.", costing_service.dashboard())


@router.get("/cost-centers", response_model=CostingApiResult)
def cost_centers() -> CostingApiResult:
    return result("cost_centers", "Cost center master.", costing_repo.snapshot(costing_repo.cost_centers))


@router.post("/cost-centers", response_model=CostingApiResult)
def create_cost_center(request: CostCenterRequest) -> CostingApiResult:
    return result("create_cost_center", "Cost center created.", costing_repo.add(costing_repo.cost_centers, request.model_dump(), "cc"))


@router.get("/cost-elements", response_model=CostingApiResult)
def cost_elements() -> CostingApiResult:
    return result("cost_elements", "Cost element master.", costing_repo.snapshot(costing_repo.cost_elements))


@router.post("/cost-elements", response_model=CostingApiResult)
def create_cost_element(request: CostElementRequest) -> CostingApiResult:
    return result("create_cost_element", "Cost element created.", costing_repo.add(costing_repo.cost_elements, request.model_dump(), "ce"))


@router.get("/inventory-costing", response_model=CostingApiResult)
def inventory_costing() -> CostingApiResult:
    return result("inventory_costing", "Inventory cost records.", costing_repo.snapshot(costing_repo.inventory_cost_records))


@router.post("/inventory-costing/calculate", response_model=CostingApiResult)
def calculate_inventory_costing(request: InventoryCostingRequest) -> CostingApiResult:
    return result("calculate_inventory_costing", "Inventory valuation calculated.", costing_service.inventory_calculate(request.model_dump()))


@router.get("/landed-cost", response_model=CostingApiResult)
def landed_cost() -> CostingApiResult:
    return result("landed_cost", "Landed cost records.", costing_repo.snapshot(costing_repo.landed_cost_records))


@router.post("/landed-cost/calculate", response_model=CostingApiResult)
def calculate_landed_cost(request: LandedCostRequest) -> CostingApiResult:
    return result("calculate_landed_cost", "Landed cost calculated.", costing_service.landed_calculate(request.model_dump()))


@router.get("/production-costing", response_model=CostingApiResult)
def production_costing() -> CostingApiResult:
    return result("production_costing", "Production cost records.", costing_repo.snapshot(costing_repo.production_cost_records))


@router.post("/production-costing/calculate", response_model=CostingApiResult)
def calculate_production_costing(request: ProductionCostingRequest) -> CostingApiResult:
    return result("calculate_production_costing", "Production cost calculated.", costing_service.production_calculate(request.model_dump()))


@router.get("/maintenance-costing", response_model=CostingApiResult)
def maintenance_costing() -> CostingApiResult:
    return result("maintenance_costing", "Maintenance cost records.", costing_repo.snapshot(costing_repo.maintenance_cost_records))


@router.post("/maintenance-costing/calculate", response_model=CostingApiResult)
def calculate_maintenance_costing(request: MaintenanceCostingRequest) -> CostingApiResult:
    return result("calculate_maintenance_costing", "Maintenance cost calculated.", costing_service.maintenance_calculate(request.model_dump()))


@router.get("/quality-costing", response_model=CostingApiResult)
def quality_costing() -> CostingApiResult:
    return result("quality_costing", "Quality cost records.", costing_repo.snapshot(costing_repo.quality_cost_records))


@router.post("/quality-costing/calculate", response_model=CostingApiResult)
def calculate_quality_costing(request: QualityCostingRequest) -> CostingApiResult:
    return result("calculate_quality_costing", "Quality cost calculated.", costing_service.quality_calculate(request.model_dump()))


@router.get("/cost-allocation-rules", response_model=CostingApiResult)
def cost_allocation_rules() -> CostingApiResult:
    return result("cost_allocation_rules", "Cost allocation rules.", costing_repo.snapshot(costing_repo.cost_allocation_rules))


@router.post("/cost-allocation-rules", response_model=CostingApiResult)
def create_cost_allocation_rule(request: CostAllocationRuleRequest) -> CostingApiResult:
    return result("create_cost_allocation_rule", "Cost allocation rule created.", costing_repo.add(costing_repo.cost_allocation_rules, request.model_dump(), "alloc"))


@router.get("/standard-costs", response_model=CostingApiResult)
def standard_costs() -> CostingApiResult:
    return result("standard_costs", "Standard cost master.", costing_repo.snapshot(costing_repo.standard_costs))


@router.post("/standard-costs", response_model=CostingApiResult)
def create_standard_cost(request: StandardCostRequest) -> CostingApiResult:
    return result("create_standard_cost", "Standard cost created for approval.", costing_service.standard_cost_create(request.model_dump()))


@router.post("/standard-costs/{standard_cost_id}/approve", response_model=CostingApiResult)
def approve_standard_cost(standard_cost_id: str) -> CostingApiResult:
    try:
        data = costing_service.approve_standard_cost(standard_cost_id)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=f"Standard cost not found: {error.args[0]}") from error
    return result("approve_standard_cost", "Standard cost approved.", data)


@router.get("/cost-variance", response_model=CostingApiResult)
def cost_variance() -> CostingApiResult:
    return result("cost_variance", "Cost variance records.", costing_repo.snapshot(costing_repo.cost_variances))


@router.post("/cost-variance/calculate", response_model=CostingApiResult)
def calculate_cost_variance(request: CostVarianceRequest) -> CostingApiResult:
    return result("calculate_cost_variance", "Cost variance calculated.", costing_service.variance_calculate(request.model_dump()))


@router.get("/profitability/products", response_model=CostingApiResult)
def product_profitability() -> CostingApiResult:
    return result("product_profitability", "Product profitability.", costing_service.product_profitability())


@router.get("/profitability/customers", response_model=CostingApiResult)
def customer_profitability() -> CostingApiResult:
    return result("customer_profitability", "Customer profitability.", costing_service.customer_profitability())


@router.get("/profitability/plants", response_model=CostingApiResult)
def plant_profitability() -> CostingApiResult:
    return result("plant_profitability", "Plant profitability.", costing_service.plant_profitability())


@router.get("/costing/reports/inventory-valuation", response_model=CostingApiResult)
def report_inventory_valuation() -> CostingApiResult:
    return result("report_inventory_valuation", "Inventory valuation report.", costing_service.report("INVENTORY_VALUATION"))


@router.get("/costing/reports/production-cost", response_model=CostingApiResult)
def report_production_cost() -> CostingApiResult:
    return result("report_production_cost", "Production cost report.", costing_service.report("PRODUCTION_COST"))


@router.get("/costing/reports/wastage-cost", response_model=CostingApiResult)
def report_wastage_cost() -> CostingApiResult:
    return result("report_wastage_cost", "Wastage cost report.", costing_service.report("WASTAGE_COST"))


@router.get("/costing/reports/profitability", response_model=CostingApiResult)
def report_profitability() -> CostingApiResult:
    return result("report_profitability", "Profitability report.", costing_service.report("PROFITABILITY"))


@ai_router.get("/risk-center", response_model=CostingApiResult)
def ai_risk_center() -> CostingApiResult:
    return result("ai_risk_center", "Costing AI risk center.", costing_service.risk_center())


@ai_router.get("/cost-increase", response_model=CostingApiResult)
def ai_cost_increase() -> CostingApiResult:
    return result("ai_cost_increase", "Cost increase AI.", costing_service.cost_increase())


@ai_router.get("/low-margin-products", response_model=CostingApiResult)
def ai_low_margin_products() -> CostingApiResult:
    return result("ai_low_margin_products", "Low-margin product AI.", costing_service.low_margin_products())


@ai_router.get("/customer-profitability-risk", response_model=CostingApiResult)
def ai_customer_profitability_risk() -> CostingApiResult:
    return result("ai_customer_profitability_risk", "Customer profitability risk AI.", costing_service.customer_profitability_risk())


@ai_router.get("/wastage-cost-risk", response_model=CostingApiResult)
def ai_wastage_cost_risk() -> CostingApiResult:
    return result("ai_wastage_cost_risk", "Wastage cost risk AI.", costing_service.wastage_cost_risk())


@ai_router.get("/production-variance", response_model=CostingApiResult)
def ai_production_variance() -> CostingApiResult:
    return result("ai_production_variance", "Production variance AI.", costing_service.production_variance())


@ai_router.get("/supplier-cost-risk", response_model=CostingApiResult)
def ai_supplier_cost_risk() -> CostingApiResult:
    return result("ai_supplier_cost_risk", "Supplier cost risk AI.", costing_service.supplier_cost_risk())


@ai_router.get("/cost-optimization", response_model=CostingApiResult)
def ai_cost_optimization() -> CostingApiResult:
    return result("ai_cost_optimization", "Cost optimization AI.", costing_service.optimization())


@ai_router.post("/draft-action", response_model=CostingApiResult)
def ai_draft_action(request: CostingDraftActionRequest) -> CostingApiResult:
    return result("ai_draft_action", "Costing AI draft action created. Human approval required.", costing_service.draft_action(request.model_dump()))
