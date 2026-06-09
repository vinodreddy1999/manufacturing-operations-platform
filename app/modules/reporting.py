from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException

from . import reporting_models  # noqa: F401
from .reporting_repository import reporting_repo
from .reporting_schemas import (
    DashboardRequest,
    KPIRequest,
    ReportExportRequest,
    ReportingApiResult,
    ReportingDraftActionRequest,
    ReportNarrativeRequest,
    ReportRunRequest,
    ReportScheduleRequest,
    SavedReportRequest,
)
from .reporting_service import reporting_service

router = APIRouter(tags=["Reporting & Analytics"])
ai_router = APIRouter(prefix="/ai/reporting", tags=["Reporting AI"])


def result(action: str, message: str, data: dict[str, Any] | list[dict[str, Any]]) -> ReportingApiResult:
    return ReportingApiResult(action=action, message=message, data=data)


@router.get("/reports/enablement", response_model=ReportingApiResult)
def enablement(company_id: str = "company-c") -> ReportingApiResult:
    return result("enablement", "Reporting feature flags by company.", reporting_service.enablement(company_id))


@router.get("/reports/catalog", response_model=ReportingApiResult)
def catalog(category: str | None = None) -> ReportingApiResult:
    return result("catalog", "Standard report catalog.", reporting_service.catalog(category))


@router.get("/reports/catalog/{report_id}", response_model=ReportingApiResult)
def catalog_detail(report_id: str) -> ReportingApiResult:
    try:
        data = reporting_service.catalog_detail(report_id)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=f"Report not found: {error.args[0]}") from error
    return result("catalog_detail", "Report catalog detail.", data)


@router.post("/reports/run", response_model=ReportingApiResult)
def run_report(request: ReportRunRequest) -> ReportingApiResult:
    try:
        data = reporting_service.run_report(request.model_dump())
    except (KeyError, PermissionError) as error:
        raise HTTPException(status_code=403, detail=str(error)) from error
    return result("run_report", "Report executed with scoped data.", data)


@router.post("/reports/export", response_model=ReportingApiResult)
def export_report(request: ReportExportRequest) -> ReportingApiResult:
    try:
        data = reporting_service.export_report(request.model_dump())
    except (KeyError, PermissionError, ValueError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return result("export_report", "Report export generated.", data)


@router.get("/reports/saved", response_model=ReportingApiResult)
def saved_reports() -> ReportingApiResult:
    return result("saved_reports", "Saved reports.", reporting_repo.snapshot(reporting_repo.saved_reports))


@router.post("/reports/saved", response_model=ReportingApiResult)
def create_saved_report(request: SavedReportRequest) -> ReportingApiResult:
    return result("create_saved_report", "Saved report created.", reporting_service.save_report(request.model_dump()))


@router.get("/reports/saved/{saved_id}", response_model=ReportingApiResult)
def saved_report(saved_id: str) -> ReportingApiResult:
    report = reporting_repo.get_by_id_or_code(reporting_repo.saved_reports, saved_id)
    if not report:
        raise HTTPException(status_code=404, detail=f"Saved report not found: {saved_id}")
    return result("saved_report", "Saved report detail.", report)


@router.put("/reports/saved/{saved_id}", response_model=ReportingApiResult)
def update_saved_report(saved_id: str, request: SavedReportRequest) -> ReportingApiResult:
    try:
        data = reporting_service.update_saved_report(saved_id, request.model_dump())
    except KeyError as error:
        raise HTTPException(status_code=404, detail=f"Saved report not found: {error.args[0]}") from error
    return result("update_saved_report", "Saved report updated.", data)


@router.delete("/reports/saved/{saved_id}", response_model=ReportingApiResult)
def delete_saved_report(saved_id: str) -> ReportingApiResult:
    try:
        data = reporting_service.delete_saved_report(saved_id)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=f"Saved report not found: {error.args[0]}") from error
    return result("delete_saved_report", "Saved report deleted.", data)


@router.get("/reports/schedules", response_model=ReportingApiResult)
def schedules() -> ReportingApiResult:
    return result("schedules", "Scheduled reports.", reporting_repo.snapshot(reporting_repo.schedules))


@router.post("/reports/schedules", response_model=ReportingApiResult)
def create_schedule(request: ReportScheduleRequest) -> ReportingApiResult:
    try:
        data = reporting_service.create_schedule(request.model_dump())
    except PermissionError as error:
        raise HTTPException(status_code=403, detail=str(error)) from error
    return result("create_schedule", "Scheduled report created.", data)


@router.put("/reports/schedules/{schedule_id}", response_model=ReportingApiResult)
def update_schedule(schedule_id: str, request: ReportScheduleRequest) -> ReportingApiResult:
    try:
        data = reporting_service.update_schedule(schedule_id, request.model_dump())
    except KeyError as error:
        raise HTTPException(status_code=404, detail=f"Schedule not found: {error.args[0]}") from error
    return result("update_schedule", "Scheduled report updated.", data)


