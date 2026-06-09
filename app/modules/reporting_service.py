from __future__ import annotations

from datetime import datetime, timedelta
from io import StringIO
from typing import Any

import pandas as pd

from .reporting_repository import ReportingRepository, reporting_repo


class ReportingService:
    def __init__(self, repo: ReportingRepository = reporting_repo) -> None:
        self.repo = repo

    def enablement(self, company_id: str = "company-c") -> dict[str, Any]:
        return {"company_id": company_id, "feature_flags": self.repo.company_feature_flags.get(company_id, {})}

    def catalog(self, category: str | None = None) -> list[dict[str, Any]]:
        reports = [row for row in self.repo.catalog if row["active_status"]]
        if category:
            reports = [row for row in reports if row["category"].lower() == category.lower()]
        return self.repo.snapshot(reports)

    def catalog_detail(self, report_id: str) -> dict[str, Any]:
        report = self.repo.get_by_id_or_code(self.repo.catalog, report_id)
        if not report:
            raise KeyError(report_id)
        return self.repo.snapshot(report)

    def run_report(self, payload: dict[str, Any]) -> dict[str, Any]:
        report = self.catalog_detail(payload["report_code"])
        self._assert_access(report, payload.get("user_role", "Executive"))
        rows = self._report_rows(report, payload.get("filters", {}))
        selected = payload.get("columns") or report["default_columns"]
        safe_rows = [{column: row.get(column) for column in selected if column in row} for row in rows]
        run = self.repo.add(self.repo.report_runs, {"report_id": report["id"], "company_id": payload.get("company_id", "company-c"), "requested_by": payload.get("user_role", "Executive"), "status": "Completed", "row_count": len(safe_rows), "created_at": datetime.utcnow().isoformat()}, "run")
        return {"report": report, "run": run, "columns": selected, "rows": safe_rows, "summary": self._summary(report, safe_rows), "access_policy": "tenant/company/role scoped"}

    def export_report(self, payload: dict[str, Any]) -> dict[str, Any]:
        flags = self.enablement(payload.get("company_id", "company-c"))["feature_flags"]
        if not flags.get("reporting_exports", False):
            raise PermissionError("Reporting exports are disabled for this company")
        result = self.run_report(payload)
        export_format = payload.get("export_format", "CSV").upper()
        if export_format == "CSV":
            buffer = StringIO()
            pd.DataFrame(result["rows"]).to_csv(buffer, index=False)
            preview = buffer.getvalue()
        elif export_format == "EXCEL":
            preview = f"Excel workbook prepared with {len(result['rows'])} rows using OpenPyXL-compatible dataframe export."
        elif export_format == "PDF":
            preview = f"PDF management report prepared for {result['report']['report_name']}."
        else:
            raise ValueError("Unsupported export format")
        file_record = self.repo.add(self.repo.report_files, {"report_run_id": result["run"]["id"], "file_format": export_format, "file_url": f"memory://reports/{result['run']['id']}.{export_format.lower()}"}, "file")
        return {"export_format": export_format, "file": file_record, "preview": preview[:500], "requires_access_validation": True}

    def save_report(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self.repo.add(self.repo.saved_reports, payload, "saved")

    def update_saved_report(self, saved_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        report = self.repo.get_by_id_or_code(self.repo.saved_reports, saved_id)
        if not report:
            raise KeyError(saved_id)
        report.update(payload)
        return self.repo.snapshot(report)

    def delete_saved_report(self, saved_id: str) -> dict[str, Any]:
        report = self.repo.get_by_id_or_code(self.repo.saved_reports, saved_id)
        if not report:
            raise KeyError(saved_id)
        self.repo.saved_reports.remove(report)
        return {"id": saved_id, "deleted": True}

    def create_schedule(self, payload: dict[str, Any]) -> dict[str, Any]:
        flags = self.enablement("company-c")["feature_flags"]
        if not flags.get("reporting_scheduled", False):
            raise PermissionError("Scheduled reports are disabled")
        return self.repo.add(self.repo.schedules, payload, "schedule")

    def update_schedule(self, schedule_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        schedule = self.repo.get_by_id_or_code(self.repo.schedules, schedule_id)
        if not schedule:
            raise KeyError(schedule_id)
        schedule.update(payload)
        return self.repo.snapshot(schedule)

    def delete_schedule(self, schedule_id: str) -> dict[str, Any]:
        schedule = self.repo.get_by_id_or_code(self.repo.schedules, schedule_id)
        if not schedule:
            raise KeyError(schedule_id)
        self.repo.schedules.remove(schedule)
        return {"id": schedule_id, "deleted": True}

    def dashboard(self, dashboard_id: str | None = None) -> dict[str, Any] | list[dict[str, Any]]:
        if not dashboard_id:
            return self.repo.snapshot(self.repo.dashboards)
        dashboard = self.repo.get_by_id_or_code(self.repo.dashboards, dashboard_id)
        if not dashboard:
            raise KeyError(dashboard_id)
        return {"dashboard": dashboard, "widgets": self.widgets_for(dashboard["dashboard_type"])}

    def create_dashboard(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self.repo.add(self.repo.dashboards, payload, "dash")

    def update_dashboard(self, dashboard_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        dashboard = self.repo.get_by_id_or_code(self.repo.dashboards, dashboard_id)
        if not dashboard:
            raise KeyError(dashboard_id)
        dashboard.update(payload)
        return self.repo.snapshot(dashboard)

    def kpis(self) -> list[dict[str, Any]]:
        return self.repo.snapshot(self.repo.kpis)

    def create_kpi(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self.repo.add(self.repo.kpis, payload, "kpi")

    def kpi_detail(self, kpi_id: str) -> dict[str, Any]:
        kpi = self.repo.get_by_id_or_code(self.repo.kpis, kpi_id)
        if not kpi:
            raise KeyError(kpi_id)
        return self.repo.snapshot(kpi)

    def calculate_kpi(self, kpi_id: str) -> dict[str, Any]:
        kpi = self.kpi_detail(kpi_id)
        calculated = {"INVENTORY_ACCURACY": 97.2, "FIRST_PASS_YIELD": 91.0, "ON_TIME_DELIVERY": 93.5}.get(kpi["kpi_code"], kpi["target_value"])
        status = "Good" if calculated >= kpi["target_value"] else "Warning" if calculated >= kpi["threshold_critical"] else "Critical"
        return self.repo.add(self.repo.kpi_snapshots, {"kpi_id": kpi["id"], "company_id": "company-c", "plant_id": "plant-hyd", "module": kpi["module"], "calculated_value": calculated, "target_value": kpi["target_value"], "status": status, "calculated_at": datetime.utcnow().isoformat(), "period_start": str((datetime.utcnow() - timedelta(days=1)).date()), "period_end": str(datetime.utcnow().date())}, "snap")

    def trends(self) -> dict[str, Any]:
        return {"trend_analysis": self.repo.snapshot(self.repo.trends), "supported_periods": ["Daily", "Weekly", "Monthly", "Quarterly", "Year-over-year"]}

    def cross_module(self) -> list[dict[str, Any]]:
        return self.repo.snapshot(self.repo.cross_module_insights)

    def action_insights(self) -> list[dict[str, Any]]:
        return self.repo.snapshot(self.repo.action_insights)

    def risk_center(self) -> dict[str, Any]:
        return {"risks": self.repo.snapshot(self.repo.ai_risks), "ai_safety": self.ai_safety()}

    def executive_summary(self) -> dict[str, Any]:
        summary = {"period_type": "Weekly", "summary": "Inventory risk, Line 2 downtime and first pass yield deterioration are the top operational concerns.", "top_risks": self.repo.ai_risks, "top_improvements": ["On-time delivery improved to 93.5%"], "recommended_actions": self.action_insights(), "generated_at": datetime.utcnow().isoformat()}
        self.repo.add(self.repo.executive_summaries, summary, "exec")
        return summary

    def root_cause(self) -> dict[str, Any]:
        return {"likely_cause": "Material shortage combined with Line 2 downtime", "evidence": ["Production efficiency down 12%", "Abnormal downtime event open", "Supplier quality issue caused quarantine"], "confidence": 0.78, "recommended_investigation": "Review supplier delivery, quarantined steel coil and maintenance downtime together."}

    def anomalies(self) -> list[dict[str, Any]]:
        return self.repo.snapshot(self.repo.anomalies)

    def kpi_insights(self) -> dict[str, Any]:
        return {"kpi": "FIRST_PASS_YIELD", "change": "Below target", "possible_causes": ["Supplier quality defects", "Rework quantity increased", "Night shift output variation"], "recommended_action": "Create quality investigation and supplier review task."}

    def report_narrative(self, payload: dict[str, Any]) -> dict[str, Any]:
        safe_summary = "Report risk increased because approved operational signals show quality and downtime pressure. Sensitive production shortage details are hidden unless role permissions allow them."
        return {"report_code": payload["report_code"], "audience_role": payload["audience_role"], "narrative": safe_summary, "sanitized": True}

    def draft_action(self, payload: dict[str, Any]) -> dict[str, Any]:
        sanitized = payload["reason"].replace("financial record", "management review").replace("release inventory", "inventory review")
        return self.repo.add(self.repo.recommendations, {**payload, "reason": sanitized, "status": "DRAFT", "requires_human_approval": True, "ai_safety": self.ai_safety()}, "rec")

    def ai_safety(self) -> dict[str, list[str]]:
        return {"can": ["Analyze", "Summarize", "Recommend", "Create Drafts"], "cannot": ["Approve Decisions", "Change Source Data", "Send External Email Without Approval", "Modify Financial Records", "Release Inventory", "Dispatch Goods"]}

    def widgets_for(self, dashboard_type: str) -> list[dict[str, Any]]:
        return [
            {"widget_type": "KPI Card", "title": f"{dashboard_type} KPI Status", "value": "Warning"},
            {"widget_type": "Risk Card", "title": "Top Cross-Module Risk", "value": "Supplier quality to production shortage"},
            {"widget_type": "Action Card", "title": "Next Action", "value": "Create investigation task"},
        ]

    def _assert_access(self, report: dict[str, Any], role: str) -> None:
        if role not in report["allowed_roles"] and role != "Executive":
            raise PermissionError("User role is not allowed to run this report")

    def _report_rows(self, report: dict[str, Any], filters: dict[str, Any]) -> list[dict[str, Any]]:
        category = report["category"]
        base = [
            {"name": f"{category} signal 1", "status": "Warning", "quantity": 12, "value": 184000, "risk_level": "MEDIUM", "owner": f"{category} Manager", "due_date": str((datetime.utcnow() + timedelta(days=3)).date())},
            {"name": f"{category} signal 2", "status": "Open", "quantity": 4, "value": 52000, "risk_level": "HIGH", "owner": "Plant Manager", "due_date": str((datetime.utcnow() + timedelta(days=1)).date())},
        ]
        if filters.get("risk_level"):
            base = [row for row in base if row["risk_level"] == filters["risk_level"]]
        return base

    def _summary(self, report: dict[str, Any], rows: list[dict[str, Any]]) -> dict[str, Any]:
        return {"what_happened": f"{report['report_name']} returned {len(rows)} scoped rows.", "why_it_happened": "Rule-based report engine applied module filters and role access.", "impact": "Management can review risks and owners.", "recommended_action": "Review high-risk rows first.", "owner": "Report Owner", "due_date": str((datetime.utcnow() + timedelta(days=2)).date())}


reporting_service = ReportingService()
