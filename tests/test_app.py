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


def test_quality_dashboard():
    response = client.get("/quality/dashboard")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["quality_enabled"] is True
    assert "pending_inspections" in data
    assert "cost_of_poor_quality" in data


def test_quality_inspection_failure_creates_quarantine():
    start = client.post("/quality/inspection-lots/lot-incoming-001/start")
    assert start.status_code == 200
    assert start.json()["data"]["status"] == "In Inspection"

    submit = client.post(
        "/quality/inspection-lots/lot-incoming-001/submit",
        json={
            "inspected_by": "qa-user",
            "results": [
                {
                    "checklist_item_id": "chk-item-thickness",
                    "measured_value": "10.8",
                    "result_status": "Failed",
                    "defect_code": "VIS-SCRATCH",
                    "comments": "Out of tolerance",
                }
            ],
        },
    )
    assert submit.status_code == 200
    assert submit.json()["data"]["inspection_lot"]["status"] == "Quarantine"

    quarantine = client.get("/quality/quarantine")
    assert quarantine.status_code == 200
    assert len(quarantine.json()["data"]) >= 1


def test_quality_kpis_and_reports():
    kpis = client.get("/quality/kpis")
    assert kpis.status_code == 200
    assert "first_pass_yield" in kpis.json()["data"]

    reports = client.get("/quality/reports")
    assert reports.status_code == 200
    assert "inspection_report" in reports.json()["data"]


