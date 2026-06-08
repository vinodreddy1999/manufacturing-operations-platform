from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from ..database import Base


class QualityPlan(Base):
    __tablename__ = "quality_plans"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    plan_code: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    plan_name: Mapped[str] = mapped_column(String(180))
    company_id: Mapped[str] = mapped_column(String(64))
    plant_id: Mapped[str] = mapped_column(String(64))
    applies_to_type: Mapped[str] = mapped_column(String(80))
    applies_to_id: Mapped[str] = mapped_column(String(80))
    inspection_type: Mapped[str] = mapped_column(String(120))
    checklist_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    sampling_rule_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    approval_required: Mapped[bool] = mapped_column(Boolean, default=False)
    active_status: Mapped[bool] = mapped_column(Boolean, default=True)
    effective_from: Mapped[date | None] = mapped_column(Date, nullable=True)
    effective_to: Mapped[date | None] = mapped_column(Date, nullable=True)


class QualityChecklist(Base):
    __tablename__ = "quality_checklists"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    checklist_code: Mapped[str] = mapped_column(String(80), unique=True)
    checklist_name: Mapped[str] = mapped_column(String(180))
    inspection_type: Mapped[str] = mapped_column(String(120))
    product_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    material_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String(80), default="Active")


class QualityChecklistItem(Base):
    __tablename__ = "quality_checklist_items"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    checklist_id: Mapped[str] = mapped_column(String(64), index=True)
    parameter_name: Mapped[str] = mapped_column(String(160))
    parameter_type: Mapped[str] = mapped_column(String(80))
    expected_value: Mapped[str | None] = mapped_column(String(160), nullable=True)
    min_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    max_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    tolerance: Mapped[float | None] = mapped_column(Float, nullable=True)
    uom: Mapped[str | None] = mapped_column(String(40), nullable=True)
    mandatory: Mapped[bool] = mapped_column(Boolean, default=True)
    critical_parameter: Mapped[bool] = mapped_column(Boolean, default=False)
    photo_required: Mapped[bool] = mapped_column(Boolean, default=False)
    document_required: Mapped[bool] = mapped_column(Boolean, default=False)


class SamplingRule(Base):
    __tablename__ = "sampling_rules"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    rule_name: Mapped[str] = mapped_column(String(160))
    lot_size_from: Mapped[int] = mapped_column(Integer)
    lot_size_to: Mapped[int] = mapped_column(Integer)
    sample_size: Mapped[int] = mapped_column(Integer)
    acceptance_quantity: Mapped[int] = mapped_column(Integer)
    rejection_quantity: Mapped[int] = mapped_column(Integer)
    inspection_level: Mapped[str] = mapped_column(String(80))
    severity_level: Mapped[str] = mapped_column(String(80))


class InspectionLot(Base):
    __tablename__ = "inspection_lots"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    lot_number: Mapped[str] = mapped_column(String(80), unique=True)
    source_type: Mapped[str] = mapped_column(String(80))
    source_id: Mapped[str] = mapped_column(String(80))
    company_id: Mapped[str] = mapped_column(String(64))
    plant_id: Mapped[str] = mapped_column(String(64))
    product_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    material_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    batch_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    production_order_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    supplier_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    customer_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    quantity: Mapped[float] = mapped_column(Float)
    sample_size: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(80), default="Created")
    created_by: Mapped[str] = mapped_column(String(120))


class InspectionResult(Base):
    __tablename__ = "inspection_results"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    inspection_lot_id: Mapped[str] = mapped_column(String(64), index=True)
    checklist_item_id: Mapped[str] = mapped_column(String(64))
    measured_value: Mapped[str | None] = mapped_column(String(160), nullable=True)
    result_status: Mapped[str] = mapped_column(String(80))
    defect_code: Mapped[str | None] = mapped_column(String(80), nullable=True)
    comments: Mapped[str | None] = mapped_column(Text, nullable=True)
    inspected_by: Mapped[str] = mapped_column(String(120))
    inspected_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class QualityDefect(Base):
    __tablename__ = "defects"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    defect_code: Mapped[str] = mapped_column(String(80), index=True)
    defect_name: Mapped[str] = mapped_column(String(160))
    defect_category: Mapped[str] = mapped_column(String(80))
    severity: Mapped[str] = mapped_column(String(40))
    source_type: Mapped[str] = mapped_column(String(80))
    source_id: Mapped[str] = mapped_column(String(80))
    product_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    material_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    batch_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    machine_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    production_line_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    supplier_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    quantity_affected: Mapped[float] = mapped_column(Float)
    description: Mapped[str] = mapped_column(Text)
    photos: Mapped[list] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String(80), default="Open")


