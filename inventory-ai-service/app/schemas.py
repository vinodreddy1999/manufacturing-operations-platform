from datetime import date
from typing import Any

from pydantic import BaseModel, Field


class RiskItem(BaseModel):
    item_id: str
    sku: str
    risk_type: str
    risk_level: str
    reason: str
    recommended_action: str
    requires_human_approval: bool = True


class RiskCenterResponse(BaseModel):
    service: str = "inventory-ai-service"
    mode: str = "rule_based"
    risks: list[RiskItem]
    draft_actions: list[dict[str, Any]]


class ShortagePredictionResponse(BaseModel):
    available_quantity: float
    days_remaining: float
    expected_stockout_date: date | None
    risk_level: str


class OverstockPredictionResponse(BaseModel):
    excess_quantity: float
    overstock_risk: str


class ProcurementRecommendationResponse(BaseModel):
    recommended_order_quantity: float
    recommended_order_date: date
    supplier_priority: str
    draft_action: dict[str, Any]


class ExpiryIntelligenceResponse(BaseModel):
    batch_id: str
    days_to_expiry: int
    quantity_at_risk: float
    recommended_action: str


class DeadStockResponse(BaseModel):
    dead_stock_status: str
    days_without_movement: int
    financial_risk: str


class ProductionMaterial(BaseModel):
    item_id: str
    required_quantity: float = Field(gt=0)


class ProductionImpactResponse(BaseModel):
    production_order_id: str
    can_produce: bool
    shortage_items: list[dict[str, Any]]
    production_delay_risk: str


class OptimizationResponse(BaseModel):
    recommendations: list[dict[str, Any]]
