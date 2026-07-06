#!/usr/bin/env python3
"""Create a 100k-row Vinod company scale dataset and benchmark frontend-facing reads.

The script is intentionally separate from normal app startup. It is safe to rerun:
only previous rows with the VINOD-SCALE/VINOD-LIVE prefixes are replaced.
"""

from __future__ import annotations

import argparse
import json
import os
import statistics
import sys
import time
from datetime import datetime, timezone
from typing import Any
from urllib.request import Request, urlopen
from uuid import uuid4

from sqlalchemy import delete, func
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.modules.frontend_admin_models import (
    DataCatalogEntry,
    DataHubAuditEvent,
    DataHubErrorLog,
    DataHubModelRelationship,
    DataHubRefreshRun,
    DataHubSavedConnection,
    DataMappingRule,
    ManufacturingDataConnection,
)
from app.platform_models import AppMetadata, Company, FeatureFlag, ModuleRecord, Plant, Role, User
from app.platform_seed import MODULE_KEYS
from app.security import hash_password


TENANT_ID = "tenant-demo-001"
COMPANY_ID = "company-vinod"
COMPANY_NAME = "vinod"
COMPANY_CODE = "VINOD"
PLANTS = [
    ("plant-vinod-main", "Vinod Main Plant", "VINOD-MAIN"),
    ("plant-vinod-assembly", "Vinod Assembly Plant", "VINOD-ASM"),
    ("plant-vinod-distribution", "Vinod Distribution Hub", "VINOD-DIST"),
]
BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:8080").rstrip("/")


MODULE_DISTRIBUTION = [
    ("inventory", 0.34, "inventory_item"),
    ("production", 0.18, "production_order"),
    ("warehouse", 0.14, "warehouse_task"),
    ("procurement", 0.10, "purchase_request"),
    ("maintenance", 0.08, "maintenance_work_order"),
    ("quality", 0.06, "inspection_lot"),
    ("sales", 0.04, "sales_order"),
    ("costing", 0.03, "cost_snapshot"),
    ("planning", 0.02, "demand_plan"),
    ("reports", 0.01, "report_snapshot"),
]

SOURCE_MAPPINGS = [
    {
        "source": "SAP MM extract",
        "connector": "SAP S/4HANA",
        "table": "MSEG_MARA_STOCK",
        "destination": "Inventory",
        "raw_columns": ["MATNR", "MAKTX", "WERKS", "LGORT", "LABST", "MEINS", "CHARG", "VFDAT"],
        "mapping": {
            "MATNR": "item_code",
            "MAKTX": "item_name",
            "WERKS": "plant_id",
            "LGORT": "warehouse",
            "LABST": "quantity",
            "MEINS": "uom",
            "CHARG": "batch_number",
            "VFDAT": "expiry_date",
        },
    },
    {
        "source": "MES production table",
        "connector": "MES SQL Server",
        "table": "tblProdOrderRuntime",
        "destination": "Production",
        "raw_columns": ["ProdOrdNo", "MatCode", "LineCode", "PlanQty", "DoneQty", "OrderState"],
        "mapping": {
            "ProdOrdNo": "production_order_id",
            "MatCode": "item_code",
            "LineCode": "production_line",
            "PlanQty": "planned_quantity",
            "DoneQty": "completed_quantity",
            "OrderState": "status",
        },
    },
    {
        "source": "WMS bin ledger",
        "connector": "WMS PostgreSQL",
        "table": "wms_bin_inventory_snapshot",
        "destination": "Warehouse",
        "raw_columns": ["sku", "bin", "zone", "qty_on_hand", "allocated_qty", "bin_status"],
        "mapping": {
            "sku": "item_code",
            "bin": "bin_code",
            "zone": "zone_code",
            "qty_on_hand": "quantity",
            "allocated_qty": "reserved_quantity",
            "bin_status": "status",
        },
    },
    {
        "source": "IoT telemetry stream",
        "connector": "MQTT / Edge gateway",
        "table": "machine.telemetry.live",
        "destination": "Maintenance",
        "raw_columns": ["assetTag", "ts", "tempC", "vibrationMmS", "alarmCode", "runState"],
        "mapping": {
            "assetTag": "asset_id",
            "ts": "event_time",
            "tempC": "temperature_c",
            "vibrationMmS": "vibration_mm_s",
            "alarmCode": "alarm_code",
            "runState": "status",
        },
    },
]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def db_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def timed(label: str, fn):
    start = time.perf_counter()
    value = fn()
    elapsed = time.perf_counter() - start
    return value, {"step": label, "seconds": round(elapsed, 3)}