@router.delete("/reports/schedules/{schedule_id}", response_model=ReportingApiResult)
def delete_schedule(schedule_id: str) -> ReportingApiResult:
    try:
        data = reporting_service.delete_schedule(schedule_id)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=f"Schedule not found: {error.args[0]}") from error
    return result("delete_schedule", "Scheduled report deleted.", data)


@router.get("/dashboards", response_model=ReportingApiResult)
def dashboards() -> ReportingApiResult:
    return result("dashboards", "Dashboard definitions.", reporting_service.dashboard())


@router.get("/dashboards/{dashboard_id}", response_model=ReportingApiResult)
def dashboard(dashboard_id: str) -> ReportingApiResult:
    try:
        data = reporting_service.dashboard(dashboard_id)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=f"Dashboard not found: {error.args[0]}") from error
    return result("dashboard", "Dashboard detail with widgets.", data)


@router.post("/dashboards", response_model=ReportingApiResult)
def create_dashboard(request: DashboardRequest) -> ReportingApiResult:
    return result("create_dashboard", "Dashboard created.", reporting_service.create_dashboard(request.model_dump()))


@router.put("/dashboards/{dashboard_id}", response_model=ReportingApiResult)
def update_dashboard(dashboard_id: str, request: DashboardRequest) -> ReportingApiResult:
    try:
        data = reporting_service.update_dashboard(dashboard_id, request.model_dump())
    except KeyError as error:
        raise HTTPException(status_code=404, detail=f"Dashboard not found: {error.args[0]}") from error
    return result("update_dashboard", "Dashboard updated.", data)


@router.get("/kpis", response_model=ReportingApiResult)
def kpis() -> ReportingApiResult:
    return result("kpis", "KPI definitions.", reporting_service.kpis())


@router.post("/kpis", response_model=ReportingApiResult)
def create_kpi(request: KPIRequest) -> ReportingApiResult:
    return result("create_kpi", "KPI definition created.", reporting_service.create_kpi(request.model_dump()))


@router.get("/kpis/{kpi_id}", response_model=ReportingApiResult)
def kpi_detail(kpi_id: str) -> ReportingApiResult:
    try:
        data = reporting_service.kpi_detail(kpi_id)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=f"KPI not found: {error.args[0]}") from error
    return result("kpi_detail", "KPI definition detail.", data)


@router.post("/kpis/{kpi_id}/calculate", response_model=ReportingApiResult)
def calculate_kpi(kpi_id: str) -> ReportingApiResult:
    try:
        data = reporting_service.calculate_kpi(kpi_id)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=f"KPI not found: {error.args[0]}") from error
    return result("calculate_kpi", "KPI snapshot calculated.", data)


@router.get("/analytics/trends", response_model=ReportingApiResult)
def trends() -> ReportingApiResult:
    return result("trends", "Trend analytics.", reporting_service.trends())


@router.get("/analytics/cross-module", response_model=ReportingApiResult)
def cross_module() -> ReportingApiResult:
    return result("cross_module", "Cross-module analytics insights.", reporting_service.cross_module())


@router.get("/analytics/action-insights", response_model=ReportingApiResult)
def action_insights() -> ReportingApiResult:
    return result("action_insights", "Action-oriented analytics insights.", reporting_service.action_insights())


@ai_router.get("/risk-center", response_model=ReportingApiResult)
def ai_risk_center() -> ReportingApiResult:
    return result("ai_risk_center", "Reporting AI risk center.", reporting_service.risk_center())


@ai_router.get("/executive-summary", response_model=ReportingApiResult)
def ai_executive_summary() -> ReportingApiResult:
    return result("ai_executive_summary", "Rule-based executive summary.", reporting_service.executive_summary())


@ai_router.get("/root-cause", response_model=ReportingApiResult)
def ai_root_cause() -> ReportingApiResult:
    return result("ai_root_cause", "Root cause analytics.", reporting_service.root_cause())


@ai_router.get("/anomalies", response_model=ReportingApiResult)
def ai_anomalies() -> ReportingApiResult:
    return result("ai_anomalies", "Rule-based anomaly detection.", reporting_service.anomalies())


@ai_router.get("/kpi-insights", response_model=ReportingApiResult)
def ai_kpi_insights() -> ReportingApiResult:
    return result("ai_kpi_insights", "KPI explanation insights.", reporting_service.kpi_insights())


@ai_router.post("/report-narrative", response_model=ReportingApiResult)
def ai_report_narrative(request: ReportNarrativeRequest) -> ReportingApiResult:
    return result("ai_report_narrative", "Sanitized report narrative generated.", reporting_service.report_narrative(request.model_dump()))


@ai_router.post("/draft-action", response_model=ReportingApiResult)
def ai_draft_action(request: ReportingDraftActionRequest) -> ReportingApiResult:
    return result("ai_draft_action", "Reporting AI draft action created. Human approval required.", reporting_service.draft_action(request.model_dump()))
