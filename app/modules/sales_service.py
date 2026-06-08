from __future__ import annotations

from datetime import date, timedelta
from typing import Any

from .sales_repository import SalesRepository, sales_repo


class SalesService:
    def __init__(self, repo: SalesRepository = sales_repo) -> None:
        self.repo = repo

    def dashboard(self) -> dict[str, Any]:
        return {
            "sales_enabled": self.repo.enabled,
            "open_sales_orders": [order for order in self.repo.orders if order["status"] not in {"Closed", "Cancelled"}],
            "orders_pending_approval": [order for order in self.repo.orders if order["status"] == "Pending Approval"],
            "orders_with_inventory_shortage": self.order_risk()["orders_with_insufficient_stock"],
            "orders_requiring_production": [order for order in self.repo.orders if order["status"] == "Production Required"],
            "ready_for_dispatch": [order for order in self.repo.orders if order["status"] == "Ready For Dispatch"],
            "dispatch_delays": [shipment for shipment in self.repo.shipments if shipment["shipment_status"] == "Delayed"],
            "regional_sales": self.regional_sales(),
            "customer_demand": self.customer_demand(),
            "returns": self.repo.snapshot(self.repo.returns),
            "finished_goods_availability": self.availability_summary(),
        }

    def create_order(self, payload: dict[str, Any]) -> dict[str, Any]:
        items = payload.pop("items", [])
        order = self.repo.add(self.repo.orders, payload, "so")
        for item in items:
            self.repo.add(self.repo.order_items, {**item, "sales_order_id": order["id"], "reserved_quantity": 0, "dispatched_quantity": 0, "pending_quantity": item["ordered_quantity"], "status": "Open"}, "soi")
        self.create_task("Sales order approval", order["id"], "Sales order created.")
        self.create_notification("Sales order created", order["id"], "Sales order created.")
        return {**order, "items": [item for item in self.repo.order_items if item["sales_order_id"] == order["id"]]}

    def submit_order(self, order_id: str) -> dict[str, Any]:
        order = self.order(order_id)
        order["status"] = "Pending Approval"
        self.create_notification("Approval pending", order_id, "Sales order submitted for approval.")
        return self.repo.snapshot(order)

    def approve_order(self, order_id: str, approved_by: str = "sales-manager") -> dict[str, Any]:
        order = self.order(order_id)
        credit = next((row for row in self.repo.credit_profiles if row["customer_id"] == order["customer_id"]), None)
        if credit and credit["hold_status"] != "None":
            order["status"] = "Pending Approval"
            return {"order": self.repo.snapshot(order), "credit_block": credit}
        order["approved_by"] = approved_by
        order["status"] = "Inventory Check Pending"
        return self.repo.snapshot(order)

    def reserve_order(self, order_id: str) -> dict[str, Any]:
        order = self.order(order_id)
        reservations = []
        production_required = False
        for item in self.items_for_order(order_id):
            availability = self.available_quantity(item["finished_goods_item_id"])
            reserve_qty = min(availability, item["pending_quantity"])
            if reserve_qty > 0:
                item["reserved_quantity"] += reserve_qty
                item["pending_quantity"] = max(item["ordered_quantity"] - item["reserved_quantity"], 0)
                item["status"] = "Partially Reserved" if item["pending_quantity"] else "Fully Reserved"
                reservation = self.repo.add(self.repo.reservations, {"reservation_id": f"res-{order_id}-{item['finished_goods_item_id']}", "customer_id": order["customer_id"], "sales_order_id": order_id, "item_id": item["finished_goods_item_id"], "batch_id": None, "quantity": reserve_qty, "reservation_type": "Customer order reservation", "expiry_date": self.repo.finished_goods[item["finished_goods_item_id"]]["expiry_date"], "status": "Active", "protected": True}, "res")
                reservations.append(reservation)
            if item["pending_quantity"] > 0:
                production_required = True
        if production_required and reservations:
            order["status"] = "Partially Reserved"
            self.create_task("Production requirement review", order_id, "Partial allocation created. Pending quantity needs production or transfer.")
        elif production_required:
            order["status"] = "Production Required"
        else:
            order["status"] = "Fully Reserved"
        return {"order": self.repo.snapshot(order), "reservations": reservations, "production_recommendation": production_required}

    def create_allocation(self, payload: dict[str, Any]) -> dict[str, Any]:
        protected = [row for row in self.repo.reservations if row["item_id"] == payload["item_id"] and row["protected"]]
        if protected and payload.get("override_protected"):
            allocation_status = "Override Approval Required"
        elif protected and not payload.get("override_protected"):
            allocation_status = "Blocked By Protected Reservation"
        else:
            allocation_status = "Allocated"
        allocation = self.repo.add(self.repo.allocations, {**payload, "status": allocation_status}, "alloc")
        return allocation

    def create_dispatch_order(self, payload: dict[str, Any]) -> dict[str, Any]:
        pick_list = []
        for item in self.items_for_order(payload["sales_order_id"]):
            pick_list.append({"sales_order_id": payload["sales_order_id"], "item_id": item["finished_goods_item_id"], "batch": "FEFO-BATCH", "quantity": item["reserved_quantity"], "warehouse": "FG-WH", "zone": "A", "rack": "R1", "shelf": "S1", "bin": "B1", "expiry_priority": "FEFO", "picker_assigned": payload.get("picker_assigned")})
        dispatch = self.repo.add(self.repo.dispatch_orders, {"sales_order_id": payload["sales_order_id"], "status": "Pending Pick", "pick_list": pick_list, "packing": {}}, "dispatch")
        self.create_task("Pick list execution", dispatch["id"], "Pick list created.")
        return dispatch

    def dispatch_order(self, order_id: str) -> dict[str, Any]:
        order = self.order(order_id)
        dispatch = self.create_dispatch_order({"sales_order_id": order_id, "picker_assigned": "picker-1"})
        order["status"] = "Ready For Dispatch"
        return {"order": self.repo.snapshot(order), "dispatch_order": dispatch}

    def close_order(self, order_id: str) -> dict[str, Any]:
        order = self.order(order_id)
        order["status"] = "Closed"
        return self.repo.snapshot(order)

    def available_quantity(self, item_id: str) -> float:
        stock = self.repo.finished_goods.get(item_id, {})
        return max(stock.get("physical", 0) - stock.get("reserved", 0) - stock.get("allocated", 0) - stock.get("quarantine", 0) - stock.get("rejected", 0) - stock.get("expired", 0) - stock.get("dispatch_pending", 0), 0)

    def availability_summary(self) -> dict[str, Any]:
        return {item_id: {**stock, "available": self.available_quantity(item_id)} for item_id, stock in self.repo.finished_goods.items()}

    def reports(self) -> dict[str, Any]:
        return {"sales_order_report": self.repo.snapshot(self.repo.orders), "customer_sales_report": self.customer_demand(), "regional_sales_report": self.regional_sales(), "finished_goods_allocation_report": self.repo.snapshot(self.repo.allocations), "dispatch_report": self.repo.snapshot(self.repo.dispatch_orders), "shipment_delay_report": [s for s in self.repo.shipments if s["shipment_status"] == "Delayed"], "return_report": self.repo.snapshot(self.repo.returns), "customer_profitability_report": self.customer_profitability(), "product_demand_report": self.product_demand(), "sales_vs_inventory_report": self.availability_summary()}

    def kpis(self) -> dict[str, Any]:
        total_orders = max(len(self.repo.orders), 1)
        fulfilled = len([order for order in self.repo.orders if order["status"] in {"Fully Dispatched", "Delivered", "Closed"}])
        backorder = sum(item["pending_quantity"] for item in self.repo.order_items)
        returns = len(self.repo.returns)
        delayed = len([shipment for shipment in self.repo.shipments if shipment["shipment_status"] == "Delayed"])
        return {"order_fulfillment_rate": round(fulfilled / total_orders * 100, 2), "on_time_delivery": 100 - delayed * 10, "fill_rate": round(sum(i["reserved_quantity"] for i in self.repo.order_items) / max(sum(i["ordered_quantity"] for i in self.repo.order_items), 1) * 100, 2), "backorder_quantity": backorder, "return_rate": round(returns / total_orders * 100, 2), "customer_demand_growth": 12.5, "regional_demand_growth": 18.0, "dispatch_delay_rate": delayed, "customer_profitability": self.customer_profitability(), "product_profitability": self.product_demand()}

    def risk_center(self) -> dict[str, Any]:
        risks = []
        for order in self.repo.orders:
            if any(item["pending_quantity"] > 0 for item in self.items_for_order(order["id"])):
                risks.append({"sales_order_id": order["id"], "risk": "Inventory shortage risk", "severity": "HIGH"})
            if order["requested_delivery_date"] < str(date.today() + timedelta(days=3)) and order["status"] not in {"Delivered", "Closed"}:
                risks.append({"sales_order_id": order["id"], "risk": "Order delay risk", "severity": "MEDIUM"})
        for item_id, stock in self.repo.finished_goods.items():
            if stock["expiry_date"] < str(date.today() + timedelta(days=30)):
                risks.append({"item_id": item_id, "risk": "Expiring finished goods risk", "severity": "MEDIUM"})
        return {"risks": risks, "ai_safety": self.ai_safety()}

    def demand_forecast(self) -> dict[str, Any]:
        return {"expected_demand": [{"product_id": "prod-pump-900", "region_id": "region-south", "expected_quantity": 960, "confidence_score": 0.82, "required_inventory": 1200, "production_recommendation": "Draft production request for 500 units"}]}

    def order_risk(self) -> dict[str, Any]:
        return {"orders_likely_delayed": [o for o in self.repo.orders if o["priority"] == "HIGH"], "orders_with_insufficient_stock": [item for item in self.repo.order_items if item["pending_quantity"] > self.available_quantity(item["finished_goods_item_id"])], "orders_dependent_on_production": [o for o in self.repo.orders if o["status"] == "Production Required"], "quality_hold_impacts": [], "shipment_delay_impacts": []}

    def allocation_recommendation(self) -> dict[str, Any]:
        return {"recommendations": [{"item_id": "fg-pump-900", "customer_id": "cust-apollo", "recommended_quantity": self.available_quantity("fg-pump-900"), "rule": "Customer priority + deadline + protected reservations respected"}]}

    def regional_demand(self) -> dict[str, Any]:
        return {"high_demand_regions": [{"region_id": "region-south", "growth_percent": 18}], "low_demand_regions": [], "regional_stock_imbalance": [], "transfer_opportunities": [{"from_region": "west", "to_region": "region-south", "item_id": "fg-pump-900", "quantity": 300}]}

    def expiry_aware_sales(self) -> dict[str, Any]:
        return {"recommendations": [{"item_id": item_id, "action": "Dispatch expiring stock first" if stock["expiry_date"] < str(date.today() + timedelta(days=45)) else "Normal allocation", "expiry_date": stock["expiry_date"]} for item_id, stock in self.repo.finished_goods.items()]}

    def customer_profitability(self) -> dict[str, Any]:
        return {"cust-apollo": {"sales_value": 3600000, "margin": 0.24, "return_cost": 0, "discount_cost": 0, "delivery_cost": 45000, "support_cost": 12000, "profitability_score": 86, "margin_risk": "LOW", "recommended_pricing_review": False}}

    def dispatch_optimization(self) -> dict[str, Any]:
        return {"best_dispatch_priority": [order["sales_order_number"] for order in sorted(self.repo.orders, key=lambda o: (o["priority"] != "HIGH", o["requested_delivery_date"]))], "shipment_grouping": "Group by region and requested delivery date", "delay_risk_alerts": self.risk_center()["risks"]}

    def returns_analysis(self) -> dict[str, Any]:
        return {"return_risk_score": len(self.repo.returns) * 10, "root_cause_suggestion": "Monitor quality-related returns and delivery damage.", "draft_investigation_task": {"status": "DRAFT"}}

    def draft_action(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self.repo.add(self.repo.recommendations, {**payload, "status": "DRAFT", "requires_human_approval": True, "ai_safety": self.ai_safety()}, "sales-draft")

    def ai_safety(self) -> dict[str, list[str]]:
        return {"can": ["Analyze", "Recommend", "Create Drafts"], "cannot": ["Confirm Sales Order", "Reassign Protected Inventory", "Dispatch Goods", "Approve Returns", "Issue Credit", "Change Customer Pricing"]}

    def regional_sales(self) -> dict[str, float]:
        return {"region-south": sum(item["ordered_quantity"] * item["unit_price"] for item in self.repo.order_items)}

    def customer_demand(self) -> dict[str, float]:
        demand: dict[str, float] = {}
        for order in self.repo.orders:
            demand[order["customer_id"]] = demand.get(order["customer_id"], 0) + sum(item["ordered_quantity"] for item in self.items_for_order(order["id"]))
        return demand

    def product_demand(self) -> dict[str, float]:
        demand: dict[str, float] = {}
        for item in self.repo.order_items:
            demand[item["product_id"]] = demand.get(item["product_id"], 0) + item["ordered_quantity"]
        return demand

    def create_task(self, task_type: str, source_id: str, message: str) -> dict[str, Any]:
        return self.repo.add(self.repo.tasks, {"task_type": task_type, "source_id": source_id, "message": message, "status": "OPEN"}, "sales-task")

    def create_notification(self, notification_type: str, source_id: str, message: str) -> dict[str, Any]:
        return self.repo.add(self.repo.notifications, {"notification_type": notification_type, "source_id": source_id, "message": message, "status": "READY_TO_SEND"}, "sales-notify")

    def order(self, order_id: str) -> dict[str, Any]:
        order = self.repo.get(self.repo.orders, order_id)
        if not order:
            raise KeyError(order_id)
        return order

    def items_for_order(self, order_id: str) -> list[dict[str, Any]]:
        return [item for item in self.repo.order_items if item["sales_order_id"] == order_id]


sales_service = SalesService()
