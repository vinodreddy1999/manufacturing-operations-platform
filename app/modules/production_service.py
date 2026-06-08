from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Any

from .production_repository import ProductionRepository, production_repo


class ProductionService:
    def __init__(self, repo: ProductionRepository = production_repo) -> None:
        self.repo = repo

    def dashboard(self) -> dict[str, Any]:
        active_orders = [order for order in self.repo.orders if order["status"] in {"Scheduled", "In Progress", "Material Reserved"}]
        at_risk = self.risk_center()["risks"]
        planned = sum(log["planned_output"] for log in self.repo.logs) or sum(order["target_quantity"] for order in active_orders)
        actual = sum(log["actual_output"] for log in self.repo.logs)
        return {
            "active_orders": len(active_orders),
            "orders_at_risk": len(at_risk),
            "material_shortages": self.material_bottlenecks()["shortage_materials"],
            "line_utilization": self.capacity_utilization(),
            "machine_downtime_minutes": sum(event["duration_minutes"] for event in self.repo.downtime_events),
            "shift_output": self.shift_output(),
            "planned_vs_actual": {"planned": planned, "actual": actual, "variance": actual - planned},
            "wip": self.repo.snapshot(self.repo.wip),
            "completed_orders": [order for order in self.repo.orders if order["status"] in {"Completed", "Closed"}],
        }

    def approve_bom(self, bom_id: str) -> dict[str, Any]:
        bom = self.repo.get(self.repo.boms, bom_id)
        if not bom:
            raise KeyError(bom_id)
        bom["status"] = "Approved"
        bom["approval_workflow"] = {"status": "Approved", "approved_by": "production-manager", "approved_at": datetime.utcnow().isoformat()}
        return self.repo.snapshot(bom)

    def material_requirements(self, order_id: str) -> list[dict[str, Any]]:
        order = self._order(order_id)
        bom = self._bom(order["bom_version"])
        requirements = []
        for item in bom["items"]:
            required = order["target_quantity"] * item["quantity_required"] * (1 + item["scrap_allowance_percent"] / 100)
            available = self.repo.inventory.get(item["material_item"], 0)
            shortage = max(required - available, 0)
            requirements.append(
                {
                    "production_order_id": order_id,
                    "material_item": item["material_item"],
                    "required_quantity": round(required, 3),
                    "available_quantity": available,
                    "shortage_quantity": round(shortage, 3),
                    "critical_material": item["critical_material"],
                    "consumption_type": item["consumption_type"],
                }
            )
        self.repo.requirements = [row for row in self.repo.requirements if row["production_order_id"] != order_id] + requirements
        return self.repo.snapshot(requirements)

    def reserve_materials(self, order_id: str) -> dict[str, Any]:
        requirements = self.material_requirements(order_id)
        reservations = []
        for requirement in requirements:
            reserved = min(requirement["required_quantity"], requirement["available_quantity"])
            shortage = max(requirement["required_quantity"] - reserved, 0)
            reservations.append(
                {
                    "id": f"reservation-{order_id}-{requirement['material_item']}",
                    "production_order_id": order_id,
                    "material_item": requirement["material_item"],
                    "required_quantity": requirement["required_quantity"],
                    "available_quantity": requirement["available_quantity"],
                    "reserved_quantity": reserved,
                    "shortage_quantity": shortage,
                    "reservation_status": "PARTIAL" if shortage else "RESERVED",
                }
            )
        self.repo.reservations = [row for row in self.repo.reservations if row["production_order_id"] != order_id] + reservations
        order = self._order(order_id)
        order["status"] = "Material Shortage" if any(row["shortage_quantity"] > 0 for row in reservations) else "Material Reserved"
        return {"production_order": self.repo.snapshot(order), "reservations": self.repo.snapshot(reservations)}

    def time_aware_material_plan(self, order_id: str) -> dict[str, Any]:
        order = self._order(order_id)
        requirements = self.material_requirements(order_id)
        lines = []
        for requirement in requirements:
            incoming = self.repo.incoming_inventory.get(requirement["material_item"], 0)
            lead_time = self.repo.supplier_lead_time_days.get(requirement["material_item"], 0)
            total_available_by_start = requirement["available_quantity"] + incoming
            procurement_required = total_available_by_start < requirement["required_quantity"]
            lines.append(
                {
                    **requirement,
                    "incoming_quantity": incoming,
                    "supplier_lead_time_days": lead_time,
                    "can_produce": total_available_by_start >= requirement["required_quantity"],
                    "partial_shortage": requirement["shortage_quantity"] > 0,
                    "expected_delay_days": lead_time if procurement_required else 0,
                    "procurement_required": procurement_required,
                }
            )
        return {
            "production_order_id": order_id,
            "planned_start_date": order["planned_start_date"],
            "planned_end_date": order["planned_end_date"],
            "can_produce": all(line["can_produce"] for line in lines),
            "materials": lines,
        }

    def schedule(self, payload: dict[str, Any]) -> dict[str, Any]:
        order = self._order(payload["production_order_id"])
        conflicts = self.detect_conflicts(payload)
        schedule = self.repo.add(self.repo.schedules, {**payload, "conflicts": conflicts, "status": "CONFLICT" if conflicts else "SCHEDULED"}, "schedule")
        order["status"] = "On Hold" if conflicts else "Scheduled"
        return schedule

    def detect_conflicts(self, payload: dict[str, Any]) -> list[dict[str, Any]]:
        conflicts = []
        line = next((line for line in self.repo.production_lines if line["id"] == payload["line_id"] or line["line_code"] == payload["line_id"]), None)
        work_center = next((wc for wc in self.repo.work_centers if wc["id"] == payload["work_center_id"] or wc["work_center_code"] == payload["work_center_id"]), None)
        if line and line["status"] != "Active":
            conflicts.append({"type": "Line Availability", "severity": "HIGH", "message": f"{line['line_code']} is {line['status']}"})
        if work_center and not work_center["active_status"]:
            conflicts.append({"type": "Capacity Conflict", "severity": "HIGH", "message": f"{work_center['work_center_code']} is inactive"})
        for machine in self.repo.machines:
            if machine["machine_status"] in {"Maintenance", "Unavailable"}:
                conflicts.append({"type": "Machine Maintenance Conflict", "severity": "MEDIUM", "message": f"{machine['machine_id']} is {machine['machine_status']}"})
        if not self.time_aware_material_plan(payload["production_order_id"])["can_produce"]:
            conflicts.append({"type": "Inventory Conflict", "severity": "HIGH", "message": "Material shortages exist before planned start"})
        return conflicts

    def consume_material(self, payload: dict[str, Any]) -> dict[str, Any]:
        variance = payload["consumed_quantity"] - payload["expected_quantity"]
        record = self.repo.add(self.repo.consumption, {**payload, "variance_quantity": variance}, "consume")
        if abs(variance) > payload["expected_quantity"] * 0.05:
            self.repo.add(
                self.repo.variances,
                {
                    "production_order_id": payload["production_order_id"],
                    "variance_type": "BOM Consumption",
                    "expected_value": payload["expected_quantity"],
                    "actual_value": payload["consumed_quantity"],
                    "variance_value": variance,
                    "approval_required": True,
                },
                "variance",
            )
        return record

    def complete_order(self, payload: dict[str, Any]) -> dict[str, Any]:
        order = self._order(payload["production_order_id"])
        order["status"] = "Quality Pending" if payload["trigger_quality_workflow"] else "Completed"
        variance = payload["accepted_quantity"] + payload["rejected_quantity"] - order["target_quantity"]
        cost = self.calculate_cost(payload["production_order_id"], payload["accepted_quantity"] or 1)
        completion = {
            "production_order": self.repo.snapshot(order),
            "final_output_quantity": payload["final_output_quantity"],
            "accepted_quantity": payload["accepted_quantity"],
            "rejected_quantity": payload["rejected_quantity"],
            "unused_reservations_released": True,
            "variance_quantity": variance,
            "costing": cost,
            "quality_workflow_triggered": payload["trigger_quality_workflow"],
        }
        return completion

    def calculate_cost(self, order_id: str, output_quantity: float | None = None) -> dict[str, Any]:
        order = self._order(order_id)
        quantity = output_quantity or order["target_quantity"]
        material_cost = quantity * 720
        machine_cost = quantity * 95
        labor_cost = quantity * 140
        overhead_cost = quantity * 60
        wastage_cost = sum(loss["quantity"] for loss in self.repo.losses if loss["production_order_id"] == order_id) * 55
        rework_cost = sum(loss["quantity"] for loss in self.repo.losses if loss["production_order_id"] == order_id and loss["loss_type"] == "Rework") * 120
        total = material_cost + machine_cost + labor_cost + overhead_cost + wastage_cost + rework_cost
        costing = {
            "production_order_id": order_id,
            "material_cost": material_cost,
            "machine_cost": machine_cost,
            "labor_cost": labor_cost,
            "overhead_cost": overhead_cost,
            "wastage_cost": wastage_cost,
            "rework_cost": rework_cost,
            "cost_per_unit": round(total / max(quantity, 1), 2),
        }
        self.repo.costing = [row for row in self.repo.costing if row["production_order_id"] != order_id] + [costing]
        return self.repo.snapshot(costing)

    def reports(self) -> dict[str, Any]:
        return {
            "production_order_report": self.repo.snapshot(self.repo.orders),
            "daily_production_report": self.repo.snapshot(self.repo.logs),
            "shift_report": self.shift_output(),
            "material_consumption_report": self.repo.snapshot(self.repo.consumption),
            "bom_variance_report": self.repo.snapshot(self.repo.variances),
            "downtime_report": self.repo.snapshot(self.repo.downtime_events),
            "capacity_utilization_report": self.capacity_utilization(),
            "wip_report": self.repo.snapshot(self.repo.wip),
            "production_cost_report": self.repo.snapshot(self.repo.costing),
        }

    def create_task(self, task_type: str, order_id: str, message: str) -> dict[str, Any]:
        return self.repo.add(self.repo.tasks, {"task_type": task_type, "production_order_id": order_id, "message": message, "status": "OPEN"}, "task")

    def create_notification(self, notification_type: str, order_id: str, message: str) -> dict[str, Any]:
        return self.repo.add(self.repo.notifications, {"notification_type": notification_type, "production_order_id": order_id, "message": message, "status": "READY_TO_SEND"}, "notification")

    def risk_center(self) -> dict[str, Any]:
        risks = []
        for order in self.repo.orders:
            plan = self.time_aware_material_plan(order["id"])
            if not plan["can_produce"]:
                risks.append({"production_order_id": order["id"], "risk": "Material Shortage Risk", "severity": "HIGH"})
            if order["priority"] in {"HIGH", "CRITICAL"} and order["status"] in {"On Hold", "Material Shortage"}:
                risks.append({"production_order_id": order["id"], "risk": "Deadline Risk", "severity": "HIGH"})
        if any(machine["downtime"] > 40 for machine in self.repo.machines):
            risks.append({"risk": "Downtime Risk", "severity": "MEDIUM", "machine_ids": [machine["machine_id"] for machine in self.repo.machines if machine["downtime"] > 40]})
        return {"risks": risks, "ai_safety": "Recommendations only. No schedule, inventory, order close, or approval action is executed automatically."}

    def delay_prediction(self) -> dict[str, Any]:
        delayed = []
        for order in self.repo.orders:
            plan = self.time_aware_material_plan(order["id"])
            delay_days = max((line["expected_delay_days"] for line in plan["materials"]), default=0)
            if delay_days:
                delayed.append({"production_order_id": order["id"], "delay_duration_days": delay_days, "root_cause": "Material procurement lead time"})
        return {"delayed_orders": delayed}

    def material_bottlenecks(self) -> dict[str, Any]:
        shortages = []
        for order in self.repo.orders:
            for requirement in self.material_requirements(order["id"]):
                if requirement["shortage_quantity"] > 0:
                    shortages.append(requirement)
        return {"shortage_materials": shortages, "delayed_materials": [], "quality_hold_materials": []}

    def capacity_optimization(self) -> dict[str, Any]:
        best_line = max(self.repo.production_lines, key=lambda line: line["capacity"])
        best_work_center = max(self.repo.work_centers, key=lambda wc: wc["capacity_per_hour"])
        return {"better_line": best_line, "better_work_center": best_work_center, "recommendation": "Use highest-capacity active resources for urgent orders."}

    def schedule_optimization(self) -> dict[str, Any]:
        orders = sorted(self.repo.orders, key=lambda order: (order["priority"] != "CRITICAL", order["planned_end_date"]))
        return {"best_sequence": [order["production_order_number"] for order in orders], "lowest_changeover": "Group by routing version", "capacity_balanced_schedule": "Balance high-run-time orders across active lines."}

    def what_if(self, payload: dict[str, Any]) -> dict[str, Any]:
        demand_multiplier = 1 + payload.get("production_increase_percent", 0) / 100
        increased_materials = []
        for order in self.repo.orders:
            for requirement in self.material_requirements(order["id"]):
                increased_materials.append({**requirement, "what_if_required_quantity": round(requirement["required_quantity"] * demand_multiplier, 3)})
        return {
            "production_increase_percent": payload.get("production_increase_percent", 0),
            "unavailable_machine_id": payload.get("unavailable_machine_id"),
            "supplier_delay_days": payload.get("supplier_delay_days", 0),
            "impact_analysis": {
                "material_requirements": increased_materials,
                "machine_impact": "Capacity conflict likely" if payload.get("unavailable_machine_id") else "No machine outage selected",
                "supplier_impact": f"Expected delivery slip of {payload.get('supplier_delay_days', 0)} days",
            },
        }

    def bom_variance_ai(self) -> dict[str, Any]:
        repeated = [variance for variance in self.repo.variances if variance["approval_required"]]
        return {"excess_material_usage": repeated, "repeated_variances": repeated}

    def downtime_impact_ai(self) -> dict[str, Any]:
        total_minutes = sum(event["duration_minutes"] for event in self.repo.downtime_events)
        return {"cost_impact": total_minutes * 25, "output_impact": round(total_minutes / 60 * 20, 2), "delivery_impact": "MEDIUM" if total_minutes else "LOW"}

    def production_cost_ai(self) -> dict[str, Any]:
        risks = [cost for cost in self.repo.costing if cost["cost_per_unit"] > 1100]
        return {"cost_overrun": risks, "high_waste": self.repo.snapshot(self.repo.losses), "low_margin_orders": risks}

    def draft_actions(self) -> dict[str, Any]:
        return {
            "drafts": [
                {"type": "Procurement Request", "status": "DRAFT", "requires_human_approval": True},
                {"type": "Reschedule Request", "status": "DRAFT", "requires_human_approval": True},
                {"type": "Investigation Task", "status": "DRAFT", "requires_human_approval": True},
                {"type": "Delay Alert", "status": "DRAFT", "requires_human_approval": True},
            ],
            "ai_safety": {"can": ["Analyze", "Recommend", "Create Drafts"], "cannot": ["Change Schedule", "Consume Inventory", "Close Orders", "Approve Orders"]},
        }

    def capacity_utilization(self) -> dict[str, Any]:
        return {line["line_code"]: round(min(sum(order["target_quantity"] for order in self.repo.orders if order["assigned_line"] == line["line_code"]) / max(line["capacity"], 1) * 100, 100), 2) for line in self.repo.production_lines}

    def shift_output(self) -> dict[str, float]:
        output: dict[str, float] = {}
        for log in self.repo.logs:
            output[log["shift"]] = output.get(log["shift"], 0) + log["actual_output"]
        return output

    def _order(self, order_id: str) -> dict[str, Any]:
        order = self.repo.get(self.repo.orders, order_id)
        if not order:
            raise KeyError(order_id)
        return order

    def _bom(self, bom_id: str) -> dict[str, Any]:
        bom = self.repo.get(self.repo.boms, bom_id)
        if not bom:
            raise KeyError(bom_id)
        return bom


production_service = ProductionService()
