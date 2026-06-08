from __future__ import annotations

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from ..database import Base


class ProductionProduct(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    product_code: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    product_name: Mapped[str] = mapped_column(String(200))
    product_type: Mapped[str] = mapped_column(String(80))
    unit_of_measure: Mapped[str] = mapped_column(String(24))
    category: Mapped[str] = mapped_column(String(120))
    default_bom_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    default_routing_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    quality_required: Mapped[bool] = mapped_column(Boolean, default=True)
    active_status: Mapped[bool] = mapped_column(Boolean, default=True)


class BomHeader(Base):
    __tablename__ = "bom_headers"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    bom_code: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    product_id: Mapped[str] = mapped_column(String(64), ForeignKey("products.id"))
    status: Mapped[str] = mapped_column(String(80), default="Draft")
    active_version: Mapped[int | None] = mapped_column(Integer, nullable=True)


class BomVersion(Base):
    __tablename__ = "bom_versions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    bom_id: Mapped[str] = mapped_column(String(64), ForeignKey("bom_headers.id"))
    version_number: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(80), default="Draft")
    approval_notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class BomItem(Base):
    __tablename__ = "bom_items"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    bom_version_id: Mapped[str] = mapped_column(String(64), ForeignKey("bom_versions.id"))
    material_item: Mapped[str] = mapped_column(String(120))
    quantity_required: Mapped[float] = mapped_column(Float)
    uom: Mapped[str] = mapped_column(String(24))
    scrap_allowance_percent: Mapped[float] = mapped_column(Float, default=0)
    substitute_allowed: Mapped[bool] = mapped_column(Boolean, default=False)
    critical_material: Mapped[bool] = mapped_column(Boolean, default=False)
    consumption_type: Mapped[str] = mapped_column(String(40), default="Auto")


class RoutingHeader(Base):
    __tablename__ = "routing_headers"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    routing_code: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    product_id: Mapped[str] = mapped_column(String(64), ForeignKey("products.id"))
    version_number: Mapped[int] = mapped_column(Integer, default=1)
    active_status: Mapped[bool] = mapped_column(Boolean, default=True)


class RoutingOperation(Base):
    __tablename__ = "routing_operations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    routing_id: Mapped[str] = mapped_column(String(64), ForeignKey("routing_headers.id"))
    operation_name: Mapped[str] = mapped_column(String(120))
    sequence_number: Mapped[int] = mapped_column(Integer)
    work_center: Mapped[str] = mapped_column(String(120))
    production_line: Mapped[str] = mapped_column(String(120))
    setup_time: Mapped[float] = mapped_column(Float)
    run_time: Mapped[float] = mapped_column(Float)
    labor_requirement: Mapped[float] = mapped_column(Float)
    machine_requirement: Mapped[str] = mapped_column(String(120))
    quality_check_required: Mapped[bool] = mapped_column(Boolean, default=False)


class WorkCenter(Base):
    __tablename__ = "work_centers"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    work_center_code: Mapped[str] = mapped_column(String(80), unique=True)
    work_center_name: Mapped[str] = mapped_column(String(160))
    plant: Mapped[str] = mapped_column(String(120))
    department: Mapped[str] = mapped_column(String(120))
    capacity_per_hour: Mapped[float] = mapped_column(Float)
    operating_calendar: Mapped[str] = mapped_column(String(120))
    active_status: Mapped[bool] = mapped_column(Boolean, default=True)


class ProductionLine(Base):
    __tablename__ = "production_lines"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    line_code: Mapped[str] = mapped_column(String(80), unique=True)
    line_name: Mapped[str] = mapped_column(String(160))
    plant: Mapped[str] = mapped_column(String(120))
    department: Mapped[str] = mapped_column(String(120))
    capacity: Mapped[float] = mapped_column(Float)
    shift_calendar: Mapped[str] = mapped_column(String(120))
    status: Mapped[str] = mapped_column(String(80), default="Active")


class ProductionMachine(Base):
    __tablename__ = "machines"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    machine_id: Mapped[str] = mapped_column(String(80), unique=True)
    machine_name: Mapped[str] = mapped_column(String(160))
    machine_status: Mapped[str] = mapped_column(String(80))
    runtime: Mapped[float] = mapped_column(Float, default=0)
    downtime: Mapped[float] = mapped_column(Float, default=0)
    capacity: Mapped[float] = mapped_column(Float)


class ProductionOrder(Base):
    __tablename__ = "production_orders"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    production_order_number: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    company: Mapped[str] = mapped_column(String(120))
    plant: Mapped[str] = mapped_column(String(120))
    product_id: Mapped[str] = mapped_column(String(64), ForeignKey("products.id"))
    bom_version: Mapped[str] = mapped_column(String(64))
    routing_version: Mapped[str] = mapped_column(String(64))
    target_quantity: Mapped[float] = mapped_column(Float)
    planned_start_date: Mapped[Date] = mapped_column(Date)
    planned_end_date: Mapped[Date] = mapped_column(Date)
    priority: Mapped[str] = mapped_column(String(40), default="MEDIUM")
    assigned_line: Mapped[str] = mapped_column(String(120))
    assigned_work_center: Mapped[str] = mapped_column(String(120))
    source: Mapped[str] = mapped_column(String(80), default="Manual")
    status: Mapped[str] = mapped_column(String(80), default="Draft")