def request_json(method: str, path: str, payload: dict[str, Any] | None = None, token: str | None = None) -> dict[str, Any]:
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    request = Request(f"{BASE_URL}{path}", data=body, method=method)
    request.add_header("Accept", "application/json")
    if payload is not None:
        request.add_header("Content-Type", "application/json")
    if token:
        request.add_header("Authorization", f"Bearer {token}")
    with urlopen(request, timeout=180) as response:
        return json.loads(response.read().decode("utf-8"))


def login() -> str:
    response = request_json("POST", "/runtime/auth/login", {"email": "super@metam.local", "password": "SuperAdmin123!"})
    return response["data"]["access_token"]


def ensure_vinod_company(db: Session) -> None:
    company = db.get(Company, COMPANY_ID)
    if not company:
        db.add(Company(id=COMPANY_ID, tenant_id=TENANT_ID, name=COMPANY_NAME, code=COMPANY_CODE, is_active=True))
    else:
        company.name = COMPANY_NAME
        company.code = COMPANY_CODE
        company.is_active = True

    for plant_id, plant_name, plant_code in PLANTS:
        plant = db.get(Plant, plant_id)
        if not plant:
            db.add(Plant(id=plant_id, tenant_id=TENANT_ID, company_id=COMPANY_ID, name=plant_name, code=plant_code))
        else:
            plant.company_id = COMPANY_ID
            plant.name = plant_name
            plant.code = plant_code

    for module_key in MODULE_KEYS:
        existing = (
            db.query(FeatureFlag)
            .filter(FeatureFlag.tenant_id == TENANT_ID, FeatureFlag.company_id == COMPANY_ID, FeatureFlag.module_key == module_key)
            .first()
        )
        if not existing:
            db.add(FeatureFlag(id=str(uuid4()), tenant_id=TENANT_ID, company_id=COMPANY_ID, module_key=module_key, enabled=True))

    role = db.get(Role, "role-vinod-scale-admin")
    if not role:
        db.add(
            Role(
                id="role-vinod-scale-admin",
                tenant_id=TENANT_ID,
                company_id=COMPANY_ID,
                name="Vinod Scale Test Admin",
                permissions=["records.read", "records.write", "datahub.manage", "analytics.read"],
            )
        )

    user = db.query(User).filter(User.email == "scale.admin.vinod@metam.local").first()
    if not user:
        db.add(
            User(
                id="user-vinod-scale-admin",
                tenant_id=TENANT_ID,
                company_id=COMPANY_ID,
                plant_id=PLANTS[0][0],
                email="scale.admin.vinod@metam.local",
                name="Vinod Scale Test Admin",
                role="admin",
                is_active=True,
                password_hash=hash_password("ScaleTest123!"),
            )
        )


