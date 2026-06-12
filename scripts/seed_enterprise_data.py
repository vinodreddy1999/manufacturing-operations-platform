#!/usr/bin/env python3
import json
import os
import sys
import time
from dataclasses import dataclass
from typing import Any
from urllib.error import HTTPError
from urllib.request import Request, urlopen


BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:8080").rstrip("/")


@dataclass(frozen=True)
class SeedUser:
    email: str
    name: str
    role: str
    password: str
    is_active: bool = True


def request_json(method: str, path: str, payload: dict[str, Any] | None = None, token: str | None = None) -> dict[str, Any]:
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    request = Request(f"{BASE_URL}{path}", data=body, method=method)
    request.add_header("Accept", "application/json")
    if payload is not None:
        request.add_header("Content-Type", "application/json")
    if token:
        request.add_header("Authorization", f"Bearer {token}")
    with urlopen(request, timeout=20) as response:
        return json.loads(response.read().decode("utf-8"))


def safe_post(path: str, token: str, payload: dict[str, Any], duplicate_ok: bool = False) -> tuple[bool, str]:
    try:
        request_json("POST", path, payload, token)
        return True, "created"
    except HTTPError as error:
        if duplicate_ok and error.code == 409:
            return False, "exists"
        detail = error.read().decode("utf-8")
        raise RuntimeError(f"POST {path} failed: {error.code} {detail}") from error


def login() -> str:
    response = request_json(
        "POST",
        "/runtime/auth/login",
        {"email": "super@mop.local", "password": "SuperAdmin123!"},
    )
    return response["data"]["access_token"]


def role_users() -> list[SeedUser]:
    return [
        SeedUser("enterprise.super@mop.local", "Enterprise Super Admin", "super_admin", "Enterprise123!"),
        SeedUser("enterprise.owner@mop.local", "Enterprise Account Owner", "account_owner", "Enterprise123!"),
        SeedUser("enterprise.orgadmin@mop.local", "Enterprise Organization Admin", "organization_admin", "Enterprise123!"),
        SeedUser("enterprise.manager@mop.local", "Enterprise Team Manager", "team_manager", "Enterprise123!"),
        SeedUser("enterprise.supervisor@mop.local", "Enterprise Supervisor", "supervisor", "Enterprise123!"),
        SeedUser("enterprise.operator@mop.local", "Enterprise Operator", "operator", "Enterprise123!"),
        SeedUser("enterprise.auditor@mop.local", "Enterprise Auditor", "auditor", "Enterprise123!"),
        SeedUser("enterprise.qa@mop.local", "Enterprise QA Tester", "qa_tester", "Enterprise123!"),
        SeedUser("enterprise.custom@mop.local", "Enterprise Custom Role User", "custom", "Enterprise123!"),
        SeedUser("enterprise.admin@mop.local", "Enterprise Admin", "admin", "Enterprise123!"),
        SeedUser("enterprise.user@mop.local", "Enterprise Read Only User", "user", "Enterprise123!"),
        SeedUser("disabled.operator@mop.local", "Disabled Operator", "operator", "Enterprise123!", False),
    ]


def record(module_key: str, record_type: str, code: str, name: str, status: str, quantity: float, **payload: Any) -> dict[str, Any]:
    return {
        "module_key": module_key,
        "record_type": record_type,
        "record_code": code,
        "name": name,
        "status": status,
        "quantity": quantity,
        "payload": payload,
    }


