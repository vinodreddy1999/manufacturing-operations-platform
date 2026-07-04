from typing import Any

from pydantic import BaseModel, Field


class FrontendAdminApiResult(BaseModel):
    action: str
    message: str
    data: dict[str, Any] | list[dict[str, Any]]


class DashboardAccessRequest(BaseModel):
    tenant_dashboard_enabled: bool = True
    role_permission: bool = True
    user_permission: bool = True
    data_scope_permission: bool = True


class DataMappingPreviewRequest(BaseModel):
    source_system: str = Field(examples=["SAP S/4HANA"])
    source_field: str = Field(examples=["SAP Material Code"])
    source_value: Any = Field(examples=["RM-STL-001"])
    target_entity: str = Field(examples=["InventoryItem"])


class WorkflowSimulationRequest(BaseModel):
    workflow_name: str = Field(examples=["Purchase Request Approval"])
    amount: float = 0
    requester_role: str = Field(default="Procurement Manager")


class PendingUpdateDecisionRequest(BaseModel):
    decided_by: str = Field(default="company-admin")
    decision: str = Field(pattern="^(Approved|Rejected)$")
    comment: str | None = None


class DataHubConnectionRequest(BaseModel):
    company_id: str | None = None
    system_name: str
    system_type: str
    connection_status: str
    last_sync: str | None = None
    health_score: float = Field(ge=0, le=100)
    record_count: int = Field(ge=0, default=0)
    source_category: str | None = None
    auth_method: str | None = None
    connection_details: dict[str, Any] = Field(default_factory=dict)


class DataCatalogEntryRequest(BaseModel):
    company_id: str | None = None
    data_type: str
    source_system: str
    owner: str
    ai_ready: bool = False
    quality_score: float = Field(ge=0, le=100)
    lineage: dict[str, Any] = Field(default_factory=dict)


class DataMappingRuleRequest(BaseModel):
    company_id: str | None = None
    source_system: str
    source_field: str
    target_entity: str
    target_field: str
    transform_rule: str | None = None
    confidence: float = Field(ge=0, le=1)


class AiReadinessOverrideItem(BaseModel):
    area: str
    score: float = Field(ge=0, le=100)
    ready: bool = False


class AiReadinessOverrideRequest(BaseModel):
    readiness: list[AiReadinessOverrideItem]


class OperationalFootprintRequest(BaseModel):
    plants: int = Field(ge=0)
    warehouses: int = Field(ge=0)
    integrations: int = Field(ge=0)
    open_approvals: int = Field(ge=0)


class CloudSourceUploadRequest(BaseModel):
    company_id: str | None = None
    provider: str
    resource_name: str
    resource_url: str
    file_format: str
    sync_mode: str = Field(default="manual")
    auth_method: str | None = None
    connection_details: dict[str, Any] = Field(default_factory=dict)


class GetDataConnectionRequest(BaseModel):
    company_id: str | None = None
    connector_key: str
    connector_name: str
    connector_category: str
    connection_name: str
    auth_method: str = "No Auth"
    connection_details: dict[str, Any] = Field(default_factory=dict)
    credentials: dict[str, Any] = Field(default_factory=dict)
    refresh_mode: str = "Manual refresh"
    destination_module: str = "Inventory"


class GetDataTestConnectionRequest(BaseModel):
    company_id: str | None = None
    connector_key: str
    connector_name: str
    connector_category: str
    auth_method: str = "No Auth"
    connection_details: dict[str, Any] = Field(default_factory=dict)
    credentials: dict[str, Any] = Field(default_factory=dict)


class GetDataSelectionRequest(BaseModel):
    selected_assets: list[str] = Field(default_factory=list)
    selected_columns: list[str] = Field(default_factory=list)


class GetDataTransformRequest(BaseModel):
    company_id: str | None = None
    connection_id: str
    recipe_name: str = "Power Query Draft"
    operations: list[dict[str, Any]] = Field(default_factory=list)


class GetDataFieldMappingRequest(BaseModel):
    company_id: str | None = None
    connection_id: str | None = None
    destination_module: str
    mappings: list[dict[str, Any]] = Field(default_factory=list)


class GetDataRelationshipRequest(BaseModel):
    company_id: str | None = None
    left_table: str
    left_column: str
    right_table: str
    right_column: str
    cardinality: str = "many-to-one"
    direction: str = "single"
    active: bool = True


class GetDataRefreshRequest(BaseModel):
    company_id: str | None = None
    connection_id: str
    refresh_mode: str = "Manual refresh"
    incremental_column: str | None = None
    schedule: dict[str, Any] = Field(default_factory=dict)