class QuarantineRecord(Base):
    __tablename__ = "quarantine_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    item_id: Mapped[str] = mapped_column(String(80))
    batch_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    quantity: Mapped[float] = mapped_column(Float)
    source_type: Mapped[str] = mapped_column(String(80))
    source_id: Mapped[str] = mapped_column(String(80))
    reason: Mapped[str] = mapped_column(Text)
    quarantine_location_id: Mapped[str] = mapped_column(String(80))
    status: Mapped[str] = mapped_column(String(80), default="Active")
    created_by: Mapped[str] = mapped_column(String(120))
    released_by: Mapped[str | None] = mapped_column(String(120), nullable=True)


class ReworkOrder(Base):
    __tablename__ = "rework_orders"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    source_inspection_lot_id: Mapped[str] = mapped_column(String(64))
    product_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    batch_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    quantity: Mapped[float] = mapped_column(Float)
    reason: Mapped[str] = mapped_column(Text)
    assigned_to: Mapped[str | None] = mapped_column(String(120), nullable=True)
    status: Mapped[str] = mapped_column(String(80), default="Open")
    rework_cost: Mapped[float] = mapped_column(Float, default=0)
    reinspection_required: Mapped[bool] = mapped_column(Boolean, default=True)


class Rejection(Base):
    __tablename__ = "rejections"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    source_type: Mapped[str] = mapped_column(String(80))
    source_id: Mapped[str] = mapped_column(String(80))
    item_id: Mapped[str] = mapped_column(String(80))
    batch_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    quantity: Mapped[float] = mapped_column(Float)
    rejection_reason: Mapped[str] = mapped_column(Text)
    rejected_by: Mapped[str] = mapped_column(String(120))
    rejected_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    cost_impact: Mapped[float] = mapped_column(Float, default=0)
    status: Mapped[str] = mapped_column(String(80), default="Rejected")


class ScrapRecord(Base):
    __tablename__ = "scrap_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    source_type: Mapped[str] = mapped_column(String(80))
    source_id: Mapped[str] = mapped_column(String(80))
    item_id: Mapped[str] = mapped_column(String(80))
    batch_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    quantity: Mapped[float] = mapped_column(Float)
    scrap_reason: Mapped[str] = mapped_column(Text)
    estimated_loss: Mapped[float] = mapped_column(Float)
    approval_required: Mapped[bool] = mapped_column(Boolean, default=True)
    approved_by: Mapped[str | None] = mapped_column(String(120), nullable=True)
    status: Mapped[str] = mapped_column(String(80), default="Pending Approval")


class CapaRecord(Base):
    __tablename__ = "capa_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    capa_number: Mapped[str] = mapped_column(String(80), unique=True)
    source_type: Mapped[str] = mapped_column(String(80))
    source_id: Mapped[str] = mapped_column(String(80))
    problem_statement: Mapped[str] = mapped_column(Text)
    root_cause: Mapped[str | None] = mapped_column(Text, nullable=True)
    corrective_action: Mapped[str | None] = mapped_column(Text, nullable=True)
    preventive_action: Mapped[str | None] = mapped_column(Text, nullable=True)
    owner_id: Mapped[str] = mapped_column(String(120))
    due_date: Mapped[date]
    status: Mapped[str] = mapped_column(String(80), default="Open")
    effectiveness_check_required: Mapped[bool] = mapped_column(Boolean, default=True)


class QualityRecommendation(Base):
    __tablename__ = "quality_recommendations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    recommendation_type: Mapped[str] = mapped_column(String(120))
    source_type: Mapped[str | None] = mapped_column(String(80), nullable=True)
    source_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    recommendation: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(80), default="Draft")
