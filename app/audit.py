from uuid import uuid4

from sqlalchemy.orm import Session

from .platform_models import AuditLog


def audit(
    db: Session,
    *,
    action: str,
    entity_type: str,
    entity_id: str,
    tenant_id: str = "tenant-demo-001",
    company_id: str | None = "company-c",
    plant_id: str | None = "plant-north",
    actor_id: str | None = None,
    old_value: dict | None = None,
    new_value: dict | None = None,
) -> AuditLog:
    row = AuditLog(
        id=str(uuid4()),
        tenant_id=tenant_id,
        company_id=company_id,
        plant_id=plant_id,
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_value=old_value,
        new_value=new_value,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row

