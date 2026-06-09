from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException

from . import integrations_models  # noqa: F401
from .integrations_repository import integrations_repo
from .integrations_schemas import (
    ConfigRequest,
    CredentialRequest,
    ExportRequest,
    FileImportRequest,
    InboundEventRequest,
    IntegrationDraftActionRequest,
    IntegrationsApiResult,
    MappingRequest,
    ProviderRequest,
    SuggestMappingRequest,
    SyncJobRequest,
    WebhookRequest,
)
from .integrations_service import integrations_service

router = APIRouter(prefix="/integrations", tags=["Integrations"])
ai_router = APIRouter(prefix="/ai/integrations", tags=["Integrations AI"])


def result(action: str, message: str, data: dict[str, Any] | list[dict[str, Any]]) -> IntegrationsApiResult:
    return IntegrationsApiResult(action=action, message=message, data=data)


@router.get("/enablement", response_model=IntegrationsApiResult)
def enablement(company_id: str = "company-c") -> IntegrationsApiResult:
    return result("enablement", "Integration feature flags.", integrations_service.enablement(company_id))


@router.get("/providers", response_model=IntegrationsApiResult)
def providers() -> IntegrationsApiResult:
    return result("providers", "Integration provider registry.", integrations_repo.snapshot(integrations_repo.providers))


@router.post("/providers", response_model=IntegrationsApiResult)
def create_provider(request: ProviderRequest) -> IntegrationsApiResult:
    return result("create_provider", "Integration provider created.", integrations_repo.add(integrations_repo.providers, {**request.model_dump(), "provider_id": None}, "provider"))


@router.get("/configs", response_model=IntegrationsApiResult)
def configs() -> IntegrationsApiResult:
    return result("configs", "Company integration configs with masked auth.", integrations_service.safe_configs())


@router.post("/configs", response_model=IntegrationsApiResult)
def create_config(request: ConfigRequest) -> IntegrationsApiResult:
    data = integrations_repo.add(integrations_repo.configs, {**request.model_dump(), "integration_config_id": None, "last_sync_at": None}, "config")
    return result("create_config", "Integration config created.", integrations_service.safe_config(data))


@router.get("/configs/{config_id}", response_model=IntegrationsApiResult)
def config_detail(config_id: str) -> IntegrationsApiResult:
    config = integrations_repo.get(integrations_repo.configs, config_id)
    if not config:
        raise HTTPException(status_code=404, detail=f"Config not found: {config_id}")
    return result("config_detail", "Integration config detail with masked auth.", integrations_service.safe_config(config))


@router.put("/configs/{config_id}", response_model=IntegrationsApiResult)
def update_config(config_id: str, request: ConfigRequest) -> IntegrationsApiResult:
    try:
        data = integrations_service.update_config(config_id, request.model_dump())
    except KeyError as error:
        raise HTTPException(status_code=404, detail=f"Config not found: {error.args[0]}") from error
    return result("update_config", "Integration config updated.", data)


@router.post("/configs/{config_id}/enable", response_model=IntegrationsApiResult)
def enable_config(config_id: str) -> IntegrationsApiResult:
    return result("enable_config", "Integration config enabled.", integrations_service.set_config_status(config_id, True))


@router.post("/configs/{config_id}/disable", response_model=IntegrationsApiResult)
def disable_config(config_id: str) -> IntegrationsApiResult:
    return result("disable_config", "Integration config disabled.", integrations_service.set_config_status(config_id, False))


@router.post("/configs/{config_id}/test-connection", response_model=IntegrationsApiResult)
def test_connection(config_id: str) -> IntegrationsApiResult:
    return result("test_connection", "Integration connection tested without logging secrets.", integrations_service.test_connection(config_id))


@router.get("/credentials", response_model=IntegrationsApiResult)
def credentials() -> IntegrationsApiResult:
    return result("credentials", "Masked integration credentials.", integrations_repo.snapshot(integrations_repo.credentials))


@router.post("/credentials", response_model=IntegrationsApiResult)
def create_credential(request: CredentialRequest) -> IntegrationsApiResult:
    return result("create_credential", "Integration credential stored with masked API response.", integrations_service.create_credential(request.model_dump()))


@router.post("/credentials/{credential_id}/rotate", response_model=IntegrationsApiResult)
def rotate_credential(credential_id: str) -> IntegrationsApiResult:
    return result("rotate_credential", "Integration credential rotated.", integrations_service.rotate_credential(credential_id))


@router.get("/webhooks", response_model=IntegrationsApiResult)
def webhooks() -> IntegrationsApiResult:
    return result("webhooks", "Integration webhooks.", integrations_repo.snapshot(integrations_repo.webhooks))


@router.post("/webhooks", response_model=IntegrationsApiResult)
def create_webhook(request: WebhookRequest) -> IntegrationsApiResult:
    payload = request.model_dump()
    payload["secret_ref"] = "vault://webhook-secret" if payload.pop("secret_value") else None
    return result("create_webhook", "Integration webhook created.", integrations_repo.add(integrations_repo.webhooks, payload, "webhook"))


@router.post("/webhooks/{webhook_id}/test", response_model=IntegrationsApiResult)
def test_webhook(webhook_id: str) -> IntegrationsApiResult:
    webhook = integrations_repo.get(integrations_repo.webhooks, webhook_id)
    if not webhook:
        raise HTTPException(status_code=404, detail=f"Webhook not found: {webhook_id}")
    return result("test_webhook", "Webhook test queued.", {"webhook_id": webhook_id, "status": "Queued", "retry_policy": webhook["retry_policy"]})


