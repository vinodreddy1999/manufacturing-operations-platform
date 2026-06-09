from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, Float, JSON, String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from ..database import Base


class IntelligenceRisk(Base):
    __tablename__ = "intelligence_risks"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    risk_id: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    risk_type: Mapped[str] = mapped_column(String(120), index=True)
    source_module: Mapped[str] = mapped_column(String(80), index=True)
    impacted_modules: Mapped[list] = mapped_column(JSON, default=list)
    risk_level: Mapped[str] = mapped_column(String(40))
    confidence: Mapped[float] = mapped_column(Float)
    business_impact: Mapped[str] = mapped_column(Text)
    recommended_action: Mapped[str] = mapped_column(Text)
    active_status: Mapped[bool] = mapped_column(Boolean, default=True)


class IntelligenceRiskLink(Base):
    __tablename__ = "intelligence_risk_links"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    risk_id: Mapped[str] = mapped_column(String(80), index=True)
    entity_type: Mapped[str] = mapped_column(String(80))
    entity_id: Mapped[str] = mapped_column(String(80), index=True)
    link_type: Mapped[str] = mapped_column(String(80), default="impacts")


class ImpactGraphNode(Base):
    __tablename__ = "impact_graph_nodes"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    entity_type: Mapped[str] = mapped_column(String(80), index=True)
    entity_id: Mapped[str] = mapped_column(String(80), index=True)
    label: Mapped[str] = mapped_column(String(160))
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict)


class ImpactGraphEdge(Base):
    __tablename__ = "impact_graph_edges"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    source_node_id: Mapped[str] = mapped_column(String(64), index=True)
    target_node_id: Mapped[str] = mapped_column(String(64), index=True)
    relationship: Mapped[str] = mapped_column(String(80), index=True)
    confidence: Mapped[float] = mapped_column(Float, default=1.0)


class RootCauseAnalysisRun(Base):
    __tablename__ = "root_cause_analysis_runs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    problem_type: Mapped[str] = mapped_column(String(120))
    entity_type: Mapped[str] = mapped_column(String(80))
    entity_id: Mapped[str] = mapped_column(String(80), index=True)
    likely_causes: Mapped[list] = mapped_column(JSON, default=list)
    confidence: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class RootCauseEvidence(Base):
    __tablename__ = "root_cause_evidence"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    root_cause_run_id: Mapped[str] = mapped_column(String(64), index=True)
    source_module: Mapped[str] = mapped_column(String(80))
    evidence_text: Mapped[str] = mapped_column(Text)
    sensitive: Mapped[bool] = mapped_column(Boolean, default=False)


class WhatIfSimulation(Base):
    __tablename__ = "what_if_simulations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    scenario_type: Mapped[str] = mapped_column(String(120))
    scenario_input: Mapped[dict] = mapped_column(JSON, default=dict)
    created_by: Mapped[str] = mapped_column(String(120), default="planner")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class WhatIfResult(Base):
    __tablename__ = "what_if_results"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    simulation_id: Mapped[str] = mapped_column(String(64), index=True)
    result_json: Mapped[dict] = mapped_column(JSON, default=dict)


class BottleneckRecord(Base):
    __tablename__ = "bottleneck_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    bottleneck_type: Mapped[str] = mapped_column(String(120))
    entity_type: Mapped[str] = mapped_column(String(80))
    entity_id: Mapped[str] = mapped_column(String(80))
    risk_level: Mapped[str] = mapped_column(String(40))
    evidence: Mapped[list] = mapped_column(JSON, default=list)


class OperationalHealthScore(Base):
    __tablename__ = "operational_health_scores"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    scope_type: Mapped[str] = mapped_column(String(80), index=True)
    scope_id: Mapped[str] = mapped_column(String(80), index=True)
    score: Mapped[float] = mapped_column(Float)
    risk_level: Mapped[str] = mapped_column(String(40))
    trend: Mapped[str] = mapped_column(String(80))
    top_causes: Mapped[list] = mapped_column(JSON, default=list)


class PlantHealthScore(Base):
    __tablename__ = "plant_health_scores"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    plant_id: Mapped[str] = mapped_column(String(80), index=True)
    score: Mapped[float] = mapped_column(Float)
    factors_json: Mapped[dict] = mapped_column(JSON, default=dict)
    open_critical_risks: Mapped[list] = mapped_column(JSON, default=list)


class CustomerImpactRecord(Base):
    __tablename__ = "customer_impact_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    customer_id: Mapped[str] = mapped_column(String(80), index=True)
    sales_order_id: Mapped[str] = mapped_column(String(80), index=True)
    impact_reason: Mapped[str] = mapped_column(Text)
    risk_level: Mapped[str] = mapped_column(String(40))
    recommended_action: Mapped[str] = mapped_column(Text)


class CostImpactRecord(Base):
    __tablename__ = "cost_impact_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    impact_type: Mapped[str] = mapped_column(String(120))
    amount: Mapped[float] = mapped_column(Float)
    source_module: Mapped[str] = mapped_column(String(80))
    reason: Mapped[str] = mapped_column(Text)


class IntelligenceRecommendation(Base):
    __tablename__ = "intelligence_recommendations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    recommendation_type: Mapped[str] = mapped_column(String(120))
    source_risk_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    recommended_action: Mapped[str] = mapped_column(Text)
    owner: Mapped[str] = mapped_column(String(120))
    due_date: Mapped[str] = mapped_column(String(40))
    status: Mapped[str] = mapped_column(String(80), default="Draft")


class IntelligenceDraftAction(Base):
    __tablename__ = "intelligence_draft_actions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    action_type: Mapped[str] = mapped_column(String(120))
    source_type: Mapped[str | None] = mapped_column(String(80), nullable=True)
    source_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    reason: Mapped[str] = mapped_column(Text)
    owner: Mapped[str] = mapped_column(String(120))
    status: Mapped[str] = mapped_column(String(80), default="DRAFT")
    requires_human_approval: Mapped[bool] = mapped_column(Boolean, default=True)


class IntelligenceExecutiveSummary(Base):
    __tablename__ = "executive_summaries_intelligence"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    summary_type: Mapped[str] = mapped_column(String(80))
    summary_text: Mapped[str] = mapped_column(Text)
    top_risks: Mapped[list] = mapped_column(JSON, default=list)
    recommended_decisions: Mapped[list] = mapped_column(JSON, default=list)


class IntelligenceAuditLog(Base):
    __tablename__ = "intelligence_audit_logs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(80), index=True)
    action: Mapped[str] = mapped_column(String(120))
    details_json: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
