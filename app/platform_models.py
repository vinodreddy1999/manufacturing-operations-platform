from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class TenantScopedMixin:
    tenant_id: Mapped[str] = mapped_column(String(80), index=True)
    company_id: Mapped[str | None] = mapped_column(String(80), index=True, nullable=True)
    plant_id: Mapped[str | None] = mapped_column(String(80), index=True, nullable=True)


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(80), index=True)
    name: Mapped[str] = mapped_column(String(200))
    code: Mapped[str] = mapped_column(String(80))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint("tenant_id", "code"),)


class Plant(Base):
    __tablename__ = "plants"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(80), index=True)
    company_id: Mapped[str] = mapped_column(String(80), ForeignKey("companies.id"), index=True)
    name: Mapped[str] = mapped_column(String(200))
    code: Mapped[str] = mapped_column(String(80))
    timezone: Mapped[str] = mapped_column(String(80), default="Asia/Kolkata")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(80), index=True)
    company_id: Mapped[str] = mapped_column(String(80), index=True)
    plant_id: Mapped[str] = mapped_column(String(80), index=True)
    name: Mapped[str] = mapped_column(String(200))
    code: Mapped[str] = mapped_column(String(80))


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(80), index=True)
    company_id: Mapped[str | None] = mapped_column(String(80), index=True, nullable=True)
    plant_id: Mapped[str | None] = mapped_column(String(80), index=True, nullable=True)
    email: Mapped[str] = mapped_column(String(200), index=True)
    name: Mapped[str] = mapped_column(String(200))
    password_hash: Mapped[str] = mapped_column(String(300))
    role: Mapped[str] = mapped_column(String(40), default="user")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(80), index=True)
    company_id: Mapped[str | None] = mapped_column(String(80), index=True, nullable=True)
    name: Mapped[str] = mapped_column(String(120))
    permissions: Mapped[list[str]] = mapped_column(JSON, default=list)


class Permission(Base):
    __tablename__ = "permissions"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    key: Mapped[str] = mapped_column(String(160), unique=True)
    description: Mapped[str] = mapped_column(String(300), default="")


class FeatureFlag(Base):
    __tablename__ = "feature_flags"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(80), index=True)
    company_id: Mapped[str] = mapped_column(String(80), index=True)
    module_key: Mapped[str] = mapped_column(String(80), index=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    rules: Mapped[dict] = mapped_column(JSON, default=dict)

    __table_args__ = (UniqueConstraint("tenant_id", "company_id", "module_key"),)


class Task(Base, TenantScopedMixin):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    title: Mapped[str] = mapped_column(String(250))
    status: Mapped[str] = mapped_column(String(40), default="OPEN")
    assigned_to_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Approval(Base, TenantScopedMixin):
    __tablename__ = "approvals"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    entity_type: Mapped[str] = mapped_column(String(80))
    entity_id: Mapped[str] = mapped_column(String(80))
    status: Mapped[str] = mapped_column(String(40), default="PENDING")
    requested_by_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    decided_by_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)


class Notification(Base, TenantScopedMixin):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(80), index=True)
    title: Mapped[str] = mapped_column(String(250))
    body: Mapped[str] = mapped_column(Text)
    read: Mapped[bool] = mapped_column(Boolean, default=False)


class Document(Base, TenantScopedMixin):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    entity_type: Mapped[str] = mapped_column(String(80))
    entity_id: Mapped[str] = mapped_column(String(80))
    filename: Mapped[str] = mapped_column(String(260))
    url: Mapped[str] = mapped_column(String(500))
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict)


class AuditLog(Base, TenantScopedMixin):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    actor_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    action: Mapped[str] = mapped_column(String(120))
    entity_type: Mapped[str] = mapped_column(String(80))
    entity_id: Mapped[str] = mapped_column(String(80))
    old_value: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    new_value: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class CustomField(Base, TenantScopedMixin):
    __tablename__ = "custom_fields"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    entity_type: Mapped[str] = mapped_column(String(80))
    field_key: Mapped[str] = mapped_column(String(120))
    field_type: Mapped[str] = mapped_column(String(60))
    required: Mapped[bool] = mapped_column(Boolean, default=False)


class BusinessRule(Base, TenantScopedMixin):
    __tablename__ = "business_rules"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    rule_key: Mapped[str] = mapped_column(String(120))
    module_key: Mapped[str] = mapped_column(String(80))
    expression: Mapped[dict] = mapped_column(JSON, default=dict)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)


class ModuleRecord(Base, TenantScopedMixin):
    __tablename__ = "module_records"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    module_key: Mapped[str] = mapped_column(String(80), index=True)
    record_type: Mapped[str] = mapped_column(String(80), index=True)
    record_code: Mapped[str] = mapped_column(String(120), index=True)
    name: Mapped[str] = mapped_column(String(250))
    status: Mapped[str] = mapped_column(String(60), default="ACTIVE")
    quantity: Mapped[float | None] = mapped_column(Float, nullable=True)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class AppMetadata(Base, TenantScopedMixin):
    __tablename__ = "app_metadata"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    category: Mapped[str] = mapped_column(String(80), index=True)
    record_key: Mapped[str] = mapped_column(String(120), index=True)
    name: Mapped[str | None] = mapped_column(String(250), nullable=True)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint("tenant_id", "company_id", "plant_id", "category", "record_key"),)
