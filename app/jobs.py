import os

from celery import Celery


CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", os.getenv("REDIS_URL", "redis://redis:6379/0"))
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://redis:6379/1")


celery_app = Celery(
    "metam_services",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
)
celery_app.conf.broker_connection_retry_on_startup = True


@celery_app.task
def scheduled_report_job(report_key: str) -> dict:
    return {"report_key": report_key, "status": "DRAFT_READY"}


@celery_app.task
def ai_risk_scan_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "RISK_SCAN_COMPLETED", "actions_created": "draft_only"}


@celery_app.task
def expiry_check_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "EXPIRY_CHECK_COMPLETED"}


@celery_app.task
def dead_stock_check_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "DEAD_STOCK_CHECK_COMPLETED"}


@celery_app.task
def maintenance_risk_scan_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "MAINTENANCE_RISK_SCAN_COMPLETED", "actions_created": "draft_only"}


@celery_app.task
def maintenance_overdue_scan_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "MAINTENANCE_OVERDUE_SCAN_COMPLETED"}


@celery_app.task
def maintenance_spare_scan_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "MAINTENANCE_SPARE_SCAN_COMPLETED", "procurement_actions": "draft_only"}


@celery_app.task
def maintenance_cost_scan_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "MAINTENANCE_COST_SCAN_COMPLETED"}


@celery_app.task
def quality_risk_scan_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "QUALITY_RISK_SCAN_COMPLETED", "actions_created": "draft_only"}


@celery_app.task
def quality_capa_overdue_scan_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "QUALITY_CAPA_OVERDUE_SCAN_COMPLETED"}


@celery_app.task
def quality_supplier_scan_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "QUALITY_SUPPLIER_SCAN_COMPLETED"}


@celery_app.task
def quality_cost_scan_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "QUALITY_COST_SCAN_COMPLETED"}


@celery_app.task
def sales_risk_scan_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "SALES_RISK_SCAN_COMPLETED", "actions_created": "draft_only"}


@celery_app.task
def sales_demand_forecast_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "SALES_DEMAND_FORECAST_COMPLETED"}


@celery_app.task
def sales_dispatch_scan_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "SALES_DISPATCH_SCAN_COMPLETED"}


@celery_app.task
def sales_returns_scan_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "SALES_RETURNS_SCAN_COMPLETED"}


@celery_app.task
def customer_portal_risk_scan_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "CUSTOMER_PORTAL_RISK_SCAN_COMPLETED", "actions_created": "draft_only"}


@celery_app.task
def customer_portal_document_scan_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "CUSTOMER_PORTAL_DOCUMENT_SCAN_COMPLETED"}


@celery_app.task
def customer_portal_support_scan_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "CUSTOMER_PORTAL_SUPPORT_SCAN_COMPLETED"}


@celery_app.task
def supplier_portal_risk_scan_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "SUPPLIER_PORTAL_RISK_SCAN_COMPLETED", "actions_created": "draft_only"}


@celery_app.task
def supplier_portal_document_scan_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "SUPPLIER_PORTAL_DOCUMENT_SCAN_COMPLETED"}


@celery_app.task
def supplier_portal_certificate_scan_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "SUPPLIER_PORTAL_CERTIFICATE_SCAN_COMPLETED"}


@celery_app.task
def supplier_portal_delivery_scan_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "SUPPLIER_PORTAL_DELIVERY_SCAN_COMPLETED", "actions_created": "draft_only"}


@celery_app.task
def reporting_scheduled_report_job(company_id: str, schedule_id: str) -> dict:
    return {"company_id": company_id, "schedule_id": schedule_id, "status": "REPORTING_SCHEDULED_REPORT_COMPLETED", "delivery": "email_first"}


@celery_app.task
def reporting_email_delivery_job(company_id: str, report_run_id: str) -> dict:
    return {"company_id": company_id, "report_run_id": report_run_id, "status": "REPORTING_EMAIL_DELIVERY_QUEUED"}


@celery_app.task
def reporting_kpi_calculation_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "REPORTING_KPI_CALCULATION_COMPLETED"}


@celery_app.task
def reporting_trend_recalculation_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "REPORTING_TREND_RECALCULATION_COMPLETED"}


@celery_app.task
def reporting_cross_module_insight_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "REPORTING_CROSS_MODULE_INSIGHTS_COMPLETED", "actions_created": "draft_only"}


@celery_app.task
def reporting_ai_risk_scan_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "REPORTING_AI_RISK_SCAN_COMPLETED", "actions_created": "draft_only"}


@celery_app.task
def reporting_executive_summary_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "REPORTING_EXECUTIVE_SUMMARY_COMPLETED", "actions_created": "draft_only"}


@celery_app.task
def costing_inventory_valuation_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "COSTING_INVENTORY_VALUATION_COMPLETED"}


@celery_app.task
def costing_production_recalculation_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "COSTING_PRODUCTION_RECALCULATION_COMPLETED"}


@celery_app.task
def costing_variance_analysis_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "COSTING_VARIANCE_ANALYSIS_COMPLETED"}


@celery_app.task
def costing_profitability_snapshot_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "COSTING_PROFITABILITY_SNAPSHOT_COMPLETED"}


@celery_app.task
def costing_wastage_scan_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "COSTING_WASTAGE_SCAN_COMPLETED", "actions_created": "draft_only"}


