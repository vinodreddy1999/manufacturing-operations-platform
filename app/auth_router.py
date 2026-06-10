from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .database import get_db
from .platform_models import User
from .schemas import LoginRequest, LoginResponse, ModuleKey
from .security import create_token, verify_password

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/refresh")
def refresh_token() -> dict[str, str]:
    return {"access_token": create_token("user-admin-001", "tenant-demo-001", ["platform.admin"]), "token_type": "bearer"}


@router.post("/db-login", response_model=LoginResponse)
def db_login(request: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    user = db.query(User).filter(User.email == request.email, User.tenant_id == "tenant-demo-001").first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    role_permissions = {
        "super_admin": ["platform.super_admin", "platform.admin", "users.manage", "data.write", "data.read"],
        "admin": ["platform.admin", "users.manage", "data.write", "data.read"],
        "user": ["data.read"],
    }
    permissions = role_permissions.get(user.role or "user", role_permissions["user"])
    return LoginResponse(
        access_token=create_token(user.id, user.tenant_id, permissions),
        tenant_id=user.tenant_id,
        user_id=user.id,
        enabled_modules=[ModuleKey.INVENTORY, ModuleKey.WAREHOUSE, ModuleKey.PROCUREMENT, ModuleKey.PRODUCTION, ModuleKey.MAINTENANCE, ModuleKey.QUALITY, ModuleKey.REPORTING, ModuleKey.AI],
    )
