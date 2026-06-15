from datetime import datetime
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, status
from jose import JWTError, jwt
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from .database import engine, get_db
from .platform_models import AuditLog, ModuleRecord, User
from .runtime_schemas import (
    LoginPayload,
    LoginResult,
    ModuleRecordCreate,
    ModuleRecordUpdate,
    RuntimeEnvelope,
    SessionUser,
    UserCreate,
    UserUpdate,
)
from .security import JWT_ALGORITHM, JWT_SECRET, create_token, hash_password, verify_password

router = APIRouter(prefix="/runtime", tags=["Runtime Application"])

TENANT_ID = "tenant-demo-001"
COMPANY_ID = "company-c"
PLANT_ID = "plant-north"
OVERRIDE_ROLES = {"super_admin", "account_owner"}

ROLE_PERMISSIONS = {
    "super_admin": ["platform.super_admin", "platform.admin", "account.override", "organization.override", "team.override", "users.manage", "roles.manage", "data.write", "data.read", "audit.read"],
    "account_owner": ["account.override", "organization.override", "team.override", "users.manage", "roles.manage", "data.write", "data.read", "audit.read"],
    "organization_admin": ["organization.override", "team.override", "users.manage", "data.write", "data.read", "audit.read"],
    "team_manager": ["team.override", "data.write", "data.read"],
    "supervisor": ["data.write", "data.read"],
    "operator": ["data.read"],
    "auditor": ["data.read", "audit.read"],
    "qa_tester": ["quality.write", "data.read"],
    "custom": ["data.read"],
    "admin": ["platform.admin", "users.manage", "data.write", "data.read", "audit.read"],
    "user": ["data.read"],
}


def ensure_runtime_schema() -> None:
    inspector = inspect(engine)
    if "users" in inspector.get_table_names():
        user_columns = {column["name"] for column in inspector.get_columns("users")}
        if "role" not in user_columns:
            with engine.begin() as connection:
                connection.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(40) DEFAULT 'user'"))


def runtime_result(action: str, message: str, data: Any) -> RuntimeEnvelope:
    return RuntimeEnvelope(action=action, message=message, data=data)


def permissions_for(role: str) -> list[str]:
    return ROLE_PERMISSIONS.get(role, ROLE_PERMISSIONS["user"])


def has_override_scope(user: User) -> bool:
    return (user.role or "user") in OVERRIDE_ROLES


def serialize_user(user: User) -> dict[str, Any]:
    role = user.role or "user"
    return {
        "id": user.id,
        "tenant_id": user.tenant_id,
        "company_id": user.company_id,
        "plant_id": user.plant_id,
        "email": user.email,
        "name": user.name,
        "role": role,
        "is_active": user.is_active,
        "permissions": permissions_for(role),
    }


def serialize_record(record: ModuleRecord) -> dict[str, Any]:
    return {
        "id": record.id,
        "tenant_id": record.tenant_id,
        "company_id": record.company_id,
        "plant_id": record.plant_id,
        "module_key": record.module_key,
        "record_type": record.record_type,
        "record_code": record.record_code,
        "name": record.name,
        "status": record.status,
        "quantity": record.quantity,
        "payload": record.payload or {},
        "created_at": record.created_at.isoformat() if record.created_at else None,
    }


def current_user(request: Request, db: Session = Depends(get_db)) -> User:
    header = request.headers.get("authorization", "")
    if not header.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token = header.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from error
    user_id = payload.get("sub")
    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is disabled or missing")
    return user


def require_any(*roles: str):
    def dependency(user: User = Depends(current_user)) -> User:
        if user.role not in roles and user.role not in OVERRIDE_ROLES:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient access")
        return user

    return dependency


def audit(db: Session, actor: User, action: str, entity_type: str, entity_id: str, old_value: dict[str, Any] | None, new_value: dict[str, Any] | None) -> None:
    db.add(
        AuditLog(
            id=f"audit-{uuid4()}",
            tenant_id=actor.tenant_id,
            company_id=actor.company_id,
            plant_id=actor.plant_id,
            actor_id=actor.id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            old_value=old_value,
            new_value=new_value,
        )
    )


@router.post("/auth/login", response_model=RuntimeEnvelope)
def runtime_login(payload: LoginPayload, db: Session = Depends(get_db)) -> RuntimeEnvelope:
    ensure_runtime_schema()
    user = db.query(User).filter(User.email == payload.email, User.tenant_id == TENANT_ID).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is disabled")
    role = user.role or "user"
    result = LoginResult(
        access_token=create_token(user.id, user.tenant_id, permissions_for(role), minutes=8 * 60),
        user=SessionUser(**serialize_user(user)),
    )
    return runtime_result("login", "Authenticated user session.", result.model_dump())


