from __future__ import annotations

from sqlalchemy import Boolean, Date, DateTime, Float, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from ..database import Base


class MaintenanceMachine(Base):
    __tablename__ = "maintenance_machines"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    machine_id: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    machine_code: Mapped[str] = mapped_column(String(80), unique=True)
    machine_name: Mapped[str] = mapped_column(String(180))
    company_id: Mapped[str] = mapped_column(String(64))
    plant_id: Mapped[str] = mapped_column(String(64))
    department_id: Mapped[str] = mapped_column(String(64))
    production_line_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    work_center_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    machine_type: Mapped[str] = mapped_column(String(100))
    manufacturer: Mapped[str | None] = mapped_column(String(160), nullable=True)
    model_number: Mapped[str | None] = mapped_column(String(120), nullable=True)
    serial_number: Mapped[str | None] = mapped_column(String(120), nullable=True)
    installed_date: Mapped[Date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(80), default="Active")
    criticality: Mapped[str] = mapped_column(String(40), default="Medium")
    capacity: Mapped[float | None] = mapped_column(Float, nullable=True)
    location: Mapped[str | None] = mapped_column(String(180), nullable=True)
    active_status: Mapped[bool] = mapped_column(Boolean, default=True)


class MachineCapability(Base):
    __tablename__ = "machine_capabilities"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    machine_id: Mapped[str] = mapped_column(String(80), index=True)
    enable_runtime_tracking: Mapped[bool] = mapped_column(Boolean, default=False)
    enable_downtime_tracking: Mapped[bool] = mapped_column(Boolean, default=False)
    enable_maintenance_tracking: Mapped[bool] = mapped_column(Boolean, default=True)
    enable_iot_tracking: Mapped[bool] = mapped_column(Boolean, default=False)
    enable_spare_tracking: Mapped[bool] = mapped_column(Boolean, default=True)
    enable_documentation: Mapped[bool] = mapped_column(Boolean, default=True)
    enable_approval_workflow: Mapped[bool] = mapped_column(Boolean, default=True)


class MaintenancePlan(Base):
    __tablename__ = "maintenance_plans"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    machine_id: Mapped[str] = mapped_column(String(80), index=True)
    plan_name: Mapped[str] = mapped_column(String(180))
    frequency_type: Mapped[str] = mapped_column(String(80))
    frequency_value: Mapped[int] = mapped_column(Integer)
    next_due_date: Mapped[Date] = mapped_column(Date)
    last_completed_date: Mapped[Date | None] = mapped_column(Date, nullable=True)
    expected_duration: Mapped[float] = mapped_column(Float, default=0)
    required_spares: Mapped[list] = mapped_column(JSON, default=list)
    required_documents: Mapped[list] = mapped_column(JSON, default=list)
    approval_required: Mapped[bool] = mapped_column(Boolean, default=False)
    active_status: Mapped[bool] = mapped_column(Boolean, default=True)


class MaintenanceRule(Base):
    __tablename__ = "maintenance_rules"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    machine_id: Mapped[str] = mapped_column(String(80), index=True)
    rule_type: Mapped[str] = mapped_column(String(80))
    rule_value: Mapped[str] = mapped_column(String(120))
    active_status: Mapped[bool] = mapped_column(Boolean, default=True)


class MaintenanceWorkOrder(Base):
    __tablename__ = "maintenance_work_orders"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    work_order_number: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    machine_id: Mapped[str] = mapped_column(String(80), index=True)
    maintenance_type: Mapped[str] = mapped_column(String(100))
    category: Mapped[str] = mapped_column(String(80))
    priority: Mapped[str] = mapped_column(String(40))
    status: Mapped[str] = mapped_column(String(80), default="Open")
    issue_description: Mapped[str] = mapped_column(Text)
    root_cause: Mapped[str | None] = mapped_column(Text, nullable=True)
    assigned_to: Mapped[str | None] = mapped_column(String(120), nullable=True)
    planned_start: Mapped[DateTime | None] = mapped_column(DateTime, nullable=True)
    planned_end: Mapped[DateTime | None] = mapped_column(DateTime, nullable=True)
    actual_start: Mapped[DateTime | None] = mapped_column(DateTime, nullable=True)
    actual_end: Mapped[DateTime | None] = mapped_column(DateTime, nullable=True)
    downtime_minutes: Mapped[float] = mapped_column(Float, default=0)
    production_impact: Mapped[str | None] = mapped_column(String(80), nullable=True)
    approval_status: Mapped[str] = mapped_column(String(80), default="Not Required")
    closure_notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class SparePartMapping(Base):
    __tablename__ = "spare_part_mappings"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    spare_part_id: Mapped[str] = mapped_column(String(80), index=True)
    inventory_item_id: Mapped[str] = mapped_column(String(80))
    machine_id: Mapped[str] = mapped_column(String(80), index=True)
    compatibility: Mapped[str] = mapped_column(String(120))
    criticality: Mapped[str] = mapped_column(String(40), default="Medium")
    replacement_interval: Mapped[str | None] = mapped_column(String(120), nullable=True)
    runtime_threshold: Mapped[float | None] = mapped_column(Float, nullable=True)
    minimum_stock: Mapped[float] = mapped_column(Float, default=0)
    preferred_supplier: Mapped[str | None] = mapped_column(String(160), nullable=True)
    active_status: Mapped[bool] = mapped_column(Boolean, default=True)


