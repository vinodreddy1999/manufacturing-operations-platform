from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timedelta
from typing import Any
from uuid import uuid4


class ManufacturingIntelligenceRepository:
    def __init__(self) -> None:
        self.feature_flags = {
            "company-a": {"manufacturing_intelligence_enabled": False},
            "company-c": {"manufacturing_intelligence_enabled": True, "intelligence_risk_center": True, "intelligence_root_cause": True, "intelligence_what_if": True, "intelligence_command_center": True, "intelligence_draft_actions": True, "intelligence_llm_summary": False, "intelligence_digital_twin_future": False},
        }
        self.enabled_modules = {"Inventory": True, "Warehouse": True, "Procurement": True, "Production": True, "Maintenance": True, "Quality": True, "Sales": True, "Costing": True, "Forecasting": False}
        self.risks = [
            {"id": "intel-risk-001", "risk_id": "intel-risk-001", "risk_type": "Supplier to production risk", "source_module": "Procurement", "impacted_modules": ["Inventory", "Production", "Sales", "Costing"], "risk_level": "HIGH", "confidence": 0.86, "business_impact": "Supplier delay may create raw material shortage, production delay, customer order delay and revenue risk.", "recommended_action": "Use backup supplier and reschedule production.", "active_status": True},
            {"id": "intel-risk-002", "risk_id": "intel-risk-002", "risk_type": "Maintenance to production risk", "source_module": "Maintenance", "impacted_modules": ["Production", "Quality", "Sales"], "risk_level": "HIGH", "confidence": 0.81, "business_impact": "Machine breakdown may reduce output and increase customer delivery risk.", "recommended_action": "Schedule urgent maintenance and move work to alternate line.", "active_status": True},
        ]
        self.risk_links = [{"id": "risk-link-001", "risk_id": "intel-risk-001", "entity_type": "Sales Order", "entity_id": "so-001", "link_type": "impacts"}]
        self.graph_nodes = [
            {"id": "node-supplier-apex", "entity_type": "Supplier", "entity_id": "supplier-apex", "label": "Apex Steel Components", "metadata_json": {"risk": "delay"}},
            {"id": "node-po-apex", "entity_type": "Purchase Order", "entity_id": "po-apex-001", "label": "PO-9001", "metadata_json": {}},
            {"id": "node-item-steel", "entity_type": "Inventory Item", "entity_id": "item-steel", "label": "Steel Coil", "metadata_json": {"stock": "low"}},
            {"id": "node-prod-demo", "entity_type": "Production Order", "entity_id": "po-demo-001", "label": "Pump Production", "metadata_json": {"status": "at risk"}},
            {"id": "node-machine-asm", "entity_type": "Machine", "entity_id": "M-ASM-01", "label": "Assembly Machine", "metadata_json": {"status": "breakdown"}},
            {"id": "node-so-001", "entity_type": "Sales Order", "entity_id": "so-001", "label": "Apollo Sales Order", "metadata_json": {"customer": "cust-apollo"}},
            {"id": "node-cust-apollo", "entity_type": "Customer", "entity_id": "cust-apollo", "label": "Apollo Industries", "metadata_json": {}},
            {"id": "node-cost-prod", "entity_type": "Cost Center", "entity_id": "cc-prod-line-1", "label": "Production Line 1 Cost Center", "metadata_json": {}},
        ]
        self.graph_edges = [
            {"id": "edge-001", "source_node_id": "node-supplier-apex", "target_node_id": "node-po-apex", "relationship": "supplies", "confidence": 0.95},
            {"id": "edge-002", "source_node_id": "node-po-apex", "target_node_id": "node-item-steel", "relationship": "depends_on", "confidence": 0.9},
            {"id": "edge-003", "source_node_id": "node-item-steel", "target_node_id": "node-prod-demo", "relationship": "consumed_by", "confidence": 0.92},
            {"id": "edge-004", "source_node_id": "node-machine-asm", "target_node_id": "node-prod-demo", "relationship": "blocked_by", "confidence": 0.88},
            {"id": "edge-005", "source_node_id": "node-prod-demo", "target_node_id": "node-so-001", "relationship": "impacts", "confidence": 0.86},
            {"id": "edge-006", "source_node_id": "node-so-001", "target_node_id": "node-cust-apollo", "relationship": "dispatched_to", "confidence": 0.93},
            {"id": "edge-007", "source_node_id": "node-prod-demo", "target_node_id": "node-cost-prod", "relationship": "impacts", "confidence": 0.77},
        ]
        self.root_cause_runs = []
        self.root_cause_evidence = []
        self.what_if_simulations = []
        self.what_if_results = []
        self.bottlenecks = [
            {"id": "bottleneck-material", "bottleneck_type": "Material bottleneck", "entity_type": "Inventory Item", "entity_id": "item-steel", "risk_level": "HIGH", "evidence": ["Low stock", "Supplier delay"]},
            {"id": "bottleneck-machine", "bottleneck_type": "Machine bottleneck", "entity_type": "Machine", "entity_id": "M-ASM-01", "risk_level": "HIGH", "evidence": ["Breakdown", "Downtime above threshold"]},
        ]
        self.health_scores = [{"id": "health-company", "scope_type": "Company", "scope_id": "company-c", "score": 74, "risk_level": "Warning", "trend": "Decreasing", "top_causes": ["Supplier delay", "Machine downtime", "Quality hold"]}]
        self.plant_health_scores = [{"id": "plant-health-hyd", "plant_id": "plant-hyd", "score": 71, "factors_json": {"inventory_availability": 68, "production_performance": 72, "machine_availability": 64, "quality_pass_rate": 91, "on_time_delivery": 86, "cost_variance": 12}, "open_critical_risks": ["intel-risk-001", "intel-risk-002"]}]
        self.customer_impacts = [{"id": "cust-impact-apollo", "customer_id": "cust-apollo", "sales_order_id": "so-001", "impact_reason": "Production order at risk due to steel shortage and machine downtime.", "risk_level": "HIGH", "recommended_action": "Draft customer delay email and prioritize alternate line."}]
        self.cost_impacts = [{"id": "cost-impact-001", "impact_type": "Downtime cost", "amount": 55000, "source_module": "Maintenance", "reason": "Assembly machine breakdown"}, {"id": "cost-impact-002", "impact_type": "Lost sales risk", "amount": 120000, "source_module": "Sales", "reason": "Customer order delay risk"}]
        self.recommendations = [{"id": "intel-rec-001", "recommendation_type": "Use backup supplier", "source_risk_id": "intel-risk-001", "recommended_action": "Create draft purchase request with backup supplier.", "owner": "Procurement Manager", "due_date": str((datetime.utcnow() + timedelta(days=1)).date()), "status": "Draft"}]
        self.draft_actions = []
        self.executive_summaries = [{"id": "intel-summary-weekly", "summary_type": "Weekly", "summary_text": "Top risks are supplier delay, machine downtime and customer delivery impact.", "top_risks": ["intel-risk-001", "intel-risk-002"], "recommended_decisions": ["Approve backup supplier review", "Move production to alternate line"]}]
        self.audit_logs = []

    def snapshot(self, data: Any) -> Any:
        return deepcopy(data)

    def add(self, collection: list[dict[str, Any]], payload: dict[str, Any], prefix: str) -> dict[str, Any]:
        record = {"id": f"{prefix}-{uuid4().hex[:8]}", **payload}
        collection.append(record)
        return self.snapshot(record)

    def node_for(self, entity_type: str, entity_id: str) -> dict[str, Any] | None:
        return next((row for row in self.graph_nodes if row["entity_type"].lower() == entity_type.lower() and row["entity_id"] == entity_id), None)


manufacturing_intelligence_repo = ManufacturingIntelligenceRepository()
