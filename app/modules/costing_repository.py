from __future__ import annotations

from copy import deepcopy
from datetime import date, datetime
from typing import Any
from uuid import uuid4


class CostingRepository:
    def __init__(self) -> None:
        self.company_feature_flags = {
            "company-a": {"costing_inventory": False, "costing_production": False, "costing_maintenance": False, "costing_quality": False, "costing_profitability": False, "costing_ai": False},
            "company-b": {"costing_inventory": True, "costing_production": False, "costing_maintenance": False, "costing_quality": False, "costing_profitability": False, "costing_ai": False},
            "company-c": {"costing_inventory": True, "costing_production": True, "costing_maintenance": True, "costing_quality": True, "costing_profitability": True, "costing_ai": True},
        }
        self.cost_centers = [
            {"id": "cc-prod-line-1", "company_id": "company-c", "plant_id": "plant-hyd", "department_id": "dept-production", "cost_center_code": "CC-PROD-L1", "cost_center_name": "Production Line 1", "cost_center_type": "Production", "active_status": True},
            {"id": "cc-maint", "company_id": "company-c", "plant_id": "plant-hyd", "department_id": "dept-maintenance", "cost_center_code": "CC-MAINT", "cost_center_name": "Maintenance", "cost_center_type": "Maintenance", "active_status": True},
        ]
        self.cost_elements = [
            {"id": "ce-material", "cost_element_code": "RAW_MATERIAL", "cost_element_name": "Raw material cost", "cost_element_type": "Material", "account_code": "5000", "active_status": True},
            {"id": "ce-labor", "cost_element_code": "LABOR", "cost_element_name": "Labor cost", "cost_element_type": "Labor", "account_code": "5100", "active_status": True},
            {"id": "ce-machine", "cost_element_code": "MACHINE", "cost_element_name": "Machine cost", "cost_element_type": "Machine", "account_code": "5200", "active_status": True},
            {"id": "ce-wastage", "cost_element_code": "WASTAGE", "cost_element_name": "Wastage cost", "cost_element_type": "Wastage", "account_code": "5600", "active_status": True},
        ]
        self.inventory_cost_records = [{"id": "ic-steel", "item_id": "item-steel", "batch_id": "batch-steel-001", "quantity": 1200, "unit_cost": 78, "total_cost": 93600, "costing_method": "FIFO", "cost_date": str(date.today()), "stock_status": "Available"}]
        self.purchase_cost_records = []
        self.landed_cost_records = []
        self.landed_cost_allocations = []
        self.production_cost_records = [{"id": "pc-pump-001", "production_order_id": "po-demo-001", "product_id": "fg-pump-900", "planned_cost": 220000, "actual_cost": 246000, "variance_percent": 11.82, "cost_per_unit": 2460}]
        self.material_cost_records = []
        self.labor_cost_records = []
        self.machine_cost_records = []
        self.overhead_cost_records = []
        self.wastage_cost_records = [{"id": "wc-steel", "item_id": "item-steel", "production_order_id": "po-demo-001", "plant_id": "plant-hyd", "reason": "Over consumption", "wastage_cost": 18500}]
        self.rework_cost_records = []
        self.scrap_cost_records = [{"id": "scrap-steel", "item_id": "item-steel", "scrap_material_value": 9200, "recoverable_value": 1800, "net_scrap_loss": 7400, "scrap_reason": "Quality rejection", "approval_status": "Pending"}]
        self.maintenance_cost_records = [{"id": "mc-wo-001", "work_order_id": "wo-breakdown-001", "machine_id": "M-ASM-01", "spare_part_cost": 42000, "labor_cost": 8500, "vendor_cost": 12000, "downtime_cost": 30000, "production_loss_cost": 55000}]
        self.quality_cost_records = [{"id": "qc-lot-001", "source_id": "lot-incoming-001", "inspection_cost": 4500, "rejection_cost": 18000, "rework_cost": 6000, "scrap_cost": 7400, "customer_return_cost": 0, "supplier_quality_cost": 12000, "capa_cost": 3500}]
        self.logistics_cost_records = [{"id": "lc-so-001", "sales_order_id": "so-001", "customer_id": "cust-apollo", "freight_cost": 15000, "packing_cost": 6000, "handling_cost": 2500, "return_logistics_cost": 0}]
        self.cost_allocation_rules = []
        self.standard_costs = [{"id": "std-pump", "item_id": None, "product_id": "fg-pump-900", "standard_material_cost": 1650, "standard_labor_cost": 210, "standard_machine_cost": 320, "standard_overhead_cost": 180, "total_standard_cost": 2360, "effective_from": str(date.today()), "approved_by": "finance-controller", "approval_status": "Approved"}]
        self.actual_costs = []
        self.cost_variances = [{"id": "var-pump-001", "variance_type": "Production cost variance", "source_id": "po-demo-001", "planned_cost": 220000, "actual_cost": 246000, "difference": 26000, "variance_percent": 11.82, "reason": "Material over-consumption and machine downtime", "responsible_area": "Production"}]
        self.product_profitability = [{"id": "profit-product-pump", "product_id": "fg-pump-900", "sales_revenue": 390000, "total_cost": 246000, "gross_margin": 144000, "net_margin": 116000, "profit_per_unit": 1160, "margin_trend": "Declining", "low_margin_alert": False}]
        self.customer_profitability = [{"id": "profit-customer-apollo", "customer_id": "cust-apollo", "sales_revenue": 390000, "discounts": 12000, "cost_of_goods_sold": 246000, "freight": 15000, "returns": 0, "profitability_score": 78, "low_margin_alert": False}]
        self.plant_profitability = [{"id": "profit-plant-hyd", "plant_id": "plant-hyd", "sales_contribution": 1450000, "total_cost": 1030000, "contribution_margin": 420000, "plant_efficiency_score": 82}]
        self.ai_risks = [{"id": "cost-risk-001", "risk_type": "Wastage cost risk", "risk_level": "HIGH", "reason": "Steel over-consumption created 18500 wastage cost.", "impacted_objects": ["item-steel", "po-demo-001"], "recommended_action": "Draft wastage investigation task."}]
        self.recommendations = []
        self.reports = [
            {"id": "cost-report-inventory", "report_code": "INVENTORY_VALUATION", "report_name": "Inventory Valuation Report", "rows_json": self.inventory_cost_records},
            {"id": "cost-report-production", "report_code": "PRODUCTION_COST", "report_name": "Production Cost Report", "rows_json": self.production_cost_records},
            {"id": "cost-report-wastage", "report_code": "WASTAGE_COST", "report_name": "Wastage Cost Report", "rows_json": self.wastage_cost_records},
            {"id": "cost-report-profitability", "report_code": "PROFITABILITY", "report_name": "Profitability Report", "rows_json": self.product_profitability},
        ]
        self.snapshots = []

    def snapshot(self, data: Any) -> Any:
        return deepcopy(data)

    def add(self, collection: list[dict[str, Any]], payload: dict[str, Any], prefix: str) -> dict[str, Any]:
        record = {"id": f"{prefix}-{uuid4().hex[:8]}", **payload}
        collection.append(record)
        return self.snapshot(record)

    def get(self, collection: list[dict[str, Any]], record_id: str) -> dict[str, Any] | None:
        return next((row for row in collection if row["id"] == record_id), None)

    def snapshot_totals(self, snapshot_type: str, totals: dict[str, Any]) -> dict[str, Any]:
        return self.add(self.snapshots, {"company_id": "company-c", "plant_id": "plant-hyd", "snapshot_type": snapshot_type, "totals_json": totals, "created_at": datetime.utcnow().isoformat()}, "cost-snap")


costing_repo = CostingRepository()
