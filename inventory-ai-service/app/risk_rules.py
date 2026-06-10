from datetime import date, timedelta


def classify_shortage_risk(days_remaining: float, supplier_lead_time_days: int) -> str:
    if days_remaining <= 0:
        return "CRITICAL"
    if days_remaining <= supplier_lead_time_days:
        return "HIGH"
    if days_remaining <= supplier_lead_time_days + 7:
        return "MEDIUM"
    return "LOW"


def classify_overstock_risk(excess_quantity: float, max_stock_level: float) -> str:
    if excess_quantity <= 0:
        return "LOW"
    if excess_quantity >= max_stock_level * 0.4:
        return "HIGH"
    if excess_quantity >= max_stock_level * 0.15:
        return "MEDIUM"
    return "LOW"


def classify_supplier_delay_risk(lead_time_days: int, delivery_reliability: float) -> str:
    if lead_time_days >= 21 or delivery_reliability < 85:
        return "HIGH"
    if lead_time_days >= 14 or delivery_reliability < 92:
        return "MEDIUM"
    return "LOW"


def classify_expiry_risk(expiry_date: date | None, average_daily_usage: float, current_quantity: float) -> tuple[str, float, int | None]:
    if not expiry_date:
        return "LOW", 0, None
    days_to_expiry = (expiry_date - date.today()).days
    projected_consumption = max(days_to_expiry, 0) * average_daily_usage
    quantity_at_risk = max(current_quantity - projected_consumption, 0)
    if days_to_expiry < 0:
        return "CRITICAL", current_quantity, days_to_expiry
    if quantity_at_risk > 0 and days_to_expiry <= 30:
        return "HIGH", quantity_at_risk, days_to_expiry
    if quantity_at_risk > 0 and days_to_expiry <= 60:
        return "MEDIUM", quantity_at_risk, days_to_expiry
    return "LOW", quantity_at_risk, days_to_expiry


def classify_dead_stock(days_without_movement: int, inventory_value: float) -> tuple[str, str]:
    if days_without_movement >= 180 and inventory_value >= 100000:
        return "DEAD_STOCK", "HIGH"
    if days_without_movement >= 90:
        return "SLOW_OR_NON_MOVING", "MEDIUM"
    return "ACTIVE", "LOW"


def expected_stockout_date(days_remaining: float) -> date | None:
    if days_remaining == float("inf"):
        return None
    return date.today() + timedelta(days=max(int(days_remaining), 0))
