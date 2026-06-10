from __future__ import annotations

from collections import Counter, defaultdict
from datetime import date, timedelta
from typing import Any

from fastapi import APIRouter

from ..schemas import (
    ApiResult,
    InventoryCountRequest,
    InventoryMobileScanRequest,
    InventoryMovementRequest,
    InventoryReservationRequest,
    ModuleKey,
)
from ..store import store

router = APIRouter(prefix="/inventory", tags=["Inventory"])


def result(action: str, message: str, data: dict[str, Any] | list[dict[str, Any]]) -> ApiResult:
    return ApiResult(module=ModuleKey.INVENTORY, action=action, message=message, data=data)


def _item_by_id(item_id: str) -> dict[str, Any] | None:
    return next((item for item in store.inventory_items if item["id"] == item_id), None)


def _balance_by_item(item_id: str) -> list[dict[str, Any]]:
    return [balance for balance in store.balances if balance["item_id"] == item_id]


def _location_by_id(location_id: str | None) -> dict[str, Any] | None:
    if not location_id:
        return None
    return next((location for location in store.locations if location["id"] == location_id), None)


def _supplier_links_for_item(item_id: str) -> list[dict[str, Any]]:
    return [link for link in store.supplier_links if link["item_id"] == item_id]


@router.get("/dashboard", response_model=ApiResult)
def inventory_dashboard() -> ApiResult:
    total_value = sum(balance["physical"] * balance["unit_cost"] for balance in store.balances)
    available = sum(balance["available"] for balance in store.balances)
    reserved = sum(balance["reserved"] for balance in store.balances)
    blocked = [
        balance for balance in store.balances
        if balance["status"] in {"DAMAGED", "REJECTED", "QUARANTINE", "EXPIRED"}
    ]
    low_stock = []
    for item in store.inventory_items:
        item_available = sum(balance["available"] for balance in _balance_by_item(item["id"]))
        if item_available <= item["reorder_level"]:
            low_stock.append({
                "item_id": item["id"],
                "sku": item["sku"],
                "available": item_available,
                "reorder_level": item["reorder_level"],
                "risk": "LOW_STOCK",
            })
    today = date.today()
    expiring_soon = [
        batch for batch in store.batches
        if batch.get("expiry_date") and date.fromisoformat(batch["expiry_date"]) <= today + timedelta(days=45)
    ]
    occupancy = {
        "average_percent": round(sum(location["occupancy_percent"] for location in store.locations) / len(store.locations), 2),
        "full_bins": [location for location in store.locations if location["occupancy_percent"] >= 90],
        "congested_bins": [location for location in store.locations if 75 <= location["occupancy_percent"] < 90],
        "empty_bins": [location for location in store.locations if location["occupancy_percent"] == 0],
    }
    return result(
        "dashboard",
        "Inventory dashboard with value, stock risk, expiry risk and warehouse occupancy.",
        {
            "total_inventory_value": round(total_value, 2),
            "available_stock": available,
            "reserved_stock": reserved,
            "low_stock_risks": low_stock,
            "expiry_risks": expiring_soon,
            "damaged_rejected_quarantine_stock": blocked,
            "warehouse_occupancy": occupancy,
        },
    )


@router.get("/items", response_model=ApiResult)
def inventory_items() -> ApiResult:
    return result("list_items", "Inventory item master data.", store.snapshot(store.inventory_items))


@router.get("/items/by-category", response_model=ApiResult)
def inventory_items_by_category() -> ApiResult:
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for item in store.inventory_items:
        grouped[item["category"]].append(item)
    return result("items_by_category", "Items grouped by raw materials, WIP, finished goods, consumables and spare parts.", dict(grouped))


@router.get("/tracking-types", response_model=ApiResult)
def tracking_types() -> ApiResult:
    counts = Counter(item["tracking_type"] for item in store.inventory_items)
    return result("tracking_types", "Tracking type summary for none, batch, serial and batch+serial inventory.", {"supported_tracking_types": ["NONE", "BATCH", "SERIAL", "BATCH_AND_SERIAL"], "counts": dict(counts)})


