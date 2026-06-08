from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class PortalLoginRequest(BaseModel):
    email: str
    password: str


class PortalInviteRequest(BaseModel):
    company_id: str = "company-c"
    customer_id: str
    name: str
    email: str
    phone: str | None = None
    role: str = "Customer Viewer"
    invited_by: str = "internal-user"


class PortalUserUpdateRequest(BaseModel):
    name: str
    phone: str | None = None
    role: str = "Customer Viewer"
    status: str = "Active"


class ProfileUpdateRequest(BaseModel):
    requested_changes: dict[str, Any]


class SupportRequestCreate(BaseModel):
    sales_order_id: str | None = None
    shipment_id: str | None = None
    request_type: str = "General support"
    subject: str
    description: str
    priority: str = "MEDIUM"
    attachments: list[str] = Field(default_factory=list)


class SupportCommentRequest(BaseModel):
    comment: str
    attachments: list[str] = Field(default_factory=list)


class PortalReturnRequest(BaseModel):
    sales_order_id: str
    reason: str
    quantity: float = Field(gt=0)


class FeedbackRequest(BaseModel):
    rating: int = Field(ge=1, le=5)
    comments: str | None = None
    linked_order_id: str | None = None
    linked_shipment_id: str | None = None
    linked_support_request_id: str | None = None


class PortalDraftActionRequest(BaseModel):
    action_type: str
    customer_id: str | None = None
    source_type: str | None = None
    source_id: str | None = None
    reason: str


class CustomerPortalApiResult(BaseModel):
    module: str = "CUSTOMER_PORTAL"
    action: str
    message: str
    data: dict[str, Any] | list[dict[str, Any]]
