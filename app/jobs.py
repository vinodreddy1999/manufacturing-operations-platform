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

