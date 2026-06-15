from uuid import uuid4

from sqlalchemy.orm import Session

from .metadata_store import upsert_metadata
from .modules.frontend_admin_models import DataCatalogEntry, DataMappingRule, ManufacturingDataConnection, PendingErpUpdate
from .platform_models import Company, Department, FeatureFlag, ModuleRecord, Permission, Plant, Role, User
from .security import hash_password
from .store import MODULES, store


MODULE_KEYS = [
    "auth",
    "platform",
    "inventory",
    "warehouse",
    "supplier",
    "procurement",
    "production",
    "maintenance",
    "quality",
    "sales",
    "reporting",
    "costing",
    "forecasting",
    "supply_chain",
    "ai",
    "ai_copilot",
    "integrations",
]

COMPANY_SEEDS = [
    ("company-c", "Company C", "CO-C", "plant-north", "North Plant", "PLANT-NORTH", "dept-ops", "Operations", "OPS"),
    ("company-apex", "Apex Components Ltd", "APEX", "plant-apex-hyd", "Apex Hyderabad Plant", "APEX-HYD", "dept-apex-ops", "Apex Operations", "APX-OPS"),
    ("company-nova", "Nova Textiles Pvt Ltd", "NOVA", "plant-nova-srt", "Nova Surat Mill", "NOVA-SRT", "dept-nova-prod", "Nova Production", "NOV-PROD"),
    ("company-fresh", "FreshFoods Processing Co", "FRESH", "plant-fresh-pune", "FreshFoods Pune Plant", "FRESH-PUNE", "dept-fresh-qa", "FreshFoods Quality", "FR-QA"),
    ("company-med", "MedSure Pharma", "MED", "plant-med-vizag", "MedSure Vizag Facility", "MED-VZG", "dept-med-compliance", "MedSure Compliance", "MED-COMP"),
]


