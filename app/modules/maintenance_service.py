from __future__ import annotations

from datetime import date, datetime
from statistics import mean
from typing import Any

from .maintenance_repository import MaintenanceRepository, maintenance_repo


class MaintenanceService:
    def __init__(self, repo: MaintenanceRepository = maintenance_repo) -> None:
        self.repo = repo

    def dashboard(self) -> dict[str, Any]:
        open_orders = [wo for wo in self.repo.work_orders if wo["status"] not in {"Closed", "Cancelled"}]
        overdue = self.overdue_plans()
        breakdown = [machine for machine in self.repo.machines if machine["status"] == "Breakdown" or machine["status"] == "Under Maintenance"]
        return {
            "open_work_orders": len(open_orders),
            "overdue_maintenance": overdue,
            "machines_under_breakdown": breakdown,
            "critical_machine_risks": [score for score in self.health_scores()["scores"] if score["risk_level"] in {"HIGH", "CRITICAL"}],
            "spare_shortages": self.spare_prediction()["critical_spare_shortage"],
            "mttr_minutes": self.mttr()["overall_mttr_minutes"],
            "mtbf_hours": self.mtbf()["overall_mtbf_hours"],
            "downtime_by_machine": self.downtime_by_machine(),
            "maintenance_cost": self.cost_report()["total_cost"],
            "upcoming_maintenance": [plan for plan in self.repo.plans if plan["active_status"]],
        }

    def create_machine(self, payload: dict[str, Any]) -> dict[str, Any]:
        capabilities = payload.pop("capabilities")
        machine = self.repo.add(self.repo.machines, payload, "maint-machine")
        self.repo.add(self.repo.capabilities, {"machine_id": machine["machine_id"], **capabilities}, "cap")
        self.add_history(machine["machine_id"], "Installed", {"machine_name": machine["machine_name"]})
        return {**machine, "capabilities": capabilities}

    def update_machine(self, machine_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        payload = payload.copy()
        capabilities = payload.pop("capabilities")
        machine = self.repo.update(self.repo.machines, machine_id, payload)
        capability = self.repo.get(self.repo.capabilities, machine["machine_id"], key="machine_id")
        if capability:
            capability.update(capabilities)
        self.add_history(machine["machine_id"], "Machine status changed", {"status": machine["status"]})
        return {**machine, "capabilities": capabilities}

    def approval_model(self, work_order: dict[str, Any]) -> str:
        machine = self.machine_by_machine_id(work_order["machine_id"])
        if work_order["category"] == "Emergency":
            return "Post Review Required"
        if work_order.get("compliance_required"):
            return "Approval Required"
        if machine["criticality"] in {"High", "Critical"} and work_order.get("estimated_cost", 0) > 10000:
            return "Approval Required"
        if work_order.get("production_impact") in {"HIGH", "CRITICAL"}:
            return "Approval Required"
        return "Not Required"

    def create_work_order(self, payload: dict[str, Any]) -> dict[str, Any]:
        payload["approval_status"] = self.approval_model(payload)
        if payload["approval_status"] == "Approval Required":
            payload["status"] = "Waiting For Approval"
        if payload["category"] == "Emergency":
            payload["status"] = "Open"
        work_order = self.repo.add(self.repo.work_orders, payload, "wo")
        self.add_history(payload["machine_id"], "Work order created", {"work_order_id": work_order["id"], "category": payload["category"]})
        self.create_task("Approve maintenance" if payload["approval_status"] == "Approval Required" else "Perform maintenance", work_order["id"], "Maintenance work order created.")
        self.create_notification("Breakdown reported" if payload["category"] == "Emergency" else "Maintenance due", work_order["id"], "Maintenance work order is ready.")
        return work_order

    def assign_work_order(self, work_order_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        work_order = self.work_order(work_order_id)
        work_order["assigned_to"] = payload.get("assigned_user_id") or payload.get("assigned_team_id") or payload.get("vendor_id")
        work_order["status"] = "Assigned"
        assignment = self.repo.add(self.repo.assignments, {"work_order_id": work_order_id, **payload}, "assign")
        return {"work_order": self.repo.snapshot(work_order), "assignment": assignment}

    def start_work_order(self, work_order_id: str) -> dict[str, Any]:
        work_order = self.work_order(work_order_id)
        work_order["status"] = "In Progress"
        work_order["actual_start"] = datetime.utcnow().isoformat()
        machine = self.machine_by_machine_id(work_order["machine_id"])
        machine["status"] = "Under Maintenance"
        self.add_history(work_order["machine_id"], "Maintenance started", {"work_order_id": work_order_id})
        return self.repo.snapshot(work_order)

    def complete_work_order(self, work_order_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        work_order = self.work_order(work_order_id)
        work_order["root_cause"] = payload["root_cause"]
        work_order["closure_notes"] = payload["closure_notes"]
        work_order["actual_end"] = (payload.get("actual_end") or datetime.utcnow()).isoformat()
        work_order["status"] = "Pending Review" if work_order["approval_status"] == "Post Review Required" else "Completed"
        machine = self.machine_by_machine_id(work_order["machine_id"])
        machine["status"] = "Pending Validation" if payload.get("quality_validation_required") else "Active"
        for spare in payload.get("spare_parts_used", []):
            self.consume_spare(work_order_id, spare["spare_part_id"], spare.get("quantity", 1), spare.get("cost", 0))
        self.calculate_cost(work_order_id)
        self.add_history(work_order["machine_id"], "Maintenance performed", {"work_order_id": work_order_id, "status": work_order["status"]})
        self.create_notification("Maintenance completed", work_order_id, "Maintenance completion captured.")
        return self.repo.snapshot(work_order)

    def close_work_order(self, work_order_id: str) -> dict[str, Any]:
        work_order = self.work_order(work_order_id)
        if work_order["status"] not in {"Completed", "Pending Review"}:
            raise ValueError("Work order must be completed before close.")
        work_order["status"] = "Closed"
        self.create_task("Close work order", work_order_id, "Work order closed with audit trail.")
        return self.repo.snapshot(work_order)

    def reserve_spare(self, payload: dict[str, Any]) -> dict[str, Any]:
        available = self.repo.spare_stock.get(payload["spare_part_id"], 0)
        reserved = min(available, payload["required_quantity"])
        shortage = max(payload["required_quantity"] - available, 0)
        status = "RESERVED" if shortage == 0 else "WAITING_FOR_SPARE"
        reservation = self.repo.add(
            self.repo.spare_reservations,
            {**payload, "available_quantity": available, "reserved_quantity": reserved, "shortage_quantity": shortage, "status": status, "eta": self.repo.incoming_spares.get(payload["spare_part_id"], {}).get("eta")},
            "spare-res",
        )
        if shortage:
            self.create_task("Procure spare", payload["work_order_id"], "Spare unavailable. Procurement recommendation created.")
            self.create_notification("Spare unavailable", payload["work_order_id"], "Critical spare is unavailable.")
        return reservation

    def consume_spare(self, work_order_id: str, spare_part_id: str, quantity: float, cost: float) -> dict[str, Any]:
        current = self.repo.spare_stock.get(spare_part_id, 0)
        self.repo.spare_stock[spare_part_id] = max(current - quantity, 0)
        usage = self.repo.add(self.repo.spare_usage, {"work_order_id": work_order_id, "spare_part_id": spare_part_id, "quantity_used": quantity, "cost": cost}, "spare-use")
        self.add_history(self.work_order(work_order_id)["machine_id"], "Spare replaced", {"spare_part_id": spare_part_id, "quantity": quantity})
        return usage

    def create_downtime(self, payload: dict[str, Any]) -> dict[str, Any]:
        duration = round((payload["end_time"] - payload["start_time"]).total_seconds() / 60, 2)
        event = self.repo.add(self.repo.downtime_events, {**payload, "duration_minutes": duration}, "dt")
        self.add_history(payload["machine_id"], "Downtime recorded", {"duration_minutes": duration, "reason": payload["reason_category"]})
        return event

    def scheduling_conflicts(self, machine_id: str, start_time: datetime, end_time: datetime) -> list[dict[str, Any]]:
        conflicts = []
        machine = self.machine_by_machine_id(machine_id)
        if machine["status"] in {"Breakdown", "Retired"}:
            conflicts.append({"type": "Machine availability", "severity": "HIGH", "message": f"{machine_id} is {machine['status']}"})
        for window in self.repo.shutdown_windows:
            if window.get("machine_id") in {None, machine_id} and start_time < datetime.fromisoformat(window["end_time"]) and end_time > datetime.fromisoformat(window["start_time"]):
                conflicts.append({"type": "Shutdown window", "severity": "LOW", "message": "Schedule is inside approved shutdown window."})
        return conflicts

    def add_history(self, machine_id: str, event_type: str, details: dict[str, Any]) -> dict[str, Any]:
        return self.repo.add(self.repo.history, {"machine_id": machine_id, "event_type": event_type, "event_time": datetime.utcnow().isoformat(), "details": details}, "hist")

    def calculate_cost(self, work_order_id: str) -> dict[str, Any]:
        work_order = self.work_order(work_order_id)
        spare_cost = sum(row["cost"] for row in self.repo.spare_usage if row["work_order_id"] == work_order_id)
        labor_cost = 750 * max((work_order.get("downtime_minutes") or 60) / 60, 1)
        vendor_cost = 5000 if work_order.get("assigned_to", "").startswith("vendor") else 0
        downtime_cost = (work_order.get("downtime_minutes") or 0) * 500
        production_loss_cost = 12000 if work_order.get("production_impact") in {"HIGH", "CRITICAL"} else 0
        total = spare_cost + labor_cost + vendor_cost + downtime_cost + production_loss_cost
        cost = self.repo.add(
            self.repo.costing,
            {"work_order_id": work_order_id, "spare_part_cost": spare_cost, "labor_cost": labor_cost, "vendor_cost": vendor_cost, "downtime_cost": downtime_cost, "production_loss_cost": production_loss_cost, "total_maintenance_cost": total},
            "maint-cost",
        )
        return cost

    def reports(self) -> dict[str, Any]:
        return {
            "maintenance_schedule_report": self.repo.snapshot(self.repo.plans),
            "work_order_report": self.repo.snapshot(self.repo.work_orders),
            "breakdown_report": [wo for wo in self.repo.work_orders if wo["maintenance_type"] == "Breakdown Maintenance"],
            "downtime_report": self.repo.snapshot(self.repo.downtime_events),
            "spare_consumption_report": self.repo.snapshot(self.repo.spare_usage),
            "machine_history_report": self.repo.snapshot(self.repo.history),
            "maintenance_cost_report": self.repo.snapshot(self.repo.costing),
            "mttr_report": self.mttr(),
            "mtbf_report": self.mtbf(),
            "overdue_maintenance_report": self.overdue_plans(),
        }

    def mttr(self) -> dict[str, Any]:
        repair_times = [wo["downtime_minutes"] for wo in self.repo.work_orders if wo.get("downtime_minutes", 0) > 0]
        return {"overall_mttr_minutes": round(mean(repair_times), 2) if repair_times else 0, "repair_count": len(repair_times)}

    def mtbf(self) -> dict[str, Any]:
        failure_count = len([wo for wo in self.repo.work_orders if wo["maintenance_type"] == "Breakdown Maintenance"]) or 1
        runtime = sum(log["runtime_hours"] for log in self.repo.runtime_logs)
        return {"overall_mtbf_hours": round(runtime / failure_count, 2), "failure_count": failure_count}

    def health_scores(self) -> dict[str, Any]:
        scores = []
        for machine in self.repo.machines:
            downtime = sum(row["duration_minutes"] for row in self.repo.downtime_events if row["machine_id"] == machine["machine_id"])
            breakdowns = len([wo for wo in self.repo.work_orders if wo["machine_id"] == machine["machine_id"] and wo["maintenance_type"] == "Breakdown Maintenance"])
            overdue = len([plan for plan in self.overdue_plans() if plan["machine_id"] == machine["machine_id"]])
            critical_penalty = 10 if machine["criticality"] == "Critical" else 0
            score = max(100 - downtime / 10 - breakdowns * 15 - overdue * 20 - critical_penalty, 0)
            if score < 50:
                risk = "CRITICAL"
            elif score < 70:
                risk = "HIGH"
            elif score < 85:
                risk = "MEDIUM"
            else:
                risk = "LOW"
            scores.append({"machine_id": machine["machine_id"], "health_score": round(score, 2), "risk_level": risk, "recommendation": self.health_recommendation(risk)})
        return {"scores": scores}

    def risk_center(self) -> dict[str, Any]:
        risks = []
        for score in self.health_scores()["scores"]:
            if score["risk_level"] in {"HIGH", "CRITICAL"}:
                risks.append({"machine_id": score["machine_id"], "risk": "Failure risk", "severity": score["risk_level"]})
        for plan in self.overdue_plans():
            risks.append({"machine_id": plan["machine_id"], "risk": "Overdue maintenance risk", "severity": "HIGH"})
        for spare in self.spare_prediction()["critical_spare_shortage"]:
            risks.append({"machine_id": spare["machine_id"], "risk": "Spare shortage risk", "severity": "HIGH"})
        if self.cost_report()["total_cost"] > 50000:
            risks.append({"risk": "High maintenance cost risk", "severity": "MEDIUM"})
        return {"risks": risks, "ai_safety": self.ai_safety()}

    def failure_prediction(self) -> dict[str, Any]:
        predictions = []
        for machine in self.repo.machines:
            score = next(row for row in self.health_scores()["scores"] if row["machine_id"] == machine["machine_id"])
            probability = max(100 - score["health_score"], 5)
            predictions.append({"machine_id": machine["machine_id"], "failure_probability": round(probability, 2), "risk_level": score["risk_level"], "recommended_action": score["recommendation"]})
        return {"predictions": predictions}

    def downtime_prediction(self) -> dict[str, Any]:
        return {"future_downtime_risk": self.downtime_by_machine(), "machine_availability_risk": [m for m in self.repo.machines if m["status"] != "Active"], "line_impact": "LINE-A has active maintenance impact"}

    def spare_prediction(self) -> dict[str, Any]:
        shortages = []
        demand = []
        for spare in self.repo.spare_parts:
            available = self.repo.spare_stock.get(spare["spare_part_id"], 0)
            if available <= spare["minimum_stock"]:
                shortages.append({**spare, "available_quantity": available, "reorder_required": True})
            demand.append({"spare_part_id": spare["spare_part_id"], "machine_id": spare["machine_id"], "upcoming_demand": max(spare["minimum_stock"] - available, 0)})
        return {"upcoming_spare_demand": demand, "critical_spare_shortage": shortages, "reorder_requirement": shortages}

    def recommendations(self) -> dict[str, Any]:
        return {
            "recommendations": [
                {"type": "Schedule maintenance earlier", "status": "DRAFT"},
                {"type": "Reserve spare parts", "status": "DRAFT"},
                {"type": "Replace part before failure", "status": "DRAFT"},
                {"type": "Investigate repeated breakdown", "status": "DRAFT"},
                {"type": "Move production to alternate line", "status": "DRAFT"},
            ],
            "ai_safety": self.ai_safety(),
        }

    def root_cause_ai(self) -> dict[str, Any]:
        return {"repeated_failures": self.repo.snapshot(self.repo.work_orders), "downtime_patterns": self.downtime_by_machine(), "likely_root_causes": ["Spindle vibration", "Runtime threshold exceeded", "Critical spare unavailable"]}

    def cost_impact_ai(self) -> dict[str, Any]:
        cost = self.cost_report()
        return {"downtime_cost": sum(row["cost_impact"] for row in self.repo.downtime_events), "maintenance_cost_trend": cost, "high_cost_machine_alerts": [row for row in self.repo.downtime_events if row["cost_impact"] > 25000], "replacement_vs_repair_recommendation": "Review replacement if high-cost alerts repeat 3 times."}

    def draft_action(self, payload: dict[str, Any]) -> dict[str, Any]:
        action = self.repo.add(self.repo.recommendations, {**payload, "status": "DRAFT", "requires_human_approval": True, "ai_safety": self.ai_safety()}, "maint-draft")
        return action

    def cost_report(self) -> dict[str, Any]:
        total = sum(row["total_maintenance_cost"] for row in self.repo.costing) + sum(row["cost_impact"] for row in self.repo.downtime_events)
        return {"total_cost": round(total, 2), "cost_per_machine": self.downtime_by_machine()}

    def downtime_by_machine(self) -> dict[str, float]:
        result: dict[str, float] = {}
        for row in self.repo.downtime_events:
            result[row["machine_id"]] = result.get(row["machine_id"], 0) + row["duration_minutes"]
        return result

    def overdue_plans(self) -> list[dict[str, Any]]:
        today = date.today()
        return [plan for plan in self.repo.plans if date.fromisoformat(plan["next_due_date"]) < today]

    def health_recommendation(self, risk: str) -> str:
        if risk == "CRITICAL":
            return "Create emergency maintenance work order and reserve critical spares."
        if risk == "HIGH":
            return "Schedule maintenance earlier and review downtime root cause."
        if risk == "MEDIUM":
            return "Monitor runtime and prepare spares."
        return "Continue planned maintenance."

    def ai_safety(self) -> dict[str, list[str]]:
        return {
            "can": ["Analyze", "Recommend", "Create Drafts"],
            "cannot": ["Close Work Order", "Approve Maintenance", "Consume Spare", "Change Production Schedule", "Release Machine As Available"],
        }

    def create_task(self, task_type: str, work_order_id: str, message: str) -> dict[str, Any]:
        return self.repo.add(self.repo.tasks, {"task_type": task_type, "work_order_id": work_order_id, "message": message, "status": "OPEN"}, "maint-task")

    def create_notification(self, notification_type: str, work_order_id: str, message: str) -> dict[str, Any]:
        return self.repo.add(self.repo.notifications, {"notification_type": notification_type, "work_order_id": work_order_id, "message": message, "status": "READY_TO_SEND"}, "maint-notify")

    def machine_by_machine_id(self, machine_id: str) -> dict[str, Any]:
        machine = self.repo.get(self.repo.machines, machine_id, key="machine_id")
        if not machine:
            raise KeyError(machine_id)
        return machine

    def machine_record(self, record_id: str) -> dict[str, Any]:
        machine = self.repo.get(self.repo.machines, record_id)
        if not machine:
            raise KeyError(record_id)
        return machine

    def work_order(self, work_order_id: str) -> dict[str, Any]:
        work_order = self.repo.get(self.repo.work_orders, work_order_id)
        if not work_order:
            raise KeyError(work_order_id)
        return work_order


maintenance_service = MaintenanceService()
