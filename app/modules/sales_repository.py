from __future__ import annotations

from copy import deepcopy
from datetime import date, timedelta
from typing import Any
from uuid import uuid4


class SalesRepository:
    def __init__(self) -> None:
        self.enabled = True
        self.customers = [
            {"id": "cust-apollo", "customer_id": "cust-apollo", "customer_code": "CUST-APOLLO", "customer_name": "Apollo Pumps Ltd", "customer_type": "Enterprise Customer", "gst_vat_tax_id": "GSTAPOLLO123", "billing_address": "Hyderabad", "shipping_address": "Chennai DC", "contact_person": "Meera Rao", "email": "meera@example.com", "phone": "+91-90000-10001", "region_id": "region-south", "territory_id": "terr-chn", "assigned_sales_rep_id": "sales-ravi", "assigned_plant_id": "plant-hyd", "active_status": True},
            {"id": "cust-dealer-south", "customer_id": "cust-dealer-south", "customer_code": "CUST-SD01", "customer_name": "South Dealer Network", "customer_type": "Dealer", "gst_vat_tax_id": None, "billing_address": "Bengaluru", "shipping_address": "Bengaluru", "contact_person": "Arun", "email": "dealer@example.com", "phone": "+91-90000-10002", "region_id": "region-south", "territory_id": "terr-blr", "assigned_sales_rep_id": "sales-ravi", "assigned_plant_id": "plant-hyd", "active_status": True},
        ]
        self.hierarchy = [{"id": "hier-001", "parent_customer_id": "cust-dealer-south", "child_customer_id": "cust-apollo", "relationship_type": "Dealer"}]
        self.regions = [{"id": "region-south", "region_id": "region-south", "region_name": "South Region", "country": "India", "state": "Telangana", "district": None, "city": "Hyderabad"}]
        self.territories = [{"id": "terr-chn", "territory_id": "terr-chn", "territory_name": "Chennai Industrial", "region_id": "region-south", "assigned_sales_user_id": "sales-ravi", "assigned_plant_representative_id": "plant-rep-south"}]
        self.plant_representatives = [{"id": "plant-rep-south", "plant_representative_id": "plant-rep-south", "user_id": "plant-rep-user", "plant_id": "plant-hyd", "region_id": "region-south", "authority_level": "REGIONAL", "allocation_limit": 1000, "active_status": True}]
        self.finished_goods = {
            "fg-pump-900": {"physical": 700, "reserved": 200, "allocated": 50, "quarantine": 25, "rejected": 0, "expired": 0, "dispatch_pending": 100, "expiry_date": str(date.today() + timedelta(days=90))},
            "fg-gear-sub": {"physical": 120, "reserved": 10, "allocated": 5, "quarantine": 0, "rejected": 0, "expired": 0, "dispatch_pending": 0, "expiry_date": str(date.today() + timedelta(days=25))},
        }
        self.orders = [
            {"id": "so-001", "sales_order_id": "so-001", "sales_order_number": "SO-1001", "customer_id": "cust-apollo", "company_id": "company-c", "plant_id": "plant-hyd", "region_id": "region-south", "order_date": str(date.today()), "requested_delivery_date": str(date.today() + timedelta(days=7)), "priority": "HIGH", "status": "Submitted", "payment_terms": "NET30", "delivery_terms": "DAP", "created_by": "sales-user", "approved_by": None}
        ]
        self.order_items = [{"id": "soi-001", "sales_order_id": "so-001", "product_id": "prod-pump-900", "finished_goods_item_id": "fg-pump-900", "ordered_quantity": 800, "reserved_quantity": 0, "dispatched_quantity": 0, "pending_quantity": 800, "unit_price": 4500, "discount": 0, "tax": 18, "requested_delivery_date": str(date.today() + timedelta(days=7)), "status": "Open"}]
        self.reservations = [{"id": "res-protected-001", "reservation_id": "res-protected-001", "customer_id": "cust-dealer-south", "sales_order_id": "contract-001", "item_id": "fg-pump-900", "batch_id": "FG-PUMP-0601", "quantity": 200, "reservation_type": "Contract reservation", "expiry_date": str(date.today() + timedelta(days=90)), "status": "Active", "protected": True}]
        self.allocations = []
        self.dispatch_orders = []
        self.shipments = []
        self.returns = []
        self.credit_profiles = [{"customer_id": "cust-apollo", "credit_limit": 5000000, "outstanding_amount": 1200000, "payment_terms": "NET30", "credit_status": "Good", "hold_status": "None"}]
        self.tasks = []
        self.notifications = []
        self.recommendations = []

    def snapshot(self, data: Any) -> Any:
        return deepcopy(data)

    def add(self, collection: list[dict[str, Any]], payload: dict[str, Any], prefix: str) -> dict[str, Any]:
        record = {"id": f"{prefix}-{uuid4().hex[:8]}", **payload}
        collection.append(record)
        return self.snapshot(record)

    def get(self, collection: list[dict[str, Any]], record_id: str) -> dict[str, Any] | None:
        return next((record for record in collection if record["id"] == record_id), None)

    def update(self, collection: list[dict[str, Any]], record_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        record = self.get(collection, record_id)
        if not record:
            raise KeyError(record_id)
        record.update(payload)
        return self.snapshot(record)


sales_repo = SalesRepository()