@celery_app.task
def costing_margin_risk_scan_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "COSTING_MARGIN_RISK_SCAN_COMPLETED", "actions_created": "draft_only"}


@celery_app.task
def costing_ai_risk_scan_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "COSTING_AI_RISK_SCAN_COMPLETED", "actions_created": "draft_only"}


@celery_app.task
def costing_scheduled_report_job(company_id: str, report_code: str) -> dict:
    return {"company_id": company_id, "report_code": report_code, "status": "COSTING_SCHEDULED_REPORT_COMPLETED"}


@celery_app.task
def mobile_offline_sync_processing_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "MOBILE_OFFLINE_SYNC_PROCESSING_COMPLETED"}


@celery_app.task
def mobile_failed_sync_retry_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "MOBILE_FAILED_SYNC_RETRY_COMPLETED"}


@celery_app.task
def mobile_notification_delivery_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "MOBILE_NOTIFICATION_DELIVERY_QUEUED"}


@celery_app.task
def mobile_upload_processing_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "MOBILE_UPLOAD_PROCESSING_COMPLETED"}


@celery_app.task
def mobile_photo_compression_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "MOBILE_PHOTO_COMPRESSION_COMPLETED"}


@celery_app.task
def mobile_ai_risk_scan_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "MOBILE_AI_RISK_SCAN_COMPLETED", "actions_created": "draft_only"}


@celery_app.task
def mobile_stale_work_alert_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "MOBILE_STALE_WORK_ALERT_COMPLETED"}


@celery_app.task
def mobile_device_inactivity_alert_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "MOBILE_DEVICE_INACTIVITY_ALERT_COMPLETED"}


@celery_app.task
def integrations_scheduled_sync_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "INTEGRATIONS_SCHEDULED_SYNC_COMPLETED"}


@celery_app.task
def integrations_webhook_delivery_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "INTEGRATIONS_WEBHOOK_DELIVERY_COMPLETED"}


@celery_app.task
def integrations_webhook_retry_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "INTEGRATIONS_WEBHOOK_RETRY_COMPLETED"}


@celery_app.task
def integrations_file_import_processing_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "INTEGRATIONS_FILE_IMPORT_PROCESSING_COMPLETED"}


@celery_app.task
def integrations_file_export_generation_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "INTEGRATIONS_FILE_EXPORT_GENERATION_COMPLETED"}


@celery_app.task
def integrations_email_delivery_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "INTEGRATIONS_EMAIL_DELIVERY_COMPLETED"}


@celery_app.task
def integrations_retry_failed_records_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "INTEGRATIONS_RETRY_FAILED_RECORDS_COMPLETED"}


@celery_app.task
def integrations_data_quality_scan_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "INTEGRATIONS_DATA_QUALITY_SCAN_COMPLETED"}


@celery_app.task
def integrations_ai_risk_scan_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "INTEGRATIONS_AI_RISK_SCAN_COMPLETED", "actions_created": "draft_only"}


@celery_app.task
def manufacturing_intelligence_risk_scan_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "MANUFACTURING_INTELLIGENCE_RISK_SCAN_COMPLETED", "actions_created": "draft_only"}


@celery_app.task
def manufacturing_intelligence_health_score_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "MANUFACTURING_INTELLIGENCE_HEALTH_SCORE_COMPLETED"}


@celery_app.task
def manufacturing_intelligence_bottleneck_detection_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "MANUFACTURING_INTELLIGENCE_BOTTLENECK_DETECTION_COMPLETED"}


@celery_app.task
def manufacturing_intelligence_customer_impact_scan_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "MANUFACTURING_INTELLIGENCE_CUSTOMER_IMPACT_SCAN_COMPLETED"}


@celery_app.task
def manufacturing_intelligence_cost_impact_scan_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "MANUFACTURING_INTELLIGENCE_COST_IMPACT_SCAN_COMPLETED"}


@celery_app.task
def manufacturing_intelligence_executive_summary_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "MANUFACTURING_INTELLIGENCE_EXECUTIVE_SUMMARY_COMPLETED", "actions_created": "draft_only"}


@celery_app.task
def manufacturing_intelligence_stale_risk_cleanup_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "MANUFACTURING_INTELLIGENCE_STALE_RISK_CLEANUP_COMPLETED"}


@celery_app.task
def manufacturing_intelligence_recommendation_generation_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "MANUFACTURING_INTELLIGENCE_RECOMMENDATION_GENERATION_COMPLETED", "actions_created": "draft_only"}


@celery_app.task
def admin_dashboard_refresh_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "ADMIN_DASHBOARD_REFRESH_COMPLETED"}


@celery_app.task
def data_hub_quality_scan_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "DATA_HUB_QUALITY_SCAN_COMPLETED"}


@celery_app.task
def data_hub_ai_readiness_scan_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "DATA_HUB_AI_READINESS_SCAN_COMPLETED"}


@celery_app.task
def data_hub_sync_monitoring_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "DATA_HUB_SYNC_MONITORING_COMPLETED"}


@celery_app.task
def data_hub_pending_update_export_job(company_id: str) -> dict:
    return {"company_id": company_id, "status": "DATA_HUB_PENDING_UPDATE_EXPORT_READY", "requires_human_approval": True}