@router.get("/balances", response_model=ApiResult)
def inventory_balances() -> ApiResult:
    return result("stock_balances", "Current physical, reserved and available stock.", store.snapshot(store.balances))


@router.get("/locations", response_model=ApiResult)
def stock_locations() -> ApiResult:
    enriched = []
    for balance in store.balances:
        item = _item_by_id(balance["item_id"])
        location = _location_by_id(balance["location_id"])
        enriched.append({**balance, "sku": item["sku"] if item else None, "description": item["description"] if item else None, "exact_product_location": location})
    return result("stock_locations", "Plant, warehouse, zone, rack, shelf and bin level product locations.", enriched)


@router.get("/warehouse-map", response_model=ApiResult)
def warehouse_map(search_item_id: str | None = None) -> ApiResult:
    map_bins = []
    for location in store.locations:
        matching_balances = [
            balance for balance in store.balances
            if balance["location_id"] == location["id"] and (search_item_id is None or balance["item_id"] == search_item_id)
        ]
        if location["occupancy_percent"] == 0:
            status = "EMPTY"
        elif location["occupancy_percent"] >= 90:
            status = "FULL"
        elif location["occupancy_percent"] >= 75:
            status = "CONGESTED"
        else:
            status = "AVAILABLE"
        map_bins.append({**location, "map_status": status, "highlight": bool(search_item_id and matching_balances), "items": matching_balances})
    return result("warehouse_map", "2D warehouse layout with bin/rack occupancy and searched item highlighting.", {"searched_item_id": search_item_id, "bins": map_bins})


@router.get("/batches", response_model=ApiResult)
def batch_serial_tracking() -> ApiResult:
    return result("batch_serial_tracking", "Batch, serial, supplier batch, manufacturing date, expiry date and status tracking.", store.snapshot(store.batches))


@router.get("/status", response_model=ApiResult)
def inventory_status() -> ApiResult:
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for balance in store.balances:
        grouped[balance["status"]].append(balance)
    return result(
        "status_view",
        "Inventory status view across available, reserved, allocated, in transit, quarantine, rejected, expired, consumed, returned and damaged stock.",
        {"supported_statuses": ["AVAILABLE", "RESERVED", "ALLOCATED", "IN_TRANSIT", "QUARANTINE", "REJECTED", "EXPIRED", "CONSUMED", "RETURNED", "DAMAGED"], "balances_by_status": dict(grouped)},
    )


@router.get("/reservations", response_model=ApiResult)
def list_reservations() -> ApiResult:
    reservations = []
    for reservation in store.reservations:
        item = _item_by_id(reservation["item_id"])
        available = sum(balance["available"] for balance in _balance_by_item(reservation["item_id"]))
        reservations.append({**reservation, "sku": item["sku"] if item else None, "available_after_reservations": max(available - reservation["quantity"], 0)})
    return result("reservation_view", "Reserved stock for production, customer orders, transfers and maintenance.", reservations)


@router.post("/reservations", response_model=ApiResult)
def create_reservation(request: InventoryReservationRequest) -> ApiResult:
    reservation = store.create_record(store.reservations, {**request.model_dump(), "status": "ACTIVE"})
    return result("create_reservation", "Inventory reservation created.", reservation)


@router.get("/movement-ledger", response_model=ApiResult)
def movement_ledger() -> ApiResult:
    return result("movement_ledger", "Receiving, transfer, adjustment, consumption, return, damage, write-off and scrap audit trail.", store.snapshot(store.seed_movements + store.movements))


@router.post("/movements", response_model=ApiResult)
def create_inventory_movement(request: InventoryMovementRequest) -> ApiResult:
    movement = store.create_record(store.movements, {**request.model_dump(), "audit_status": "RECORDED", "created_by": "demo-user"})
    return result("create_movement", "Inventory movement recorded and ready for audit.", movement)


@router.get("/stock-counts", response_model=ApiResult)
def list_stock_counts() -> ApiResult:
    return result("stock_counting", "Manual, cycle, barcode, QR and blind count workflows with variance and approval status.", store.snapshot(store.stock_counts))