@router.get("/auth/me", response_model=RuntimeEnvelope)
def me(user: User = Depends(current_user)) -> RuntimeEnvelope:
    return runtime_result("session", "Current authenticated user.", serialize_user(user))


@router.get("/users", response_model=RuntimeEnvelope)
def list_users(_: User = Depends(require_any("admin")), db: Session = Depends(get_db)) -> RuntimeEnvelope:
    actor = _
    query = db.query(User).filter(User.tenant_id == TENANT_ID)
    if not has_override_scope(actor):
        query = query.filter(User.company_id == actor.company_id)
    users = query.order_by(User.email).all()
    return runtime_result("list_users", "Users with access status and roles.", [serialize_user(user) for user in users])


@router.post("/users", response_model=RuntimeEnvelope)
def create_user(payload: UserCreate, actor: User = Depends(require_any("admin")), db: Session = Depends(get_db)) -> RuntimeEnvelope:
    existing = db.query(User).filter(User.email == payload.email, User.tenant_id == TENANT_ID).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already exists")
    if payload.role in {"super_admin", "account_owner"} and actor.role != "super_admin":
        raise HTTPException(status_code=403, detail="Only super admin can create top-level override users")
    target_company_id = payload.company_id or actor.company_id or COMPANY_ID
    if not has_override_scope(actor) and target_company_id != actor.company_id:
        raise HTTPException(status_code=403, detail="Cannot create users for another company")
    user = User(
        id=f"user-{uuid4()}",
        tenant_id=TENANT_ID,
        company_id=target_company_id,
        plant_id=payload.plant_id or PLANT_ID,
        email=payload.email,
        name=payload.name,
        password_hash=hash_password(payload.password),
        role=payload.role,
        is_active=payload.is_active,
    )
    db.add(user)
    audit(db, actor, "CREATE", "user", user.id, None, serialize_user(user))
    db.commit()
    db.refresh(user)
    return runtime_result("create_user", "User created.", serialize_user(user))


@router.put("/users/{user_id}", response_model=RuntimeEnvelope)
def update_user(user_id: str, payload: UserUpdate, actor: User = Depends(require_any("admin")), db: Session = Depends(get_db)) -> RuntimeEnvelope:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not has_override_scope(actor) and user.company_id != actor.company_id:
        raise HTTPException(status_code=403, detail="Cannot manage users from another company")
    if user.role in {"super_admin", "account_owner"} and actor.role != "super_admin":
        raise HTTPException(status_code=403, detail="Only super admin can update top-level override users")
    if payload.role in {"super_admin", "account_owner"} and actor.role != "super_admin":
        raise HTTPException(status_code=403, detail="Only super admin can grant top-level override roles")
    old_value = serialize_user(user)
    if payload.name is not None:
        user.name = payload.name
    if payload.role is not None:
        user.role = payload.role
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.password:
        user.password_hash = hash_password(payload.password)
    audit(db, actor, "UPDATE", "user", user.id, old_value, serialize_user(user))
    db.commit()
    db.refresh(user)
    return runtime_result("update_user", "User updated.", serialize_user(user))


@router.get("/records", response_model=RuntimeEnvelope)
def list_records(
    module_key: str | None = None,
    company_id: str | None = None,
    plant_id: str | None = None,
    actor: User = Depends(current_user),
    db: Session = Depends(get_db),
) -> RuntimeEnvelope:
    query = db.query(ModuleRecord)
    if not has_override_scope(actor):
        query = query.filter(ModuleRecord.company_id == actor.company_id)
    if module_key:
        query = query.filter(ModuleRecord.module_key == module_key)
    if company_id:
        query = query.filter(ModuleRecord.company_id == company_id)
    if plant_id:
        query = query.filter(ModuleRecord.plant_id == plant_id)
    records = query.order_by(ModuleRecord.module_key, ModuleRecord.record_code).all()
    return runtime_result("list_records", "Database-backed module records.", [serialize_record(record) for record in records])


@router.post("/records", response_model=RuntimeEnvelope)
def create_record(payload: ModuleRecordCreate, actor: User = Depends(require_any("admin")), db: Session = Depends(get_db)) -> RuntimeEnvelope:
    target_company_id = payload.company_id or actor.company_id or COMPANY_ID
    if not has_override_scope(actor) and target_company_id != actor.company_id:
        raise HTTPException(status_code=403, detail="Cannot create records for another company")
    record = ModuleRecord(
        id=f"record-{uuid4()}",
        tenant_id=TENANT_ID,
        company_id=target_company_id,
        plant_id=payload.plant_id or actor.plant_id or PLANT_ID,
        module_key=payload.module_key,
        record_type=payload.record_type,
        record_code=payload.record_code,
        name=payload.name,
        status=payload.status,
        quantity=payload.quantity,
        payload=payload.payload,
        created_at=datetime.utcnow(),
    )
    db.add(record)
    audit(db, actor, "CREATE", "module_record", record.id, None, serialize_record(record))
    db.commit()
    db.refresh(record)
    return runtime_result("create_record", "Module record created.", serialize_record(record))