class SparePartUsage(Base):
    __tablename__ = "spare_part_usage"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    work_order_id: Mapped[str] = mapped_column(String(64), index=True)
    spare_part_id: Mapped[str] = mapped_column(String(80))
    quantity_used: Mapped[float] = mapped_column(Float)
    cost: Mapped[float] = mapped_column(Float, default=0)


class MaintenanceDowntimeEvent(Base):
    __tablename__ = "maintenance_downtime_events"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    machine_id: Mapped[str] = mapped_column(String(80), index=True)
    production_line_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    work_order_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    start_time: Mapped[DateTime] = mapped_column(DateTime)
    end_time: Mapped[DateTime] = mapped_column(DateTime)
    duration_minutes: Mapped[float] = mapped_column(Float)
    reason_category: Mapped[str] = mapped_column(String(80))
    root_cause: Mapped[str | None] = mapped_column(Text, nullable=True)
    production_loss: Mapped[float] = mapped_column(Float, default=0)
    cost_impact: Mapped[float] = mapped_column(Float, default=0)


class ShutdownWindow(Base):
    __tablename__ = "shutdown_windows"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    plant_id: Mapped[str] = mapped_column(String(64))
    line_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    machine_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    start_time: Mapped[DateTime] = mapped_column(DateTime)
    end_time: Mapped[DateTime] = mapped_column(DateTime)
    reason: Mapped[str] = mapped_column(Text)
    approved_by: Mapped[str | None] = mapped_column(String(120), nullable=True)


class MaintenanceAttachment(Base):
    __tablename__ = "maintenance_attachments"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    work_order_id: Mapped[str] = mapped_column(String(64), index=True)
    document_type: Mapped[str] = mapped_column(String(80))
    file_url: Mapped[str] = mapped_column(String(500))
    uploaded_by: Mapped[str] = mapped_column(String(120))
    uploaded_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())
    description: Mapped[str | None] = mapped_column(Text, nullable=True)


class MachineDocument(Base):
    __tablename__ = "machine_documents"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    machine_id: Mapped[str] = mapped_column(String(80), index=True)
    document_type: Mapped[str] = mapped_column(String(80))
    file_url: Mapped[str] = mapped_column(String(500))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)


class MachineHistory(Base):
    __tablename__ = "machine_history"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    machine_id: Mapped[str] = mapped_column(String(80), index=True)
    event_type: Mapped[str] = mapped_column(String(100))
    event_time: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())
    details: Mapped[dict] = mapped_column(JSON, default=dict)


class MachineRuntimeLog(Base):
    __tablename__ = "machine_runtime_logs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    machine_id: Mapped[str] = mapped_column(String(80), index=True)
    runtime_hours: Mapped[float] = mapped_column(Float)
    logged_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())


class MaintenanceCosting(Base):
    __tablename__ = "maintenance_costing"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    work_order_id: Mapped[str] = mapped_column(String(64), index=True)
    spare_part_cost: Mapped[float] = mapped_column(Float, default=0)
    labor_cost: Mapped[float] = mapped_column(Float, default=0)
    vendor_cost: Mapped[float] = mapped_column(Float, default=0)
    downtime_cost: Mapped[float] = mapped_column(Float, default=0)
    production_loss_cost: Mapped[float] = mapped_column(Float, default=0)
    total_maintenance_cost: Mapped[float] = mapped_column(Float, default=0)


class MachineHealthScore(Base):
    __tablename__ = "machine_health_scores"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    machine_id: Mapped[str] = mapped_column(String(80), index=True)
    health_score: Mapped[float] = mapped_column(Float)
    risk_level: Mapped[str] = mapped_column(String(40))
    recommendation: Mapped[str] = mapped_column(Text)
    calculated_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())


class MaintenanceRecommendation(Base):
    __tablename__ = "maintenance_recommendations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    machine_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    recommendation_type: Mapped[str] = mapped_column(String(100))
    recommendation: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(80), default="Draft")
