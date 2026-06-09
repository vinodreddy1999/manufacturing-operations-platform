from __future__ import annotations

from copy import deepcopy
from datetime import datetime
from typing import Any
from uuid import uuid4


class MobileRepository:
    def __init__(self) -> None:
        self.feature_flags = {
            "company-a": {"mobile_enabled": False},
            "company-c": {"mobile_enabled": True, "mobile_inventory": True, "mobile_warehouse": True, "mobile_production": True, "mobile_maintenance": True, "mobile_quality": True, "mobile_sales": True, "mobile_offline_sync": True, "mobile_barcode_qr": True, "mobile_photo_upload": True, "mobile_approvals": True},
        }
        self.users = [
            {"user_id": "mobile-user-warehouse", "password": "Mobile123!", "company_id": "company-c", "name": "Warehouse Operator", "role": "Warehouse Operator", "permissions": ["mobile.inventory.receive", "mobile.inventory.transfer", "mobile.inventory.count", "mobile.warehouse.move", "mobile.document.upload"]},
            {"user_id": "mobile-user-quality", "password": "Mobile123!", "company_id": "company-c", "name": "Quality Inspector", "role": "Quality Inspector", "permissions": ["mobile.quality.inspect", "mobile.document.upload"]},
        ]
        self.devices = [{"id": "mob-dev-001", "device_id": "device-demo-001", "user_id": "mobile-user-warehouse", "company_id": "company-c", "device_name": "Warehouse Zebra", "device_type": "Scanner", "os": "Android", "app_version": "1.0.0", "last_sync_at": None, "last_login_at": None, "status": "Active"}]
        self.sessions = []
        self.device_tokens = []
        self.work_queue = [
            {"id": "mob-task-count-001", "user_id": "mobile-user-warehouse", "work_type": "Inventory Count", "related_type": "Count", "related_id": "count-cycle-001", "priority": "High", "status": "Open", "payload": {"location_id": "bin-a-01-01"}},
            {"id": "mob-task-wo-001", "user_id": "mobile-user-warehouse", "work_type": "Maintenance", "related_type": "Work Order", "related_id": "wo-breakdown-001", "priority": "Critical", "status": "Open", "payload": {"machine_id": "M-ASM-01"}},
        ]
        self.approvals = [{"id": "mob-appr-001", "user_id": "mobile-user-warehouse", "approval_type": "Inventory transfer override", "related_id": "transfer-risk-001", "status": "Pending"}]
        self.offline_actions = []
        self.sync_batches = []
        self.sync_results = []
        self.scan_events = []
        self.uploads = []
        self.audit_logs = []
        self.conflicts = []
        self.notifications = [{"id": "mob-notif-001", "user_id": "mobile-user-warehouse", "notification_type": "Critical alert", "message": "Cycle count due in Bin A-01-01.", "channel": "In-App", "status": "Unread"}]
        self.preferences = [{"id": "mob-pref-001", "user_id": "mobile-user-warehouse", "preferences": {"default_warehouse": "WH-HYD", "offline_mode": True}}]
        self.receipts = [{"id": "mob-rec-pending-001", "purchase_order_id": "po-apex-001", "item_id": "item-steel", "status": "Pending"}]
        self.transfers = []
        self.counts = [{"id": "count-cycle-001", "count_type": "Cycle Count", "location_id": "bin-a-01-01", "status": "Assigned", "items": [{"item_id": "item-steel", "system_quantity": 100}]}]
        self.warehouse_movements = []
        self.production_orders = [{"id": "po-demo-001", "product_id": "fg-pump-900", "status": "Released", "assigned_user_id": "mobile-user-warehouse"}]
        self.maintenance_work_orders = [{"id": "wo-breakdown-001", "machine_id": "M-ASM-01", "status": "Assigned", "assigned_user_id": "mobile-user-warehouse"}]
        self.quality_inspections = [{"id": "lot-incoming-001", "status": "Assigned", "assigned_user_id": "mobile-user-quality", "checklist": ["Visual", "Dimension"]}]
        self.pick_lists = [{"id": "pick-so-001", "sales_order_id": "so-001", "status": "Ready", "items": [{"item_id": "fg-pump-900", "quantity": 2, "bin_id": "bin-fg-01"}]}]
        self.ai_risks = [{"id": "mob-risk-001", "risk_type": "Failed sync risk", "risk_level": "MEDIUM", "reason": "Device has pending offline actions.", "recommended_action": "Prompt user to sync before shift end."}]
        self.recommendations = []
        self.scan_index = {
            "ITEM:item-steel": {"entity_type": "Item", "entity_id": "item-steel", "display_name": "Steel Coil", "allowed_actions": ["receive", "transfer", "count"], "warnings": []},
            "BIN:A-01-01": {"entity_type": "Bin", "entity_id": "bin-a-01-01", "display_name": "Bin A-01-01", "allowed_actions": ["move", "count"], "warnings": []},
            "WO:wo-breakdown-001": {"entity_type": "Work order", "entity_id": "wo-breakdown-001", "display_name": "Breakdown Work Order", "allowed_actions": ["start", "complete", "upload_photo"], "warnings": ["Critical machine"]},
        }

    def snapshot(self, data: Any) -> Any:
        return deepcopy(data)

    def add(self, collection: list[dict[str, Any]], payload: dict[str, Any], prefix: str) -> dict[str, Any]:
        record = {"id": f"{prefix}-{uuid4().hex[:8]}", **payload}
        collection.append(record)
        return self.snapshot(record)

    def get(self, collection: list[dict[str, Any]], record_id: str) -> dict[str, Any] | None:
        return next((row for row in collection if row["id"] == record_id), None)

    def audit(self, user_id: str, device_id: str, action_type: str, related_type: str | None = None, related_id: str | None = None, new_value: dict[str, Any] | None = None) -> dict[str, Any]:
        return self.add(self.audit_logs, {"user_id": user_id, "device_id": device_id, "action_type": action_type, "related_type": related_type, "related_id": related_id, "location": None, "old_value": {}, "new_value": new_value or {}, "offline_created_at": None, "synced_at": datetime.utcnow().isoformat(), "ip": "127.0.0.1", "app_version": "1.0.0"}, "mob-audit")


mobile_repo = MobileRepository()
