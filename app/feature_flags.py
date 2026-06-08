from sqlalchemy.orm import Session

from .platform_models import FeatureFlag


def module_enabled(db: Session, tenant_id: str, company_id: str, module_key: str) -> bool:
    flag = (
        db.query(FeatureFlag)
        .filter(
            FeatureFlag.tenant_id == tenant_id,
            FeatureFlag.company_id == company_id,
            FeatureFlag.module_key == module_key,
        )
        .first()
    )
    return flag.enabled if flag else True

