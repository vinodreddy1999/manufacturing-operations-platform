from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from ..database import Base


class IntegrationProvider(Base):
    __tablename__ = "integration_providers"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    provider_code: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    provider_name: Mapped[str] = mapped_column(String(160))
    provider_type: Mapped[str] = mapped_column(String(80), index=True)
    description: Mapped[str] = mapped_column(Text)
    auth_type: Mapped[str] = mapped_column(String(80))
    base_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    active_status: Mapped[bool] = mapped_column(Boolean, default=True)


class IntegrationConfig(Base):
    __tablename__ = "integration_configs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    company_id: Mapped[str] = mapped_column(String(80), index=True)
    provider_id: Mapped[str] = mapped_column(String(64), index=True)
    integration_name: Mapped[str] = mapped_column(String(160))
    enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    auth_config_encrypted: Mapped[dict] = mapped_column(JSON, default=dict)
    settings_json: Mapped[dict] = mapped_column(JSON, default=dict)
    sync_frequency: Mapped[str] = mapped_column(String(80), default="Manual")
    last_sync_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(80), default="Draft")


class IntegrationCredential(Base):
    __tablename__ = "integration_credentials"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    integration_config_id: Mapped[str] = mapped_column(String(64), index=True)
    credential_type: Mapped[str] = mapped_column(String(80))
    secret_ref: Mapped[str] = mapped_column(String(180))
    masked_value: Mapped[str] = mapped_column(String(120))
    active_status: Mapped[bool] = mapped_column(Boolean, default=True)
    rotated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class IntegrationWebhook(Base):
    __tablename__ = "integration_webhooks"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    integration_config_id: Mapped[str] = mapped_column(String(64), index=True)
    direction: Mapped[str] = mapped_column(String(40), default="Outbound")
    event_type: Mapped[str] = mapped_column(String(120), index=True)
    target_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    secret_ref: Mapped[str | None] = mapped_column(String(180), nullable=True)
    retry_policy: Mapped[dict] = mapped_column(JSON, default=dict)
    ip_allowlist: Mapped[list] = mapped_column(JSON, default=list)
    active_status: Mapped[bool] = mapped_column(Boolean, default=True)


class IntegrationEvent(Base):
    __tablename__ = "integration_events"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    company_id: Mapped[str] = mapped_column(String(80), index=True)
    source_module: Mapped[str] = mapped_column(String(80), index=True)
    event_type: Mapped[str] = mapped_column(String(120), index=True)
    entity_type: Mapped[str] = mapped_column(String(80))
    entity_id: Mapped[str] = mapped_column(String(80), index=True)
    payload_json: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(80), default="Pending")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    processed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class IntegrationSyncJob(Base):
    __tablename__ = "integration_sync_jobs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    company_id: Mapped[str] = mapped_column(String(80), index=True)
    integration_config_id: Mapped[str] = mapped_column(String(64), index=True)
    sync_type: Mapped[str] = mapped_column(String(80))
    source_entity: Mapped[str] = mapped_column(String(80))
    target_entity: Mapped[str] = mapped_column(String(80))
    status: Mapped[str] = mapped_column(String(80), default="Pending")
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    records_processed: Mapped[str] = mapped_column(String(40), default="0")
    records_success: Mapped[str] = mapped_column(String(40), default="0")
    records_failed: Mapped[str] = mapped_column(String(40), default="0")
    error_summary: Mapped[str | None] = mapped_column(Text, nullable=True)


class IntegrationSyncJobItem(Base):
    __tablename__ = "integration_sync_job_items"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    sync_job_id: Mapped[str] = mapped_column(String(64), index=True)
    external_record_id: Mapped[str] = mapped_column(String(120), index=True)
    status: Mapped[str] = mapped_column(String(80))
    payload_json: Mapped[dict] = mapped_column(JSON, default=dict)


class IntegrationMapping(Base):
    __tablename__ = "integration_mappings"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    integration_config_id: Mapped[str] = mapped_column(String(64), index=True)
    source_entity: Mapped[str] = mapped_column(String(80))
    target_entity: Mapped[str] = mapped_column(String(80))
    source_field: Mapped[str] = mapped_column(String(120))
    target_field: Mapped[str] = mapped_column(String(120))
    transform_rule: Mapped[str | None] = mapped_column(String(120), nullable=True)
    required: Mapped[bool] = mapped_column(Boolean, default=False)
    default_value: Mapped[str | None] = mapped_column(String(160), nullable=True)


class IntegrationTransformRule(Base):
    __tablename__ = "integration_transform_rules"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    mapping_id: Mapped[str] = mapped_column(String(64), index=True)
    rule_type: Mapped[str] = mapped_column(String(80))
    rule_config: Mapped[dict] = mapped_column(JSON, default=dict)


