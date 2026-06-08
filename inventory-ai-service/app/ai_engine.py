from datetime import date
from math import inf
from typing import Iterable

import pandas as pd

from .models import InventorySignal
from .recommendations import draft_action, recommended_order_date, supplier_priority
from .risk_rules import (
    classify_dead_stock,
    classify_expiry_risk,
    classify_overstock_risk,
    classify_shortage_risk,
    classify_supplier_delay_risk,
    expected_stockout_date,
)


def predict_shortage(
    current_stock: float,
    reserved_quantity: float,
    incoming_quantity: float,
    daily_consumption: float,
    supplier_lead_time_days: int,
) -> dict:
    available_quantity = current_stock - reserved_quantity + incoming_quantity
    days_remaining = inf if daily_consumption <= 0 else max(available_quantity, 0) / daily_consumption
    risk_level = classify_shortage_risk(days_remaining, supplier_lead_time_days)
    return {
        "available_quantity": round(available_quantity, 2),
        "days_remaining": 999999 if days_remaining == inf else round(days_remaining, 2),
        "expected_stockout_date": expected_stockout_date(days_remaining),
        "risk_level": risk_level,
    }


def predict_overstock(current_stock: float, average_monthly_usage: float, max_stock_level: float) -> dict:
    target_stock = max(max_stock_level, average_monthly_usage)
    excess_quantity = max(current_stock - target_stock, 0)
    return {
        "excess_quantity": round(excess_quantity, 2),
        "overstock_risk": classify_overstock_risk(excess_quantity, max_stock_level),
    }


def procurement_recommendation(
    current_stock: float,
    reserved_stock: float,
    production_demand: float,
    incoming_stock: float,
    safety_stock: float,
    supplier_lead_time_days: int,
    item_id: str = "query-item",
) -> dict:
    net_requirement = production_demand + reserved_stock + safety_stock - current_stock - incoming_stock
    recommended_quantity = max(net_requirement, 0)
    shortage = predict_shortage(current_stock, reserved_stock, incoming_stock, max(production_demand / 30, 1), supplier_lead_time_days)
    priority = supplier_priority(supplier_lead_time_days, shortage["risk_level"])
    return {
        "recommended_order_quantity": round(recommended_quantity, 2),
        "recommended_order_date": recommended_order_date(supplier_lead_time_days, shortage["risk_level"]),
        "supplier_priority": priority,
        "draft_action": draft_action(
            "REORDER_INVENTORY",
            item_id,
            f"Create purchase request draft for {round(recommended_quantity, 2)} units.",
            shortage["risk_level"],
        ),
    }


def expiry_intelligence(batch_id: str, expiry_date: date, current_quantity: float, average_daily_usage: float) -> dict:
    risk_level, quantity_at_risk, days_to_expiry = classify_expiry_risk(expiry_date, average_daily_usage, current_quantity)
    if risk_level in {"HIGH", "CRITICAL"}:
        action = "Consume expiring batch first or create discount/scrap review draft."
    elif risk_level == "MEDIUM":
        action = "Prioritize this batch in allocation."
    else:
        action = "No immediate action."
    return {
        "batch_id": batch_id,
        "days_to_expiry": days_to_expiry or 0,
        "quantity_at_risk": round(quantity_at_risk, 2),
        "recommended_action": action,
    }


def dead_stock_detection(last_movement_date: date, current_quantity: float, inventory_value: float) -> dict:
    days_without_movement = (date.today() - last_movement_date).days
    status, financial_risk = classify_dead_stock(days_without_movement, inventory_value)
    return {
        "dead_stock_status": status if current_quantity > 0 else "NO_STOCK",
        "days_without_movement": days_without_movement,
        "financial_risk": financial_risk,
    }


def production_impact(production_order_id: str, required_materials: list[dict], available_inventory: dict, incoming_inventory: dict) -> dict:
    shortage_items = []
    for material in required_materials:
        item_id = material["item_id"]
        required = material["required_quantity"]
        available = available_inventory.get(item_id, 0) + incoming_inventory.get(item_id, 0)
        if available < required:
            shortage_items.append({"item_id": item_id, "required_quantity": required, "available_plus_incoming": available, "shortage": required - available})
    if shortage_items:
        delay_risk = "HIGH" if len(shortage_items) > 1 else "MEDIUM"
    else:
        delay_risk = "LOW"
    return {
        "production_order_id": production_order_id,
        "can_produce": not shortage_items,
        "shortage_items": shortage_items,
        "production_delay_risk": delay_risk,
    }