def seed_platform(db: Session) -> None:
    upsert_metadata(
        db,
        category="tenant",
        record_key="precision-components",
        row_id="meta-tenant-precision-components",
        payload=store.snapshot(store.tenants["precision-components"]),
        name="Precision Components Demo",
    )
    for module in MODULES:
        module_payload = module.model_dump()
        upsert_metadata(
            db,
            category="module_definition",
            record_key=str(module.key),
            row_id=f"meta-module-{str(module.key).lower()}",
            payload=module_payload,
            name=module.name,
        )

    for company_id, company_name, company_code, plant_id, plant_name, plant_code, dept_id, dept_name, dept_code in COMPANY_SEEDS:
        if not db.query(Company).filter(Company.id == company_id).first():
            db.add(Company(id=company_id, tenant_id="tenant-demo-001", name=company_name, code=company_code))
        if not db.query(Plant).filter(Plant.id == plant_id).first():
            db.add(Plant(id=plant_id, tenant_id="tenant-demo-001", company_id=company_id, name=plant_name, code=plant_code))
        if not db.query(Department).filter(Department.id == dept_id).first():
            db.add(Department(id=dept_id, tenant_id="tenant-demo-001", company_id=company_id, plant_id=plant_id, name=dept_name, code=dept_code))
        upsert_metadata(
            db,
            category="company",
            record_key=company_id,
            row_id=f"meta-company-{company_id}",
            company_id=company_id,
            payload={"id": company_id, "tenant_id": "tenant-demo-001", "name": company_name, "code": company_code, "is_active": True},
            name=company_name,
        )
        upsert_metadata(
            db,
            category="plant",
            record_key=plant_id,
            row_id=f"meta-plant-{plant_id}",
            company_id=company_id,
            plant_id=plant_id,
            payload={"id": plant_id, "tenant_id": "tenant-demo-001", "company_id": company_id, "name": plant_name, "code": plant_code, "timezone": "Asia/Kolkata"},
            name=plant_name,
        )

    for warehouse in store.warehouses:
        upsert_metadata(
            db,
            category="warehouse",
            record_key=warehouse["id"],
            row_id=f"meta-warehouse-{warehouse['id']}",
            company_id="company-c",
            plant_id=warehouse.get("plant_id"),
            payload=warehouse,
            name=warehouse.get("name"),
        )
    for item in store.inventory_items:
        upsert_metadata(
            db,
            category="inventory_item",
            record_key=item["id"],
            row_id=f"meta-item-{item['id']}",
            company_id="company-c",
            plant_id="plant-north",
            payload=item,
            name=item.get("description"),
        )
    for balance in store.balances:
        upsert_metadata(
            db,
            category="inventory_balance",
            record_key=f"{balance['item_id']}::{balance['location_id']}",
            row_id=f"meta-balance-{balance['item_id']}-{balance['location_id']}",
            company_id="company-c",
            plant_id="plant-north",
            payload=balance,
            name=balance["item_id"],
        )
    for location in store.locations:
        upsert_metadata(
            db,
            category="location",
            record_key=location["id"],
            row_id=f"meta-location-{location['id']}",
            company_id="company-c",
            plant_id="plant-north",
            payload=location,
            name=location.get("code"),
        )
    for supplier in store.suppliers:
        upsert_metadata(
            db,
            category="supplier",
            record_key=supplier["id"],
            row_id=f"meta-supplier-{supplier['id']}",
            company_id="company-c",
            payload=supplier,
            name=supplier.get("name"),
        )
    for link in store.supplier_links:
        upsert_metadata(
            db,
            category="supplier_link",
            record_key=f"{link['item_id']}::{link['supplier_id']}::{link['role']}",
            row_id=f"meta-supplier-link-{link['item_id']}-{link['supplier_id']}-{link['role'].lower()}",
            company_id="company-c",
            plant_id="plant-north",
            payload=link,
            name=link.get("supplier_name"),
        )
    for batch in store.batches:
        key = batch["serial_number"] or batch["batch_number"]
        upsert_metadata(
            db,
            category="batch",
            record_key=key,
            row_id=f"meta-batch-{key.lower().replace(' ', '-')}",
            company_id="company-c",
            plant_id="plant-north",
            payload=batch,
            name=batch.get("batch_number"),
        )
    for reservation in store.reservations:
        upsert_metadata(
            db,
            category="inventory_reservation",
            record_key=reservation["id"],
            row_id=f"meta-reservation-{reservation['id']}",
            company_id="company-c",
            plant_id="plant-north",
            payload=reservation,
            name=reservation.get("reserved_for"),
        )
    for movement in store.seed_movements:
        upsert_metadata(
            db,
            category="inventory_movement",
            record_key=movement["id"],
            row_id=f"meta-movement-{movement['id']}",
            company_id="company-c",
            plant_id="plant-north",
            payload=movement,
            name=movement.get("movement_type"),
        )
    for count in store.stock_counts:
        upsert_metadata(
            db,
            category="stock_count",
            record_key=count["id"],
            row_id=f"meta-stock-count-{count['id']}",
            company_id="company-c",
            plant_id="plant-north",
            payload=count,
            name=count.get("count_type"),
        )
    for index, row in enumerate(store.non_moving_stock, start=1):
        upsert_metadata(
            db,
            category="non_moving_stock",
            record_key=f"non-moving-{index}",
            row_id=f"meta-non-moving-{index}",
            company_id="company-c",
            plant_id="plant-north",
            payload=row,
            name=row.get("item_id"),
        )
    for index, row in enumerate(store.slow_moving_stock, start=1):
        upsert_metadata(
            db,
            category="slow_moving_stock",
            record_key=f"slow-moving-{index}",
            row_id=f"meta-slow-moving-{index}",
            company_id="company-c",
            plant_id="plant-north",
            payload=row,
            name=row.get("item_id"),
        )
    for index, row in enumerate(store.expiry_actions, start=1):
        upsert_metadata(
            db,
            category="expiry_action",
            record_key=f"expiry-action-{index}",
            row_id=f"meta-expiry-action-{index}",
            company_id="company-c",
            plant_id="plant-north",
            payload=row,
            name=row.get("item_id"),
        )
    for index, row in enumerate(store.fifo_layers, start=1):
        upsert_metadata(
            db,
            category="fifo_layer",
            record_key=row["receipt_id"],
            row_id=f"meta-fifo-layer-{index}",
            company_id="company-c",
            plant_id="plant-north",
            payload=row,
            name=row.get("item_id"),
        )
    for index, row in enumerate(store.inventory_reports, start=1):
        upsert_metadata(
            db,
            category="inventory_report",
            record_key=f"inventory-report-{index}",
            row_id=f"meta-inventory-report-{index}",
            company_id="company-c",
            plant_id="plant-north",
            payload=row,
            name=row.get("report"),
        )

    seed_users = [
        ("user-super-001", "super@mop.local", "MOP Super Admin", "super_admin", "SuperAdmin123!"),
        ("user-owner-001", "owner@mop.local", "MOP Account Owner", "account_owner", "Owner12345!"),
        ("user-orgadmin-001", "orgadmin@mop.local", "MOP Organization Admin", "organization_admin", "OrgAdmin123!"),
        ("user-admin-001", "admin@mop.local", "MOP Admin", "admin", "ChangeMe123!"),
        ("user-manager-001", "manager@mop.local", "MOP Team Manager", "team_manager", "Manager123!"),
        ("user-supervisor-001", "supervisor@mop.local", "MOP Supervisor", "supervisor", "Supervisor123!"),
        ("user-operator-001", "operator@mop.local", "MOP Operator", "operator", "Operator123!"),
        ("user-auditor-001", "auditor@mop.local", "MOP Auditor", "auditor", "Auditor123!"),
        ("user-qa-001", "qa@mop.local", "MOP QA Tester", "qa_tester", "QaTester123!"),
        ("user-custom-001", "custom@mop.local", "MOP Custom User", "custom", "Custom123!"),
        ("user-viewer-001", "user@mop.local", "MOP User", "user", "User12345!"),
        ("user-disabled-001", "disabled.operator@mop.local", "MOP Disabled Operator", "operator", "Disabled123!"),
    ]
    for user_id, email, name, role, password in seed_users:
        user = db.query(User).filter(User.id == user_id).first()
        is_active = email != "disabled.operator@mop.local"
        if not user:
            db.add(
                User(
                    id=user_id,
                    tenant_id="tenant-demo-001",
                    company_id="company-c",
                    plant_id="plant-north",
                    email=email,
                    name=name,
                    password_hash=hash_password(password),
                    role=role,
                    is_active=is_active,
                )
            )
        else:
            user.role = role
            user.is_active = is_active

    roles = [
        ("role-super-admin", "Super Admin", ["platform.super_admin", "platform.admin", "account.override", "organization.override", "team.override", "users.manage", "roles.manage", "data.write", "data.read", "audit.read"]),
        ("role-account-owner", "Account Owner", ["account.override", "organization.override", "team.override", "users.manage", "roles.manage", "data.write", "data.read", "audit.read"]),
        ("role-organization-admin", "Organization Admin", ["organization.override", "team.override", "users.manage", "data.write", "data.read", "audit.read"]),
        ("role-team-manager", "Team Manager", ["team.override", "data.write", "data.read"]),
        ("role-supervisor", "Supervisor", ["data.write", "data.read"]),
        ("role-operator", "Operator/User", ["data.read"]),
        ("role-auditor", "Auditor", ["data.read", "audit.read"]),
        ("role-qa-tester", "QA/Tester", ["quality.write", "data.read"]),
        ("role-custom", "Custom Role", ["data.read"]),
        ("role-admin", "Admin", ["platform.admin", "users.manage", "data.write", "data.read", "audit.read"]),
        ("role-user", "User", ["data.read"]),
    ]
    for company_id, *_ in COMPANY_SEEDS:
        for role_id, name, permissions in roles:
            company_role_id = f"{role_id}-{company_id}"
            role = db.query(Role).filter(Role.id == company_role_id).first()
            if not role:
                db.add(Role(id=company_role_id, tenant_id="tenant-demo-001", company_id=company_id, name=name, permissions=permissions))
            else:
                role.permissions = permissions

    permission_keys = [
        "platform.super_admin",
        "platform.admin",
        "account.override",
        "organization.override",
        "team.override",
        "users.manage",
        "roles.manage",
        "data.write",
        "data.read",
        "audit.read",
        "quality.write",
        "inventory.read",
        "feature_flags.manage",
    ]
    for key in permission_keys:
        if not db.query(Permission).filter(Permission.key == key).first():
            db.add(Permission(id=str(uuid4()), key=key, description=key))

    for company_id, *_ in COMPANY_SEEDS:
        for module_key in MODULE_KEYS:
            if not db.query(FeatureFlag).filter(FeatureFlag.tenant_id == "tenant-demo-001", FeatureFlag.company_id == company_id, FeatureFlag.module_key == module_key).first():
                db.add(FeatureFlag(id=str(uuid4()), tenant_id="tenant-demo-001", company_id=company_id, module_key=module_key, enabled=True))

    for company_id, company_name, company_code, plant_id, plant_name, *_ in COMPANY_SEEDS:
        if not db.query(ManufacturingDataConnection).filter(ManufacturingDataConnection.id == f"conn-{company_id}-erp").first():
            db.add(
                ManufacturingDataConnection(
                    id=f"conn-{company_id}-erp",
                    company_id=company_id,
                    system_name=f"{company_name} ERP",
                    system_type="ERP",
                    connection_status="Healthy",
                    last_sync="2026-06-15T09:00:00Z",
                    health_score=92,
                    record_count=24000,
                )
            )
        if not db.query(ManufacturingDataConnection).filter(ManufacturingDataConnection.id == f"conn-{company_id}-mes").first():
            db.add(
                ManufacturingDataConnection(
                    id=f"conn-{company_id}-mes",
                    company_id=company_id,
                    system_name=f"{company_name} MES",
                    system_type="MES",
                    connection_status="Warning",
                    last_sync="2026-06-15T08:40:00Z",
                    health_score=78,
                    record_count=8200,
                )
            )
        if not db.query(DataCatalogEntry).filter(DataCatalogEntry.id == f"catalog-{company_id}-inventory").first():
            db.add(
                DataCatalogEntry(
                    id=f"catalog-{company_id}-inventory",
                    company_id=company_id,
                    data_type="Inventory",
                    source_system=f"{company_name} ERP",
                    owner="Inventory Manager",
                    ai_ready=True,
                    quality_score=91,
                    lineage={"plant": plant_name, "plant_id": plant_id, "warehouse": f"{company_code}-MAIN"},
                )
            )
        if not db.query(DataCatalogEntry).filter(DataCatalogEntry.id == f"catalog-{company_id}-production").first():
            db.add(
                DataCatalogEntry(
                    id=f"catalog-{company_id}-production",
                    company_id=company_id,
                    data_type="Production",
                    source_system=f"{company_name} MES",
                    owner="Production Manager",
                    ai_ready=True,
                    quality_score=86,
                    lineage={"plant": plant_name, "plant_id": plant_id, "warehouse": f"{company_code}-FG"},
                )
            )
        if not db.query(DataCatalogEntry).filter(DataCatalogEntry.id == f"catalog-{company_id}-machines").first():
            db.add(
                DataCatalogEntry(
                    id=f"catalog-{company_id}-machines",
                    company_id=company_id,
                    data_type="Machine Data",
                    source_system=f"{company_name} PLC",
                    owner="Maintenance Manager",
                    ai_ready=False,
                    quality_score=74,
                    lineage={"plant": plant_name, "plant_id": plant_id, "warehouse": f"{company_code}-MRO"},
                )
            )
        if not db.query(DataMappingRule).filter(DataMappingRule.id == f"map-{company_id}-material").first():
            db.add(
                DataMappingRule(
                    id=f"map-{company_id}-material",
                    company_id=company_id,
                    source_system=f"{company_name} ERP",
                    source_field="Material Code",
                    target_entity="InventoryItem",
                    target_field="sku",
                    transform_rule="trim_uppercase",
                    confidence=0.98,
                )
            )
        if not db.query(DataMappingRule).filter(DataMappingRule.id == f"map-{company_id}-plant").first():
            db.add(
                DataMappingRule(
                    id=f"map-{company_id}-plant",
                    company_id=company_id,
                    source_system=f"{company_name} ERP",
                    source_field="Plant",
                    target_entity="Plant",
                    target_field="plant_code",
                    transform_rule="lookup_company_plant",
                    confidence=0.95,
                )
            )
        if not db.query(PendingErpUpdate).filter(PendingErpUpdate.id == f"erp-upd-{company_id}-001").first():
            db.add(
                PendingErpUpdate(
                    id=f"erp-upd-{company_id}-001",
                    company_id=company_id,
                    recommendation=f"Increase safety stock for {company_name} item-steel",
                    entity_type="InventoryItem",
                    entity_id=f"{company_id}-item-steel",
                    current_value={"safety_stock": 500},
                    recommended_value={"safety_stock": 750},
                    approval_status="Pending",
                    erp_status="Draft",
                )
            )

    records = [
        ("inv-steel-001", "inventory", "raw_material", "RM-STEEL-001", "Stainless Steel Coil", "AVAILABLE", 1240.0, {"uom": "kg", "reorder_level": 500, "warehouse": "WH-A", "bin": "A-01-01", "unit_cost": 82}),
        ("inv-bearing-001", "inventory", "spare_part", "SP-BEAR-001", "Precision Bearing", "LOW_STOCK", 42.0, {"uom": "ea", "reorder_level": 75, "warehouse": "WH-B", "bin": "B-04-07", "unit_cost": 650}),
        ("inv-gasket-001", "inventory", "consumable", "CN-GASK-001", "Seal Gasket", "QUARANTINE", 18.0, {"uom": "ea", "reorder_level": 30, "warehouse": "WH-QA", "bin": "Q-01-02", "unit_cost": 24}),
        ("prod-order-001", "production", "work_order", "WO-10042", "Pump Assembly Batch", "SCHEDULED", 120.0, {"line": "LINE-2", "due_date": "2026-06-18"}),
        ("maint-order-001", "maintenance", "work_order", "MWO-7781", "CNC spindle inspection", "OPEN", 1.0, {"asset": "CNC-14", "priority": "high"}),
    ]
    for record_id, module_key, record_type, code, name, status, quantity, payload in records:
        if not db.query(ModuleRecord).filter(ModuleRecord.id == record_id).first():
            db.add(
                ModuleRecord(
                    id=record_id,
                    tenant_id="tenant-demo-001",
                    company_id="company-c",
                    plant_id="plant-north",
                    module_key=module_key,
                    record_type=record_type,
                    record_code=code,
                    name=name,
                    status=status,
                    quantity=quantity,
                    payload=payload,
                )
            )
    db.commit()
