from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from ..database import Base


class MobileDevice(Base):
    __tablename__ = "mobile_devices"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    device_id: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    user_id: Mapped[str] = mapped_column(String(80), index=True)
    company_id: Mapped[str] = mapped_column(String(80), index=True)
    device_name: Mapped[str] = mapped_column(String(160))
    device_type: Mapped[str] = mapped_column(String(80))
    os: Mapped[str] = mapped_column(String(80))
    app_version: Mapped[str] = mapped_column(String(40))
    last_sync_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(80), default="Active")


class MobileSession(Base):
    __tablename__ = "mobile_sessions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(80), index=True)
    device_id: Mapped[str] = mapped_column(String(120), index=True)
    refresh_token: Mapped[str] = mapped_column(String(180), unique=True, index=True)
    status: Mapped[str] = mapped_column(String(80), default="Active")
    mfa_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class MobileDeviceToken(Base):
    __tablename__ = "mobile_device_tokens"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    device_id: Mapped[str] = mapped_column(String(120), index=True)
    token_type: Mapped[str] = mapped_column(String(80), default="push")
    token_value: Mapped[str] = mapped_column(String(300))
    active_status: Mapped[bool] = mapped_column(Boolean, default=True)


class MobileWorkQueue(Base):
    __tablename__ = "mobile_work_queue"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(80), index=True)
    work_type: Mapped[str] = mapped_column(String(80), index=True)
    related_type: Mapped[str] = mapped_column(String(80))
    related_id: Mapped[str] = mapped_column(String(80), index=True)
    priority: Mapped[str] = mapped_column(String(40), default="Normal")
    status: Mapped[str] = mapped_column(String(80), default="Open")
    payload: Mapped[dict] = mapped_column(JSON, default=dict)


class MobileOfflineAction(Base):
    __tablename__ = "mobile_offline_actions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    local_action_id: Mapped[str] = mapped_column(String(120), index=True)
    action_type: Mapped[str] = mapped_column(String(120), index=True)
    device_id: Mapped[str] = mapped_column(String(120), index=True)
    user_id: Mapped[str] = mapped_column(String(80), index=True)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    idempotency_key: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    sync_status: Mapped[str] = mapped_column(String(80), default="Pending")
    created_offline_at: Mapped[str | None] = mapped_column(String(80), nullable=True)


class MobileSyncBatch(Base):
    __tablename__ = "mobile_sync_batches"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    device_id: Mapped[str] = mapped_column(String(120), index=True)
    user_id: Mapped[str] = mapped_column(String(80), index=True)
    last_sync_at: Mapped[str | None] = mapped_column(String(80), nullable=True)
    action_count: Mapped[str] = mapped_column(String(40), default="0")
    status: Mapped[str] = mapped_column(String(80), default="Processed")


class MobileSyncResult(Base):
    __tablename__ = "mobile_sync_results"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    sync_batch_id: Mapped[str] = mapped_column(String(64), index=True)
    local_action_id: Mapped[str] = mapped_column(String(120), index=True)
    status: Mapped[str] = mapped_column(String(80))
    conflict_reason: Mapped[str | None] = mapped_column(Text, nullable=True)


class MobileScanEvent(Base):
    __tablename__ = "mobile_scan_events"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    scanned_value: Mapped[str] = mapped_column(String(180), index=True)
    scan_context: Mapped[str] = mapped_column(String(120))
    device_id: Mapped[str] = mapped_column(String(120), index=True)
    user_id: Mapped[str] = mapped_column(String(80), index=True)
    resolved_entity_type: Mapped[str | None] = mapped_column(String(80), nullable=True)
    resolved_entity_id: Mapped[str | None] = mapped_column(String(80), nullable=True)


class MobileUpload(Base):
    __tablename__ = "mobile_uploads"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    related_type: Mapped[str] = mapped_column(String(80), index=True)
    related_id: Mapped[str] = mapped_column(String(80), index=True)
    file_type: Mapped[str] = mapped_column(String(80))
    uploaded_by: Mapped[str] = mapped_column(String(80), index=True)
    device_id: Mapped[str] = mapped_column(String(120), index=True)
    offline_reference_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    sync_status: Mapped[str] = mapped_column(String(80), default="Synced")


class MobileActionAuditLog(Base):
    __tablename__ = "mobile_action_audit_logs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(80), index=True)
    device_id: Mapped[str] = mapped_column(String(120), index=True)
    action_type: Mapped[str] = mapped_column(String(120), index=True)
    related_type: Mapped[str | None] = mapped_column(String(80), nullable=True)
    related_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    location: Mapped[str | None] = mapped_column(String(160), nullable=True)
    old_value: Mapped[dict] = mapped_column(JSON, default=dict)
    new_value: Mapped[dict] = mapped_column(JSON, default=dict)
    offline_created_at: Mapped[str | None] = mapped_column(String(80), nullable=True)
    synced_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    ip: Mapped[str | None] = mapped_column(String(80), nullable=True)
    app_version: Mapped[str | None] = mapped_column(String(40), nullable=True)


class MobileConflict(Base):
    __tablename__ = "mobile_conflicts"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    conflict_type: Mapped[str] = mapped_column(String(120))
    related_type: Mapped[str] = mapped_column(String(80))
    related_id: Mapped[str] = mapped_column(String(80))
    conflict_reason: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(80), default="Requires Review")


class MobileNotification(Base):
    __tablename__ = "mobile_notifications"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(80), index=True)
    notification_type: Mapped[str] = mapped_column(String(120))
    message: Mapped[str] = mapped_column(Text)
    channel: Mapped[str] = mapped_column(String(80), default="In-App")
    status: Mapped[str] = mapped_column(String(80), default="Unread")


class MobileUserPreference(Base):
    __tablename__ = "mobile_user_preferences"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(80), index=True)
    preferences: Mapped[dict] = mapped_column(JSON, default=dict)


class MobileAIRisk(Base):
    __tablename__ = "mobile_ai_risks"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    risk_type: Mapped[str] = mapped_column(String(120))
    risk_level: Mapped[str] = mapped_column(String(40))
    reason: Mapped[str] = mapped_column(Text)
    recommended_action: Mapped[str] = mapped_column(Text)


class MobileAIRecommendation(Base):
    __tablename__ = "mobile_ai_recommendations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    recommendation_type: Mapped[str] = mapped_column(String(120))
    source_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    recommendation: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(80), default="DRAFT")
    requires_human_approval: Mapped[bool] = mapped_column(Boolean, default=True)
