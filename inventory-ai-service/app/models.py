from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class InventorySignal(Base):
    __tablename__ = "inventory_signals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    item_id: Mapped[str] = mapped_column(String(80), index=True)
    sku: Mapped[str] = mapped_column(String(80), index=True)
    item_name: Mapped[str] = mapped_column(String(200))
    current_stock: Mapped[float] = mapped_column(Float)
    reserved_quantity: Mapped[float] = mapped_column(Float)
    incoming_quantity: Mapped[float] = mapped_column(Float)
    daily_consumption: Mapped[float] = mapped_column(Float)
    average_monthly_usage: Mapped[float] = mapped_column(Float)
    max_stock_level: Mapped[float] = mapped_column(Float)
    safety_stock: Mapped[float] = mapped_column(Float)
    supplier_lead_time_days: Mapped[int] = mapped_column(Integer)
    supplier_quality_rating: Mapped[float] = mapped_column(Float)
    supplier_delivery_reliability: Mapped[float] = mapped_column(Float)
    production_demand: Mapped[float] = mapped_column(Float)
    inventory_value: Mapped[float] = mapped_column(Float)
    expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    last_movement_date: Mapped[date] = mapped_column(Date)
    batch_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    status: Mapped[str] = mapped_column(String(40), default="AVAILABLE")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class DraftAction(Base):
    __tablename__ = "draft_actions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    action_type: Mapped[str] = mapped_column(String(80), index=True)
    item_id: Mapped[str] = mapped_column(String(80), index=True)
    summary: Mapped[str] = mapped_column(String(500))
    risk_level: Mapped[str] = mapped_column(String(20))
    requires_human_approval: Mapped[bool] = mapped_column(default=True)
    status: Mapped[str] = mapped_column(String(40), default="DRAFT")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
