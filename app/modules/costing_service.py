from __future__ import annotations

from datetime import date
from typing import Any

import numpy as np

from .costing_repository import CostingRepository, costing_repo


class CostingService:
    def __init__(self, repo: CostingRepository = costing_repo) -> None:
        self.repo = repo

    def enablement(self, company_id: str = "company-c") -> dict[str, Any]:
        return {"company_id": company_id, "feature_flags": self.repo.company_feature_flags.get(company_id, {})}

    def dashboard(self) -> dict[str, Any]:
        total_inventory_value = sum(row["total_cost"] for row in self.repo.inventory_cost_records)
        production_cost = sum(row["actual_cost"] for row in self.repo.production_cost_records)
        wastage_cost = sum(row["wastage_cost"] for row in self.repo.wastage_cost_records)
        rework_cost = sum(sum(row[key] for key in ["material_cost", "labor_cost", "machine_cost", "inspection_cost", "delay_cost"]) for row in self.repo.rework_cost_records)
        scrap_cost = sum(row["net_scrap_loss"] for row in self.repo.scrap_cost_records)
        maintenance_cost = sum(row["spare_part_cost"] + row["labor_cost"] + row["vendor_cost"] + row["downtime_cost"] + row["production_loss_cost"] for row in self.repo.maintenance_cost_records)
        quality_cost = sum(row["inspection_cost"] + row["rejection_cost"] + row["rework_cost"] + row["scrap_cost"] + row["customer_return_cost"] + row["supplier_quality_cost"] + row["capa_cost"] for row in self.repo.quality_cost_records)
        return {"total_inventory_value": total_inventory_value, "production_cost_this_month": production_cost, "wastage_cost": wastage_cost, "rework_cost": rework_cost, "scrap_cost": scrap_cost, "maintenance_cost": maintenance_cost, "cost_of_poor_quality": quality_cost, "low_margin_products": [row for row in self.repo.product_profitability if row["low_margin_alert"]], "low_profit_customers": [row for row in self.repo.customer_profitability if row["low_margin_alert"]], "cost_variance_alerts": self.repo.cost_variances}

    def inventory_calculate(self, payload: dict[str, Any]) -> dict[str, Any]:
        total = round(payload["quantity"] * payload["unit_cost"], 2)
        record = self.repo.add(self.repo.inventory_cost_records, {**payload, "total_cost": total, "cost_date": str(date.today())}, "ic")
        self.repo.snapshot_totals("inventory_valuation", {"latest_item": payload["item_id"], "total_cost": total})
        return record

    def landed_calculate(self, payload: dict[str, Any]) -> dict[str, Any]:
        total = sum(payload[key] for key in ["purchase_cost", "freight", "duty", "tax", "handling", "inspection", "other_charges"])
        per_unit = round(total / payload["quantity"], 4)
        record = self.repo.add(self.repo.landed_cost_records, {"purchase_order_id": payload["purchase_order_id"], "allocation_method": payload["allocation_method"], "total_landed_cost": total, "landed_cost_per_unit": per_unit}, "landed")
        self.repo.add(self.repo.landed_cost_allocations, {"landed_cost_id": record["id"], "item_id": "item-steel", "allocated_cost": total, "allocation_base": payload["allocation_method"]}, "landed-alloc")
        return record

    def production_calculate(self, payload: dict[str, Any]) -> dict[str, Any]:
        planned = payload["planned_material_cost"] + payload["planned_labor_cost"] + payload["planned_machine_cost"]
        actual = payload["actual_material_cost"] + payload["actual_labor_cost"] + payload["actual_machine_cost"] + payload["overhead_cost"] + payload["wastage_cost"] + payload["rework_cost"] + payload["quality_cost"] + payload["maintenance_impact_cost"]
        variance = actual - planned
        variance_percent = round((variance / planned) * 100, 2) if planned else 0
        cost_per_unit = round(actual / payload["produced_quantity"], 2)
        record = self.repo.add(self.repo.production_cost_records, {"production_order_id": payload["production_order_id"], "product_id": payload["product_id"], "planned_cost": planned, "actual_cost": actual, "variance_percent": variance_percent, "cost_per_unit": cost_per_unit}, "pc")
        self.repo.add(self.repo.cost_variances, {"variance_type": "Production cost variance", "source_id": payload["production_order_id"], "planned_cost": planned, "actual_cost": actual, "difference": variance, "variance_percent": variance_percent, "reason": "Actual production components exceeded plan", "responsible_area": "Production"}, "var")
        return record

    def maintenance_calculate(self, payload: dict[str, Any]) -> dict[str, Any]:
        total = payload["spare_part_cost"] + payload["labor_cost"] + payload["vendor_cost"] + payload["downtime_cost"] + payload["production_loss_cost"]
        record = self.repo.add(self.repo.maintenance_cost_records, payload, "mc")
        return {**record, "total_maintenance_cost": total}

    def quality_calculate(self, payload: dict[str, Any]) -> dict[str, Any]:
        total = sum(payload[key] for key in ["inspection_cost", "rejection_cost", "rework_cost", "scrap_cost", "customer_return_cost", "supplier_quality_cost", "capa_cost"])
        record = self.repo.add(self.repo.quality_cost_records, payload, "qc")
        return {**record, "cost_of_poor_quality": total}

    def standard_cost_create(self, payload: dict[str, Any]) -> dict[str, Any]:
        total = payload["standard_material_cost"] + payload["standard_labor_cost"] + payload["standard_machine_cost"] + payload["standard_overhead_cost"]
        return self.repo.add(self.repo.standard_costs, {**payload, "total_standard_cost": total, "approved_by": None, "approval_status": "Pending"}, "std")

    def approve_standard_cost(self, standard_cost_id: str) -> dict[str, Any]:
        record = self.repo.get(self.repo.standard_costs, standard_cost_id)
        if not record:
            raise KeyError(standard_cost_id)
        record["approval_status"] = "Approved"
        record["approved_by"] = "finance-controller"
        return self.repo.snapshot(record)

    def variance_calculate(self, payload: dict[str, Any]) -> dict[str, Any]:
        difference = payload["actual_cost"] - payload["planned_cost"]
        percent = round((difference / payload["planned_cost"]) * 100, 2) if payload["planned_cost"] else 0
        return self.repo.add(self.repo.cost_variances, {**payload, "difference": difference, "variance_percent": percent}, "var")

    def product_profitability(self) -> list[dict[str, Any]]:
        return self.repo.snapshot(self.repo.product_profitability)

    def customer_profitability(self) -> list[dict[str, Any]]:
        return self.repo.snapshot(self.repo.customer_profitability)

    def plant_profitability(self) -> list[dict[str, Any]]:
        return self.repo.snapshot(self.repo.plant_profitability)

    def report(self, report_code: str) -> dict[str, Any]:
        report = next((row for row in self.repo.reports if row["report_code"] == report_code), None)
        if not report:
            raise KeyError(report_code)
        return self.repo.snapshot(report)

    def risk_center(self) -> dict[str, Any]:
        return {"risks": self.repo.snapshot(self.repo.ai_risks), "ai_safety": self.ai_safety()}

    def cost_increase(self) -> dict[str, Any]:
        return {"risk_level": "MEDIUM", "cost_increase_reason": "Supplier price and maintenance cost increased.", "impacted_products": ["fg-pump-900"], "recommended_action": "Review supplier price trend and maintenance downtime cost."}

    def low_margin_products(self) -> dict[str, Any]:
        products = self.repo.product_profitability
        scored = [{**row, "product_risk_score": round(100 - row["net_margin"] / max(row["sales_revenue"], 1) * 100, 2), "cost_drivers": ["Material", "Machine downtime"], "pricing_review_recommended": row["margin_trend"] == "Declining"} for row in products]
        return {"products": scored}

    def customer_profitability_risk(self) -> dict[str, Any]:
        rows = [{**row, "recommended_pricing_review": row["profitability_score"] < 80} for row in self.repo.customer_profitability]
        return {"customers": rows}

    def wastage_cost_risk(self) -> dict[str, Any]:
        root = max(self.repo.wastage_cost_records, key=lambda row: row["wastage_cost"]) if self.repo.wastage_cost_records else None
        return {"highest_wastage": root, "root_cause_suggestion": "Material over-consumption on production order", "investigation_task": {"status": "DRAFT", "requires_human_approval": True}}

    def production_variance(self) -> dict[str, Any]:
        return {"variances": self.repo.snapshot(self.repo.cost_variances), "variance_explanation": "BOM variance and machine downtime increased actual cost.", "recommended_corrective_action": "Review material issue and downtime by line."}

    def supplier_cost_risk(self) -> dict[str, Any]:
        score = float(np.mean([72, 68, 75]))
        return {"supplier_cost_risk_score": round(score, 2), "supplier_review_recommended": score < 75, "drivers": ["Supplier price trend", "Quality cost", "Delay cost"]}

    def optimization(self) -> dict[str, Any]:
        return {"recommendations": ["Reduce wastage", "Improve machine utilization", "Review product pricing", "Improve quality at source"], "draft_only": True, "requires_human_approval": True}

    def draft_action(self, payload: dict[str, Any]) -> dict[str, Any]:
        sanitized = payload["reason"].replace("change product price", "pricing review").replace("modify financial records", "finance review").replace("write off inventory", "inventory loss review")
        return self.repo.add(self.repo.recommendations, {**payload, "reason": sanitized, "status": "DRAFT", "requires_human_approval": True, "ai_safety": self.ai_safety()}, "cost-rec")

    def ai_safety(self) -> dict[str, list[str]]:
        return {"can": ["Analyze", "Recommend", "Create Drafts"], "cannot": ["Change Product Price", "Change Supplier Contract", "Approve Cost Allocation", "Write Off Inventory", "Change Standard Cost", "Modify Financial Records"]}


costing_service = CostingService()
