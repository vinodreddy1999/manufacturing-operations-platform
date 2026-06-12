from uuid import uuid4

from sqlalchemy.orm import Session

from .platform_models import Company, Department, FeatureFlag, ModuleRecord, Permission, Plant, Role, User
from .security import hash_password


MODULE_KEYS = [
    "inventory",
    "warehouse",
    "procurement",
    "production",
    "maintenance",
    "quality",
    "sales",
    "reporting",
    "costing",
    "forecasting",
    "ai_copilot",
    "integrations",
]


def seed_platform(db: Session) -> None:
    if not db.query(Company).filter(Company.id == "company-c").first():
        db.add(Company(id="company-c", tenant_id="tenant-demo-001", name="Company C", code="CO-C"))
    if not db.query(Plant).filter(Plant.id == "plant-north").first():
        db.add(Plant(id="plant-north", tenant_id="tenant-demo-001", company_id="company-c", name="North Plant", code="PLANT-NORTH"))
    if not db.query(Department).filter(Department.id == "dept-ops").first():
        db.add(Department(id="dept-ops", tenant_id="tenant-demo-001", company_id="company-c", plant_id="plant-north", name="Operations", code="OPS"))

    seed_users = [
        ("user-super-001", "super@mop.local", "MOP Super Admin", "super_admin", "SuperAdmin123!"),
        ("user-owner-001", "owner@mop.local", "MOP Account Owner", "account_owner", "Owner12345!"),
        ("user-admin-001", "admin@mop.local", "MOP Admin", "admin", "ChangeMe123!"),
        ("user-manager-001", "manager@mop.local", "MOP Team Manager", "team_manager", "Manager123!"),
        ("user-auditor-001", "auditor@mop.local", "MOP Auditor", "auditor", "Auditor123!"),
        ("user-qa-001", "qa@mop.local", "MOP QA Tester", "qa_tester", "QaTester123!"),
        ("user-viewer-001", "user@mop.local", "MOP User", "user", "User12345!"),
    ]
    for user_id, email, name, role, password in seed_users:
        user = db.query(User).filter(User.id == user_id).first()
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
                    is_active=True,
                )
            )
        else:
            user.role = role
            user.is_active = True

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
    for role_id, name, permissions in roles:
        role = db.query(Role).filter(Role.id == role_id).first()
        if not role:
            db.add(Role(id=role_id, tenant_id="tenant-demo-001", company_id="company-c", name=name, permissions=permissions))
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

    for module_key in MODULE_KEYS:
        if not db.query(FeatureFlag).filter(FeatureFlag.tenant_id == "tenant-demo-001", FeatureFlag.company_id == "company-c", FeatureFlag.module_key == module_key).first():
            db.add(FeatureFlag(id=str(uuid4()), tenant_id="tenant-demo-001", company_id="company-c", module_key=module_key, enabled=True))

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
