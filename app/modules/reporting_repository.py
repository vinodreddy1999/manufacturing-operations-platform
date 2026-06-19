from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timedelta
from typing import Any
from uuid import uuid4


class ReportingRepository:
    def __init__(self) -> None:
        self.company_feature_flags = {
            "company-a": {"reporting_standard": False, "reporting_custom": False, "reporting_scheduled": False, "reporting_exports": False, "analytics_dashboards": False, "ai_insights": False},
            "company-b": {"reporting_standard": True, "reporting_custom": False, "reporting_scheduled": False, "reporting_exports": False, "analytics_dashboards": True, "ai_insights": False},
            "company-c": {"reporting_standard": True, "reporting_custom": True, "reporting_scheduled": True, "reporting_exports": True, "analytics_dashboards": True, "ai_insights": True},
        }
        self.catalog = self._seed_catalog()
        self.saved_reports = []
        self.schedules = []
        self.report_runs = []
        self.report_files = []
        self.dashboards = [
            {"id": "dash-exec", "dashboard_code": "EXECUTIVE", "dashboard_name": "Executive Dashboard", "dashboard_type": "Executive", "company_id": "company-c", "layout_json": {"widgets": ["kpi_cards", "risk_cards", "trend_lines", "action_cards"]}, "active_status": True},
            {"id": "dash-inventory", "dashboard_code": "INVENTORY", "dashboard_name": "Inventory Dashboard", "dashboard_type": "Inventory", "company_id": "company-c", "layout_json": {"widgets": ["stockout_risk", "expiry_risk", "valuation"]}, "active_status": True},
        ]
        self.dashboard_widgets = []
        self.kpis = [
            {"id": "kpi-inventory-accuracy", "kpi_code": "INVENTORY_ACCURACY", "kpi_name": "Inventory Accuracy", "module": "Inventory", "formula": "matched_counts / total_counts * 100", "target_value": 98, "threshold_warning": 95, "threshold_critical": 90, "calculation_frequency": "Daily", "owner_role": "Inventory Manager"},
            {"id": "kpi-fpy", "kpi_code": "FIRST_PASS_YIELD", "kpi_name": "First Pass Yield", "module": "Quality", "formula": "passed_first_time / inspected_lots * 100", "target_value": 96, "threshold_warning": 92, "threshold_critical": 88, "calculation_frequency": "Daily", "owner_role": "Quality Manager"},
            {"id": "kpi-otd", "kpi_code": "ON_TIME_DELIVERY", "kpi_name": "On-Time Delivery", "module": "Sales", "formula": "on_time_shipments / total_shipments * 100", "target_value": 95, "threshold_warning": 90, "threshold_critical": 85, "calculation_frequency": "Daily", "owner_role": "Sales Manager"},
        ]
        self.kpi_snapshots = [
            {"id": "snap-fpy", "kpi_id": "kpi-fpy", "company_id": "company-c", "plant_id": "plant-hyd", "module": "Quality", "calculated_value": 91, "target_value": 96, "status": "Warning", "calculated_at": datetime.utcnow().isoformat(), "period_start": None, "period_end": None}
        ]
        self.trends = [{"id": "trend-prod-eff", "metric_key": "production_efficiency", "period_type": "Weekly", "trend_type": "Decreasing", "evidence": {"change_percent": -12, "driver": "Line 2 downtime"}}]
        self.cross_module_insights = [
            {"id": "cross-001", "insight_code": "SUPPLIER_QUALITY_TO_PRODUCTION", "source_chain": ["Supplier quality issue", "Quarantine", "Production shortage"], "impact": "Steel coil rejection may delay pump assembly orders.", "risk_level": "HIGH"}
        ]
        self.action_insights = [
            {"id": "act-001", "what_happened": "Production efficiency dropped 12%.", "why_it_happened": "Line 2 downtime and material shortage increased.", "impact": "Sales delivery risk increased for priority orders.", "recommended_action": "Review maintenance downtime and expedite steel delivery.", "owner": "Plant Manager", "due_date": str((datetime.utcnow() + timedelta(days=2)).date()), "risk_level": "HIGH"}
        ]
        self.ai_risks = [{"id": "rep-risk-001", "risk_type": "KPI deterioration", "risk_level": "HIGH", "reason": "First Pass Yield is below warning threshold.", "recommended_action": "Create quality investigation task."}]
        self.recommendations = []
        self.executive_summaries = []
        self.anomalies = [{"id": "anom-001", "anomaly_type": "Abnormal downtime", "module": "Maintenance", "severity": "HIGH", "evidence": {"machine": "M-ASM-01", "downtime_minutes": 180}, "status": "Open"}]

    def _seed_catalog(self) -> list[dict[str, Any]]:
        categories = {
            "Inventory": ["Inventory Status Report", "Inventory Aging Report", "Inventory Valuation Report", "Inventory Movement Report", "Inventory Reservation Report", "Low Stock Report", "Expiry Report", "Dead Stock Report"],
            "Warehouse": ["Warehouse Occupancy Report", "Zone Occupancy Report", "Rack/Bin Utilization Report", "Inventory By Location Report", "Cycle Count Report", "Variance Report"],
            "Procurement": ["Open Purchase Orders", "Supplier Lead Time Report", "Supplier Quality Report", "Supplier Delay Report", "Purchase Spend Report", "Supplier Performance Report"],
            "Production": ["Production Order Report", "Daily Production Report", "Shift Production Report", "Material Consumption Report", "BOM Variance Report", "Downtime Report", "Capacity Utilization Report"],
            "Maintenance": ["Maintenance Schedule Report", "Work Order Report", "Breakdown Report", "Spare Consumption Report", "Machine History Report", "MTTR Report", "MTBF Report"],
            "Quality": ["Inspection Report", "Defect Report", "Quarantine Report", "Rework Report", "Rejection Report", "Scrap Report", "CAPA Report", "Cost of Poor Quality Report"],
            "Sales": ["Sales Order Report", "Customer Sales Report", "Regional Sales Report", "Dispatch Report", "Shipment Delay Report", "Return Report", "Sales vs Inventory Report"],
            "Costing": ["Inventory Cost Report", "Production Cost Report", "Wastage Cost Report", "Rework Cost Report", "Scrap Cost Report", "Plant Profitability Report"],
            "Executive": ["Plant Performance Report", "Cross-Plant Comparison", "Operational Risk Report", "Weekly Executive Summary", "Monthly Business Review"],
            "Audit": ["User Activity Report", "Approval History Report", "Inventory Adjustment Audit", "Document Access Audit"],
            "AI Insights": ["Analytics Risk Center", "KPI Insight Report", "Root Cause Summary", "Anomaly Report"],
        }
        reports: list[dict[str, Any]] = []
        for category, names in categories.items():
            for name in names:
                code = name.upper().replace("/", "").replace(" ", "_").replace("-", "_")
                reports.append({
                    "id": f"report-{code.lower()}",
                    "report_code": code,
                    "report_name": name,
                    "category": category,
                    "description": f"{name} for Metam Services analytics.",
                    "source_module": category,
                    "allowed_roles": ["Executive", f"{category} Manager", "Plant Manager"],
                    "available_filters": ["date_range", "plant", "warehouse", "product", "item", "customer", "supplier", "machine", "line", "shift", "status", "risk_level"],
                    "available_columns": ["name", "status", "quantity", "value", "risk_level", "owner", "due_date"],
                    "default_columns": ["name", "status", "quantity", "risk_level"],
                    "export_enabled": True,
                    "schedule_enabled": True,
                    "active_status": True,
                })
        return reports

    def snapshot(self, data: Any) -> Any:
        return deepcopy(data)

    def add(self, collection: list[dict[str, Any]], payload: dict[str, Any], prefix: str) -> dict[str, Any]:
        record = {"id": f"{prefix}-{uuid4().hex[:8]}", **payload}
        collection.append(record)
        return self.snapshot(record)

    def get_by_id_or_code(self, collection: list[dict[str, Any]], value: str) -> dict[str, Any] | None:
        return next((row for row in collection if row.get("id") == value or row.get("report_code") == value or row.get("kpi_code") == value or row.get("dashboard_code") == value), None)


reporting_repo = ReportingRepository()
