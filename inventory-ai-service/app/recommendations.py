from datetime import date, timedelta


def draft_action(action_type: str, item_id: str, summary: str, risk_level: str) -> dict:
    return {
        "action_type": action_type,
        "item_id": item_id,
        "summary": summary,
        "risk_level": risk_level,
        "status": "DRAFT",
        "requires_human_approval": risk_level in {"MEDIUM", "HIGH", "CRITICAL"},
    }


def supplier_priority(lead_time_days: int, risk_level: str) -> str:
    if risk_level in {"HIGH", "CRITICAL"}:
        return "EMERGENCY_SUPPLIER"
    if lead_time_days > 14:
        return "BACKUP_SUPPLIER"
    return "PRIMARY_SUPPLIER"


def recommended_order_date(lead_time_days: int, risk_level: str) -> date:
    buffer_days = 2 if risk_level in {"HIGH", "CRITICAL"} else 7
    return date.today() + timedelta(days=max(lead_time_days - buffer_days, 0))
