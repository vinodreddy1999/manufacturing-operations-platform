from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from ..database import Base


class SupplierPortalUser(Base):
    __tablename__ = "supplier_portal_users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    supplier_portal_user_id: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    company_id: Mapped[str] = mapped_column(String(80), index=True)
    supplier_id: Mapped[str] = mapped_column(String(80), index=True)
    name: Mapped[str] = mapped_column(String(160))
    email: Mapped[str] = mapped_column(String(180), unique=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(60), nullable=True)
    role: Mapped[str] = mapped_column(String(80), default="Supplier Viewer")
    status: Mapped[str] = mapped_column(String(80), default="Invited")
    last_login: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    invited_by: Mapped[str | None] = mapped_column(String(120), nullable=True)
    invitation_status: Mapped[str] = mapped_column(String(80), default="Pending")


class SupplierPortalRole(Base):
    __tablename__ = "supplier_portal_roles"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    company_id: Mapped[str] = mapped_column(String(80), index=True)
    role_name: Mapped[str] = mapped_column(String(80), index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class SupplierPortalPermission(Base):
    __tablename__ = "supplier_portal_permissions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    role_id: Mapped[str] = mapped_column(String(64), index=True)
    permission_key: Mapped[str] = mapped_column(String(120), index=True)
    allowed: Mapped[bool] = mapped_column(Boolean, default=True)


class SupplierPortalSession(Base):
    __tablename__ = "supplier_portal_sessions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    supplier_portal_user_id: Mapped[str] = mapped_column(String(80), index=True)
    refresh_token: Mapped[str] = mapped_column(String(180), unique=True, index=True)
    mfa_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(80), default="Active")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class SupplierPortalInvitation(Base):
    __tablename__ = "supplier_portal_invitations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    company_id: Mapped[str] = mapped_column(String(80), index=True)
    supplier_id: Mapped[str] = mapped_column(String(80), index=True)
    email: Mapped[str] = mapped_column(String(180), index=True)
    invitation_token: Mapped[str] = mapped_column(String(180), unique=True)
    invited_by: Mapped[str] = mapped_column(String(120))
    status: Mapped[str] = mapped_column(String(80), default="Pending")
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class SupplierProfileUpdateRequest(Base):
    __tablename__ = "supplier_profile_update_requests"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    supplier_id: Mapped[str] = mapped_column(String(80), index=True)
    requested_field: Mapped[str] = mapped_column(String(120))
    old_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    new_value: Mapped[str] = mapped_column(Text)
    reason: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(80), default="Pending Review")
    reviewed_by: Mapped[str | None] = mapped_column(String(120), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class SupplierPOAcknowledgement(Base):
    __tablename__ = "supplier_po_acknowledgements"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    purchase_order_id: Mapped[str] = mapped_column(String(80), index=True)
    supplier_id: Mapped[str] = mapped_column(String(80), index=True)
    acknowledgement_status: Mapped[str] = mapped_column(String(80))
    confirmed_quantity: Mapped[float] = mapped_column(Float, default=0)
    rejected_quantity: Mapped[float] = mapped_column(Float, default=0)
    confirmed_delivery_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    supplier_comments: Mapped[str | None] = mapped_column(Text, nullable=True)
    attachment_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    submitted_by: Mapped[str] = mapped_column(String(80))


class SupplierDeliveryConfirmation(Base):
    __tablename__ = "supplier_delivery_confirmations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    purchase_order_id: Mapped[str] = mapped_column(String(80), index=True)
    supplier_id: Mapped[str] = mapped_column(String(80), index=True)
    shipment_reference: Mapped[str] = mapped_column(String(120))
    dispatch_date: Mapped[date] = mapped_column(Date)
    expected_delivery_date: Mapped[date] = mapped_column(Date)
    carrier_name: Mapped[str] = mapped_column(String(120))
    vehicle_number: Mapped[str | None] = mapped_column(String(80), nullable=True)
    tracking_number: Mapped[str | None] = mapped_column(String(120), nullable=True)
    shipped_quantity: Mapped[float] = mapped_column(Float)
    package_count: Mapped[int] = mapped_column(Integer)
    supplier_comments: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(80), default="Submitted")


class AdvanceShipmentNotice(Base):
    __tablename__ = "advance_shipment_notices"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    asn_number: Mapped[str] = mapped_column(String(80), unique=True)
    purchase_order_id: Mapped[str] = mapped_column(String(80), index=True)
    supplier_id: Mapped[str] = mapped_column(String(80), index=True)
    shipment_date: Mapped[date] = mapped_column(Date)
    expected_arrival_date: Mapped[date] = mapped_column(Date)
    item_details: Mapped[list] = mapped_column(JSON, default=list)
    batch_details: Mapped[list] = mapped_column(JSON, default=list)
    quantity: Mapped[float] = mapped_column(Float)
    package_details: Mapped[dict] = mapped_column(JSON, default=dict)
    documents: Mapped[list] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String(80), default="Submitted")


