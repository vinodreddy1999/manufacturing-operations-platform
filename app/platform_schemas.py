from typing import Any

from pydantic import BaseModel, Field


class TenantContext(BaseModel):
    tenant_id: str = "tenant-demo-001"
    company_id: str = "company-c"
    plant_id: str | None = "plant-north"


class CreateCompanyRequest(BaseModel):
    name: str
    code: str
    tenant_id: str = "tenant-demo-001"


class CreatePlantRequest(BaseModel):
    company_id: str = "company-c"
    name: str
    code: str
    timezone: str = "Asia/Kolkata"
    tenant_id: str = "tenant-demo-001"


class CreateDepartmentRequest(BaseModel):
    company_id: str = "company-c"
    plant_id: str = "plant-north"
    name: str
    code: str
    tenant_id: str = "tenant-demo-001"


class CreateUserRequest(BaseModel):
    email: str
    name: str
    password: str = Field(min_length=8)
    company_id: str | None = "company-c"
    plant_id: str | None = "plant-north"
    tenant_id: str = "tenant-demo-001"


class CreateRoleRequest(BaseModel):
    name: str
    permissions: list[str] = Field(default_factory=list)
    tenant_id: str = "tenant-demo-001"
    company_id: str | None = "company-c"


class CreatePermissionRequest(BaseModel):
    key: str
    description: str = ""


class FeatureFlagRequest(BaseModel):
    tenant_id: str = "tenant-demo-001"
    company_id: str = "company-c"
    module_key: str
    enabled: bool
    rules: dict[str, Any] = Field(default_factory=dict)


class TaskRequest(BaseModel):
    title: str
    tenant_id: str = "tenant-demo-001"
    company_id: str = "company-c"
    plant_id: str | None = "plant-north"
    assigned_to_id: str | None = None
    payload: dict[str, Any] = Field(default_factory=dict)


class ApprovalDecisionRequest(BaseModel):
    status: str
    decided_by_id: str | None = None
    reason: str | None = None


class DocumentRequest(BaseModel):
    entity_type: str
    entity_id: str
    filename: str
    url: str
    tenant_id: str = "tenant-demo-001"
    company_id: str = "company-c"
    plant_id: str | None = "plant-north"
    metadata_json: dict[str, Any] = Field(default_factory=dict)


class ModuleRecordRequest(BaseModel):
    tenant_id: str = "tenant-demo-001"
    company_id: str = "company-c"
    plant_id: str | None = "plant-north"
    record_code: str
    name: str
    status: str = "ACTIVE"
    quantity: float | None = None
    payload: dict[str, Any] = Field(default_factory=dict)

