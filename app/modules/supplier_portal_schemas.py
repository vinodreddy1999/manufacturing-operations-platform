from __future__ import annotations

from datetime import date
from typing import Any

from pydantic import BaseModel, Field


class SupplierPortalLoginRequest(BaseModel):
    email: str
    password: str


class SupplierPortalInviteRequest(BaseModel):
    company_id: str = "company-c"
    supplier_id: str
    name: str
    email: str
    phone: str | None = None
    role: str = "Supplier Viewer"
    invited_by: str = "procurement-user"


class SupplierProfileUpdateRequest(BaseModel):
    requested_field: str
    old_value: str | None = None
    new_value: str
    reason: str


class POAcknowledgementRequest(BaseModel):
    acknowledgement_status: str = "Accepted"
    confirmed_quantity: float = Field(ge=0)
    rejected_quantity: float = Field(default=0, ge=0)
    confirmed_delivery_date: date | None = None
    supplier_comments: str | None = None
    attachment_id: str | None = None


class DeliveryConfirmationRequest(BaseModel):
    purchase_order_id: str
    shipment_reference: str
    dispatch_date: date
    expected_delivery_date: date
    carrier_name: str
    vehicle_number: str | None = None
    tracking_number: str | None = None
    shipped_quantity: float = Field(gt=0)
    package_count: int = Field(ge=1)
    supplier_comments: str | None = None
    status: str = "Submitted"


class ASNRequest(BaseModel):
    asn_number: str
    purchase_order_id: str
    shipment_date: date
    expected_arrival_date: date
    item_details: list[dict[str, Any]] = Field(default_factory=list)
    batch_details: list[dict[str, Any]] = Field(default_factory=list)
    quantity: float = Field(gt=0)
    package_details: dict[str, Any] = Field(default_factory=dict)
    documents: list[str] = Field(default_factory=list)
    status: str = "Submitted"


class SupplierDocumentUploadRequest(BaseModel):
    linked_type: str
    linked_id: str
    document_type: str
    file_url: str


class SupplierCertificateUploadRequest(BaseModel):
    certificate_type: str
    certificate_number: str
    issue_date: date
    expiry_date: date
    document_url: str


class SupplierMessageRequest(BaseModel):
    related_type: str
    related_id: str
    message: str
    attachments: list[str] = Field(default_factory=list)


class SupplierCapaResponseRequest(BaseModel):
    capa_id: str
    root_cause: str
    corrective_action: str
    preventive_action: str
    target_date: date
    attachments: list[str] = Field(default_factory=list)
    status: str = "Submitted"


class SupplierPortalDraftActionRequest(BaseModel):
    action_type: str
    supplier_id: str | None = None
    source_type: str | None = None
    source_id: str | None = None
    reason: str


class SupplierPortalApiResult(BaseModel):
    module: str = "SUPPLIER_PORTAL"
    action: str
    message: str
    data: dict[str, Any] | list[dict[str, Any]]
