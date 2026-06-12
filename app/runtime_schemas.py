from typing import Any, Literal

from pydantic import BaseModel, Field


RoleName = Literal[
    "super_admin",
    "account_owner",
    "organization_admin",
    "team_manager",
    "supervisor",
    "operator",
    "auditor",
    "qa_tester",
    "custom",
    "admin",
    "user",
]


class RuntimeEnvelope(BaseModel):
    action: str
    message: str
    data: Any


class LoginPayload(BaseModel):
    email: str
    password: str = Field(min_length=1)


class SessionUser(BaseModel):
    id: str
    tenant_id: str
    company_id: str | None = None
    plant_id: str | None = None
    email: str
    name: str
    role: RoleName
    is_active: bool
    permissions: list[str]


class LoginResult(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: SessionUser


class UserCreate(BaseModel):
    email: str
    name: str = Field(min_length=2)
    password: str = Field(min_length=8)
    role: RoleName = "user"
    is_active: bool = True
    company_id: str | None = None
    plant_id: str | None = None


class UserUpdate(BaseModel):
    name: str | None = None
    role: RoleName | None = None
    is_active: bool | None = None
    password: str | None = Field(default=None, min_length=8)


class ModuleRecordCreate(BaseModel):
    company_id: str | None = None
    plant_id: str | None = None
    module_key: str = Field(min_length=2)
    record_type: str = Field(min_length=2)
    record_code: str = Field(min_length=2)
    name: str = Field(min_length=2)
    status: str = "ACTIVE"
    quantity: float | None = None
    payload: dict[str, Any] = Field(default_factory=dict)


class ModuleRecordUpdate(BaseModel):
    company_id: str | None = None
    plant_id: str | None = None
    record_type: str | None = None
    record_code: str | None = None
    name: str | None = None
    status: str | None = None
    quantity: float | None = None
    payload: dict[str, Any] | None = None