class ProductionSchedule(Base):
    __tablename__ = "production_schedules"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    production_order_id: Mapped[str] = mapped_column(String(64), ForeignKey("production_orders.id"))
    scheduled_start: Mapped[DateTime] = mapped_column(DateTime)
    scheduled_end: Mapped[DateTime] = mapped_column(DateTime)
    line_id: Mapped[str] = mapped_column(String(64))
    work_center_id: Mapped[str] = mapped_column(String(64))
    conflicts: Mapped[list] = mapped_column(JSON, default=list)


class MaterialRequirement(Base):
    __tablename__ = "material_requirements"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    production_order_id: Mapped[str] = mapped_column(String(64), ForeignKey("production_orders.id"))
    material_item: Mapped[str] = mapped_column(String(120))
    required_quantity: Mapped[float] = mapped_column(Float)
    available_quantity: Mapped[float] = mapped_column(Float)
    shortage_quantity: Mapped[float] = mapped_column(Float)


class MaterialReservation(Base):
    __tablename__ = "material_reservations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    production_order_id: Mapped[str] = mapped_column(String(64), ForeignKey("production_orders.id"))
    material_item: Mapped[str] = mapped_column(String(120))
    required_quantity: Mapped[float] = mapped_column(Float)
    available_quantity: Mapped[float] = mapped_column(Float)
    reserved_quantity: Mapped[float] = mapped_column(Float)
    shortage_quantity: Mapped[float] = mapped_column(Float)


class MaterialConsumption(Base):
    __tablename__ = "material_consumption"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    production_order_id: Mapped[str] = mapped_column(String(64), ForeignKey("production_orders.id"))
    material_item: Mapped[str] = mapped_column(String(120))
    consumed_quantity: Mapped[float] = mapped_column(Float)
    variance_quantity: Mapped[float] = mapped_column(Float, default=0)
    consumption_type: Mapped[str] = mapped_column(String(40), default="Manual")


class ProductionLog(Base):
    __tablename__ = "production_logs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    production_order_id: Mapped[str] = mapped_column(String(64), ForeignKey("production_orders.id"))
    log_date: Mapped[Date] = mapped_column(Date)
    shift: Mapped[str] = mapped_column(String(80))
    line: Mapped[str] = mapped_column(String(120))
    machine: Mapped[str] = mapped_column(String(120))
    planned_output: Mapped[float] = mapped_column(Float)
    actual_output: Mapped[float] = mapped_column(Float)
    material_consumed: Mapped[float] = mapped_column(Float)
    downtime: Mapped[float] = mapped_column(Float)
    wastage: Mapped[float] = mapped_column(Float)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)


class DowntimeEvent(Base):
    __tablename__ = "downtime_events"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    production_order_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    machine_id: Mapped[str] = mapped_column(String(80))
    downtime_type: Mapped[str] = mapped_column(String(80))
    duration_minutes: Mapped[float] = mapped_column(Float)
    root_cause: Mapped[str | None] = mapped_column(Text, nullable=True)


class WipInventory(Base):
    __tablename__ = "wip_inventory"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    production_order_id: Mapped[str] = mapped_column(String(64), ForeignKey("production_orders.id"))
    quantity_in_process: Mapped[float] = mapped_column(Float)
    stage: Mapped[str] = mapped_column(String(120))
    status: Mapped[str] = mapped_column(String(80))
    location: Mapped[str] = mapped_column(String(120))


class ProductionCosting(Base):
    __tablename__ = "production_costing"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    production_order_id: Mapped[str] = mapped_column(String(64), ForeignKey("production_orders.id"))
    material_cost: Mapped[float] = mapped_column(Float)
    machine_cost: Mapped[float] = mapped_column(Float)
    labor_cost: Mapped[float] = mapped_column(Float)
    overhead_cost: Mapped[float] = mapped_column(Float)
    wastage_cost: Mapped[float] = mapped_column(Float)
    rework_cost: Mapped[float] = mapped_column(Float)
    cost_per_unit: Mapped[float] = mapped_column(Float)


class ProductionVariance(Base):
    __tablename__ = "production_variance"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    production_order_id: Mapped[str] = mapped_column(String(64), ForeignKey("production_orders.id"))
    variance_type: Mapped[str] = mapped_column(String(80))
    expected_value: Mapped[float] = mapped_column(Float)
    actual_value: Mapped[float] = mapped_column(Float)
    variance_value: Mapped[float] = mapped_column(Float)
    approval_required: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[str] = mapped_column(DateTime, server_default=func.now())
