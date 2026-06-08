from celery import Celery


celery_app = Celery(
    "manufacturing_operations_platform",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/1",
)


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
