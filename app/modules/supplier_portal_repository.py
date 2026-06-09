from __future__ import annotations

from copy import deepcopy
from datetime import date, datetime, timedelta
from typing import Any
from uuid import uuid4


class SupplierPortalRepository:
    def __init__(self) -> None:
        self.enabled = True
        self.company_feature_flags = {
            "company-a": {"supplier_portal_enabled": False, "po_visibility": False, "delivery_confirmation": False, "document_upload": False, "certificates": False, "rfq_responses": False, "quality_feedback": False, "performance_visible": False},
            "company-b": {"supplier_portal_enabled": True, "po_visibility": True, "delivery_confirmation": False, "document_upload": False, "certificates": False, "rfq_responses": False, "quality_feedback": False, "performance_visible": False},
            "company-c": {"supplier_portal_enabled": True, "po_visibility": True, "delivery_confirmation": True, "document_upload": True, "certificates": True, "rfq_responses": True, "quality_feedback": True, "performance_visible": True},
        }
        self.roles = [
            {"id": "sp-role-admin", "company_id": "company-c", "role_name": "Supplier Admin", "permissions": ["portal:read", "po:acknowledge", "delivery:create", "document:upload", "certificate:upload", "message:create", "capa:respond"]},
            {"id": "sp-role-viewer", "company_id": "company-c", "role_name": "Supplier Viewer", "permissions": ["portal:read"]},
        ]
        self.permissions = [
            {"id": "sp-perm-po-ack", "role_id": "sp-role-admin", "permission_key": "po:acknowledge", "allowed": True},
            {"id": "sp-perm-doc-upload", "role_id": "sp-role-admin", "permission_key": "document:upload", "allowed": True},
        ]
        self.users = [
            {"id": "spu-apex-admin", "supplier_portal_user_id": "spu-apex-admin", "company_id": "company-c", "supplier_id": "supplier-apex", "name": "Apex Supplier Admin", "email": "apex@example.com", "phone": "+91-90000-20001", "role": "Supplier Admin", "status": "Active", "last_login": None, "invited_by": "procurement-user", "invitation_status": "Accepted", "password": "Supplier123!"}
        ]
        self.sessions = []
        self.invitations = []
        self.suppliers = [{"supplier_id": "supplier-apex", "supplier_code": "SUP-APEX", "supplier_name": "Apex Steel Components", "address": "Pune", "tax_id": "GSTAPEX123", "contact": "apex@example.com", "payment_terms": "NET45", "active_status": True}]
        self.purchase_orders = [
            {"id": "po-apex-001", "purchase_order_id": "po-apex-001", "po_number": "PO-9001", "supplier_id": "supplier-apex", "po_date": str(date.today()), "delivery_date": str(date.today() + timedelta(days=6)), "status": "Issued", "buyer_contact": "buyer@mop.local", "delivery_address": "Hyderabad Plant", "delivery_instructions": "Deliver to gate 2", "document_requirements": ["Invoice", "Test certificate"], "items": [{"item_id": "item-steel", "description": "Steel coil", "ordered_quantity": 1000, "pending_quantity": 1000, "uom": "KG"}]},
            {"id": "po-other-001", "purchase_order_id": "po-other-001", "po_number": "PO-OTHER", "supplier_id": "supplier-mech", "po_date": str(date.today()), "delivery_date": str(date.today() + timedelta(days=10)), "status": "Issued", "buyer_contact": "buyer@mop.local", "delivery_address": "Hyderabad Plant", "delivery_instructions": "Internal", "document_requirements": [], "items": []},
        ]
        self.profile_update_requests = []
        self.acknowledgements = []
        self.delivery_confirmations = []
        self.asn = []
        self.documents = []
        self.certificates = [{"id": "cert-apex-iso", "supplier_id": "supplier-apex", "certificate_type": "ISO 9001", "certificate_number": "ISO-APX-2026", "issue_date": str(date.today() - timedelta(days=200)), "expiry_date": str(date.today() + timedelta(days=20)), "document_url": "https://example.com/supplier/iso.pdf", "verification_status": "Approved", "verified_by": "quality-user"}]
        self.messages = []
        self.capa_responses = []
        self.notifications = [{"id": "spn-001", "supplier_id": "supplier-apex", "notification_type": "PO issued", "message": "PO-9001 is awaiting acknowledgement.", "status": "Unread"}]
        self.document_access = []
        self.audit_logs = []
        self.ai_risks = [{"id": "sp-risk-001", "supplier_id": "supplier-apex", "risk_type": "PO acknowledgement delay", "risk_level": "MEDIUM", "reason": "PO-9001 is issued and awaiting acknowledgement.", "recommended_action": "Send supplier acknowledgement reminder.", "requires_human_approval": True}]
        self.recommendations = []
        self.performance = [{"id": "sp-performance-apex", "supplier_id": "supplier-apex", "on_time_delivery": 92, "quality_rating": 96, "rejection_rate": 1.5, "response_time_hours": 10, "document_compliance": 88, "delivery_reliability": 91}]
        self.tasks = [
            {"id": "sp-task-ack-po", "supplier_id": "supplier-apex", "task_type": "Acknowledge PO", "related_id": "po-apex-001", "status": "Open", "owner": "Supplier Admin"},
            {"id": "sp-task-upload-cert", "supplier_id": "supplier-apex", "task_type": "Upload certificate", "related_id": "cert-apex-iso", "status": "Open", "owner": "Supplier Quality Contact"},
        ]

    def snapshot(self, data: Any) -> Any:
        return deepcopy(data)

    def add(self, collection: list[dict[str, Any]], payload: dict[str, Any], prefix: str) -> dict[str, Any]:
        record = {"id": f"{prefix}-{uuid4().hex[:8]}", **payload}
        collection.append(record)
        return self.snapshot(record)

    def get(self, collection: list[dict[str, Any]], record_id: str) -> dict[str, Any] | None:
        return next((record for record in collection if record["id"] == record_id), None)

    def audit(self, user_id: str, action: str, details: dict[str, Any]) -> dict[str, Any]:
        return self.add(self.audit_logs, {"supplier_portal_user_id": user_id, "action": action, "details": details, "created_at": datetime.utcnow().isoformat()}, "sp-audit")


supplier_portal_repo = SupplierPortalRepository()