def cleanup_previous_scale_data(db: Session) -> None:
    prefixes = ("VINOD-SCALE-%", "VINOD-LIVE-%")
    for prefix in prefixes:
        db.execute(delete(ModuleRecord).where(ModuleRecord.company_id == COMPANY_ID, ModuleRecord.record_code.like(prefix)))
    db.execute(delete(DataHubSavedConnection).where(DataHubSavedConnection.company_id == COMPANY_ID, DataHubSavedConnection.id.like("vinod-scale-%")))
    db.execute(delete(DataHubRefreshRun).where(DataHubRefreshRun.company_id == COMPANY_ID, DataHubRefreshRun.id.like("vinod-scale-%")))
    db.execute(delete(DataHubErrorLog).where(DataHubErrorLog.company_id == COMPANY_ID, DataHubErrorLog.id.like("vinod-scale-%")))
    db.execute(delete(DataHubAuditEvent).where(DataHubAuditEvent.company_id == COMPANY_ID, DataHubAuditEvent.id.like("vinod-scale-%")))
    db.execute(delete(DataHubModelRelationship).where(DataHubModelRelationship.company_id == COMPANY_ID, DataHubModelRelationship.id.like("vinod-scale-%")))
    db.execute(delete(DataMappingRule).where(DataMappingRule.company_id == COMPANY_ID, DataMappingRule.id.like("vinod-scale-%")))
    db.execute(delete(DataCatalogEntry).where(DataCatalogEntry.company_id == COMPANY_ID, DataCatalogEntry.id.like("vinod-scale-%")))
    db.execute(delete(ManufacturingDataConnection).where(ManufacturingDataConnection.company_id == COMPANY_ID, ManufacturingDataConnection.id.like("vinod-scale-%")))
    db.execute(delete(AppMetadata).where(AppMetadata.company_id == COMPANY_ID, AppMetadata.record_key.like("vinod-scale-%")))


def count_distribution(total_rows: int) -> list[tuple[str, int, str]]:
    counts: list[tuple[str, int, str]] = []
    remaining = total_rows
    for index, (module_key, ratio, record_type) in enumerate(MODULE_DISTRIBUTION):
        count = remaining if index == len(MODULE_DISTRIBUTION) - 1 else int(total_rows * ratio)
        remaining -= count
        counts.append((module_key, count, record_type))
    return counts


def status_for(module_key: str, index: int) -> str:
    if module_key == "inventory":
        return "LOW_STOCK" if index % 17 == 0 else ("QUARANTINE" if index % 43 == 0 else "AVAILABLE")
    if module_key == "production":
        return "DELAY_RISK" if index % 29 == 0 else ("IN_PROGRESS" if index % 2 == 0 else "SCHEDULED")
    if module_key == "warehouse":
        return "CONGESTED" if index % 31 == 0 else "OPEN"
    if module_key == "procurement":
        return "SUPPLIER_DELAY" if index % 37 == 0 else "PENDING_APPROVAL"
    if module_key == "maintenance":
        return "CRITICAL" if index % 41 == 0 else "ASSIGNED"
    if module_key == "quality":
        return "REJECTED" if index % 53 == 0 else "PASSED"
    return "ACTIVE"


def generate_module_records(total_rows: int) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    global_index = 0
    for module_key, count, record_type in count_distribution(total_rows):
        for local_index in range(1, count + 1):
            global_index += 1
            plant_id, plant_name, plant_code = PLANTS[global_index % len(PLANTS)]
            status = status_for(module_key, global_index)
            quantity = float((global_index * 7) % 2200 + 1)
            reorder_level = 140 if module_key == "inventory" else 0
            rows.append(
                {
                    "id": f"vinod-scale-{global_index:06d}",
                    "tenant_id": TENANT_ID,
                    "company_id": COMPANY_ID,
                    "plant_id": plant_id,
                    "module_key": module_key,
                    "record_type": record_type,
                    "record_code": f"VINOD-SCALE-{module_key.upper()}-{local_index:06d}",
                    "name": f"Vinod {module_key.title()} Record {local_index:06d}",
                    "status": status,
                    "quantity": quantity,
                    "payload": {
                        "scale_test": True,
                        "scale_test_id": "vinod-100k-operations",
                        "source_batch": f"SRC-BATCH-{(global_index % 40) + 1:02d}",
                        "source_table": SOURCE_MAPPINGS[global_index % len(SOURCE_MAPPINGS)]["table"],
                        "source_column_mapping": SOURCE_MAPPINGS[global_index % len(SOURCE_MAPPINGS)]["mapping"],
                        "company_id": COMPANY_ID,
                        "company_name": COMPANY_NAME,
                        "plant_id": plant_id,
                        "plant_name": plant_name,
                        "plant_code": plant_code,
                        "warehouse": f"WH-{(global_index % 12) + 1:02d}",
                        "zone": f"Z-{(global_index % 20) + 1:02d}",
                        "bin": f"BIN-{(global_index % 3500) + 1:04d}",
                        "line": f"LINE-{(global_index % 24) + 1:02d}",
                        "supplier": f"Supplier-{(global_index % 80) + 1:03d}",
                        "customer": f"Customer-{(global_index % 120) + 1:03d}",
                        "unit_cost": round(12.5 + (global_index % 500) * 1.17, 2),
                        "reorder_level": reorder_level,
                        "event_time": now_iso(),
                    },
                    "created_at": db_now(),
                }
            )
    return rows


