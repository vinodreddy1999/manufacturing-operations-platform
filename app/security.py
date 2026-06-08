from datetime import datetime, timedelta, timezone
from uuid import uuid4

from jose import jwt
from passlib.context import CryptContext


JWT_SECRET = "local-development-secret"
JWT_ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_token(subject: str, tenant_id: str, permissions: list[str], minutes: int = 30) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            "jti": str(uuid4()),
            "sub": subject,
            "tenant_id": tenant_id,
            "permissions": permissions,
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(minutes=minutes)).timestamp()),
        },
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )
