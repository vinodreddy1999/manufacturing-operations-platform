from __future__ import annotations

from collections import Counter, defaultdict
from datetime import date, timedelta
from typing import Any

from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from ..database import get_db
from ..metadata_store import list_metadata, upsert_metadata
from ..schemas import (
    ApiResult,
    InventoryCountRequest,
    InventoryMobileScanRequest,
    InventoryMovementRequest,
    InventoryReservationRequest,
    ModuleKey,
)

router = APIRouter(prefix="/inventory", tags=["Inventory"])


def result(action: str, message: str, data: dict[str, Any] | list[dict[str, Any]]) -> ApiResult:
    return ApiResult(module=ModuleKey.INVENTORY, action=action, message=message, data=data)


def _items(db: Session) -> list[dict[str, Any]]:
    return list_metadata(db, "inventory_item", company_id="company-c", plant_id="plant-north")


def _balances(db: Session) -> list[dict[str, Any]]:
    return list_metadata(db, "inventory_balance", company_id="company-c", plant_id="plant-north")


def _locations(db: Session) -> list[dict[str, Any]]:
    return list_metadata(db, "location", company_id="company-c", plant_id="plant-north")


def _item_by_id(db: Session, item_id: str) -> dict[str, Any] | None:
    return next((item for item in _items(db) if item["id"] == item_id), None)


def _balance_by_item(db: Session, item_id: str) -> list[dict[str, Any]]:
    return [balance for balance in _balances(db) if balance["item_id"] == item_id]


def _location_by_id(db: Session, location_id: str | None) -> dict[str, Any] | None:
    if not location_id:
        return None
    return next((location for location in _locations(db) if location["id"] == location_id), None)


def _supplier_links_for_item(db: Session, item_id: str) -> list[dict[str, Any]]:
    return [link for link in list_metadata(db, "supplier_link", company_id="company-c", plant_id="plant-north") if link["item_id"] == item_id]