def test_quality_ai_draft_action_is_safe():
    response = client.post(
        "/ai/quality/draft-action",
        json={"action_type": "Draft CAPA", "source_type": "Defect", "source_id": "defect-visual-001", "reason": "Repeated supplier defect"},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["requires_human_approval"] is True
    assert "Scrap Inventory" in data["ai_safety"]["cannot"]


def test_sales_dashboard_and_customers():
    dashboard = client.get("/sales/dashboard")
    assert dashboard.status_code == 200
    assert dashboard.json()["data"]["sales_enabled"] is True

    customers = client.get("/customers")
    assert customers.status_code == 200
    assert customers.json()["module"] == "SALES"
    assert any(customer["customer_id"] == "cust-apollo" for customer in customers.json()["data"])


def test_sales_reserve_order_partial_allocation():
    response = client.post("/sales-orders/so-001/reserve")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["order"]["status"] in {"Partially Reserved", "Fully Reserved", "Production Required"}
    assert "production_recommendation" in data


def test_sales_protected_allocation_requires_override_approval():
    response = client.post(
        "/allocations",
        json={"sales_order_id": "so-001", "item_id": "fg-pump-900", "quantity": 50, "override_protected": True},
    )
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "Override Approval Required"


def test_sales_dispatch_and_kpis():
    dispatch = client.post("/sales-orders/so-001/dispatch")
    assert dispatch.status_code == 200
    assert "pick_list" in dispatch.json()["data"]["dispatch_order"]

    kpis = client.get("/sales/kpis")
    assert kpis.status_code == 200
    assert "fill_rate" in kpis.json()["data"]


def test_sales_ai_draft_action_is_safe():
    response = client.post(
        "/ai/sales/draft-action",
        json={"action_type": "Draft production request", "source_type": "Sales Order", "source_id": "so-001", "reason": "Insufficient finished goods"},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["requires_human_approval"] is True
    assert "Dispatch Goods" in data["ai_safety"]["cannot"]


def test_customer_portal_login_and_profile_are_customer_scoped():
    login = client.post("/customer-portal/auth/login", json={"email": "meera@example.com", "password": "Portal123!"})
    assert login.status_code == 200
    assert login.json()["data"]["customer_id"] == "cust-apollo"

    profile = client.get("/customer-portal/profile")
    assert profile.status_code == 200
    data = profile.json()["data"]
    assert data["customer_id"] == "cust-apollo"
    assert "region_id" not in data


def test_customer_portal_orders_hide_internal_details():
    response = client.get("/customer-portal/orders")
    assert response.status_code == 200
    orders = response.json()["data"]
    assert all(order["id"] == "so-001" for order in orders)
    assert "portal_status" in orders[0]
    assert "priority" not in orders[0]


def test_customer_portal_support_and_return_requests():
    support = client.post(
        "/customer-portal/support-requests",
        json={"sales_order_id": "so-001", "request_type": "Delivery issue", "subject": "Need delivery update", "description": "Please update expected delivery."},
    )
    assert support.status_code == 200
    assert support.json()["data"]["customer_id"] == "cust-apollo"

    return_request = client.post(
        "/customer-portal/returns",
        json={"sales_order_id": "so-001", "reason": "Damaged item", "quantity": 1},
    )
    assert return_request.status_code == 200
    assert return_request.json()["data"]["status"] == "Submitted"


def test_customer_portal_document_download_is_scoped():
    response = client.get("/customer-portal/documents/doc-invoice-001/download")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["document_id"] == "doc-invoice-001"
    assert "secure_download_token" in data
    assert "file_url" not in data


def test_customer_portal_ai_draft_action_is_safe_and_sanitized():
    response = client.post(
        "/ai/customer-portal/draft-action",
        json={"action_type": "Draft customer delay email", "customer_id": "cust-apollo", "source_type": "Sales Order", "source_id": "so-001", "reason": "internal shortage in plant"},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["requires_human_approval"] is True
    assert "Release Internal Information" in data["ai_safety"]["cannot"]
    assert "internal shortage" not in data["reason"]


def test_supplier_portal_login_and_profile_are_supplier_scoped():
    login = client.post("/supplier-portal/auth/login", json={"email": "apex@example.com", "password": "Supplier123!"})
    assert login.status_code == 200
    assert login.json()["data"]["supplier_id"] == "supplier-apex"

    profile = client.get("/supplier-portal/profile")
    assert profile.status_code == 200
    data = profile.json()["data"]
    assert data["supplier_id"] == "supplier-apex"
    assert "quality_risk_score" not in data


def test_supplier_portal_purchase_orders_hide_other_suppliers():
    response = client.get("/supplier-portal/purchase-orders")
    assert response.status_code == 200
    orders = response.json()["data"]
    assert any(order["id"] == "po-apex-001" for order in orders)
    assert all(order["id"] != "po-other-001" for order in orders)
    assert "supplier_status" in orders[0]


def test_supplier_portal_acknowledgement_and_delivery_confirmation():
    acknowledgement = client.post(
        "/supplier-portal/purchase-orders/po-apex-001/acknowledge",
        json={
            "acknowledgement_status": "Accepted",
            "confirmed_quantity": 1000,
            "rejected_quantity": 0,
            "confirmed_delivery_date": "2026-06-20",
            "supplier_comments": "Confirmed",
        },
    )
    assert acknowledgement.status_code == 200
    assert acknowledgement.json()["data"]["supplier_id"] == "supplier-apex"

    delivery = client.post(
        "/supplier-portal/delivery-confirmations",
        json={
            "purchase_order_id": "po-apex-001",
            "shipment_reference": "SHIP-APX-001",
            "dispatch_date": "2026-06-16",
            "expected_delivery_date": "2026-06-20",
            "carrier_name": "Blue Dart",
            "vehicle_number": "TS09AB1234",
            "tracking_number": "TRK-001",
            "shipped_quantity": 1000,
            "package_count": 8,
            "supplier_comments": "Loaded",
        },
    )
    assert delivery.status_code == 200
    assert delivery.json()["data"]["status"] == "Submitted"


def test_supplier_portal_documents_and_certificates():
    upload = client.post(
        "/supplier-portal/documents/upload",
        json={"linked_type": "Purchase Order", "linked_id": "po-apex-001", "document_type": "Invoice", "file_url": "https://example.com/invoice.pdf"},
    )
    assert upload.status_code == 200
    assert upload.json()["data"]["status"] == "Pending Review"

    documents = client.get("/supplier-portal/documents")
    assert documents.status_code == 200
    assert any(document["document_type"] == "Invoice" for document in documents.json()["data"])

    certificates = client.get("/supplier-portal/certificates")
    assert certificates.status_code == 200
    assert any(certificate["id"] == "cert-apex-iso" for certificate in certificates.json()["data"])


def test_supplier_portal_enablement_performance_and_tasks():
    enablement = client.get("/supplier-portal/enablement")
    assert enablement.status_code == 200
    data = enablement.json()["data"]
    assert data["feature_flags"]["supplier_portal_enabled"] is True
    assert "po:acknowledge" in data["permissions"]

    performance = client.get("/supplier-portal/performance")
    assert performance.status_code == 200
    assert performance.json()["data"]["visible"] is True
    assert performance.json()["data"]["metrics"]["supplier_id"] == "supplier-apex"

    tasks = client.get("/supplier-portal/tasks")
    assert tasks.status_code == 200
    assert any(task["task_type"] == "Acknowledge PO" for task in tasks.json()["data"])


def test_supplier_portal_ai_draft_action_is_safe_and_sanitized():
    response = client.post(
        "/ai/supplier-portal/draft-action",
        json={
            "action_type": "Draft supplier follow-up",
            "supplier_id": "supplier-apex",
            "source_type": "Purchase Order",
            "source_id": "po-apex-001",
            "reason": "production shortage and inventory risk",
        },
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["requires_human_approval"] is True
    assert "Change PO" in data["ai_safety"]["cannot"]
    assert "production shortage" not in data["reason"]


def test_reporting_catalog_run_and_export():
    catalog = client.get("/reports/catalog?category=Inventory")
    assert catalog.status_code == 200
    reports = catalog.json()["data"]
    assert any(report["report_code"] == "INVENTORY_STATUS_REPORT" for report in reports)

    run = client.post("/reports/run", json={"report_code": "INVENTORY_STATUS_REPORT", "filters": {"risk_level": "HIGH"}, "user_role": "Executive"})
    assert run.status_code == 200
    data = run.json()["data"]
    assert data["run"]["status"] == "Completed"
    assert data["access_policy"] == "tenant/company/role scoped"

    export = client.post("/reports/export", json={"report_code": "INVENTORY_STATUS_REPORT", "export_format": "CSV", "user_role": "Executive"})
    assert export.status_code == 200
    assert export.json()["data"]["export_format"] == "CSV"


def test_reporting_saved_schedule_dashboard_and_kpi():
    saved = client.post(
        "/reports/saved",
        json={"report_name": "My weekly inventory risk", "report_type": "Standard", "owner_user_id": "admin-user", "company_id": "company-c", "columns_json": ["name", "risk_level"], "visibility": "Private"},
    )
    assert saved.status_code == 200
    saved_id = saved.json()["data"]["id"]
    assert client.get(f"/reports/saved/{saved_id}").status_code == 200

    schedule = client.post(
        "/reports/schedules",
        json={"report_id": "report-inventory_status_report", "frequency": "Weekly", "recipients": ["ops@example.com"], "format": "Excel", "active_status": True},
    )
    assert schedule.status_code == 200
    assert schedule.json()["data"]["frequency"] == "Weekly"

    dashboard = client.get("/dashboards/EXECUTIVE")
    assert dashboard.status_code == 200
    assert len(dashboard.json()["data"]["widgets"]) >= 1

    kpi = client.post("/kpis/kpi-fpy/calculate")
    assert kpi.status_code == 200
    assert kpi.json()["data"]["status"] in {"Good", "Warning", "Critical"}


def test_reporting_analytics_and_ai_are_draft_only():
    cross = client.get("/analytics/cross-module")
    assert cross.status_code == 200
    assert cross.json()["data"][0]["risk_level"] == "HIGH"

    summary = client.get("/ai/reporting/executive-summary")
    assert summary.status_code == 200
    assert "recommended_actions" in summary.json()["data"]

    draft = client.post(
        "/ai/reporting/draft-action",
        json={"action_type": "Draft investigation", "source_type": "KPI", "source_id": "kpi-fpy", "reason": "financial record risk and release inventory concern", "owner": "quality-manager"},
    )
    assert draft.status_code == 200
    data = draft.json()["data"]
    assert data["requires_human_approval"] is True
    assert "Modify Financial Records" in data["ai_safety"]["cannot"]
    assert "financial record" not in data["reason"]
