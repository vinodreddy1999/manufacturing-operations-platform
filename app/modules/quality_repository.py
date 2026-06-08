from __future__ import annotations

from copy import deepcopy
from datetime import date, timedelta
from typing import Any
from uuid import uuid4


class QualityRepository:
    def __init__(self) -> None:
        self.enabled = True
        self.plans = [
            {
                "id": "qplan-steel-incoming",
                "plan_code": "QP-IN-STL",
                "plan_name": "Steel Incoming Inspection",
                "company_id": "company-c",
                "plant_id": "plant-hyd",
                "applies_to_type": "Material",
                "applies_to_id": "item-steel",
                "inspection_type": "Incoming Inspection",
                "checklist_id": "chk-steel-in",
                "sampling_rule_id": "sample-normal-001",
                "approval_required": True,
                "active_status": True,
                "effective_from": str(date.today() - timedelta(days=30)),
                "effective_to": None,
            }
        ]
        self.checklists = [
            {
                "id": "chk-steel-in",
                "checklist_code": "CHK-STL-IN",
                "checklist_name": "Steel Incoming Checklist",
                "inspection_type": "Incoming Inspection",
                "product_id": None,
                "material_id": "item-steel",
                "version": 1,
                "status": "Active",
                "items": [
                    {
                        "id": "chk-item-thickness",
                        "parameter_name": "Thickness",
                        "parameter_type": "Measurement",
                        "expected_value": None,
                        "min_value": 9.8,
                        "max_value": 10.2,
                        "tolerance": 0.2,
                        "uom": "mm",
                        "mandatory": True,
                        "critical_parameter": True,
                        "photo_required": False,
                        "document_required": False,
                    },
                    {
                        "id": "chk-item-cert",
                        "parameter_name": "Supplier Certificate",
                        "parameter_type": "Document",
                        "expected_value": "Available",
                        "min_value": None,
                        "max_value": None,
                        "tolerance": None,
                        "uom": None,
                        "mandatory": True,
                        "critical_parameter": True,
                        "photo_required": False,
                        "document_required": True,
                    },
                ],
            }
        ]
        self.sampling_rules = [
            {"id": "sample-normal-001", "rule_name": "Normal 10 percent", "lot_size_from": 1, "lot_size_to": 1000, "sample_size": 50, "acceptance_quantity": 1, "rejection_quantity": 2, "inspection_level": "Normal", "severity_level": "Normal"}
        ]
        self.inspection_lots = [
            {
                "id": "lot-incoming-001",
                "lot_number": "QL-1001",
                "source_type": "Goods Receipt",
                "source_id": "GR-778",
                "company_id": "company-c",
                "plant_id": "plant-hyd",
                "product_id": None,
                "material_id": "item-steel",
                "batch_id": "BATCH-STL-2401",
                "production_order_id": None,
                "supplier_id": "supplier-apex",
                "customer_id": None,
                "quantity": 1000,
                "sample_size": 50,
                "status": "Pending Inspection",
                "created_by": "qa-user",
            }
        ]
        self.inspection_results = []
        self.defects = [
            {"id": "defect-visual-001", "defect_code": "VIS-SCRATCH", "defect_name": "Surface Scratch", "defect_category": "Visual", "severity": "Major", "source_type": "Inspection Lot", "source_id": "lot-incoming-001", "product_id": None, "material_id": "item-steel", "batch_id": "BATCH-STL-2401", "machine_id": None, "production_line_id": None, "supplier_id": "supplier-apex", "quantity_affected": 24, "description": "Visible scratches on steel surface.", "photos": [], "status": "Open"}
        ]
        self.quarantine = []
        self.rework = []
        self.rejections = []
        self.scrap = []
        self.conditional_releases = []
        self.approvals = []
        self.capa = [
            {"id": "capa-001", "capa_number": "CAPA-1001", "source_type": "Defect", "source_id": "defect-visual-001", "problem_statement": "Repeated surface scratches from supplier batch.", "root_cause": None, "corrective_action": None, "preventive_action": None, "owner_id": "qa-manager", "due_date": str(date.today() + timedelta(days=10)), "status": "Investigation", "effectiveness_check_required": True}
        ]
        self.rca = []
        self.supplier_metrics = [{"supplier_id": "supplier-apex", "incoming_rejection_rate": 2.4, "defect_frequency": 3, "quality_rating": 94.2, "capa_count": 1, "return_to_supplier_count": 0}]
        self.production_metrics = [{"production_order_id": "po-demo-001", "product_id": "prod-pump-900", "line": "LINE-A", "machine_id": "M-ASM-01", "shift": "Morning", "defect_rate": 3.5, "rework_rate": 1.2, "scrap_rate": 0.4, "first_pass_yield": 96.5, "rejection_cost": 12000}]
        self.customer_returns = []
        self.documents = []
        self.costing = []
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


quality_repo = QualityRepository()
