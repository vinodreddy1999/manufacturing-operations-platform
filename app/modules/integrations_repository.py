from __future__ import annotations

from copy import deepcopy
from datetime import datetime
from typing import Any
from uuid import uuid4


class IntegrationsRepository:
    def __init__(self) -> None:
        self.feature_flags = {
            "company-a": {"integrations_enabled": False},
            "company-c": {"integrations_enabled": True, "integrations_api": True, "integrations_webhooks": True, "integrations_file_import": True, "integrations_file_export": True, "integrations_erp": True, "integrations_accounting": True, "integrations_machine_iot": False, "integrations_email": True, "integrations_ai_monitoring": True},
        }
        self.providers = [
            {"id": "provider-demo-erp", "provider_id": "provider-demo-erp", "provider_code": "DEMO_ERP", "provider_name": "Demo ERP", "provider_type": "ERP", "description": "Demo ERP integration provider", "auth_type": "API Key", "base_url": "https://erp.example.com", "active_status": True},
            {"id": "provider-smtp", "provider_id": "provider-smtp", "provider_code": "SMTP", "provider_name": "SMTP Email", "provider_type": "Email", "description": "Email delivery provider", "auth_type": "Basic Auth", "base_url": None, "active_status": True},
        ]
        self.configs = [{"id": "config-demo-erp", "integration_config_id": "config-demo-erp", "company_id": "company-c", "provider_id": "provider-demo-erp", "integration_name": "Demo ERP Sync", "enabled": True, "auth_config_encrypted": {"api_key": "secret-ref-api-key"}, "settings_json": {"entities": ["items", "purchase_orders"]}, "sync_frequency": "Daily", "last_sync_at": None, "status": "Active"}]
        self.credentials = [{"id": "cred-demo-erp", "integration_config_id": "config-demo-erp", "credential_type": "API key", "secret_ref": "vault://cred-demo-erp", "masked_value": "****-1234", "active_status": True, "rotated_at": None}]
        self.webhooks = [{"id": "webhook-inventory-moved", "integration_config_id": "config-demo-erp", "direction": "Outbound", "event_type": "InventoryMoved", "target_url": "https://erp.example.com/webhooks/inventory", "secret_ref": "vault://webhook-secret", "retry_policy": {"max_retries": 3, "backoff": "exponential"}, "ip_allowlist": [], "active_status": True}]
        self.events = [{"id": "event-001", "event_id": "event-001", "company_id": "company-c", "source_module": "Inventory", "event_type": "InventoryMoved", "entity_type": "InventoryMovement", "entity_id": "move-001", "payload_json": {"item_id": "item-steel"}, "status": "Pending", "created_at": datetime.utcnow().isoformat(), "processed_at": None}]
        self.sync_jobs = []
        self.sync_job_items = []
        self.mappings = [{"id": "map-material-code", "integration_config_id": "config-demo-erp", "source_entity": "Material", "target_entity": "Item", "source_field": "material_code", "target_field": "item_code", "transform_rule": "Rename field", "required": True, "default_value": None}]
        self.transform_rules = []
        self.file_import_jobs = []
        self.file_import_records = []
        self.file_export_jobs = []
        self.errors = [{"id": "int-error-001", "integration_config_id": "config-demo-erp", "sync_job_id": None, "entity_type": "Item", "entity_id": "EXT-100", "error_code": "MISSING_MAPPING", "error_message": "External field material_group has no mapping.", "raw_payload": {"material_group": "RM"}, "retryable": True, "resolved": False, "resolved_by": None}]
        self.retry_logs = []
        self.idempotency_keys = []
        self.email_provider_configs = [{"id": "email-config-001", "company_id": "company-c", "provider_name": "SMTP", "smtp_host": "smtp.example.com", "status": "Active"}]
        self.email_templates = [{"id": "email-template-error", "template_code": "INTEGRATION_ERROR", "subject": "Integration error", "body": "Integration {{name}} failed."}]
        self.email_delivery_logs = []
        self.machine_integration_configs = [{"id": "machine-int-001", "machine_id": "M-ASM-01", "protocol": "MQTT", "settings_json": {"topic": "machines/M-ASM-01"}, "active_status": False}]
        self.iot_event_logs = []
        self.ai_risks = [{"id": "int-risk-001", "risk_type": "Missing mappings", "risk_level": "HIGH", "reason": "MISSING_MAPPING error is unresolved.", "recommended_action": "Draft mapping fix for material_group."}]
        self.recommendations = []

    def snapshot(self, data: Any) -> Any:
        return deepcopy(data)

    def add(self, collection: list[dict[str, Any]], payload: dict[str, Any], prefix: str) -> dict[str, Any]:
        record = {"id": f"{prefix}-{uuid4().hex[:8]}", **payload}
        collection.append(record)
        return self.snapshot(record)

    def get(self, collection: list[dict[str, Any]], record_id: str) -> dict[str, Any] | None:
        return next((row for row in collection if row["id"] == record_id or row.get("provider_code") == record_id), None)

    def mask_secret(self, secret_value: str) -> str:
        return "****-" + secret_value[-4:] if len(secret_value) >= 4 else "****"


integrations_repo = IntegrationsRepository()
