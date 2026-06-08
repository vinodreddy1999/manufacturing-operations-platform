from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_modules_are_available():
    response = client.get("/modules")
    assert response.status_code == 200
    modules = {item["key"] for item in response.json()}
    assert "INVENTORY" in modules
    assert "PRODUCTION" in modules
    assert "AI" in modules


def test_demo_login():
    response = client.post(
        "/auth/login",
        json={
            "tenant_slug": "precision-components",
            "email": "admin@mop.local",
            "password": "ChangeMe123!",
        },
    )
    assert response.status_code == 200
    assert response.json()["token_type"] == "bearer"


def test_inventory_balances():
    response = client.get("/inventory/balances")
    assert response.status_code == 200
    assert response.json()["module"] == "INVENTORY"



def test_inventory_dashboard():
    response = client.get("/inventory/dashboard")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["total_inventory_value"] > 0
    assert "low_stock_risks" in data
    assert "warehouse_occupancy" in data


def test_inventory_items_by_category():
    response = client.get("/inventory/items/by-category")
    assert response.status_code == 200
    data = response.json()["data"]
    assert "RAW_MATERIALS" in data
    assert "FINISHED_GOODS" in data


def test_inventory_warehouse_map_highlight():
    response = client.get("/inventory/warehouse-map?search_item_id=item-steel")
    assert response.status_code == 200
    bins = response.json()["data"]["bins"]
    assert any(item["highlight"] for item in bins)


def test_inventory_reservation_create():
    response = client.post(
        "/inventory/reservations",
        json={
            "item_id": "item-steel",
            "quantity": 100,
            "reservation_type": "TRANSFER",
            "reserved_for": "Transfer request TR-100",
        },
    )
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "ACTIVE"


def test_inventory_mobile_scan():
    response = client.post(
        "/inventory/mobile/scan",
        json={"action": "SCAN_BIN", "location_id": "bin-a-01-01", "barcode_or_qr": "BIN:A-01-01"},
    )
    assert response.status_code == 200
    assert response.json()["data"]["sync_status"] == "SYNCED"


def test_core_company_seed_available():
    response = client.get("/companies")
    assert response.status_code == 200
    companies = response.json()
    assert any(company["id"] == "company-c" for company in companies)


def test_feature_flag_toggle():
    response = client.post("/feature-flags/warehouse/disable")
    assert response.status_code == 200
    assert response.json()["enabled"] is False

    response = client.post("/feature-flags/warehouse/enable")
    assert response.status_code == 200
    assert response.json()["enabled"] is True


def test_generic_module_record_create():
    response = client.post(
        "/purchase-orders",
        json={
            "record_code": "PO-1001",
            "name": "Demo purchase order",
            "quantity": 25,
            "payload": {"supplier_id": "supplier-apex"},
        },
    )
    assert response.status_code == 200
    assert response.json()["module_key"] == "purchase_orders"


def test_production_dashboard():
    response = client.get("/production/dashboard")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["active_orders"] >= 1
    assert "material_shortages" in data
    assert "line_utilization" in data


def test_production_material_requirements():
    response = client.post("/production/orders/po-demo-001/material-requirements")
    assert response.status_code == 200
    data = response.json()["data"]
    assert any(item["material_item"] == "item-steel" for item in data)
    assert all("shortage_quantity" in item for item in data)


def test_production_reserve_materials_tracks_shortage():
    response = client.post("/production/orders/po-demo-001/reserve-materials")
    assert response.status_code == 200
    data = response.json()["data"]
    assert "reservations" in data
    assert data["production_order"]["status"] in {"Material Reserved", "Material Shortage"}


def test_production_ai_draft_actions_are_safe():
    response = client.get("/production/ai/draft-actions")
    assert response.status_code == 200
    data = response.json()["data"]
    assert all(action["requires_human_approval"] for action in data["drafts"])
    assert "Change Schedule" in data["ai_safety"]["cannot"]


def test_maintenance_dashboard():
    response = client.get("/maintenance/dashboard")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["open_work_orders"] >= 1
    assert "mttr_minutes" in data
    assert "spare_shortages" in data


def test_maintenance_root_machine_alias():
    response = client.get("/machines")
    assert response.status_code == 200
    assert response.json()["module"] == "MAINTENANCE"
    assert any(machine["machine_id"] == "M-ASM-01" for machine in response.json()["data"])


def test_maintenance_spare_reservation_creates_shortage():
    response = client.post(
        "/maintenance/spare-reservations",
        json={"work_order_id": "wo-breakdown-001", "spare_part_id": "spare-spindle-bearing", "required_quantity": 1},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["status"] == "WAITING_FOR_SPARE"
    assert data["shortage_quantity"] == 1


def test_maintenance_work_order_lifecycle_assign_start():
    assign = client.post(
        "/work-orders/wo-breakdown-001/assign",
        json={"assigned_user_id": "tech-sita", "skill_required": "CNC spindle maintenance"},
    )
    assert assign.status_code == 200
    assert assign.json()["data"]["work_order"]["status"] == "Assigned"

    start = client.post("/work-orders/wo-breakdown-001/start")
    assert start.status_code == 200
    assert start.json()["data"]["status"] == "In Progress"


def test_maintenance_ai_draft_action_is_safe():
    response = client.post(
        "/ai/maintenance/draft-action",
        json={"action_type": "Draft work order", "machine_id": "M-CUT-01", "reason": "Repeated spindle vibration"},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["requires_human_approval"] is True
    assert "Close Work Order" in data["ai_safety"]["cannot"]