def enterprise_records(batch: str) -> list[dict[str, Any]]:
    industries = [
        ("manufacturing", "MFG", "Discrete Manufacturing"),
        ("textile", "TXT", "Textile Mill"),
        ("clothing", "CLT", "Clothing Factory"),
        ("food_processing", "FOD", "Food Processing"),
        ("electronics", "ELC", "Electronics Assembly"),
        ("automotive", "AUT", "Automotive Parts"),
        ("pharmaceutical", "PHR", "Pharmaceutical Batch"),
        ("packaging", "PKG", "Packaging Line"),
        ("warehousing", "WHR", "Warehouse Operation"),
        ("logistics", "LOG", "Logistics Fleet"),
        ("chemical", "CHM", "Chemical Plant"),
        ("generic_business", "GEN", "Generic Business"),
    ]

    rows: list[dict[str, Any]] = []
    for index, (industry, code, label) in enumerate(industries, start=1):
        rows.extend(
            [
                record(
                    "inventory",
                    "raw_material",
                    f"ENT-{batch}-{code}-RM",
                    f"{label} Raw Material",
                    "LOW_STOCK" if index % 4 == 0 else "AVAILABLE",
                    80 + index * 17,
                    industry=industry,
                    uom="kg",
                    reorder_level=120 if index % 4 == 0 else 50,
                    warehouse=f"WH-{(index % 4) + 1}",
                    zone=f"Z-{(index % 5) + 1}",
                    rack=f"R-{index:02d}",
                    bin=f"BIN-{index:03d}",
                    unit_cost=25 + index * 11,
                    supplier=f"Supplier {code}",
                ),
                record(
                    "procurement",
                    "purchase_requisition",
                    f"ENT-{batch}-{code}-PR",
                    f"{label} Procurement Request",
                    "PENDING_APPROVAL" if index % 3 == 0 else "DRAFT",
                    100 + index * 13,
                    industry=industry,
                    supplier=f"Supplier {code}",
                    lead_time_days=3 + (index % 8),
                    estimated_value=(100 + index * 13) * (40 + index),
                    approval_required=True,
                ),
                record(
                    "production",
                    "work_order",
                    f"ENT-{batch}-{code}-WO",
                    f"{label} Production Work Order",
                    "SCHEDULED" if index % 2 else "IN_PROGRESS",
                    30 + index * 5,
                    industry=industry,
                    line=f"LINE-{(index % 6) + 1}",
                    priority="high" if index % 5 == 0 else "normal",
                    due_date="2026-07-15",
                    oee_target=82 + (index % 10),
                ),
                record(
                    "quality",
                    "inspection_lot",
                    f"ENT-{batch}-{code}-QI",
                    f"{label} Quality Inspection",
                    "OPEN" if index % 3 else "IN_REVIEW",
                    10 + index,
                    industry=industry,
                    sample_size=3 + (index % 5),
                    acceptance_level="AQL-1.5",
                    defect_rate_percent=round((index % 6) * 0.7, 2),
                ),
                record(
                    "maintenance",
                    "work_order",
                    f"ENT-{batch}-{code}-MWO",
                    f"{label} Maintenance Task",
                    "OPEN" if index % 2 else "ASSIGNED",
                    1,
                    industry=industry,
                    asset=f"ASSET-{code}-{index:03d}",
                    priority="critical" if index % 6 == 0 else "medium",
                    estimated_hours=2 + (index % 7),
                ),
                record(
                    "sales",
                    "sales_order",
                    f"ENT-{batch}-{code}-SO",
                    f"{label} Customer Order",
                    "OPEN" if index % 2 else "ALLOCATED",
                    20 + index * 4,
                    industry=industry,
                    customer=f"Customer {code}",
                    requested_date="2026-07-20",
                    margin_percent=12 + (index % 9),
                ),
            ]
        )

    rows.extend(
        [
            record("warehouse", "bin_occupancy", f"ENT-{batch}-WH-OCC-001", "North Plant Warehouse Occupancy", "ACTIVE", 78, warehouse="WH-1", occupancy_percent=78, congestion="medium"),
            record("warehouse", "bin_occupancy", f"ENT-{batch}-WH-OCC-002", "Cold Chain Warehouse Occupancy", "ACTIVE", 91, warehouse="WH-2", occupancy_percent=91, congestion="high"),
            record("reporting", "scheduled_report", f"ENT-{batch}-RPT-DAILY", "Daily Executive Operations Report", "SCHEDULED", 1, cadence="daily", recipients=["owner@mop.local", "admin@mop.local"]),
            record("reporting", "scheduled_report", f"ENT-{batch}-RPT-WEEKLY", "Weekly Plant Performance Report", "SCHEDULED", 1, cadence="weekly", recipients=["manager@mop.local"]),
            record("costing", "cost_snapshot", f"ENT-{batch}-COST-001", "Inventory Valuation Snapshot", "POSTED", 18400000, currency="INR", variance_percent=3.4),
            record("integrations", "erp_sync", f"ENT-{batch}-SAP-SYNC", "SAP Inventory Sync", "HEALTHY", 12500, provider="SAP S/4HANA", last_sync="2026-06-12T10:00:00Z"),
            record("integrations", "iot_stream", f"ENT-{batch}-IOT-STREAM", "Machine Telemetry Stream", "DEGRADED", 4200, provider="MQTT", packet_loss_percent=1.7),
            record("mobile", "offline_sync", f"ENT-{batch}-MOB-SYNC", "Warehouse Scanner Offline Sync", "PENDING", 42, device_group="warehouse_scanners", conflicts=3),
            record("ai_copilot", "recommendation", f"ENT-{batch}-AI-REC", "Consume Expiring Batch First", "DRAFT", 1, requires_human_approval=True, risk_level="HIGH"),
        ]
    )
    return rows


def main() -> int:
    print(f"Connecting to {BASE_URL}")
    health = request_json("GET", "/health")
    print(f"Health: {health['status']}")
    token = login()
    print("Authenticated as super admin")

    created_users = 0
    existing_users = 0
    for user in role_users():
        created, status = safe_post(
            "/runtime/users",
            token,
            {
                "email": user.email,
                "name": user.name,
                "password": user.password,
                "role": user.role,
                "is_active": user.is_active,
            },
            duplicate_ok=True,
        )
        created_users += int(created)
        existing_users += int(status == "exists")

    batch = time.strftime("%Y%m%d%H%M%S")
    rows = enterprise_records(batch)
    for row in rows:
        safe_post("/runtime/records", token, row)

    analytics = request_json("GET", "/runtime/analytics/summary", token=token)["data"]
    users = request_json("GET", "/runtime/users", token=token)["data"]
    audit_logs = request_json("GET", "/runtime/audit-logs", token=token)["data"]

    print(f"Users created: {created_users}")
    print(f"Users already existed: {existing_users}")
    print(f"Records created: {len(rows)}")
    print(f"Active users: {analytics['active_users']}")
    print(f"Disabled users: {analytics['disabled_users']}")
    print(f"Module counts: {analytics['module_record_counts']}")
    print(f"Low stock items: {analytics['inventory_low_stock_count']}")
    print(f"Audit rows returned: {len(audit_logs)}")
    print("Role coverage:")
    for role in sorted({user["role"] for user in users}):
        count = sum(1 for user in users if user["role"] == role)
        print(f"  {role}: {count}")
    print("Enterprise seed: ok")
    return 0


if __name__ == "__main__":
    sys.exit(main())
