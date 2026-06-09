from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ReportingApiResult(BaseModel):
    module: str = "REPORTING"
    action: str
    message: str
    data: dict[str, Any] | list[dict[str, Any]]


class ReportRunRequest(BaseModel):
    report_code: str
    filters: dict[str, Any] = Field(default_factory=dict)
    columns: list[str] | None = None
    user_role: str = "Executive"
    company_id: str = "company-c"
    plant_id: str | None = None


class ReportExportRequest(ReportRunRequest):
    export_format: str = "CSV"


class SavedReportRequest(BaseModel):
    report_name: str
    report_type: str = "Standard"
    owner_user_id: str = "admin-user"
    company_id: str = "company-c"
    filters_json: dict[str, Any] = Field(default_factory=dict)
    columns_json: list[str] = Field(default_factory=list)
    sort_json: dict[str, Any] = Field(default_factory=dict)
    group_by_json: list[str] = Field(default_factory=list)
    chart_config_json: dict[str, Any] = Field(default_factory=dict)
    visibility: str = "Private"


class ReportScheduleRequest(BaseModel):
    report_id: str
    frequency: str = "Weekly"
    recipients: list[str]
    format: str = "Excel"
    filters: dict[str, Any] = Field(default_factory=dict)
    next_run_at: datetime | None = None
    active_status: bool = True


class DashboardRequest(BaseModel):
    dashboard_code: str
    dashboard_name: str
    dashboard_type: str = "Executive"
    company_id: str = "company-c"
    layout_json: dict[str, Any] = Field(default_factory=dict)
    active_status: bool = True


class KPIRequest(BaseModel):
    kpi_code: str
    kpi_name: str
    module: str
    formula: str
    target_value: float
    threshold_warning: float
    threshold_critical: float
    calculation_frequency: str = "Daily"
    owner_role: str = "Manager"


class ReportNarrativeRequest(BaseModel):
    report_code: str
    report_data: list[dict[str, Any]] = Field(default_factory=list)
    audience_role: str = "Executive"


class ReportingDraftActionRequest(BaseModel):
    action_type: str
    source_type: str | None = None
    source_id: str | None = None
    reason: str
    owner: str = "operations-manager"
