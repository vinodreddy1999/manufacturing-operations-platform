from __future__ import annotations

from datetime import date, datetime
from statistics import mean
from typing import Any

from .quality_repository import QualityRepository, quality_repo


class QualityService:
    def __init__(self, repo: QualityRepository = quality_repo) -> None:
        self.repo = repo

    def dashboard(self) -> dict[str, Any]:
        kpis = self.kpis()
        return {
            "quality_enabled": self.repo.enabled,
            "pending_inspections": [lot for lot in self.repo.inspection_lots if lot["status"] in {"Created", "Pending Inspection", "In Inspection"}],
            "failed_inspections": [lot for lot in self.repo.inspection_lots if lot["status"] in {"Failed", "Partially Passed"}],
            "quarantine_stock": self.repo.snapshot(self.repo.quarantine),
            "rework_orders": self.repo.snapshot(self.repo.rework),
            "rejection_rate": kpis["defect_rate"],
            "defect_trend": self.trends()["defect_trend"],
            "supplier_quality_issues": self.repo.snapshot(self.repo.supplier_metrics),
            "open_capa": [capa for capa in self.repo.capa if capa["status"] not in {"Closed", "Cancelled"}],
            "first_pass_yield": kpis["first_pass_yield"],
            "cost_of_poor_quality": kpis["cost_of_poor_quality"],
        }

    def start_inspection(self, lot_id: str) -> dict[str, Any]:
        lot = self.lot(lot_id)
        lot["status"] = "In Inspection"
        self.create_task("Perform inspection", lot_id, "Inspection lot is now in inspection.")
        return self.repo.snapshot(lot)

    def submit_inspection(self, lot_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        lot = self.lot(lot_id)
        failed = [row for row in payload["results"] if row["result_status"] in {"Failed", "Rejected"}]
        for row in payload["results"]:
            self.repo.add(self.repo.inspection_results, {"inspection_lot_id": lot_id, "inspected_at": datetime.utcnow().isoformat(), **payload, **row}, "insp-result")
        if failed:
            lot["status"] = "Failed"
            decision = self.failure_decision(lot, failed)
            self.apply_failure_decision(lot, decision, failed)
            self.create_notification("Inspection failed", lot_id, "Inspection failed and quality action was created.")
        else:
            lot["status"] = "Passed"
            self.create_notification("Quality release approved", lot_id, "Inspection passed.")
        return {"inspection_lot": self.repo.snapshot(lot), "failed_items": failed}

    def approve_lot(self, lot_id: str) -> dict[str, Any]:
        lot = self.lot(lot_id)
        lot["status"] = "Approved"
        self.repo.add(self.repo.approvals, {"source_type": "Inspection Lot", "source_id": lot_id, "action": "Approve inspection", "status": "Approved"}, "q-approval")
        return self.repo.snapshot(lot)

    def reject_lot(self, lot_id: str) -> dict[str, Any]:
        lot = self.lot(lot_id)
        lot["status"] = "Rejected"
        return self.repo.snapshot(lot)

    def release_quarantine(self, quarantine_id: str, released_by: str = "qa-manager") -> dict[str, Any]:
        record = self.repo.get(self.repo.quarantine, quarantine_id)
        if not record:
            raise KeyError(quarantine_id)
        record["status"] = "Released"
        record["released_by"] = released_by
        self.repo.add(self.repo.approvals, {"source_type": "Quarantine", "source_id": quarantine_id, "action": "Approve quarantine release", "status": "Approved"}, "q-approval")
        return self.repo.snapshot(record)

    def failure_decision(self, lot: dict[str, Any], failed: list[dict[str, Any]]) -> str:
        if any(row.get("defect_code") == "CRITICAL" for row in failed):
            return "Quarantine"
        if lot.get("supplier_id"):
            return "Quarantine"
        return "Rework"

    def apply_failure_decision(self, lot: dict[str, Any], decision: str, failed: list[dict[str, Any]]) -> None:
        item_id = lot.get("material_id") or lot.get("product_id") or "unknown-item"
        if decision == "Quarantine":
            self.repo.add(self.repo.quarantine, {"item_id": item_id, "batch_id": lot.get("batch_id"), "quantity": lot["quantity"], "source_type": "Inspection Lot", "source_id": lot["id"], "reason": "Inspection failed", "quarantine_location_id": "quarantine-zone-a", "status": "Active", "created_by": "qa-user"}, "quarantine")
            lot["status"] = "Quarantine"
        elif decision == "Rework":
            self.repo.add(self.repo.rework, {"source_inspection_lot_id": lot["id"], "product_id": lot.get("product_id"), "batch_id": lot.get("batch_id"), "quantity": lot["quantity"], "reason": "Inspection failed", "assigned_to": None, "status": "Open", "rework_cost": 0, "reinspection_required": True}, "rework")
            lot["status"] = "Rework Required"

    def create_defect(self, payload: dict[str, Any]) -> dict[str, Any]:
        defect = self.repo.add(self.repo.defects, payload, "defect")
        if payload["severity"] == "Critical":
            self.create_task("Investigate defect", defect["id"], "Critical defect requires investigation.")
            self.create_notification("Critical defect found", defect["id"], "Critical defect captured.")
        return defect

    def create_capa(self, payload: dict[str, Any]) -> dict[str, Any]:
        capa = self.repo.add(self.repo.capa, payload, "capa")
        self.create_task("Complete CAPA", capa["id"], "CAPA assigned.")
        self.create_notification("CAPA assigned", capa["id"], "CAPA is assigned.")
        return capa

    def kpis(self) -> dict[str, Any]:
        inspected = max(len(self.repo.inspection_lots), 1)
        failed = len([lot for lot in self.repo.inspection_lots if lot["status"] in {"Failed", "Quarantine", "Rejected", "Scrapped"}])
        defect_qty = sum(defect["quantity_affected"] for defect in self.repo.defects)
        total_qty = sum(lot["quantity"] for lot in self.repo.inspection_lots) or 1
        rework_qty = sum(row["quantity"] for row in self.repo.rework)
        scrap_qty = sum(row["quantity"] for row in self.repo.scrap)
        capa_days = [10 for capa in self.repo.capa if capa["status"] == "Closed"] or [0]
        copq = self.costing()["cost_of_poor_quality"]
        return {
            "first_pass_yield": round((inspected - failed) / inspected * 100, 2),
            "defect_rate": round(defect_qty / total_qty * 100, 2),
            "rework_rate": round(rework_qty / total_qty * 100, 2),
            "scrap_rate": round(scrap_qty / total_qty * 100, 2),
            "supplier_rejection_rate": round(mean([m["incoming_rejection_rate"] for m in self.repo.supplier_metrics]), 2),
            "customer_return_rate": len(self.repo.customer_returns),
            "capa_closure_time_days": round(mean(capa_days), 2),
            "cost_of_poor_quality": copq,
        }

    def reports(self) -> dict[str, Any]:
        return {
            "inspection_report": self.repo.snapshot(self.repo.inspection_lots),
            "defect_report": self.repo.snapshot(self.repo.defects),
            "quarantine_report": self.repo.snapshot(self.repo.quarantine),
            "rework_report": self.repo.snapshot(self.repo.rework),
            "rejection_report": self.repo.snapshot(self.repo.rejections),
            "scrap_report": self.repo.snapshot(self.repo.scrap),
            "capa_report": self.repo.snapshot(self.repo.capa),
            "supplier_quality_report": self.repo.snapshot(self.repo.supplier_metrics),
            "production_quality_report": self.repo.snapshot(self.repo.production_metrics),
            "customer_return_quality_report": self.repo.snapshot(self.repo.customer_returns),
            "cost_of_poor_quality_report": self.costing(),
        }

    def costing(self) -> dict[str, Any]:
        inspection_cost = len(self.repo.inspection_lots) * 350
        rework_cost = sum(row["rework_cost"] for row in self.repo.rework)
        scrap_cost = sum(row["estimated_loss"] for row in self.repo.scrap)
        rejection_cost = sum(row["cost_impact"] for row in self.repo.rejections)
        supplier_cost = sum(metric["incoming_rejection_rate"] * 1000 for metric in self.repo.supplier_metrics)
        customer_cost = len(self.repo.customer_returns) * 5000
        return {"inspection_cost": inspection_cost, "rework_cost": rework_cost, "scrap_cost": scrap_cost, "rejection_cost": rejection_cost, "supplier_quality_cost": supplier_cost, "customer_return_cost": customer_cost, "cost_of_poor_quality": round(inspection_cost + rework_cost + scrap_cost + rejection_cost + supplier_cost + customer_cost, 2)}

    def risk_center(self) -> dict[str, Any]:
        risks = []
        if len(self.repo.defects) >= 1:
            risks.append({"risk": "Defect increase", "severity": "MEDIUM"})
        for metric in self.repo.supplier_metrics:
            if metric["incoming_rejection_rate"] > 2:
                risks.append({"risk": "Supplier quality risk", "supplier_id": metric["supplier_id"], "severity": "HIGH"})
        for metric in self.repo.production_metrics:
            if metric["defect_rate"] > 3:
                risks.append({"risk": "Production line quality risk", "line": metric["line"], "severity": "MEDIUM"})
        if any(capa["due_date"] < str(date.today()) and capa["status"] != "Closed" for capa in self.repo.capa):
            risks.append({"risk": "CAPA overdue risk", "severity": "HIGH"})
        return {"risks": risks, "ai_safety": self.ai_safety()}

    def defect_prediction(self) -> dict[str, Any]:
        return {"defect_risk_score": 72, "risk_level": "HIGH", "possible_cause": "Supplier batch and visual defect trend", "recommended_action": "Create supplier quality review and tighten inspection."}

    def trends(self) -> dict[str, Any]:
        return {"defect_trend": "Increasing", "rework_trend": "Stable", "scrap_trend": "Stable", "supplier_degradation": self.repo.snapshot(self.repo.supplier_metrics), "machine_quality_deterioration": [], "shift_quality_issues": self.repo.snapshot(self.repo.production_metrics)}

    def supplier_risk(self) -> dict[str, Any]:
        return {"supplier_quality_risks": [{"supplier_id": m["supplier_id"], "risk_score": round(m["incoming_rejection_rate"] * 20, 2), "recommended_supplier_review": True, "recommended_backup_supplier": "supplier-mech"} for m in self.repo.supplier_metrics]}

    def production_risk(self) -> dict[str, Any]:
        return {"production_quality_risks": self.repo.snapshot(self.repo.production_metrics), "example": "LINE-A has elevated defect rate during Morning shift."}

    def root_cause_ai(self) -> dict[str, Any]:
        return {"likely_root_causes": ["Supplier material surface handling", "Incoming packaging damage", "Process handling"], "evidence": self.repo.snapshot(self.repo.defects), "recommended_investigation_tasks": ["Review supplier batch", "Inspect warehouse handling", "Audit receiving process"]}

    def cost_risk(self) -> dict[str, Any]:
        cost = self.costing()
        return {"high_cost_of_poor_quality": cost["cost_of_poor_quality"] > 5000, "expensive_rework": cost["rework_cost"], "high_scrap_cost": cost["scrap_cost"], "low_quality_supplier_cost_impact": cost["supplier_quality_cost"], "machine_caused_quality_losses": []}

    def draft_action(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self.repo.add(self.repo.recommendations, {**payload, "status": "DRAFT", "requires_human_approval": True, "ai_safety": self.ai_safety()}, "q-draft")

    def ai_safety(self) -> dict[str, list[str]]:
        return {"can": ["Analyze", "Recommend", "Create Drafts"], "cannot": ["Approve Release", "Scrap Inventory", "Release Quarantine", "Close CAPA", "Reject Supplier", "Dispatch Affected Goods"]}

    def create_task(self, task_type: str, source_id: str, message: str) -> dict[str, Any]:
        return self.repo.add(self.repo.tasks, {"task_type": task_type, "source_id": source_id, "message": message, "status": "OPEN"}, "q-task")

    def create_notification(self, notification_type: str, source_id: str, message: str) -> dict[str, Any]:
        return self.repo.add(self.repo.notifications, {"notification_type": notification_type, "source_id": source_id, "message": message, "status": "READY_TO_SEND"}, "q-notify")

    def lot(self, lot_id: str) -> dict[str, Any]:
        lot = self.repo.get(self.repo.inspection_lots, lot_id)
        if not lot:
            raise KeyError(lot_id)
        return lot


quality_service = QualityService()