def seed_datahub_metadata(db: Session, total_rows: int) -> None:
    for index, source in enumerate(SOURCE_MAPPINGS, start=1):
        plant_id, plant_name, _ = PLANTS[index % len(PLANTS)]
        db.add(
            ManufacturingDataConnection(
                id=f"vinod-scale-system-{index}",
                company_id=COMPANY_ID,
                system_name=source["connector"],
                system_type=f"{source['destination']} source",
                connection_status="Healthy" if index != 4 else "Streaming",
                last_sync=now_iso(),
                health_score=94 - index,
                record_count=int(total_rows / len(SOURCE_MAPPINGS)),
            )
        )
        db.add(
            DataHubSavedConnection(
                id=f"vinod-scale-connection-{index}",
                company_id=COMPANY_ID,
                connector_key=source["connector"].lower().replace(" ", "_").replace("/", "_"),
                connector_name=source["connector"],
                connector_category="Scale Test Source",
                connection_name=f"Vinod {source['connector']} to {source['destination']}",
                auth_method="Read-only masked credentials",
                connection_details={
                    "plant_id": plant_id,
                    "plant_name": plant_name,
                    "source_table": source["table"],
                    "raw_columns": source["raw_columns"],
                    "column_mapping": source["mapping"],
                    "sync_mode": "Incremental refresh" if index != 4 else "Real-time webhook update",
                    "watermark_column": "updated_at",
                },
                credential_summary={"masked": {"username": "vi**********er", "password": "****", "api_key": "vi********ey"}, "storage": "masked metadata only"},
                status="Loaded",
                last_test_status="Succeeded",
                last_test_message="Scale test connection validated in read-only mode.",
                refresh_mode="Incremental refresh" if index != 4 else "Real-time webhook update",
                destination_module=source["destination"],
                selected_assets=[source["table"]],
                selected_columns=list(source["mapping"].values()),
                field_mappings=[{"source_field": src, "target_field": dst, "transform": "rename/type_cast/trim"} for src, dst in source["mapping"].items()],
                validation_results=[{"rule": "Required destination fields mapped", "status": "Passed"}],
                created_by="scale.admin.vinod@metam.local",
            )
        )
        db.add(
            DataCatalogEntry(
                id=f"vinod-scale-catalog-{index}",
                company_id=COMPANY_ID,
                data_type=source["destination"],
                source_system=source["connector"],
                owner="Vinod Data Integration Admin",
                ai_ready=True,
                quality_score=91 - index,
                lineage={"plant_id": plant_id, "plant_name": plant_name, "source_table": source["table"], "raw_columns": source["raw_columns"]},
            )
        )
        for src, dst in source["mapping"].items():
            db.add(
                DataMappingRule(
                    id=f"vinod-scale-map-{index}-{src}".replace("/", "-"),
                    company_id=COMPANY_ID,
                    source_system=source["connector"],
                    source_field=src,
                    target_entity=source["destination"],
                    target_field=dst,
                    transform_rule="trim -> normalize case -> type cast -> map to module field",
                    confidence=0.98,
                )
            )

    db.add(
        DataHubModelRelationship(
            id="vinod-scale-rel-inventory-production",
            company_id=COMPANY_ID,
            left_table="MSEG_MARA_STOCK",
            left_column="item_code",
            right_table="tblProdOrderRuntime",
            right_column="item_code",
            cardinality="one-to-many",
            direction="single",
            active=True,
            created_by="scale.admin.vinod@metam.local",
        )
    )