@router.get("/dashboard", response_model=ApiResult)
def inventory_dashboard(db: Session = Depends(get_db)) -> ApiResult:
    balances = _balances(db)
    items = _items(db)
    batches = list_metadata(db, "batch", company_id="company-c", plant_id="plant-north")
    locations = _locations(db)
    total_value = sum(balance["physical"] * balance["unit_cost"] for balance in balances)
    available = sum(balance["available"] for balance in balances)
    reserved = sum(balance["reserved"] for balance in balances)
    blocked = [
        balance for balance in balances
        if balance["status"] in {"DAMAGED", "REJECTED", "QUARANTINE", "EXPIRED"}
    ]
    low_stock = []
    for item in items:
        item_available = sum(balance["available"] for balance in _balance_by_item(db, item["id"]))
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
        batch for batch in batches
        if batch.get("expiry_date") and date.fromisoformat(batch["expiry_date"]) <= today + timedelta(days=45)
    ]
    occupancy = {
        "average_percent": round(sum(location["occupancy_percent"] for location in locations) / len(locations), 2),
        "full_bins": [location for location in locations if location["occupancy_percent"] >= 90],
        "congested_bins": [location for location in locations if 75 <= location["occupancy_percent"] < 90],
        "empty_bins": [location for location in locations if location["occupancy_percent"] == 0],
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
def inventory_items(db: Session = Depends(get_db)) -> ApiResult:
    return result("list_items", "Inventory item master data.", _items(db))


@router.get("/items/by-category", response_model=ApiResult)
def inventory_items_by_category(db: Session = Depends(get_db)) -> ApiResult:
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for item in _items(db):
        grouped[item["category"]].append(item)
    return result("items_by_category", "Items grouped by raw materials, WIP, finished goods, consumables and spare parts.", dict(grouped))


@router.get("/tracking-types", response_model=ApiResult)
def tracking_types(db: Session = Depends(get_db)) -> ApiResult:
    counts = Counter(item["tracking_type"] for item in _items(db))
    return result("tracking_types", "Tracking type summary for none, batch, serial and batch+serial inventory.", {"supported_tracking_types": ["NONE", "BATCH", "SERIAL", "BATCH_AND_SERIAL"], "counts": dict(counts)})


@router.get("/balances", response_model=ApiResult)
def inventory_balances(db: Session = Depends(get_db)) -> ApiResult:
    return result("stock_balances", "Current physical, reserved and available stock.", _balances(db))


@router.get("/locations", response_model=ApiResult)
def stock_locations(db: Session = Depends(get_db)) -> ApiResult:
    enriched = []
    for balance in _balances(db):
        item = _item_by_id(db, balance["item_id"])
        location = _location_by_id(db, balance["location_id"])
        enriched.append({**balance, "sku": item["sku"] if item else None, "description": item["description"] if item else None, "exact_product_location": location})
    return result("stock_locations", "Plant, warehouse, zone, rack, shelf and bin level product locations.", enriched)


@router.get("/warehouse-map", response_model=ApiResult)
def warehouse_map(search_item_id: str | None = None, db: Session = Depends(get_db)) -> ApiResult:
    map_bins = []
    for location in _locations(db):
        matching_balances = [
            balance for balance in _balances(db)
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
def batch_serial_tracking(db: Session = Depends(get_db)) -> ApiResult:
    return result("batch_serial_tracking", "Batch, serial, supplier batch, manufacturing date, expiry date and status tracking.", list_metadata(db, "batch", company_id="company-c", plant_id="plant-north"))


@router.get("/status", response_model=ApiResult)
def inventory_status(db: Session = Depends(get_db)) -> ApiResult:
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for balance in _balances(db):
        grouped[balance["status"]].append(balance)
    return result(
        "status_view",
        "Inventory status view across available, reserved, allocated, in transit, quarantine, rejected, expired, consumed, returned and damaged stock.",
        {"supported_statuses": ["AVAILABLE", "RESERVED", "ALLOCATED", "IN_TRANSIT", "QUARANTINE", "REJECTED", "EXPIRED", "CONSUMED", "RETURNED", "DAMAGED"], "balances_by_status": dict(grouped)},
    )


@router.get("/reservations", response_model=ApiResult)
def list_reservations(db: Session = Depends(get_db)) -> ApiResult:
    reservations = []
    for reservation in list_metadata(db, "inventory_reservation", company_id="company-c", plant_id="plant-north"):
        item = _item_by_id(db, reservation["item_id"])
        available = sum(balance["available"] for balance in _balance_by_item(db, reservation["item_id"]))
        reservations.append({**reservation, "sku": item["sku"] if item else None, "available_after_reservations": max(available - reservation["quantity"], 0)})
    return result("reservation_view", "Reserved stock for production, customer orders, transfers and maintenance.", reservations)


@router.post("/reservations", response_model=ApiResult)
def create_reservation(request: InventoryReservationRequest, db: Session = Depends(get_db)) -> ApiResult:
    reservation = {**request.model_dump(), "status": "ACTIVE", "id": f"res-{request.item_id}-{request.reservation_type.lower()}-{len(list_metadata(db, 'inventory_reservation', company_id='company-c', plant_id='plant-north'))+1}"}
    upsert_metadata(
        db,
        category="inventory_reservation",
        record_key=reservation["id"],
        row_id=reservation["id"],
        company_id="company-c",
        plant_id="plant-north",
        payload=reservation,
        name=request.reserved_for,
    )
    db.commit()
    return result("create_reservation", "Inventory reservation created.", reservation)


@router.get("/movement-ledger", response_model=ApiResult)
def movement_ledger(db: Session = Depends(get_db)) -> ApiResult:
    return result("movement_ledger", "Receiving, transfer, adjustment, consumption, return, damage, write-off and scrap audit trail.", list_metadata(db, "inventory_movement", company_id="company-c", plant_id="plant-north"))


@router.post("/movements", response_model=ApiResult)
def create_inventory_movement(request: InventoryMovementRequest, db: Session = Depends(get_db)) -> ApiResult:
    current = list_metadata(db, "inventory_movement", company_id="company-c", plant_id="plant-north")
    movement = {**request.model_dump(), "audit_status": "RECORDED", "created_by": "demo-user", "id": f"mov-{len(current)+1:04d}"}
    upsert_metadata(
        db,
        category="inventory_movement",
        record_key=movement["id"],
        row_id=movement["id"],
        company_id="company-c",
        plant_id="plant-north",
        payload=movement,
        name=request.movement_type,
    )
    db.commit()
    return result("create_movement", "Inventory movement recorded and ready for audit.", movement)


@router.get("/stock-counts", response_model=ApiResult)
def list_stock_counts(db: Session = Depends(get_db)) -> ApiResult:
    return result("stock_counting", "Manual, cycle, barcode, QR and blind count workflows with variance and approval status.", list_metadata(db, "stock_count", company_id="company-c", plant_id="plant-north"))


@router.post("/stock-counts", response_model=ApiResult)
def create_stock_count(request: InventoryCountRequest, db: Session = Depends(get_db)) -> ApiResult:
    variance = request.counted_quantity - request.expected_quantity
    approval_status = "APPROVAL_REQUIRED" if abs(variance) > request.variance_tolerance else "AUTO_ACCEPTED"
    current = list_metadata(db, "stock_count", company_id="company-c", plant_id="plant-north")
    count = {**request.model_dump(), "variance": variance, "approval_status": approval_status, "id": f"count-{len(current)+1:04d}"}
    upsert_metadata(
        db,
        category="stock_count",
        record_key=count["id"],
        row_id=count["id"],
        company_id="company-c",
        plant_id="plant-north",
        payload=count,
        name=request.item_id,
    )
    db.commit()
    return result("create_stock_count", "Stock count captured with variance analysis.", count)


@router.get("/expiry-aging", response_model=ApiResult)
def expiry_aging(db: Session = Depends(get_db)) -> ApiResult:
    today = date.today()
    expiring_soon = []
    expired = []
    batches = list_metadata(db, "batch", company_id="company-c", plant_id="plant-north")
    for batch in batches:
        expiry = batch.get("expiry_date")
        if not expiry:
            continue
        expiry_date = date.fromisoformat(expiry)
        if expiry_date < today:
            expired.append(batch)
        elif expiry_date <= today + timedelta(days=45):
            expiring_soon.append(batch)
    return result("expiry_aging", "Expiry, aging, non-moving and slow-moving stock with suggested actions.", {"expiring_soon": expiring_soon, "expired_stock": expired, "non_moving_stock": list_metadata(db, "non_moving_stock", company_id="company-c", plant_id="plant-north"), "slow_moving_stock": list_metadata(db, "slow_moving_stock", company_id="company-c", plant_id="plant-north"), "suggested_actions": list_metadata(db, "expiry_action", company_id="company-c", plant_id="plant-north")})


@router.get("/procurement-recommendations", response_model=ApiResult)
def procurement_recommendations(db: Session = Depends(get_db)) -> ApiResult:
    recommendations = []
    for item in _items(db):
        available = sum(balance["available"] for balance in _balance_by_item(db, item["id"]))
        if available <= item["reorder_level"]:
            primary_supplier = next((link for link in _supplier_links_for_item(db, item["id"]) if link["role"] == "PRIMARY"), None)
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
def supplier_links(db: Session = Depends(get_db)) -> ApiResult:
    return result("supplier_links", "Primary, backup and emergency supplier links with lead time and quality rating.", list_metadata(db, "supplier_link", company_id="company-c", plant_id="plant-north"))


@router.get("/costs", response_model=ApiResult)
def inventory_costs(db: Session = Depends(get_db)) -> ApiResult:
    balances = _balances(db)
    valuation = sum(balance["physical"] * balance["unit_cost"] for balance in balances)
    damaged_cost = sum(balance["physical"] * balance["unit_cost"] for balance in balances if balance["status"] == "DAMAGED")
    expiry_loss = sum(item["estimated_loss"] for item in list_metadata(db, "expiry_action", company_id="company-c", plant_id="plant-north"))
    return result("inventory_cost", "FIFO costing, inventory valuation, wastage cost, damaged stock cost and expiry loss.", {"costing_method": "FIFO", "inventory_valuation": round(valuation, 2), "wastage_cost": 18400, "damaged_stock_cost": round(damaged_cost, 2), "expiry_loss": expiry_loss, "fifo_layers": list_metadata(db, "fifo_layer", company_id="company-c", plant_id="plant-north")})


@router.get("/reports", response_model=ApiResult)
def inventory_reports(db: Session = Depends(get_db)) -> ApiResult:
    return result("reports", "Inventory status, aging, valuation, movement, occupancy and supplier performance reports.", list_metadata(db, "inventory_report", company_id="company-c", plant_id="plant-north"))


@router.post("/mobile/scan", response_model=ApiResult)
def mobile_scan(request: InventoryMobileScanRequest, db: Session = Depends(get_db)) -> ApiResult:
    current = list_metadata(db, "inventory_mobile_scan", company_id="company-c", plant_id="plant-north")
    scan = {**request.model_dump(), "sync_status": "QUEUED_OFFLINE" if request.offline else "SYNCED", "photo_count": len(request.photo_urls), "id": f"scan-{len(current)+1:04d}"}
    upsert_metadata(
        db,
        category="inventory_mobile_scan",
        record_key=scan["id"],
        row_id=scan["id"],
        company_id="company-c",
        plant_id="plant-north",
        payload=scan,
        name=request.action,
    )
    db.commit()
    return result("mobile_scan", "Mobile inventory action captured for receive, move, scan, count, photo upload or offline sync.", scan)