@router.post("/inbound/{provider_code}", response_model=IntegrationsApiResult)
def inbound(provider_code: str, request: InboundEventRequest) -> IntegrationsApiResult:
    return result("inbound", "Inbound integration event accepted with idempotency.", integrations_service.inbound_event(provider_code, request.model_dump()))


@router.get("/events", response_model=IntegrationsApiResult)
def events() -> IntegrationsApiResult:
    return result("events", "Integration event log.", integrations_repo.snapshot(integrations_repo.events))


@router.get("/sync-jobs", response_model=IntegrationsApiResult)
def sync_jobs() -> IntegrationsApiResult:
    return result("sync_jobs", "Integration sync jobs.", integrations_repo.snapshot(integrations_repo.sync_jobs))


@router.post("/sync-jobs", response_model=IntegrationsApiResult)
def create_sync_job(request: SyncJobRequest) -> IntegrationsApiResult:
    return result("create_sync_job", "Integration sync job executed.", integrations_service.create_sync_job(request.model_dump()))


@router.post("/sync-jobs/{sync_job_id}/retry", response_model=IntegrationsApiResult)
def retry_sync_job(sync_job_id: str) -> IntegrationsApiResult:
    return result("retry_sync_job", "Integration sync job retry queued.", integrations_service.retry_sync_job(sync_job_id))


@router.get("/mappings", response_model=IntegrationsApiResult)
def mappings() -> IntegrationsApiResult:
    return result("mappings", "Integration field mappings.", integrations_repo.snapshot(integrations_repo.mappings))


@router.post("/mappings", response_model=IntegrationsApiResult)
def create_mapping(request: MappingRequest) -> IntegrationsApiResult:
    return result("create_mapping", "Integration field mapping created.", integrations_repo.add(integrations_repo.mappings, request.model_dump(), "map"))


@router.post("/import/file", response_model=IntegrationsApiResult)
def import_file(request: FileImportRequest) -> IntegrationsApiResult:
    return result("import_file", "File import parsed and validated.", integrations_service.import_file(request.model_dump()))


@router.get("/import/{import_id}/preview", response_model=IntegrationsApiResult)
def import_preview(import_id: str) -> IntegrationsApiResult:
    return result("import_preview", "File import preview.", integrations_service.import_preview(import_id))


@router.post("/import/{import_id}/approve", response_model=IntegrationsApiResult)
def import_approve(import_id: str) -> IntegrationsApiResult:
    return result("import_approve", "File import approval processed.", integrations_service.import_approve(import_id))


@router.post("/import/{import_id}/commit", response_model=IntegrationsApiResult)
def import_commit(import_id: str) -> IntegrationsApiResult:
    return result("import_commit", "File import commit processed.", integrations_service.import_commit(import_id))


@router.post("/export", response_model=IntegrationsApiResult)
def export_file(request: ExportRequest) -> IntegrationsApiResult:
    return result("export_file", "File export generated.", integrations_service.export_file(request.model_dump()))


@router.get("/errors", response_model=IntegrationsApiResult)
def errors() -> IntegrationsApiResult:
    return result("errors", "Integration error logs.", integrations_repo.snapshot(integrations_repo.errors))


@router.post("/errors/{error_id}/resolve", response_model=IntegrationsApiResult)
def resolve_error(error_id: str) -> IntegrationsApiResult:
    return result("resolve_error", "Integration error resolved.", integrations_service.resolve_error(error_id))


@router.get("/monitoring", response_model=IntegrationsApiResult)
def monitoring() -> IntegrationsApiResult:
    return result("monitoring", "Integration monitoring dashboard.", integrations_service.monitoring())


@router.get("/reports/{report_type}", response_model=IntegrationsApiResult)
def reports(report_type: str) -> IntegrationsApiResult:
    return result("reports", "Integration report output.", integrations_service.reports(report_type))


@ai_router.get("/risk-center", response_model=IntegrationsApiResult)
def ai_risk_center() -> IntegrationsApiResult:
    return result("ai_risk_center", "Integration AI risk center.", integrations_service.risk_center())


@ai_router.get("/data-quality", response_model=IntegrationsApiResult)
def ai_data_quality() -> IntegrationsApiResult:
    return result("ai_data_quality", "Integration data quality AI.", integrations_service.data_quality())


@ai_router.get("/sync-failure-analysis", response_model=IntegrationsApiResult)
def ai_sync_failure() -> IntegrationsApiResult:
    return result("ai_sync_failure", "Integration sync failure analysis.", integrations_service.sync_failure_analysis())


@ai_router.get("/anomaly-detection", response_model=IntegrationsApiResult)
def ai_anomaly_detection() -> IntegrationsApiResult:
    return result("ai_anomaly_detection", "Integration anomaly detection.", integrations_service.anomaly_detection())


@ai_router.post("/suggest-mapping", response_model=IntegrationsApiResult)
def ai_suggest_mapping(request: SuggestMappingRequest) -> IntegrationsApiResult:
    return result("ai_suggest_mapping", "Integration mapping suggestion created for human review.", integrations_service.suggest_mapping(request.external_field, request.target_entity))


@ai_router.post("/draft-action", response_model=IntegrationsApiResult)
def ai_draft_action(request: IntegrationDraftActionRequest) -> IntegrationsApiResult:
    return result("ai_draft_action", "Integration AI draft action created. Human approval required.", integrations_service.draft_action(request.model_dump()))
