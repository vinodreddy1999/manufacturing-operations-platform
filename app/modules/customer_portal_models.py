from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from ..database import Base


class CustomerPortalUser(Base):
    __tablename__ = "customer_portal_users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    customer_portal_user_id: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    company_id: Mapped[str] = mapped_column(String(80), index=True)
    customer_id: Mapped[str] = mapped_column(String(80), index=True)
    name: Mapped[str] = mapped_column(String(160))
    email: Mapped[str] = mapped_column(String(180), unique=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(60), nullable=True)
    role: Mapped[str] = mapped_column(String(80), default="Customer Viewer")
    status: Mapped[str] = mapped_column(String(80), default="Invited")
    last_login: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    invited_by: Mapped[str | None] = mapped_column(String(120), nullable=True)
    invitation_status: Mapped[str] = mapped_column(String(80), default="Pending")


class CustomerPortalSession(Base):
    __tablename__ = "customer_portal_sessions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    customer_portal_user_id: Mapped[str] = mapped_column(String(80), index=True)
    refresh_token: Mapped[str] = mapped_column(String(240))
    status: Mapped[str] = mapped_column(String(80), default="Active")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class CustomerProfileUpdateRequest(Base):
    __tablename__ = "customer_profile_update_requests"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    customer_id: Mapped[str] = mapped_column(String(80), index=True)
    requested_by: Mapped[str] = mapped_column(String(80))
    requested_changes: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(80), default="Pending Review")


class CustomerSupportRequest(Base):
    __tablename__ = "customer_support_requests"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    support_request_id: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    customer_id: Mapped[str] = mapped_column(String(80), index=True)
    sales_order_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    shipment_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    request_type: Mapped[str] = mapped_column(String(80))
    subject: Mapped[str] = mapped_column(String(180))
    description: Mapped[str] = mapped_column(Text)
    priority: Mapped[str] = mapped_column(String(40), default="MEDIUM")
    status: Mapped[str] = mapped_column(String(80), default="Open")
    assigned_internal_user_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    attachments: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class CustomerReturnRequest(Base):
    __tablename__ = "customer_return_requests"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    return_request_id: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    customer_id: Mapped[str] = mapped_column(String(80), index=True)
    sales_order_id: Mapped[str] = mapped_column(String(80))
    reason: Mapped[str] = mapped_column(Text)
    quantity: Mapped[float]
    status: Mapped[str] = mapped_column(String(80), default="Submitted")
    quality_required: Mapped[bool] = mapped_column(Boolean, default=True)


class CustomerPortalDocumentAccess(Base):
    __tablename__ = "customer_document_access"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    document_id: Mapped[str] = mapped_column(String(80), unique=True)
    customer_id: Mapped[str] = mapped_column(String(80), index=True)
    linked_type: Mapped[str] = mapped_column(String(80))
    linked_id: Mapped[str] = mapped_column(String(80))
    document_type: Mapped[str] = mapped_column(String(80))
    file_url: Mapped[str] = mapped_column(String(500))
    access_level: Mapped[str] = mapped_column(String(80), default="Download")
    downloadable: Mapped[bool] = mapped_column(Boolean, default=True)
    shared_by: Mapped[str] = mapped_column(String(120))


class CustomerPortalNotification(Base):
    __tablename__ = "customer_portal_notifications"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    customer_id: Mapped[str] = mapped_column(String(80), index=True)
    notification_type: Mapped[str] = mapped_column(String(80))
    message: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(80), default="Unread")


class CustomerPortalAuditLog(Base):
    __tablename__ = "customer_portal_audit_logs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    customer_portal_user_id: Mapped[str] = mapped_column(String(80))
    action: Mapped[str] = mapped_column(String(120))
    details: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class CustomerPortalRecommendation(Base):
    __tablename__ = "customer_portal_recommendations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    recommendation_type: Mapped[str] = mapped_column(String(120))
    customer_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    recommendation: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(80), default="Draft")