@router.post("/stock-counts", response_model=ApiResult)
def create_stock_count(request: InventoryCountRequest) -> ApiResult:
    variance = request.counted_quantity - request.expected_quantity
    approval_status = "APPROVAL_REQUIRED" if abs(variance) > request.variance_tolerance else "AUTO_ACCEPTED"
    count = store.create_record(store.stock_counts, {**request.model_dump(), "variance": variance, "approval_status": approval_status})
    return result("create_stock_count", "Stock count captured with variance analysis.", count)


@router.get("/expiry-aging", response_model=ApiResult)
def expiry_aging() -> ApiResult:
    today = date.today()
    expiring_soon = []
    expired = []
    for batch in store.batches:
        expiry = batch.get("expiry_date")
        if not expiry:
            continue
        expiry_date = date.fromisoformat(expiry)
        if expiry_date < today:
            expired.append(batch)
        elif expiry_date <= today + timedelta(days=45):
            expiring_soon.append(batch)
    return result("expiry_aging", "Expiry, aging, non-moving and slow-moving stock with suggested actions.", {"expiring_soon": expiring_soon, "expired_stock": expired, "non_moving_stock": store.snapshot(store.non_moving_stock), "slow_moving_stock": store.snapshot(store.slow_moving_stock), "suggested_actions": store.snapshot(store.expiry_actions)})


@router.get("/procurement-recommendations", response_model=ApiResult)
def procurement_recommendations() -> ApiResult:
    recommendations = []
    for item in store.inventory_items:
        available = sum(balance["available"] for balance in _balance_by_item(item["id"]))
        if available <= item["reorder_level"]:
            primary_supplier = next((link for link in _supplier_links_for_item(item["id"]) if link["role"] == "PRIMARY"), None)
            recommendations.append({
                "item_id": item["id"],
                "sku": item["sku"],
                "available": available,
                "reorder_level": item["reorder_level"],
                "safety_stock": item["safety_stock"],
                "supplier_lead_time_days": primary_supplier["lead_time_days"] if primary_supplier else None,
                "purchase_request_draft": {"quantity": max(item["safety_stock"] + item["reorder_level"] - available, 0), "status": "DRAFT"},
            })
    return result("procurement_recommendations", "Low-stock procurement recommendations with reorder level, safety stock and supplier lead time.", recommendations)


@router.get("/supplier-links", response_model=ApiResult)
def supplier_links() -> ApiResult:
    return result("supplier_links", "Primary, backup and emergency supplier links with lead time and quality rating.", store.snapshot(store.supplier_links))


@router.get("/costs", response_model=ApiResult)
def inventory_costs() -> ApiResult:
    valuation = sum(balance["physical"] * balance["unit_cost"] for balance in store.balances)
    damaged_cost = sum(balance["physical"] * balance["unit_cost"] for balance in store.balances if balance["status"] == "DAMAGED")
    expiry_loss = sum(item["estimated_loss"] for item in store.expiry_actions)
    return result("inventory_cost", "FIFO costing, inventory valuation, wastage cost, damaged stock cost and expiry loss.", {"costing_method": "FIFO", "inventory_valuation": round(valuation, 2), "wastage_cost": 18400, "damaged_stock_cost": round(damaged_cost, 2), "expiry_loss": expiry_loss, "fifo_layers": store.snapshot(store.fifo_layers)})


@router.get("/reports", response_model=ApiResult)
def inventory_reports() -> ApiResult:
    return result("reports", "Inventory status, aging, valuation, movement, occupancy and supplier performance reports.", store.snapshot(store.inventory_reports))


@router.post("/mobile/scan", response_model=ApiResult)
def mobile_scan(request: InventoryMobileScanRequest) -> ApiResult:
    scan = store.create_record(store.mobile_scans, {**request.model_dump(), "sync_status": "QUEUED_OFFLINE" if request.offline else "SYNCED", "photo_count": len(request.photo_urls)})
    return result("mobile_scan", "Mobile inventory action captured for receive, move, scan, count, photo upload or offline sync.", scan)
