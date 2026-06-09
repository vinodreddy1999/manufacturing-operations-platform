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
