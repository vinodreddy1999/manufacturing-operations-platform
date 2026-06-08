from __future__ import annotations

from copy import deepcopy
from datetime import datetime
from typing import Any
from uuid import uuid4


class CustomerPortalRepository:
    def __init__(self) -> None:
        self.enabled = True
        self.users = [
            {"id": "cpu-apollo-admin", "customer_portal_user_id": "cpu-apollo-admin", "company_id": "company-c", "customer_id": "cust-apollo", "name": "Meera Rao", "email": "meera@example.com", "phone": "+91-90000-10001", "role": "Customer Admin", "status": "Active", "last_login": None, "invited_by": "sales-ravi", "invitation_status": "Accepted", "password": "Portal123!"}
        ]
        self.sessions = []
        self.profile_update_requests = []
        self.support_requests = []
        self.support_comments = []
        self.support_attachments = []
        self.return_requests = []
        self.feedback = []
        self.complaints = []
        self.notifications = [{"id": "cpn-001", "customer_id": "cust-apollo", "notification_type": "Order confirmed", "message": "SO-1001 is under review.", "status": "Unread"}]
        self.documents = [
            {"id": "doc-invoice-001", "document_id": "doc-invoice-001", "customer_id": "cust-apollo", "linked_type": "Sales Order", "linked_id": "so-001", "document_type": "Invoice", "file_url": "https://example.com/customer-docs/invoice-so-1001.pdf", "access_level": "Download", "downloadable": True, "shared_by": "sales-ravi"},
            {"id": "doc-qc-001", "document_id": "doc-qc-001", "customer_id": "cust-apollo", "linked_type": "Sales Order", "linked_id": "so-001", "document_type": "Quality certificate", "file_url": "https://example.com/customer-docs/qc-so-1001.pdf", "access_level": "Download", "downloadable": True, "shared_by": "qa-user"},
        ]
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
        return self.add(self.audit_logs, {"customer_portal_user_id": user_id, "action": action, "details": details, "created_at": datetime.utcnow().isoformat()}, "cp-audit")


customer_portal_repo = CustomerPortalRepository()
