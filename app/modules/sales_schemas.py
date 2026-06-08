from __future__ import annotations

from datetime import date
from typing import Any

from pydantic import BaseModel, Field


class CustomerRequest(BaseModel):
    customer_id: str
    customer_code: str
    customer_name: str
    customer_type: str = "Direct Customer"
    gst_vat_tax_id: str | None = None
    billing_address: str
    shipping_address: str
    contact_person: str | None = None
    email: str | None = None
    phone: str | None = None
    region_id: str | None = None
    territory_id: str | None = None
    assigned_sales_rep_id: str | None = None
    assigned_plant_id: str | None = None
    active_status: bool = True


class RegionRequest(BaseModel):
    region_id: str
    region_name: str
    country: str = "India"
    state: str
    district: str | None = None
    city: str | None = None


class TerritoryRequest(BaseModel):
    territory_id: str
    territory_name: str
    region_id: str
    assigned_sales_user_id: str | None = None
    assigned_plant_representative_id: str | None = None


class PlantRepresentativeRequest(BaseModel):
    plant_representative_id: str
    user_id: str
    plant_id: str
    region_id: str
    authority_level: str = "REGIONAL"
    allocation_limit: float = Field(default=0, ge=0)
    active_status: bool = True


class SalesOrderItemRequest(BaseModel):
    product_id: str
    finished_goods_item_id: str
    ordered_quantity: float = Field(gt=0)
    unit_price: float = Field(ge=0)
    discount: float = Field(default=0, ge=0)
    tax: float = Field(default=0, ge=0)
    requested_delivery_date: date


class SalesOrderRequest(BaseModel):
    sales_order_id: str
    sales_order_number: str
    customer_id: str
    company_id: str = "company-c"
    plant_id: str = "plant-hyd"
    region_id: str = "region-south"
    order_date: date
    requested_delivery_date: date
    priority: str = "MEDIUM"
    status: str = "Draft"
    payment_terms: str | None = "NET30"
    delivery_terms: str | None = "DAP"
    created_by: str = "sales-user"
    approved_by: str | None = None
    items: list[SalesOrderItemRequest] = Field(default_factory=list)


class AllocationRequest(BaseModel):
    sales_order_id: str
    item_id: str
    quantity: float = Field(gt=0)
    allocation_mode: str = "Representative-controlled allocation"
    override_protected: bool = False


class DispatchOrderRequest(BaseModel):
    sales_order_id: str
    picker_assigned: str | None = None


class ShipmentRequest(BaseModel):
    shipment_id: str
    shipment_number: str
    sales_order_id: str
    customer_id: str
    dispatch_date: date
    carrier_name: str
    vehicle_number: str | None = None
    tracking_number: str | None = None
    driver_name: str | None = None
    driver_phone: str | None = None
    shipment_status: str = "Created"
    expected_delivery_date: date | None = None
    actual_delivery_date: date | None = None
    proof_of_delivery_document: str | None = None


class ReturnRequest(BaseModel):
    return_number: str
    sales_order_id: str
    customer_id: str
    reason: str
    quantity: float = Field(gt=0)
    status: str = "Requested"
    decision: str | None = None


class SalesDraftActionRequest(BaseModel):
    action_type: str
    source_type: str | None = None
    source_id: str | None = None
    reason: str


class SalesApiResult(BaseModel):
    module: str = "SALES"
    action: str
    message: str
    data: dict[str, Any] | list[dict[str, Any]]