@router.put("/records/{record_id}", response_model=RuntimeEnvelope)
def update_record(record_id: str, payload: ModuleRecordUpdate, actor: User = Depends(require_any("admin")), db: Session = Depends(get_db)) -> RuntimeEnvelope:
    record = db.get(ModuleRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    if not has_override_scope(actor) and record.company_id != actor.company_id:
        raise HTTPException(status_code=403, detail="Cannot modify records from another company")
    old_value = serialize_record(record)
    updates = payload.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(record, key, value)
    audit(db, actor, "UPDATE", "module_record", record.id, old_value, serialize_record(record))
    db.commit()
    db.refresh(record)
    return runtime_result("update_record", "Module record updated.", serialize_record(record))


@router.delete("/records/{record_id}", response_model=RuntimeEnvelope)
def delete_record(record_id: str, actor: User = Depends(require_any("admin")), db: Session = Depends(get_db)) -> RuntimeEnvelope:
    record = db.get(ModuleRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    if not has_override_scope(actor) and record.company_id != actor.company_id:
        raise HTTPException(status_code=403, detail="Cannot delete records from another company")
    old_value = serialize_record(record)
    db.delete(record)
    audit(db, actor, "DELETE", "module_record", record_id, old_value, None)
    db.commit()
    return runtime_result("delete_record", "Module record deleted.", {"id": record_id})


@router.get("/inventory/items", response_model=RuntimeEnvelope)
def inventory_items(user: User = Depends(current_user), db: Session = Depends(get_db)) -> RuntimeEnvelope:
    return list_records("inventory", None, None, user, db)


@router.get("/analytics/summary", response_model=RuntimeEnvelope)
def analytics_summary(_: User = Depends(current_user), db: Session = Depends(get_db)) -> RuntimeEnvelope:
    actor = _
    record_query = db.query(ModuleRecord)
    user_query = db.query(User)
    if not has_override_scope(actor):
        record_query = record_query.filter(ModuleRecord.company_id == actor.company_id)
        user_query = user_query.filter(User.company_id == actor.company_id)
    records = record_query.all()
    inventory = [record for record in records if record.module_key == "inventory"]
    active_users = user_query.filter(User.is_active.is_(True)).count()
    disabled_users = user_query.filter(User.is_active.is_(False)).count()
    total_quantity = sum(record.quantity or 0 for record in inventory)
    low_stock = [record for record in inventory if (record.quantity or 0) <= float((record.payload or {}).get("reorder_level", 0))]
    by_module: dict[str, int] = {}
    by_company: dict[str, int] = {}
    inventory_by_company: dict[str, float] = {}
    for record in records:
        by_module[record.module_key] = by_module.get(record.module_key, 0) + 1
        company_id = record.company_id or "unassigned"
        by_company[company_id] = by_company.get(company_id, 0) + 1
        if record.module_key == "inventory":
            inventory_by_company[company_id] = inventory_by_company.get(company_id, 0) + (record.quantity or 0)
    return runtime_result(
        "analytics_summary",
        "Live database analytics for visualization.",
        {
            "active_users": active_users,
            "disabled_users": disabled_users,
            "module_record_counts": by_module,
            "company_record_counts": by_company,
            "inventory_quantity_by_company": inventory_by_company,
            "inventory_total_quantity": total_quantity,
            "inventory_low_stock_count": len(low_stock),
            "inventory_low_stock_items": [serialize_record(record) for record in low_stock],
        },
    )


@router.get("/audit-logs", response_model=RuntimeEnvelope)
def audit_logs(_: User = Depends(require_any("admin")), db: Session = Depends(get_db)) -> RuntimeEnvelope:
    actor = _
    query = db.query(AuditLog)
    if not has_override_scope(actor):
        query = query.filter(AuditLog.company_id == actor.company_id)
    logs = query.order_by(AuditLog.created_at.desc()).limit(50).all()
    data = [
        {
            "id": log.id,
            "actor_id": log.actor_id,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "old_value": log.old_value,
            "new_value": log.new_value,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        }
        for log in logs
    ]
    return runtime_result("audit_logs", "Latest database write audit trail.", data)
