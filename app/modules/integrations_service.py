from __future__ import annotations

from datetime import datetime
from typing import Any

from .integrations_repository import IntegrationsRepository, integrations_repo


class IntegrationsService:
    def __init__(self, repo: IntegrationsRepository = integrations_repo) -> None:
        self.repo = repo

    def enablement(self, company_id: str = "company-c") -> dict[str, Any]:
        return {"company_id": company_id, "feature_flags": self.repo.feature_flags.get(company_id, {})}

    def create_credential(self, payload: dict[str, Any]) -> dict[str, Any]:
        masked = self.repo.mask_secret(payload["secret_value"])
        return self.repo.add(self.repo.credentials, {"integration_config_id": payload["integration_config_id"], "credential_type": payload["credential_type"], "secret_ref": f"vault://{payload['integration_config_id']}/{payload['credential_type']}", "masked_value": masked, "active_status": True, "rotated_at": None}, "cred")

    def rotate_credential(self, credential_id: str) -> dict[str, Any]:
        credential = self.repo.get(self.repo.credentials, credential_id)
        if not credential:
            raise KeyError(credential_id)
        credential["rotated_at"] = datetime.utcnow().isoformat()
        credential["masked_value"] = "****-rotated"
        return self.repo.snapshot(credential)

    def safe_configs(self) -> list[dict[str, Any]]:
        return [self.safe_config(row) for row in self.repo.configs]

    def safe_config(self, row: dict[str, Any]) -> dict[str, Any]:
        clone = self.repo.snapshot(row)
        clone["auth_config_encrypted"] = {"masked": True, "secret_ref_count": len(row.get("auth_config_encrypted", {}))}
        return clone

    def update_config(self, config_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        config = self.repo.get(self.repo.configs, config_id)
        if not config:
            raise KeyError(config_id)
        config.update(payload)
        return self.safe_config(config)

    def set_config_status(self, config_id: str, enabled: bool) -> dict[str, Any]:
        config = self.repo.get(self.repo.configs, config_id)
        if not config:
            raise KeyError(config_id)
        config["enabled"] = enabled
        config["status"] = "Active" if enabled else "Disabled"
        return self.safe_config(config)

    def test_connection(self, config_id: str) -> dict[str, Any]:
        config = self.repo.get(self.repo.configs, config_id)
        if not config:
            raise KeyError(config_id)
        return {"integration_config_id": config_id, "status": "Success" if config["enabled"] else "Paused", "latency_ms": 42, "secrets_logged": False}

    def inbound_event(self, provider_code: str, payload: dict[str, Any]) -> dict[str, Any]:
        existing = next((row for row in self.repo.idempotency_keys if row["idempotency_key"] == payload["idempotency_key"]), None)
        if existing:
            return {"status": "Ignored", "reason": "Duplicate idempotency key", "idempotency_key": payload["idempotency_key"]}
        self.repo.add(self.repo.idempotency_keys, {"source_system": provider_code, "entity_type": payload["entity_type"], "external_record_id": payload["entity_id"], "idempotency_key": payload["idempotency_key"]}, "idem")
        event = self.repo.add(self.repo.events, {**payload, "event_id": f"event-{payload['entity_id']}", "status": "Pending", "created_at": datetime.utcnow().isoformat(), "processed_at": None}, "event")
        return event

    def create_sync_job(self, payload: dict[str, Any]) -> dict[str, Any]:
        job = self.repo.add(self.repo.sync_jobs, {**payload, "status": "Success", "started_at": datetime.utcnow().isoformat(), "completed_at": datetime.utcnow().isoformat(), "records_processed": "2", "records_success": "1", "records_failed": "1", "error_summary": "1 record requires mapping review"}, "sync")
        self.repo.add(self.repo.sync_job_items, {"sync_job_id": job["id"], "external_record_id": "EXT-100", "status": "Failed", "payload_json": {"material_group": "RM"}}, "sync-item")
        return job

    def retry_sync_job(self, sync_job_id: str) -> dict[str, Any]:
        job = self.repo.get(self.repo.sync_jobs, sync_job_id)
        if not job:
            raise KeyError(sync_job_id)
        job["status"] = "Retrying"
        self.repo.add(self.repo.retry_logs, {"error_id": "sync-job", "retry_count": "1", "status": "Queued"}, "retry")
        return self.repo.snapshot(job)

    def import_file(self, payload: dict[str, Any]) -> dict[str, Any]:
        errors = []
        for index, record in enumerate(payload["records"], start=1):
            row_errors = []
            if not record.get("external_record_id"):
                row_errors.append("external_record_id is required")
            if payload["import_type"] in {"Inventory opening balance", "Inventory movements"} and "quantity" not in record:
                row_errors.append("quantity is required")
            errors.extend(row_errors)
        job = self.repo.add(self.repo.file_import_jobs, {"company_id": payload["company_id"], "import_type": payload["import_type"], "file_format": payload["file_format"], "status": "Validated" if not errors else "Validation Failed", "validation_summary": {"error_count": len(errors), "errors": errors}}, "import")
        for index, record in enumerate(payload["records"], start=1):
            self.repo.add(self.repo.file_import_records, {"import_job_id": job["id"], "row_number": str(index), "record_json": record, "validation_status": "Valid" if record.get("external_record_id") else "Invalid", "errors_json": [] if record.get("external_record_id") else ["external_record_id is required"]}, "import-row")
        return job

    def import_preview(self, import_id: str) -> dict[str, Any]:
        job = self.repo.get(self.repo.file_import_jobs, import_id)
        if not job:
            raise KeyError(import_id)
        rows = [row for row in self.repo.file_import_records if row["import_job_id"] == import_id]
        return {"job": job, "records": rows}

    def import_approve(self, import_id: str) -> dict[str, Any]:
        job = self.repo.get(self.repo.file_import_jobs, import_id)
        if not job:
            raise KeyError(import_id)
        if job["validation_summary"]["error_count"]:
            job["status"] = "Approval Blocked"
            return self.repo.snapshot(job)
        job["status"] = "Approved"
        return self.repo.snapshot(job)

    def import_commit(self, import_id: str) -> dict[str, Any]:
        job = self.repo.get(self.repo.file_import_jobs, import_id)
        if not job:
            raise KeyError(import_id)
        if job["status"] != "Approved":
            return {"id": import_id, "status": "Requires Approval", "committed_records": 0}
        job["status"] = "Committed"
        return {"id": import_id, "status": "Committed", "committed_records": len([row for row in self.repo.file_import_records if row["import_job_id"] == import_id])}

    def export_file(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self.repo.add(self.repo.file_export_jobs, {"company_id": payload["company_id"], "export_type": payload["export_type"], "file_format": payload["file_format"], "status": "Generated", "file_url": f"memory://exports/{payload['export_type'].lower()}.{payload['file_format'].lower()}"}, "export")

    def resolve_error(self, error_id: str, user_id: str = "integration-owner") -> dict[str, Any]:
        error = self.repo.get(self.repo.errors, error_id)
        if not error:
            raise KeyError(error_id)
        error["resolved"] = True
        error["resolved_by"] = user_id
        return self.repo.snapshot(error)

    def monitoring(self) -> dict[str, Any]:
        return {"active_integrations": len([row for row in self.repo.configs if row["enabled"]]), "failed_integrations": len([row for row in self.repo.configs if row["status"] == "Error"]), "last_sync_time": self.repo.configs[0]["last_sync_at"], "records_processed": sum(int(row.get("records_processed", 0)) for row in self.repo.sync_jobs), "error_count": len([row for row in self.repo.errors if not row["resolved"]]), "pending_retries": len(self.repo.retry_logs), "slow_integrations": [], "data_mapping_issues": [row for row in self.repo.errors if row["error_code"] == "MISSING_MAPPING"]}

    def reports(self, report_type: str) -> dict[str, Any]:
        data = {"status": self.monitoring(), "sync-history": self.repo.sync_jobs, "failed-records": self.repo.errors, "data-import": self.repo.file_import_jobs, "webhook-delivery": self.repo.events, "api-usage": [{"provider": "DEMO_ERP", "requests": 12}]}
        return {"report_type": report_type, "data": data.get(report_type, [])}

    def risk_center(self) -> dict[str, Any]:
        return {"risks": self.repo.snapshot(self.repo.ai_risks), "ai_safety": self.ai_safety()}

    def data_quality(self) -> dict[str, Any]:
        return {"issues": [{"issue": "Missing required field", "field": "external_record_id"}, {"issue": "Missing mapping", "field": "material_group"}], "recommendation": "Create data validation task and mapping fix draft."}

    def sync_failure_analysis(self) -> dict[str, Any]:
        return {"likely_cause": "Missing field mapping", "retry_recommendation": "Retry after mapping material_group", "mapping_issue_detection": True, "suggested_fix": "Map material_group to item_category"}

    def anomaly_detection(self) -> dict[str, Any]:
        return {"anomalies": [{"type": "Repeated failed webhook", "severity": "MEDIUM"}, {"type": "Large inventory import", "severity": "HIGH"}]}

    def suggest_mapping(self, external_field: str, target_entity: str) -> dict[str, Any]:
        target = {"material_code": "item_code", "customer_code": "customer_code", "supplier_code": "supplier_code", "material_group": "item_category"}.get(external_field, external_field)
        return {"external_field": external_field, "target_entity": target_entity, "suggested_internal_field": target, "confidence": 0.92, "requires_human_review": True}

    def draft_action(self, payload: dict[str, Any]) -> dict[str, Any]:
        sanitized = payload["reason"].replace("change credentials", "credential review").replace("send external data", "data sharing review").replace("delete records", "record review")
        return self.repo.add(self.repo.recommendations, {**payload, "reason": sanitized, "status": "DRAFT", "requires_human_approval": True, "ai_safety": self.ai_safety()}, "int-rec")

    def ai_safety(self) -> dict[str, list[str]]:
        return {"can": ["Analyze", "Recommend", "Create Drafts"], "cannot": ["Commit High-Risk Imports", "Change Credentials", "Send External Data Without Approval", "Modify Financial Records", "Delete Records", "Override Tenant Security"]}


integrations_service = IntegrationsService()
