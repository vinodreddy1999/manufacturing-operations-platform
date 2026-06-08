from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from .ai_engine import (
    dead_stock_detection,
    expiry_intelligence,
    optimization,
    predict_overstock,
    predict_shortage,
    procurement_recommendation,
    production_impact,
    risk_center,
)
from .database import get_db
from .models import InventorySignal
from .schemas import (
    DeadStockResponse,
    ExpiryIntelligenceResponse,
    OptimizationResponse,
    OverstockPredictionResponse,
    ProcurementRecommendationResponse,
    ProductionImpactResponse,
    RiskCenterResponse,
    ShortagePredictionResponse,
)

router = APIRouter(prefix="/inventory-ai", tags=["Inventory AI"])


@router.get("/risk-center", response_model=RiskCenterResponse)
def get_risk_center(db: Session = Depends(get_db)) -> RiskCenterResponse:
    analysis = risk_center(db.query(InventorySignal).all())
    return RiskCenterResponse(risks=analysis["risks"], draft_actions=analysis["draft_actions"])


@router.get("/shortage-prediction", response_model=ShortagePredictionResponse)
def get_shortage_prediction(
    current_stock: float = 18400,
    reserved_quantity: float = 3200,
    incoming_quantity: float = 9000,
    daily_consumption: float = 1250,
    supplier_lead_time_days: int = 12,
) -> dict:
    return predict_shortage(current_stock, reserved_quantity, incoming_quantity, daily_consumption, supplier_lead_time_days)


@router.get("/overstock", response_model=OverstockPredictionResponse)
def get_overstock_prediction(
    current_stock: float = 62000,
    average_monthly_usage: float = 24000,
    max_stock_level: float = 42000,
) -> dict:
    return predict_overstock(current_stock, average_monthly_usage, max_stock_level)


@router.get("/procurement-recommendations", response_model=ProcurementRecommendationResponse)
def get_procurement_recommendation(
    current_stock: float = 18,
    reserved_stock: float = 4,
    production_demand: float = 30,
    incoming_stock: float = 0,
    safety_stock: float = 6,
    supplier_lead_time_days: int = 5,
    item_id: str = "item-bearing",
) -> dict:
    return procurement_recommendation(current_stock, reserved_stock, production_demand, incoming_stock, safety_stock, supplier_lead_time_days, item_id)


@router.get("/expiry-intelligence", response_model=ExpiryIntelligenceResponse)
def get_expiry_intelligence(
    batch_id: str = "CHEM-CLN-118",
    expiry_date: date = Query(default_factory=date.today),
    current_quantity: float = 90,
    average_daily_usage: float = 1.5,
) -> dict:
    return expiry_intelligence(batch_id, expiry_date, current_quantity, average_daily_usage)


@router.get("/dead-stock", response_model=DeadStockResponse)
def get_dead_stock(
    last_movement_date: date = Query(default_factory=date.today),
    current_quantity: float = 90,
    inventory_value: float = 18900,
) -> dict:
    return dead_stock_detection(last_movement_date, current_quantity, inventory_value)


@router.get("/production-impact", response_model=ProductionImpactResponse)
def get_production_impact(production_order_id: str = "PO-1007") -> dict:
    required_materials = [
        {"item_id": "item-steel", "required_quantity": 22000},
        {"item_id": "item-bearing", "required_quantity": 30},
    ]
    available_inventory = {"item-steel": 15200, "item-bearing": 14}
    incoming_inventory = {"item-steel": 9000, "item-bearing": 0}
    return production_impact(production_order_id, required_materials, available_inventory, incoming_inventory)


@router.get("/optimization", response_model=OptimizationResponse)
def get_optimization(db: Session = Depends(get_db)) -> OptimizationResponse:
    return OptimizationResponse(recommendations=optimization(db.query(InventorySignal).all()))
