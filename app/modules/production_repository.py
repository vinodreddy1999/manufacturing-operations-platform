from __future__ import annotations

from copy import deepcopy
from datetime import date, datetime, time
from typing import Any
from uuid import uuid4


class ProductionRepository:
    def __init__(self) -> None:
        self.products = [
            {
                "id": "prod-pump-900",
                "product_code": "FG-PUMP-900",
                "product_name": "Hydraulic Pump 900",
                "product_type": "Finished Product",
                "unit_of_measure": "EA",
                "category": "Hydraulics",
                "default_bom_id": "bom-pump-900",
                "default_routing_id": "routing-pump-900",
                "quality_required": True,
                "active_status": True,
            },
            {
                "id": "prod-gear-sub",
                "product_code": "SF-GEAR-SUB",
                "product_name": "Gear Sub Assembly",
                "product_type": "Sub Assembly",
                "unit_of_measure": "EA",
                "category": "Gearbox",
                "default_bom_id": "bom-gear-sub",
                "default_routing_id": "routing-gear-sub",
                "quality_required": True,
                "active_status": True,
            },
        ]
        self.boms = [
            {
                "id": "bom-pump-900",
                "bom_code": "BOM-PUMP-900",
                "product_id": "prod-pump-900",
                "version_number": 1,
                "status": "Active",
                "approval_workflow": {"status": "Approved", "approved_by": "production-manager"},
                "items": [
                    {
                        "id": "bom-item-steel",
                        "material_item": "item-steel",
                        "quantity_required": 12,
                        "uom": "KG",
                        "scrap_allowance_percent": 3,
                        "substitute_allowed": False,
                        "critical_material": True,
                        "consumption_type": "Backflush",
                    },
                    {
                        "id": "bom-item-bearing",
                        "material_item": "item-bearing",
                        "quantity_required": 2,
                        "uom": "EA",
                        "scrap_allowance_percent": 1,
                        "substitute_allowed": True,
                        "critical_material": True,
                        "consumption_type": "Auto",
                    },
                ],
            }
        ]
        self.routing = [
            {
                "id": "routing-pump-900",
                "routing_code": "ROUTE-PUMP-900",
                "product_id": "prod-pump-900",
                "version_number": 1,
                "active_status": True,
                "operations": [
                    {
                        "id": "op-cutting",
                        "operation_name": "Cutting",
                        "sequence_number": 10,
                        "work_center": "WC-CUT-01",
                        "production_line": "LINE-A",
                        "setup_time": 30,
                        "run_time": 4,
                        "labor_requirement": 2,
                        "machine_requirement": "M-CUT-01",
                        "quality_check_required": False,
                    },
                    {
                        "id": "op-assembly",
                        "operation_name": "Assembly",
                        "sequence_number": 20,
                        "work_center": "WC-ASM-01",
                        "production_line": "LINE-A",
                        "setup_time": 45,
                        "run_time": 8,
                        "labor_requirement": 4,
                        "machine_requirement": "M-ASM-01",
                        "quality_check_required": True,
                    },
                ],
            }
        ]
        self.work_centers = [
            {
                "id": "wc-asm-01",
                "work_center_code": "WC-ASM-01",
                "work_center_name": "Assembly Work Center",
                "plant": "Hyderabad Plant",
                "department": "Production",
                "capacity_per_hour": 25,
                "operating_calendar": "Default",
                "active_status": True,
            }
        ]
        self.production_lines = [
            {
                "id": "line-a",
                "line_code": "LINE-A",
                "line_name": "Main Assembly Line A",
                "plant": "Hyderabad Plant",
                "department": "Production",
                "capacity": 180,
                "shift_calendar": "Three Shift",
                "status": "Active",
            }
        ]
        self.machines = [
            {"id": "machine-cut-01", "machine_id": "M-CUT-01", "machine_name": "CNC Cutter 01", "machine_status": "Available", "runtime": 420, "downtime": 18, "capacity": 40},
            {"id": "machine-asm-01", "machine_id": "M-ASM-01", "machine_name": "Assembly Press 01", "machine_status": "Available", "runtime": 380, "downtime": 42, "capacity": 25},
        ]
        self.orders = [
            {
                "id": "po-demo-001",
                "production_order_number": "MO-1001",
                "company": "Precision Components Ltd",
                "plant": "Hyderabad Plant",
                "product_id": "prod-pump-900",
                "bom_version": "bom-pump-900",
                "routing_version": "routing-pump-900",
                "target_quantity": 120,
                "planned_start_date": str(date.today()),
                "planned_end_date": str(date.today()),
                "priority": "HIGH",
                "assigned_line": "LINE-A",
                "assigned_work_center": "WC-ASM-01",
                "source": "Sales Demand",
                "status": "Scheduled",
            }
        ]
        self.approval_rules = [{"id": "approval-high-value", "name": "High value production approval", "quantity_threshold": 500, "material_value_threshold": 100000, "priorities": ["HIGH", "CRITICAL"]}]
        self.shifts = [
            {"id": "shift-morning", "shift_name": "Morning Shift", "start_time": str(time(6, 0)), "end_time": str(time(14, 0))},
            {"id": "shift-evening", "shift_name": "Evening Shift", "start_time": str(time(14, 0)), "end_time": str(time(22, 0))},
            {"id": "shift-night", "shift_name": "Night Shift", "start_time": str(time(22, 0)), "end_time": str(time(6, 0))},
        ]
        self.inventory = {"item-steel": 900, "item-bearing": 160}
        self.incoming_inventory = {"item-steel": 600, "item-bearing": 40}
        self.supplier_lead_time_days = {"item-steel": 12, "item-bearing": 5}
        self.reservations = []
        self.requirements = []
        self.schedules = []
        self.logs = []
        self.downtime_events = []
        self.wip = []
        self.losses = []
        self.consumption = []
        self.costing = []
        self.variances = []
        self.tasks = []
        self.notifications = []

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

    def delete(self, collection: list[dict[str, Any]], record_id: str) -> dict[str, Any]:
        record = self.get(collection, record_id)
        if not record:
            raise KeyError(record_id)
        collection.remove(record)
        return self.snapshot(record)


production_repo = ProductionRepository()
