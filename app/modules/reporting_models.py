from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from ..database import Base


class ReportCatalog(Base):
    __tablename__ = "report_catalog"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    report_code: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    report_name: Mapped[str] = mapped_column(String(160))
    category: Mapped[str] = mapped_column(String(80), index=True)
    description: Mapped[str] = mapped_column(Text)
    source_module: Mapped[str] = mapped_column(String(80), index=True)
    allowed_roles: Mapped[list] = mapped_column(JSON, default=list)
    available_filters: Mapped[list] = mapped_column(JSON, default=list)
    available_columns: Mapped[list] = mapped_column(JSON, default=list)
    default_columns: Mapped[list] = mapped_column(JSON, default=list)
    export_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    schedule_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    active_status: Mapped[bool] = mapped_column(Boolean, default=True)


class ReportColumn(Base):
    __tablename__ = "report_columns"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    report_id: Mapped[str] = mapped_column(String(64), index=True)
    column_key: Mapped[str] = mapped_column(String(120))
    column_label: Mapped[str] = mapped_column(String(160))
    data_type: Mapped[str] = mapped_column(String(40), default="string")


class ReportFilter(Base):
    __tablename__ = "report_filters"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    report_id: Mapped[str] = mapped_column(String(64), index=True)
    filter_key: Mapped[str] = mapped_column(String(120))
    filter_type: Mapped[str] = mapped_column(String(80), default="text")
    allowed_values: Mapped[list] = mapped_column(JSON, default=list)


class SavedReport(Base):
    __tablename__ = "saved_reports"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    report_name: Mapped[str] = mapped_column(String(160))
    report_type: Mapped[str] = mapped_column(String(80))
    owner_user_id: Mapped[str] = mapped_column(String(80), index=True)
    company_id: Mapped[str] = mapped_column(String(80), index=True)
    filters_json: Mapped[dict] = mapped_column(JSON, default=dict)
    columns_json: Mapped[list] = mapped_column(JSON, default=list)
    sort_json: Mapped[dict] = mapped_column(JSON, default=dict)
    group_by_json: Mapped[list] = mapped_column(JSON, default=list)
    chart_config_json: Mapped[dict] = mapped_column(JSON, default=dict)
    visibility: Mapped[str] = mapped_column(String(80), default="Private")


class ReportSchedule(Base):
    __tablename__ = "report_schedules"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    report_id: Mapped[str] = mapped_column(String(64), index=True)
    frequency: Mapped[str] = mapped_column(String(80))
    recipients: Mapped[list] = mapped_column(JSON, default=list)
    format: Mapped[str] = mapped_column(String(40), default="Excel")
    filters: Mapped[dict] = mapped_column(JSON, default=dict)
    next_run_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    active_status: Mapped[bool] = mapped_column(Boolean, default=True)