class FileImportJob(Base):
    __tablename__ = "file_import_jobs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    company_id: Mapped[str] = mapped_column(String(80), index=True)
    import_type: Mapped[str] = mapped_column(String(80))
    file_format: Mapped[str] = mapped_column(String(40))
    status: Mapped[str] = mapped_column(String(80), default="Uploaded")
    validation_summary: Mapped[dict] = mapped_column(JSON, default=dict)


class FileImportRecord(Base):
    __tablename__ = "file_import_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    import_job_id: Mapped[str] = mapped_column(String(64), index=True)
    row_number: Mapped[str] = mapped_column(String(40))
    record_json: Mapped[dict] = mapped_column(JSON, default=dict)
    validation_status: Mapped[str] = mapped_column(String(80), default="Valid")
    errors_json: Mapped[list] = mapped_column(JSON, default=list)


class FileExportJob(Base):
    __tablename__ = "file_export_jobs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    company_id: Mapped[str] = mapped_column(String(80), index=True)
    export_type: Mapped[str] = mapped_column(String(80))
    file_format: Mapped[str] = mapped_column(String(40))
    status: Mapped[str] = mapped_column(String(80), default="Generated")
    file_url: Mapped[str] = mapped_column(String(500))


class IntegrationErrorLog(Base):
    __tablename__ = "integration_error_logs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    integration_config_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    sync_job_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    entity_type: Mapped[str] = mapped_column(String(80))
    entity_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    error_code: Mapped[str] = mapped_column(String(80))
    error_message: Mapped[str] = mapped_column(Text)
    raw_payload: Mapped[dict] = mapped_column(JSON, default=dict)
    retryable: Mapped[bool] = mapped_column(Boolean, default=True)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    resolved_by: Mapped[str | None] = mapped_column(String(120), nullable=True)


class IntegrationRetryLog(Base):
    __tablename__ = "integration_retry_logs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    error_id: Mapped[str] = mapped_column(String(64), index=True)
    retry_count: Mapped[str] = mapped_column(String(40), default="1")
    status: Mapped[str] = mapped_column(String(80), default="Queued")


class IntegrationIdempotencyKey(Base):
    __tablename__ = "integration_idempotency_keys"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    source_system: Mapped[str] = mapped_column(String(80), index=True)
    entity_type: Mapped[str] = mapped_column(String(80))
    external_record_id: Mapped[str] = mapped_column(String(120), index=True)
    idempotency_key: Mapped[str] = mapped_column(String(180), unique=True, index=True)


class EmailProviderConfig(Base):
    __tablename__ = "email_provider_configs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    company_id: Mapped[str] = mapped_column(String(80), index=True)
    provider_name: Mapped[str] = mapped_column(String(120))
    smtp_host: Mapped[str] = mapped_column(String(180))
    status: Mapped[str] = mapped_column(String(80), default="Active")


class EmailTemplate(Base):
    __tablename__ = "email_templates"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    template_code: Mapped[str] = mapped_column(String(80), unique=True)
    subject: Mapped[str] = mapped_column(String(180))
    body: Mapped[str] = mapped_column(Text)


class EmailDeliveryLog(Base):
    __tablename__ = "email_delivery_logs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    template_id: Mapped[str] = mapped_column(String(64), index=True)
    recipient: Mapped[str] = mapped_column(String(180))
    status: Mapped[str] = mapped_column(String(80), default="Queued")


class MachineIntegrationConfig(Base):
    __tablename__ = "machine_integration_configs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    machine_id: Mapped[str] = mapped_column(String(80), index=True)
    protocol: Mapped[str] = mapped_column(String(80))
    settings_json: Mapped[dict] = mapped_column(JSON, default=dict)
    active_status: Mapped[bool] = mapped_column(Boolean, default=False)


class IoTEventLog(Base):
    __tablename__ = "iot_event_logs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    machine_id: Mapped[str] = mapped_column(String(80), index=True)
    event_type: Mapped[str] = mapped_column(String(120))
    payload_json: Mapped[dict] = mapped_column(JSON, default=dict)


class IntegrationAIRisk(Base):
    __tablename__ = "integration_ai_risks"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    risk_type: Mapped[str] = mapped_column(String(120))
    risk_level: Mapped[str] = mapped_column(String(40))
    reason: Mapped[str] = mapped_column(Text)
    recommended_action: Mapped[str] = mapped_column(Text)


class IntegrationRecommendation(Base):
    __tablename__ = "integration_recommendations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    recommendation_type: Mapped[str] = mapped_column(String(120))
    source_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    recommendation: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(80), default="DRAFT")
    requires_human_approval: Mapped[bool] = mapped_column(Boolean, default=True)
