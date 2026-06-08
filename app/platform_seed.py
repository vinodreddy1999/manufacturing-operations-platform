from uuid import uuid4

from sqlalchemy.orm import Session

from .platform_models import Company, Department, FeatureFlag, Permission, Plant, Role, User
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
    if db.query(Company).filter(Company.id == "company-c").first():
        return
    company = Company(id="company-c", tenant_id="tenant-demo-001", name="Company C", code="CO-C")
    plant = Plant(id="plant-north", tenant_id="tenant-demo-001", company_id="company-c", name="North Plant", code="PLANT-NORTH")
    department = Department(id="dept-ops", tenant_id="tenant-demo-001", company_id="company-c", plant_id="plant-north", name="Operations", code="OPS")
    admin = User(
        id="user-admin-001",
        tenant_id="tenant-demo-001",
        company_id="company-c",
        plant_id="plant-north",
        email="admin@mop.local",
        name="MOP Admin",
        password_hash=hash_password("ChangeMe123!"),
    )
    role = Role(id="role-admin", tenant_id="tenant-demo-001", company_id="company-c", name="Admin", permissions=["platform.admin"])
    permissions = [Permission(id=str(uuid4()), key=key, description=key) for key in ["platform.admin", "inventory.read", "feature_flags.manage"]]
    flags = [
        FeatureFlag(id=str(uuid4()), tenant_id="tenant-demo-001", company_id="company-c", module_key=module_key, enabled=True)
        for module_key in MODULE_KEYS
    ]
    db.add_all([company, plant, department, admin, role, *permissions, *flags])
    db.commit()