def insert_live_batches(db: Session, batches: int, batch_size: int) -> list[dict[str, Any]]:
    timings = []
    for batch in range(1, batches + 1):
        start_count = db.query(func.count(ModuleRecord.id)).filter(ModuleRecord.company_id == COMPANY_ID, ModuleRecord.record_code.like("VINOD-LIVE-%")).scalar()
        rows = []
        for index in range(1, batch_size + 1):
            number = ((batch - 1) * batch_size) + index
            plant_id, plant_name, _ = PLANTS[number % len(PLANTS)]
            rows.append(
                {
                    "id": f"vinod-live-{number:06d}",
                    "tenant_id": TENANT_ID,
                    "company_id": COMPANY_ID,
                    "plant_id": plant_id,
                    "module_key": "maintenance",
                    "record_type": "machine_telemetry",
                    "record_code": f"VINOD-LIVE-IOT-{number:06d}",
                    "name": f"Vinod live machine telemetry {number:06d}",
                    "status": "ALARM" if number % 13 == 0 else "RUNNING",
                    "quantity": float(number % 100),
                    "payload": {
                        "scale_test": True,
                        "live_stream": True,
                        "plant_id": plant_id,
                        "plant_name": plant_name,
                        "asset_id": f"VINOD-ASSET-{number % 250:03d}",
                        "temperature_c": round(42 + (number % 30) * 0.4, 2),
                        "vibration_mm_s": round(1.5 + (number % 20) * 0.08, 2),
                        "event_time": now_iso(),
                    },
                    "created_at": db_now(),
                }
            )
        _, insert_timing = timed(f"live_batch_{batch}_insert_{batch_size}", lambda: db.bulk_insert_mappings(ModuleRecord, rows))
        db.commit()
        reflected = db.query(func.count(ModuleRecord.id)).filter(ModuleRecord.company_id == COMPANY_ID, ModuleRecord.record_code.like("VINOD-LIVE-%")).scalar()
        insert_timing["before_rows"] = int(start_count or 0)
        insert_timing["after_rows"] = int(reflected or 0)
        insert_timing["rows_added"] = int(reflected or 0) - int(start_count or 0)
        timings.append(insert_timing)
    return timings


