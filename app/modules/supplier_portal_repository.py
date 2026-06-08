from __future__ import annotations

from copy import deepcopy
from datetime import date, datetime, timedelta
from typing import Any
from uuid import uuid4


class SupplierPortalRepository:
    def __init__(self) -> None:
        self.enabled = True
        self.users = [
            {"id": "spu-apex-admin", "supplier_portal_user_id": "spu-apex-admin", "company_id": "company-c", "supplier_id": "supplier-apex", "name": "Apex Supplier Admin", "email": "apex@example.com", "phone": "+91-90000-20001", "role": "Supplier Admin", "status": "Active", "last_login": None, "invited_by": "procurement-user", "invitation_status": "Accepted", "password": "Supplier123!"}
        ]
        self.sessions = []
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
        self.audit_logs = []
        self.recommendations = []

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
