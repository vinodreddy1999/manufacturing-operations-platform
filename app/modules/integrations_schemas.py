from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class IntegrationsApiResult(BaseModel):
    module: str = "INTEGRATIONS"
    action: str
    message: str
    data: dict[str, Any] | list[dict[str, Any]]


class ProviderRequest(BaseModel):
    provider_code: str
    provider_name: str
    provider_type: str = "Custom API"
    description: str = ""
    auth_type: str = "API Key"
    base_url: str | None = None
    active_status: bool = True


class ConfigRequest(BaseModel):
    company_id: str = "company-c"
    provider_id: str
    integration_name: str
    enabled: bool = False
    auth_config_encrypted: dict[str, Any] = Field(default_factory=dict)
    settings_json: dict[str, Any] = Field(default_factory=dict)
    sync_frequency: str = "Manual"
    status: str = "Draft"


class CredentialRequest(BaseModel):
    integration_config_id: str
    credential_type: str = "API key"
    secret_value: str


class WebhookRequest(BaseModel):
    integration_config_id: str
    direction: str = "Outbound"
    event_type: str
    target_url: str | None = None
    secret_value: str | None = None
    retry_policy: dict[str, Any] = Field(default_factory=lambda: {"max_retries": 3, "backoff": "exponential"})
    ip_allowlist: list[str] = Field(default_factory=list)
    active_status: bool = True


class InboundEventRequest(BaseModel):
    company_id: str = "company-c"
    source_module: str = "External"
    event_type: str
    entity_type: str
    entity_id: str
    payload_json: dict[str, Any] = Field(default_factory=dict)
    idempotency_key: str


class SyncJobRequest(BaseModel):
    company_id: str = "company-c"
    integration_config_id: str
    sync_type: str = "Pull"
    source_entity: str
    target_entity: str


class MappingRequest(BaseModel):
    integration_config_id: str
    source_entity: str
    target_entity: str
    source_field: str
    target_field: str
    transform_rule: str | None = None
    required: bool = False
    default_value: str | None = None


class FileImportRequest(BaseModel):
    company_id: str = "company-c"
    import_type: str
    file_format: str = "CSV"
    records: list[dict[str, Any]] = Field(default_factory=list)


class ExportRequest(BaseModel):
    company_id: str = "company-c"
    export_type: str
    file_format: str = "CSV"
    filters: dict[str, Any] = Field(default_factory=dict)


class SuggestMappingRequest(BaseModel):
    external_field: str
    target_entity: str = "Item"


class IntegrationDraftActionRequest(BaseModel):
    action_type: str
    source_type: str | None = None
    source_id: str | None = None
    reason: str
    owner: str = "integration-owner"