def benchmark_api(token: str) -> list[dict[str, Any]]:
    calls = [
        ("health", "GET", "/health", None),
        ("ready", "GET", "/ready", None),
        ("vinod_inventory_page_250", "GET", f"/runtime/records?company_id={COMPANY_ID}&module_key=inventory&limit=250", token),
        ("vinod_live_telemetry_page_250", "GET", f"/runtime/records?company_id={COMPANY_ID}&module_key=maintenance&search=VINOD-LIVE&limit=250", token),
        ("vinod_search_low_stock", "GET", f"/runtime/records?company_id={COMPANY_ID}&search=LOW_STOCK&limit=250", token),
        ("analytics_summary_all_companies", "GET", "/runtime/analytics/summary", token),
        ("datahub_saved_connections", "GET", "/manufacturing-data-hub/get-data/saved-connections", token),
        ("datahub_catalog", "GET", "/manufacturing-data-hub/catalog", token),
    ]
    results = []
    for label, method, path, auth_token in calls:
        durations = []
        size = 0
        status = "ok"
        for _ in range(3):
            start = time.perf_counter()
            try:
                response = request_json(method, path, token=auth_token)
                encoded = json.dumps(response).encode("utf-8")
                size = len(encoded)
            except Exception as exc:  # noqa: BLE001 - benchmark should report failures
                status = f"failed: {exc}"
            durations.append(time.perf_counter() - start)
        results.append(
            {
                "endpoint": path,
                "label": label,
                "status": status,
                "min_seconds": round(min(durations), 3),
                "median_seconds": round(statistics.median(durations), 3),
                "max_seconds": round(max(durations), 3),
                "response_kb": round(size / 1024, 2),
            }
        )
    return results


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--rows", type=int, default=100_000)
    parser.add_argument("--live-batches", type=int, default=5)
    parser.add_argument("--live-batch-size", type=int, default=200)
    args = parser.parse_args()

    timings: list[dict[str, Any]] = []
    db = SessionLocal()
    try:
        _, timing = timed("ensure_vinod_company_plants_roles", lambda: ensure_vinod_company(db))
        timings.append(timing)
        _, timing = timed("cleanup_previous_vinod_scale_rows", lambda: cleanup_previous_scale_data(db))
        timings.append(timing)
        db.commit()

        records, timing = timed(f"generate_{args.rows}_module_records", lambda: generate_module_records(args.rows))
        timings.append(timing)
        _, timing = timed(f"bulk_insert_{args.rows}_module_records", lambda: db.bulk_insert_mappings(ModuleRecord, records))
        timings.append(timing)
        _, timing = timed("seed_datahub_connections_catalog_mappings", lambda: seed_datahub_metadata(db, args.rows))
        timings.append(timing)
        db.add(
            DataHubRefreshRun(
                id="vinod-scale-refresh-base-load",
                company_id=COMPANY_ID,
                connection_id="vinod-scale-connection-1",
                refresh_mode="Bulk initial load",
                status="Completed",
                rows_processed=args.rows,
                started_at=now_iso(),
                completed_at=now_iso(),
            )
        )
        db.add(
            DataHubAuditEvent(
                id="vinod-scale-audit-base-load",
                company_id=COMPANY_ID,
                actor_email="scale.admin.vinod@metam.local",
                action="bulk_scale_seed",
                entity_type="module_records",
                entity_id="vinod-100k-operations",
                details={"rows": args.rows, "plants": [plant[0] for plant in PLANTS], "modules": count_distribution(args.rows)},
            )
        )
        _, timing = timed("commit_bulk_load", db.commit)
        timings.append(timing)

        live_timings = insert_live_batches(db, args.live_batches, args.live_batch_size)
        token = login()
        api_timings = benchmark_api(token)

        module_counts = {
            module: int(count)
            for module, count in db.query(ModuleRecord.module_key, func.count(ModuleRecord.id))
            .filter(ModuleRecord.company_id == COMPANY_ID)
            .group_by(ModuleRecord.module_key)
            .all()
        }
        plant_counts = {
            plant: int(count)
            for plant, count in db.query(ModuleRecord.plant_id, func.count(ModuleRecord.id))
            .filter(ModuleRecord.company_id == COMPANY_ID)
            .group_by(ModuleRecord.plant_id)
            .all()
        }
        total_count = int(db.query(func.count(ModuleRecord.id)).filter(ModuleRecord.company_id == COMPANY_ID).scalar() or 0)

        report = {
            "generated_at": now_iso(),
            "company": {"id": COMPANY_ID, "name": COMPANY_NAME, "code": COMPANY_CODE},
            "base_rows_requested": args.rows,
            "live_rows_added": args.live_batches * args.live_batch_size,
            "total_vinod_module_records_after_run": total_count,
            "module_counts": module_counts,
            "plant_counts": plant_counts,
            "load_timings": timings,
            "live_refresh_timings": live_timings,
            "api_timings": api_timings,
            "source_mappings": SOURCE_MAPPINGS,
        }
        print(json.dumps(report, indent=2, default=str))
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
