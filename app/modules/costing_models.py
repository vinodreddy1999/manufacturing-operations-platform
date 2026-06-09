from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from ..database import Base


class CostCenter(Base):
    __tablename__ = "cost_centers"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    company_id: Mapped[str] = mapped_column(String(80), index=True)
    plant_id: Mapped[str] = mapped_column(String(80), index=True)
    department_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    cost_center_code: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    cost_center_name: Mapped[str] = mapped_column(String(160))
    cost_center_type: Mapped[str] = mapped_column(String(80), index=True)
    active_status: Mapped[bool] = mapped_column(Boolean, default=True)


class CostElement(Base):
    __tablename__ = "cost_elements"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    cost_element_code: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    cost_element_name: Mapped[str] = mapped_column(String(160))
    cost_element_type: Mapped[str] = mapped_column(String(80), index=True)
    account_code: Mapped[str | None] = mapped_column(String(80), nullable=True)
    active_status: Mapped[bool] = mapped_column(Boolean, default=True)


class InventoryCostRecord(Base):
    __tablename__ = "inventory_cost_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    item_id: Mapped[str] = mapped_column(String(80), index=True)
    batch_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    quantity: Mapped[float] = mapped_column(Float)
    unit_cost: Mapped[float] = mapped_column(Float)
    total_cost: Mapped[float] = mapped_column(Float)
    costing_method: Mapped[str] = mapped_column(String(80), default="FIFO")
    cost_date: Mapped[date] = mapped_column(Date)
    stock_status: Mapped[str] = mapped_column(String(80), default="Available")


class PurchaseCostRecord(Base):
    __tablename__ = "purchase_cost_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    purchase_order_id: Mapped[str] = mapped_column(String(80), index=True)
    supplier_id: Mapped[str] = mapped_column(String(80), index=True)
    item_id: Mapped[str] = mapped_column(String(80), index=True)
    purchase_price: Mapped[float] = mapped_column(Float)
    freight: Mapped[float] = mapped_column(Float, default=0)
    duties_taxes: Mapped[float] = mapped_column(Float, default=0)
    handling_cost: Mapped[float] = mapped_column(Float, default=0)
    inspection_cost: Mapped[float] = mapped_column(Float, default=0)
    other_landed_cost: Mapped[float] = mapped_column(Float, default=0)


class LandedCostRecord(Base):
    __tablename__ = "landed_cost_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    purchase_order_id: Mapped[str] = mapped_column(String(80), index=True)
    allocation_method: Mapped[str] = mapped_column(String(80), default="Quantity")
    total_landed_cost: Mapped[float] = mapped_column(Float)
    landed_cost_per_unit: Mapped[float] = mapped_column(Float)


class LandedCostAllocation(Base):
    __tablename__ = "landed_cost_allocations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    landed_cost_id: Mapped[str] = mapped_column(String(64), index=True)
    item_id: Mapped[str] = mapped_column(String(80), index=True)
    allocated_cost: Mapped[float] = mapped_column(Float)
    allocation_base: Mapped[str] = mapped_column(String(80))


class ProductionCostRecord(Base):
    __tablename__ = "production_cost_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    production_order_id: Mapped[str] = mapped_column(String(80), index=True)
    product_id: Mapped[str] = mapped_column(String(80), index=True)
    planned_cost: Mapped[float] = mapped_column(Float)
    actual_cost: Mapped[float] = mapped_column(Float)
    variance_percent: Mapped[float] = mapped_column(Float)
    cost_per_unit: Mapped[float] = mapped_column(Float)


class MaterialCostRecord(Base):
    __tablename__ = "material_cost_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    production_order_id: Mapped[str] = mapped_column(String(80), index=True)
    planned_material_cost: Mapped[float] = mapped_column(Float)
    actual_material_cost: Mapped[float] = mapped_column(Float)
    material_variance: Mapped[float] = mapped_column(Float)


class LaborCostRecord(Base):
    __tablename__ = "labor_cost_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    production_order_id: Mapped[str] = mapped_column(String(80), index=True)
    planned_labor_hours: Mapped[float] = mapped_column(Float)
    actual_labor_hours: Mapped[float] = mapped_column(Float)
    hourly_rate: Mapped[float] = mapped_column(Float)
    labor_variance: Mapped[float] = mapped_column(Float)


