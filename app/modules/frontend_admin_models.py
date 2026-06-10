from sqlalchemy import Boolean, Column, DateTime, Float, Integer, JSON, String, Text
from sqlalchemy.sql import func

from ..database import Base


class PlatformSubscription(Base):
    __tablename__ = "platform_subscriptions"

    id = Column(String, primary_key=True)
    tenant_id = Column(String, index=True, nullable=False)
    company_id = Column(String, index=True, nullable=False)
    plan_name = Column(String, nullable=False)
    billing_status = Column(String, nullable=False, default="Active")
    enabled_modules = Column(JSON, nullable=False, default=list)
    usage_limits = Column(JSON, nullable=False, default=dict)
    storage_limit_gb = Column(Integer, nullable=False, default=100)
    api_limit_per_day = Column(Integer, nullable=False, default=10000)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class DashboardAccessPolicy(Base):
    __tablename__ = "dashboard_access_policies"

    id = Column(String, primary_key=True)
    tenant_id = Column(String, index=True, nullable=False)
    company_id = Column(String, index=True, nullable=False)
    dashboard_key = Column(String, index=True, nullable=False)
    enabled_for_company = Column(Boolean, nullable=False, default=True)
    allowed_roles = Column(JSON, nullable=False, default=list)
    allowed_users = Column(JSON, nullable=False, default=list)
    data_scope = Column(JSON, nullable=False, default=dict)


class DataScopePolicy(Base):
    __tablename__ = "data_scope_policies"

    id = Column(String, primary_key=True)
    company_id = Column(String, index=True, nullable=False)
    role_name = Column(String, index=True, nullable=False)
    plant_ids = Column(JSON, nullable=False, default=list)
    warehouse_ids = Column(JSON, nullable=False, default=list)
    production_line_ids = Column(JSON, nullable=False, default=list)
    department_ids = Column(JSON, nullable=False, default=list)


class WorkflowDefinition(Base):
    __tablename__ = "workflow_definitions"

    id = Column(String, primary_key=True)
    company_id = Column(String, index=True, nullable=False)
    workflow_name = Column(String, nullable=False)
    trigger_type = Column(String, nullable=False)
    steps = Column(JSON, nullable=False, default=list)
    active_status = Column(Boolean, nullable=False, default=True)


class ManufacturingDataConnection(Base):
    __tablename__ = "manufacturing_data_connections"

    id = Column(String, primary_key=True)
    company_id = Column(String, index=True, nullable=False)
    system_name = Column(String, nullable=False)
    system_type = Column(String, nullable=False)
    connection_status = Column(String, nullable=False)
    last_sync = Column(String)
    health_score = Column(Float, nullable=False, default=0)
    record_count = Column(Integer, nullable=False, default=0)


class DataCatalogEntry(Base):
    __tablename__ = "data_catalog_entries"

    id = Column(String, primary_key=True)
    company_id = Column(String, index=True, nullable=False)
    data_type = Column(String, nullable=False)
    source_system = Column(String, nullable=False)
    owner = Column(String, nullable=False)
    ai_ready = Column(Boolean, nullable=False, default=False)
    quality_score = Column(Float, nullable=False, default=0)
    lineage = Column(JSON, nullable=False, default=dict)


class DataMappingRule(Base):
    __tablename__ = "data_mapping_rules"

    id = Column(String, primary_key=True)
    company_id = Column(String, index=True, nullable=False)
    source_system = Column(String, nullable=False)
    source_field = Column(String, nullable=False)
    target_entity = Column(String, nullable=False)
    target_field = Column(String, nullable=False)
    transform_rule = Column(Text)
    confidence = Column(Float, nullable=False, default=1)


class PendingErpUpdate(Base):
    __tablename__ = "pending_erp_updates"

    id = Column(String, primary_key=True)
    company_id = Column(String, index=True, nullable=False)
    recommendation = Column(Text, nullable=False)
    entity_type = Column(String, nullable=False)
    entity_id = Column(String, nullable=False)
    current_value = Column(JSON, nullable=False, default=dict)
    recommended_value = Column(JSON, nullable=False, default=dict)
    approval_status = Column(String, nullable=False, default="Draft")
    erp_status = Column(String, nullable=False, default="Not Exported")


class DigitalTwinNode(Base):
    __tablename__ = "digital_twin_nodes"

    id = Column(String, primary_key=True)
    company_id = Column(String, index=True, nullable=False)
    twin_type = Column(String, nullable=False)
    entity_type = Column(String, nullable=False)
    entity_id = Column(String, nullable=False)
    status = Column(String, nullable=False)
    telemetry = Column(JSON, nullable=False, default=dict)