class AdvanceShipmentNoticeItem(Base):
    __tablename__ = "advance_shipment_notice_items"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    asn_id: Mapped[str] = mapped_column(String(64), index=True)
    item_id: Mapped[str] = mapped_column(String(80), index=True)
    batch_number: Mapped[str | None] = mapped_column(String(120), nullable=True)
    shipped_quantity: Mapped[float] = mapped_column(Float)
    uom: Mapped[str] = mapped_column(String(40), default="EA")


class SupplierUploadedDocument(Base):
    __tablename__ = "supplier_uploaded_documents"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    supplier_id: Mapped[str] = mapped_column(String(80), index=True)
    linked_type: Mapped[str] = mapped_column(String(80))
    linked_id: Mapped[str] = mapped_column(String(80))
    document_type: Mapped[str] = mapped_column(String(80))
    file_url: Mapped[str] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(String(80), default="Pending Review")


class SupplierCertificate(Base):
    __tablename__ = "supplier_certificates"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    supplier_id: Mapped[str] = mapped_column(String(80), index=True)
    certificate_type: Mapped[str] = mapped_column(String(120))
    certificate_number: Mapped[str] = mapped_column(String(120))
    issue_date: Mapped[date] = mapped_column(Date)
    expiry_date: Mapped[date] = mapped_column(Date)
    document_url: Mapped[str] = mapped_column(String(500))
    verification_status: Mapped[str] = mapped_column(String(80), default="Pending Review")
    verified_by: Mapped[str | None] = mapped_column(String(120), nullable=True)


class SupplierMessage(Base):
    __tablename__ = "supplier_messages"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    supplier_id: Mapped[str] = mapped_column(String(80), index=True)
    related_type: Mapped[str] = mapped_column(String(80))
    related_id: Mapped[str] = mapped_column(String(80))
    sender_type: Mapped[str] = mapped_column(String(80))
    sender_id: Mapped[str] = mapped_column(String(80))
    message: Mapped[str] = mapped_column(Text)
    attachments: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class SupplierCapaResponse(Base):
    __tablename__ = "supplier_capa_responses"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    capa_id: Mapped[str] = mapped_column(String(80), index=True)
    supplier_id: Mapped[str] = mapped_column(String(80), index=True)
    root_cause: Mapped[str] = mapped_column(Text)
    corrective_action: Mapped[str] = mapped_column(Text)
    preventive_action: Mapped[str] = mapped_column(Text)
    target_date: Mapped[date] = mapped_column(Date)
    attachments: Mapped[list] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String(80), default="Submitted")


class SupplierPortalNotification(Base):
    __tablename__ = "supplier_portal_notifications"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    supplier_id: Mapped[str] = mapped_column(String(80), index=True)
    notification_type: Mapped[str] = mapped_column(String(120))
    message: Mapped[str] = mapped_column(Text)
    channel: Mapped[str] = mapped_column(String(40), default="Email")
    status: Mapped[str] = mapped_column(String(80), default="Unread")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class SupplierDocumentAccess(Base):
    __tablename__ = "supplier_document_access"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    supplier_id: Mapped[str] = mapped_column(String(80), index=True)
    document_id: Mapped[str] = mapped_column(String(80), index=True)
    access_level: Mapped[str] = mapped_column(String(80), default="View")
    granted_by: Mapped[str] = mapped_column(String(120))
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class SupplierPortalAuditLog(Base):
    __tablename__ = "supplier_portal_audit_logs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    supplier_portal_user_id: Mapped[str] = mapped_column(String(80), index=True)
    action: Mapped[str] = mapped_column(String(120), index=True)
    details: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class SupplierPortalAIRisk(Base):
    __tablename__ = "supplier_portal_ai_risks"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    supplier_id: Mapped[str] = mapped_column(String(80), index=True)
    risk_type: Mapped[str] = mapped_column(String(120))
    risk_level: Mapped[str] = mapped_column(String(40))
    reason: Mapped[str] = mapped_column(Text)
    recommended_action: Mapped[str] = mapped_column(Text)
    requires_human_approval: Mapped[bool] = mapped_column(Boolean, default=True)


class SupplierPortalRecommendation(Base):
    __tablename__ = "supplier_portal_recommendations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    recommendation_type: Mapped[str] = mapped_column(String(120))
    supplier_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    recommendation: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(80), default="Draft")