class MachineCostRecord(Base):
    __tablename__ = "machine_cost_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    production_order_id: Mapped[str] = mapped_column(String(80), index=True)
    machine_id: Mapped[str] = mapped_column(String(80), index=True)
    machine_hourly_rate: Mapped[float] = mapped_column(Float)
    runtime_hours: Mapped[float] = mapped_column(Float)
    downtime_hours: Mapped[float] = mapped_column(Float)
    machine_cost_per_unit: Mapped[float] = mapped_column(Float)


class OverheadCostRecord(Base):
    __tablename__ = "overhead_cost_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    cost_center_id: Mapped[str] = mapped_column(String(80), index=True)
    overhead_type: Mapped[str] = mapped_column(String(80))
    allocation_method: Mapped[str] = mapped_column(String(80))
    allocated_amount: Mapped[float] = mapped_column(Float)


class WastageCostRecord(Base):
    __tablename__ = "wastage_cost_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    item_id: Mapped[str] = mapped_column(String(80), index=True)
    production_order_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    plant_id: Mapped[str] = mapped_column(String(80), index=True)
    reason: Mapped[str] = mapped_column(String(160))
    wastage_cost: Mapped[float] = mapped_column(Float)


class ReworkCostRecord(Base):
    __tablename__ = "rework_cost_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    production_order_id: Mapped[str] = mapped_column(String(80), index=True)
    material_cost: Mapped[float] = mapped_column(Float)
    labor_cost: Mapped[float] = mapped_column(Float)
    machine_cost: Mapped[float] = mapped_column(Float)
    inspection_cost: Mapped[float] = mapped_column(Float)
    delay_cost: Mapped[float] = mapped_column(Float, default=0)


class ScrapCostRecord(Base):
    __tablename__ = "scrap_cost_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    item_id: Mapped[str] = mapped_column(String(80), index=True)
    scrap_material_value: Mapped[float] = mapped_column(Float)
    recoverable_value: Mapped[float] = mapped_column(Float)
    net_scrap_loss: Mapped[float] = mapped_column(Float)
    scrap_reason: Mapped[str] = mapped_column(String(160))
    approval_status: Mapped[str] = mapped_column(String(80), default="Pending")


class MaintenanceCostRecord(Base):
    __tablename__ = "maintenance_cost_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    work_order_id: Mapped[str] = mapped_column(String(80), index=True)
    machine_id: Mapped[str] = mapped_column(String(80), index=True)
    spare_part_cost: Mapped[float] = mapped_column(Float)
    labor_cost: Mapped[float] = mapped_column(Float)
    vendor_cost: Mapped[float] = mapped_column(Float)
    downtime_cost: Mapped[float] = mapped_column(Float)
    production_loss_cost: Mapped[float] = mapped_column(Float)


class QualityCostRecord(Base):
    __tablename__ = "quality_cost_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    source_id: Mapped[str] = mapped_column(String(80), index=True)
    inspection_cost: Mapped[float] = mapped_column(Float)
    rejection_cost: Mapped[float] = mapped_column(Float)
    rework_cost: Mapped[float] = mapped_column(Float)
    scrap_cost: Mapped[float] = mapped_column(Float)
    capa_cost: Mapped[float] = mapped_column(Float)


class LogisticsCostRecord(Base):
    __tablename__ = "logistics_cost_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    sales_order_id: Mapped[str] = mapped_column(String(80), index=True)
    customer_id: Mapped[str] = mapped_column(String(80), index=True)
    freight_cost: Mapped[float] = mapped_column(Float)
    packing_cost: Mapped[float] = mapped_column(Float)
    handling_cost: Mapped[float] = mapped_column(Float)
    return_logistics_cost: Mapped[float] = mapped_column(Float, default=0)


class CostAllocationRule(Base):
    __tablename__ = "cost_allocation_rules"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    company_id: Mapped[str] = mapped_column(String(80), index=True)
    plant_id: Mapped[str] = mapped_column(String(80), index=True)
    cost_element_id: Mapped[str] = mapped_column(String(80), index=True)
    allocation_base: Mapped[str] = mapped_column(String(80))
    allocation_method: Mapped[str] = mapped_column(String(80))
    effective_from: Mapped[date] = mapped_column(Date)
    effective_to: Mapped[date | None] = mapped_column(Date, nullable=True)
    active_status: Mapped[bool] = mapped_column(Boolean, default=True)