class ReportRun(Base):
    __tablename__ = "report_runs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    report_id: Mapped[str] = mapped_column(String(64), index=True)
    company_id: Mapped[str] = mapped_column(String(80), index=True)
    requested_by: Mapped[str] = mapped_column(String(80))
    status: Mapped[str] = mapped_column(String(80), default="Completed")
    row_count: Mapped[float] = mapped_column(Float, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class ReportRunFile(Base):
    __tablename__ = "report_run_files"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    report_run_id: Mapped[str] = mapped_column(String(64), index=True)
    file_format: Mapped[str] = mapped_column(String(40))
    file_url: Mapped[str] = mapped_column(String(500))


class ReportRecipient(Base):
    __tablename__ = "report_recipients"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    schedule_id: Mapped[str] = mapped_column(String(64), index=True)
    recipient_type: Mapped[str] = mapped_column(String(80))
    recipient_value: Mapped[str] = mapped_column(String(180))


class DashboardDefinition(Base):
    __tablename__ = "dashboard_definitions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    dashboard_code: Mapped[str] = mapped_column(String(80), unique=True)
    dashboard_name: Mapped[str] = mapped_column(String(160))
    dashboard_type: Mapped[str] = mapped_column(String(80), index=True)
    company_id: Mapped[str] = mapped_column(String(80), index=True)
    layout_json: Mapped[dict] = mapped_column(JSON, default=dict)
    active_status: Mapped[bool] = mapped_column(Boolean, default=True)


class DashboardWidget(Base):
    __tablename__ = "dashboard_widgets"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    dashboard_id: Mapped[str] = mapped_column(String(64), index=True)
    widget_type: Mapped[str] = mapped_column(String(80))
    title: Mapped[str] = mapped_column(String(160))
    config_json: Mapped[dict] = mapped_column(JSON, default=dict)


class KPIDefinition(Base):
    __tablename__ = "kpi_definitions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    kpi_code: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    kpi_name: Mapped[str] = mapped_column(String(160))
    module: Mapped[str] = mapped_column(String(80), index=True)
    formula: Mapped[str] = mapped_column(Text)
    target_value: Mapped[float] = mapped_column(Float)
    threshold_warning: Mapped[float] = mapped_column(Float)
    threshold_critical: Mapped[float] = mapped_column(Float)
    calculation_frequency: Mapped[str] = mapped_column(String(80), default="Daily")
    owner_role: Mapped[str] = mapped_column(String(80), default="Manager")


class KPISnapshot(Base):
    __tablename__ = "kpi_snapshots"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    kpi_id: Mapped[str] = mapped_column(String(64), index=True)
    company_id: Mapped[str] = mapped_column(String(80), index=True)
    plant_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    module: Mapped[str] = mapped_column(String(80), index=True)
    calculated_value: Mapped[float] = mapped_column(Float)
    target_value: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(80))
    calculated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    period_start: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    period_end: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class AnalyticsSnapshot(Base):
    __tablename__ = "analytics_snapshots"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    company_id: Mapped[str] = mapped_column(String(80), index=True)
    module: Mapped[str] = mapped_column(String(80), index=True)
    metric_key: Mapped[str] = mapped_column(String(120))
    metric_value: Mapped[float] = mapped_column(Float)
    snapshot_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class TrendAnalysis(Base):
    __tablename__ = "trend_analysis"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    metric_key: Mapped[str] = mapped_column(String(120), index=True)
    period_type: Mapped[str] = mapped_column(String(80))
    trend_type: Mapped[str] = mapped_column(String(80))
    evidence: Mapped[dict] = mapped_column(JSON, default=dict)


class CrossModuleInsight(Base):
    __tablename__ = "cross_module_insights"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    insight_code: Mapped[str] = mapped_column(String(80), unique=True)
    source_chain: Mapped[list] = mapped_column(JSON, default=list)
    impact: Mapped[str] = mapped_column(Text)
    risk_level: Mapped[str] = mapped_column(String(40))


class ActionInsight(Base):
    __tablename__ = "action_insights"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    what_happened: Mapped[str] = mapped_column(Text)
    why_it_happened: Mapped[str] = mapped_column(Text)
    impact: Mapped[str] = mapped_column(Text)
    recommended_action: Mapped[str] = mapped_column(Text)
    owner: Mapped[str] = mapped_column(String(120))
    due_date: Mapped[str] = mapped_column(String(40))
    risk_level: Mapped[str] = mapped_column(String(40))


class ReportingAIRisk(Base):
    __tablename__ = "reporting_ai_risks"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    risk_type: Mapped[str] = mapped_column(String(120))
    risk_level: Mapped[str] = mapped_column(String(40))
    reason: Mapped[str] = mapped_column(Text)
    recommended_action: Mapped[str] = mapped_column(Text)


class ReportingRecommendation(Base):
    __tablename__ = "reporting_recommendations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    recommendation_type: Mapped[str] = mapped_column(String(120))
    source_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    recommendation: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(80), default="DRAFT")
    requires_human_approval: Mapped[bool] = mapped_column(Boolean, default=True)


class ExecutiveSummary(Base):
    __tablename__ = "executive_summaries"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    period_type: Mapped[str] = mapped_column(String(80))
    summary: Mapped[str] = mapped_column(Text)
    top_risks: Mapped[list] = mapped_column(JSON, default=list)
    recommended_actions: Mapped[list] = mapped_column(JSON, default=list)


class AnomalyEvent(Base):
    __tablename__ = "anomaly_events"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    anomaly_type: Mapped[str] = mapped_column(String(120))
    module: Mapped[str] = mapped_column(String(80), index=True)
    severity: Mapped[str] = mapped_column(String(40))
    evidence: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(80), default="Open")
