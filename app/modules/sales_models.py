from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from ..database import Base


class SalesCustomer(Base):
    __tablename__ = "sales_customers"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    customer_id: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    customer_code: Mapped[str] = mapped_column(String(80), unique=True)
    customer_name: Mapped[str] = mapped_column(String(180))
    customer_type: Mapped[str] = mapped_column(String(80))
    gst_vat_tax_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    billing_address: Mapped[str] = mapped_column(Text)
    shipping_address: Mapped[str] = mapped_column(Text)
    contact_person: Mapped[str | None] = mapped_column(String(120), nullable=True)
    email: Mapped[str | None] = mapped_column(String(180), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(60), nullable=True)
    region_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    territory_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    assigned_sales_rep_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    assigned_plant_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    active_status: Mapped[bool] = mapped_column(Boolean, default=True)


class CustomerHierarchy(Base):
    __tablename__ = "customer_hierarchy"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    parent_customer_id: Mapped[str] = mapped_column(String(80))
    child_customer_id: Mapped[str] = mapped_column(String(80))
    relationship_type: Mapped[str] = mapped_column(String(80))


class SalesRegion(Base):
    __tablename__ = "regions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    region_id: Mapped[str] = mapped_column(String(80), unique=True)
    region_name: Mapped[str] = mapped_column(String(120))
    country: Mapped[str] = mapped_column(String(80))
    state: Mapped[str] = mapped_column(String(80))
    district: Mapped[str | None] = mapped_column(String(80), nullable=True)
    city: Mapped[str | None] = mapped_column(String(80), nullable=True)


class SalesTerritory(Base):
    __tablename__ = "territories"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    territory_id: Mapped[str] = mapped_column(String(80), unique=True)
    territory_name: Mapped[str] = mapped_column(String(120))
    region_id: Mapped[str] = mapped_column(String(80))
    assigned_sales_user_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    assigned_plant_representative_id: Mapped[str | None] = mapped_column(String(80), nullable=True)


class PlantRepresentative(Base):
    __tablename__ = "plant_representatives"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    plant_representative_id: Mapped[str] = mapped_column(String(80), unique=True)
    user_id: Mapped[str] = mapped_column(String(80))
    plant_id: Mapped[str] = mapped_column(String(80))
    region_id: Mapped[str] = mapped_column(String(80))
    authority_level: Mapped[str] = mapped_column(String(80))
    allocation_limit: Mapped[float] = mapped_column(Float)
    active_status: Mapped[bool] = mapped_column(Boolean, default=True)


class SalesOrder(Base):
    __tablename__ = "sales_orders"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    sales_order_id: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    sales_order_number: Mapped[str] = mapped_column(String(80), unique=True)
    customer_id: Mapped[str] = mapped_column(String(80))
    company_id: Mapped[str] = mapped_column(String(80))
    plant_id: Mapped[str] = mapped_column(String(80))
    region_id: Mapped[str] = mapped_column(String(80))
    order_date: Mapped[date] = mapped_column(Date)
    requested_delivery_date: Mapped[date] = mapped_column(Date)
    priority: Mapped[str] = mapped_column(String(40))
    status: Mapped[str] = mapped_column(String(80), default="Draft")
    payment_terms: Mapped[str | None] = mapped_column(String(120), nullable=True)
    delivery_terms: Mapped[str | None] = mapped_column(String(120), nullable=True)
    created_by: Mapped[str] = mapped_column(String(120))
    approved_by: Mapped[str | None] = mapped_column(String(120), nullable=True)


class SalesOrderItem(Base):
    __tablename__ = "sales_order_items"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    sales_order_id: Mapped[str] = mapped_column(String(80), index=True)
    product_id: Mapped[str] = mapped_column(String(80))
    finished_goods_item_id: Mapped[str] = mapped_column(String(80))
    ordered_quantity: Mapped[float] = mapped_column(Float)
    reserved_quantity: Mapped[float] = mapped_column(Float, default=0)
    dispatched_quantity: Mapped[float] = mapped_column(Float, default=0)
    pending_quantity: Mapped[float] = mapped_column(Float)
    unit_price: Mapped[float] = mapped_column(Float)
    discount: Mapped[float] = mapped_column(Float, default=0)
    tax: Mapped[float] = mapped_column(Float, default=0)
    requested_delivery_date: Mapped[date] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(80), default="Open")


class FinishedGoodsReservation(Base):
    __tablename__ = "finished_goods_reservations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    reservation_id: Mapped[str] = mapped_column(String(80), unique=True)
    customer_id: Mapped[str] = mapped_column(String(80))
    sales_order_id: Mapped[str] = mapped_column(String(80))
    item_id: Mapped[str] = mapped_column(String(80))
    batch_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    quantity: Mapped[float] = mapped_column(Float)
    reservation_type: Mapped[str] = mapped_column(String(80))
    expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(80), default="Active")
    protected: Mapped[bool] = mapped_column(Boolean, default=True)


class DispatchOrder(Base):
    __tablename__ = "dispatch_orders"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    sales_order_id: Mapped[str] = mapped_column(String(80))
    status: Mapped[str] = mapped_column(String(80), default="Pending Pick")
    pick_list: Mapped[list] = mapped_column(JSON, default=list)
    packing: Mapped[dict] = mapped_column(JSON, default=dict)


class Shipment(Base):
    __tablename__ = "shipments"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    shipment_id: Mapped[str] = mapped_column(String(80), unique=True)
    shipment_number: Mapped[str] = mapped_column(String(80), unique=True)
    sales_order_id: Mapped[str] = mapped_column(String(80))
    customer_id: Mapped[str] = mapped_column(String(80))
    dispatch_date: Mapped[date] = mapped_column(Date)
    carrier_name: Mapped[str] = mapped_column(String(120))
    vehicle_number: Mapped[str | None] = mapped_column(String(80), nullable=True)
    tracking_number: Mapped[str | None] = mapped_column(String(120), nullable=True)
    driver_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    driver_phone: Mapped[str | None] = mapped_column(String(60), nullable=True)
    shipment_status: Mapped[str] = mapped_column(String(80), default="Created")
    expected_delivery_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    actual_delivery_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    proof_of_delivery_document: Mapped[str | None] = mapped_column(String(500), nullable=True)


class CustomerReturn(Base):
    __tablename__ = "customer_returns"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    return_number: Mapped[str] = mapped_column(String(80), unique=True)
    sales_order_id: Mapped[str] = mapped_column(String(80))
    customer_id: Mapped[str] = mapped_column(String(80))
    reason: Mapped[str] = mapped_column(Text)
    quantity: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(80), default="Requested")
    decision: Mapped[str | None] = mapped_column(String(80), nullable=True)


class SalesRecommendation(Base):
    __tablename__ = "sales_recommendations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    recommendation_type: Mapped[str] = mapped_column(String(120))
    source_type: Mapped[str | None] = mapped_column(String(80), nullable=True)
    source_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    recommendation: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(80), default="Draft")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