class StandardCost(Base):
    __tablename__ = "standard_costs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    item_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    product_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    standard_material_cost: Mapped[float] = mapped_column(Float)
    standard_labor_cost: Mapped[float] = mapped_column(Float)
    standard_machine_cost: Mapped[float] = mapped_column(Float)
    standard_overhead_cost: Mapped[float] = mapped_column(Float)
    total_standard_cost: Mapped[float] = mapped_column(Float)
    effective_from: Mapped[date] = mapped_column(Date)
    approved_by: Mapped[str | None] = mapped_column(String(120), nullable=True)
    approval_status: Mapped[str] = mapped_column(String(80), default="Pending")


class ActualCost(Base):
    __tablename__ = "actual_costs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    source_type: Mapped[str] = mapped_column(String(80), index=True)
    source_id: Mapped[str] = mapped_column(String(80), index=True)
    components: Mapped[dict] = mapped_column(JSON, default=dict)
    total_actual_cost: Mapped[float] = mapped_column(Float)


class CostVariance(Base):
    __tablename__ = "cost_variances"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    variance_type: Mapped[str] = mapped_column(String(120))
    source_id: Mapped[str] = mapped_column(String(80), index=True)
    planned_cost: Mapped[float] = mapped_column(Float)
    actual_cost: Mapped[float] = mapped_column(Float)
    difference: Mapped[float] = mapped_column(Float)
    variance_percent: Mapped[float] = mapped_column(Float)
    reason: Mapped[str] = mapped_column(Text)
    responsible_area: Mapped[str] = mapped_column(String(120))


class ProductProfitability(Base):
    __tablename__ = "product_profitability"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    product_id: Mapped[str] = mapped_column(String(80), index=True)
    sales_revenue: Mapped[float] = mapped_column(Float)
    total_cost: Mapped[float] = mapped_column(Float)
    gross_margin: Mapped[float] = mapped_column(Float)
    net_margin: Mapped[float] = mapped_column(Float)
    profit_per_unit: Mapped[float] = mapped_column(Float)
    margin_trend: Mapped[str] = mapped_column(String(80))
    low_margin_alert: Mapped[bool] = mapped_column(Boolean, default=False)


class CustomerProfitability(Base):
    __tablename__ = "customer_profitability"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    customer_id: Mapped[str] = mapped_column(String(80), index=True)
    sales_revenue: Mapped[float] = mapped_column(Float)
    discounts: Mapped[float] = mapped_column(Float, default=0)
    cost_of_goods_sold: Mapped[float] = mapped_column(Float)
    freight: Mapped[float] = mapped_column(Float, default=0)
    returns: Mapped[float] = mapped_column(Float, default=0)
    profitability_score: Mapped[float] = mapped_column(Float)
    low_margin_alert: Mapped[bool] = mapped_column(Boolean, default=False)


class PlantProfitability(Base):
    __tablename__ = "plant_profitability"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    plant_id: Mapped[str] = mapped_column(String(80), index=True)
    sales_contribution: Mapped[float] = mapped_column(Float)
    total_cost: Mapped[float] = mapped_column(Float)
    contribution_margin: Mapped[float] = mapped_column(Float)
    plant_efficiency_score: Mapped[float] = mapped_column(Float)


class CostingAIRisk(Base):
    __tablename__ = "costing_ai_risks"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    risk_type: Mapped[str] = mapped_column(String(120))
    risk_level: Mapped[str] = mapped_column(String(40))
    reason: Mapped[str] = mapped_column(Text)
    impacted_objects: Mapped[list] = mapped_column(JSON, default=list)
    recommended_action: Mapped[str] = mapped_column(Text)


class CostingRecommendation(Base):
    __tablename__ = "costing_recommendations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    recommendation_type: Mapped[str] = mapped_column(String(120))
    source_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    recommendation: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(80), default="DRAFT")
    requires_human_approval: Mapped[bool] = mapped_column(Boolean, default=True)


class CostingReport(Base):
    __tablename__ = "costing_reports"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    report_code: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    report_name: Mapped[str] = mapped_column(String(160))
    rows_json: Mapped[list] = mapped_column(JSON, default=list)


class CostingSnapshot(Base):
    __tablename__ = "costing_snapshots"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    company_id: Mapped[str] = mapped_column(String(80), index=True)
    plant_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    snapshot_type: Mapped[str] = mapped_column(String(80), index=True)
    totals_json: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
