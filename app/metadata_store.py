from __future__ import annotations

from uuid import uuid4

from sqlalchemy.orm import Session

from .platform_models import AppMetadata


def list_metadata(
    db: Session,
    category: str,
    *,
    tenant_id: str = "tenant-demo-001",
    company_id: str | None = None,
    plant_id: str | None = None,
) -> list[dict]:
    query = db.query(AppMetadata).filter(AppMetadata.tenant_id == tenant_id, AppMetadata.category == category)
    if company_id is None:
        query = query.filter(AppMetadata.company_id.is_(None))
    else:
        query = query.filter(AppMetadata.company_id == company_id)
    if plant_id is None:
        query = query.filter(AppMetadata.plant_id.is_(None))
    else:
        query = query.filter(AppMetadata.plant_id == plant_id)
    return [row.payload for row in query.order_by(AppMetadata.record_key.asc()).all()]


def first_metadata(
    db: Session,
    category: str,
    record_key: str,
    *,
    tenant_id: str = "tenant-demo-001",
    company_id: str | None = None,
    plant_id: str | None = None,
) -> dict | None:
    query = db.query(AppMetadata).filter(
        AppMetadata.tenant_id == tenant_id,
        AppMetadata.category == category,
        AppMetadata.record_key == record_key,
    )
    if company_id is None:
        query = query.filter(AppMetadata.company_id.is_(None))
    else:
        query = query.filter(AppMetadata.company_id == company_id)
    if plant_id is None:
        query = query.filter(AppMetadata.plant_id.is_(None))
    else:
        query = query.filter(AppMetadata.plant_id == plant_id)
    row = query.first()
    return row.payload if row else None


def upsert_metadata(
    db: Session,
    *,
    category: str,
    record_key: str,
    payload: dict,
    tenant_id: str = "tenant-demo-001",
    company_id: str | None = None,
    plant_id: str | None = None,
    name: str | None = None,
    row_id: str | None = None,
) -> AppMetadata:
    query = db.query(AppMetadata).filter(
        AppMetadata.tenant_id == tenant_id,
        AppMetadata.category == category,
        AppMetadata.record_key == record_key,
    )
    if company_id is None:
        query = query.filter(AppMetadata.company_id.is_(None))
    else:
        query = query.filter(AppMetadata.company_id == company_id)
    if plant_id is None:
        query = query.filter(AppMetadata.plant_id.is_(None))
    else:
        query = query.filter(AppMetadata.plant_id == plant_id)
    row = query.first()
    if not row:
        row = AppMetadata(
            id=row_id or str(uuid4()),
            tenant_id=tenant_id,
            company_id=company_id,
            plant_id=plant_id,
            category=category,
            record_key=record_key,
            name=name,
            payload=payload,
        )
        db.add(row)
    else:
        row.name = name or row.name
        row.payload = payload
    return row
