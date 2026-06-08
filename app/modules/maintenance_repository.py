from __future__ import annotations

from copy import deepcopy
from datetime import date, datetime, timedelta
from typing import Any
from uuid import uuid4


class MaintenanceRepository:
    def __init__(self) -> None:
        now = datetime.utcnow()
        self.machines = [
            {
                "id": "maint-machine-asm-01",
                "machine_id": "M-ASM-01",
                "machine_code": "ASM-PRESS-01",
                "machine_name": "Assembly Press 01",
                "company_id": "company-c",
                "plant_id": "plant-hyd",
                "department_id": "dept-production",
                "production_line_id": "LINE-A",
                "work_center_id": "WC-ASM-01",
                "machine_type": "Hydraulic Press",
                "manufacturer": "PressMaster",
                "model_number": "PM-900",
                "serial_number": "PM900-7788",
                "installed_date": "2023-01-15",
                "status": "Active",
                "criticality": "Critical",
                "capacity": 25,
                "location": "Plant 1 / Line A / Cell 2",
                "active_status": True,
            },
            {
                "id": "maint-machine-cut-01",
                "machine_id": "M-CUT-01",
                "machine_code": "CNC-CUT-01",
                "machine_name": "CNC Cutter 01",
                "company_id": "company-c",
                "plant_id": "plant-hyd",
                "department_id": "dept-production",
                "production_line_id": "LINE-A",
                "work_center_id": "WC-CUT-01",
                "machine_type": "CNC Cutter",
                "manufacturer": "CNCWorks",
                "model_number": "CW-450",
                "serial_number": "CW450-1033",
                "installed_date": "2022-08-01",
                "status": "Under Maintenance",
                "criticality": "High",
                "capacity": 40,
                "location": "Plant 1 / Cutting Bay",
                "active_status": True,
            },
        ]
        self.capabilities = [
            {
                "id": "cap-asm-01",
                "machine_id": "M-ASM-01",
                "enable_runtime_tracking": True,
                "enable_downtime_tracking": True,
                "enable_maintenance_tracking": True,
                "enable_iot_tracking": False,
                "enable_spare_tracking": True,
                "enable_documentation": True,
                "enable_approval_workflow": True,
            },
            {
                "id": "cap-cut-01",
                "machine_id": "M-CUT-01",
                "enable_runtime_tracking": True,
                "enable_downtime_tracking": True,
                "enable_maintenance_tracking": True,
                "enable_iot_tracking": False,
                "enable_spare_tracking": True,
                "enable_documentation": True,
                "enable_approval_workflow": False,
            },
        ]
        self.rules = [
            {"id": "rule-asm-monthly", "machine_id": "M-ASM-01", "rule_type": "Calendar-based", "rule_value": "Every 30 days", "active_status": True},
            {"id": "rule-asm-runtime", "machine_id": "M-ASM-01", "rule_type": "Runtime-based", "rule_value": "Every 1000 runtime hours", "active_status": True},
        ]
        self.plans = [
            {
                "id": "plan-asm-monthly",
                "machine_id": "M-ASM-01",
                "plan_name": "Monthly press inspection",
                "frequency_type": "Monthly",
                "frequency_value": 1,
                "next_due_date": str(date.today() + timedelta(days=3)),
                "last_completed_date": str(date.today() - timedelta(days=28)),
                "expected_duration": 180,
                "required_spares": ["spare-hyd-filter"],
                "required_documents": ["inspection_checklist"],
                "approval_required": True,
                "active_status": True,
            }
        ]
        self.work_orders = [
            {
                "id": "wo-breakdown-001",
                "work_order_number": "MWO-1001",
                "machine_id": "M-CUT-01",
                "maintenance_type": "Breakdown Maintenance",
                "category": "Emergency",
                "priority": "CRITICAL",
                "status": "In Progress",
                "issue_description": "CNC cutter spindle vibration above threshold.",
                "root_cause": None,
                "assigned_to": "tech-ravi",
                "planned_start": now.isoformat(),
                "planned_end": (now + timedelta(hours=2)).isoformat(),
                "actual_start": now.isoformat(),
                "actual_end": None,
                "downtime_minutes": 95,
                "production_impact": "HIGH",
                "estimated_cost": 18000,
                "compliance_required": False,
                "approval_status": "Post Review Required",
                "closure_notes": None,
            }
        ]
        self.spare_parts = [
            {
                "id": "spare-map-filter",
                "spare_part_id": "spare-hyd-filter",
                "inventory_item_id": "item-filter-hyd",
                "machine_id": "M-ASM-01",
                "compatibility": "Hydraulic press filter",
                "criticality": "High",
                "replacement_interval": "Every 500 runtime hours",
                "runtime_threshold": 500,
                "minimum_stock": 4,
                "preferred_supplier": "Apex Hydraulics",
                "active_status": True,
            },
            {
                "id": "spare-map-bearing",
                "spare_part_id": "spare-spindle-bearing",
                "inventory_item_id": "item-bearing",
                "machine_id": "M-CUT-01",
                "compatibility": "CNC spindle bearing",
                "criticality": "Critical",
                "replacement_interval": "Every 1000 runtime hours",
                "runtime_threshold": 1000,
                "minimum_stock": 2,
                "preferred_supplier": "MechWorks Spares",
                "active_status": True,
            },
        ]
        self.spare_stock = {"spare-hyd-filter": 2, "spare-spindle-bearing": 0}
        self.incoming_spares = {"spare-spindle-bearing": {"quantity": 4, "eta": str(date.today() + timedelta(days=5))}}
        self.spare_reservations = []
        self.spare_usage = []
        self.downtime_events = [
            {
                "id": "dt-cut-001",
                "machine_id": "M-CUT-01",
                "production_line_id": "LINE-A",
                "work_order_id": "wo-breakdown-001",
                "start_time": (now - timedelta(hours=3)).isoformat(),
                "end_time": (now - timedelta(hours=1, minutes=25)).isoformat(),
                "duration_minutes": 95,
                "reason_category": "Unplanned Breakdown",
                "root_cause": "Spindle vibration",
                "production_loss": 38,
                "cost_impact": 47500,
            }
        ]
        self.shutdown_windows = []
        self.assignments = []
        self.vendors = [{"id": "vendor-hyd-service", "vendor_id": "vendor-hyd-service", "vendor_name": "Hydraulic Service Co", "contract_reference": "AMC-2026-17", "service_type": "Hydraulic Press", "contact_details": {"email": "service@example.com"}}]
        self.attachments = []
        self.machine_documents = [
            {"id": "doc-asm-manual", "machine_id": "M-ASM-01", "document_type": "Manual", "file_url": "https://example.com/manuals/asm-press.pdf", "description": "Assembly press manual"}
        ]
        self.history = [
            {"id": "hist-asm-installed", "machine_id": "M-ASM-01", "event_type": "Installed", "event_time": "2023-01-15T09:00:00", "details": {"location": "Line A"}},
            {"id": "hist-cut-breakdown", "machine_id": "M-CUT-01", "event_type": "Breakdown occurred", "event_time": now.isoformat(), "details": {"work_order_id": "wo-breakdown-001"}},
        ]
        self.runtime_logs = [
            {"id": "rt-asm", "machine_id": "M-ASM-01", "runtime_hours": 960, "logged_at": now.isoformat()},
            {"id": "rt-cut", "machine_id": "M-CUT-01", "runtime_hours": 1280, "logged_at": now.isoformat()},
        ]
        self.costing = []
        self.health_scores = []
        self.tasks = []
        self.notifications = []
        self.recommendations = []

    def snapshot(self, data: Any) -> Any:
        return deepcopy(data)

    def add(self, collection: list[dict[str, Any]], payload: dict[str, Any], prefix: str) -> dict[str, Any]:
        record = {"id": f"{prefix}-{uuid4().hex[:8]}", **payload}
        collection.append(record)
        return self.snapshot(record)

    def get(self, collection: list[dict[str, Any]], record_id: str, key: str = "id") -> dict[str, Any] | None:
        return next((record for record in collection if record.get(key) == record_id), None)

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


maintenance_repo = MaintenanceRepository()