def risk_center(signals: Iterable[InventorySignal]) -> dict:
    rows = []
    risks = []
    actions = []
    for signal in signals:
        shortage = predict_shortage(signal.current_stock, signal.reserved_quantity, signal.incoming_quantity, signal.daily_consumption, signal.supplier_lead_time_days)
        supplier_risk = classify_supplier_delay_risk(signal.supplier_lead_time_days, signal.supplier_delivery_reliability)
        expiry_risk, quantity_at_risk, days_to_expiry = classify_expiry_risk(signal.expiry_date, signal.daily_consumption, signal.current_stock)
        dead_stock = dead_stock_detection(signal.last_movement_date, signal.current_stock, signal.inventory_value)
        overstock = predict_overstock(signal.current_stock, signal.average_monthly_usage, signal.max_stock_level)
        rows.append({
            "item_id": signal.item_id,
            "sku": signal.sku,
            "shortage_risk": shortage["risk_level"],
            "supplier_delay_risk": supplier_risk,
            "expiry_risk": expiry_risk,
            "dead_stock_status": dead_stock["dead_stock_status"],
            "overstock_risk": overstock["overstock_risk"],
        })
        checks = [
            ("low_stock_risk", shortage["risk_level"], "Review reorder point and open purchase draft."),
            ("stockout_risk", shortage["risk_level"], "Expedite incoming stock or transfer inventory."),
            ("supplier_delay_risk", supplier_risk, "Review backup or emergency supplier."),
            ("production_risk", shortage["risk_level"] if signal.production_demand > signal.current_stock + signal.incoming_quantity else "LOW", "Check production order material availability."),
            ("expiry_risk", expiry_risk, f"{round(quantity_at_risk, 2)} units may expire before consumption."),
            ("dead_stock_risk", dead_stock["financial_risk"], "Review transfer, discount, return or write-off draft."),
        ]
        for risk_type, risk_level, recommendation in checks:
            if risk_level in {"MEDIUM", "HIGH", "CRITICAL"}:
                risks.append({
                    "item_id": signal.item_id,
                    "sku": signal.sku,
                    "risk_type": risk_type,
                    "risk_level": risk_level,
                    "reason": recommendation,
                    "recommended_action": recommendation,
                    "requires_human_approval": True,
                })
                actions.append(draft_action(risk_type.upper(), signal.item_id, recommendation, risk_level))
    frame = pd.DataFrame(rows)
    summary = frame.to_dict(orient="records") if not frame.empty else []
    return {"risks": risks, "draft_actions": actions, "risk_summary": summary}


def optimization(signals: Iterable[InventorySignal]) -> list[dict]:
    recommendations = []
    for signal in signals:
        shortage = predict_shortage(signal.current_stock, signal.reserved_quantity, signal.incoming_quantity, signal.daily_consumption, signal.supplier_lead_time_days)
        overstock = predict_overstock(signal.current_stock, signal.average_monthly_usage, signal.max_stock_level)
        expiry = expiry_intelligence(signal.batch_id or signal.item_id, signal.expiry_date, signal.current_stock, signal.daily_consumption) if signal.expiry_date else None
        if shortage["risk_level"] in {"HIGH", "CRITICAL"}:
            recommendations.append(draft_action("INCREASE_SAFETY_STOCK", signal.item_id, "Increase safety stock because stockout risk is high.", shortage["risk_level"]))
            recommendations.append(draft_action("REORDER_INVENTORY", signal.item_id, "Create reorder draft to avoid stockout.", shortage["risk_level"]))
        if overstock["overstock_risk"] in {"MEDIUM", "HIGH"}:
            recommendations.append(draft_action("REDUCE_SAFETY_STOCK", signal.item_id, "Reduce safety stock or pause procurement due to overstock.", overstock["overstock_risk"]))
            recommendations.append(draft_action("TRANSFER_INVENTORY", signal.item_id, "Transfer excess inventory to a plant with demand.", overstock["overstock_risk"]))
        if expiry and expiry["quantity_at_risk"] > 0:
            recommendations.append(draft_action("CONSUME_EXPIRING_BATCH_FIRST", signal.item_id, expiry["recommended_action"], "HIGH"))
    return recommendations
