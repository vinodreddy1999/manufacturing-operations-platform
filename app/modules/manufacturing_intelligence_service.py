from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Protocol

import numpy as np

from .manufacturing_intelligence_repository import ManufacturingIntelligenceRepository, manufacturing_intelligence_repo


class IntelligenceLLMProvider(Protocol):
    def summarize(self, prompt: str, context: dict[str, Any]) -> str:
        ...


class MockIntelligenceProvider:
    def summarize(self, prompt: str, context: dict[str, Any]) -> str:
        return f"Rule-based summary: {prompt}. Top risk count: {len(context.get('risks', []))}."


class ManufacturingIntelligenceService:
    def __init__(self, repo: ManufacturingIntelligenceRepository = manufacturing_intelligence_repo, llm_provider: IntelligenceLLMProvider | None = None) -> None:
        self.repo = repo
        self.llm_provider = llm_provider or MockIntelligenceProvider()

    def enablement(self, company_id: str = "company-c") -> dict[str, Any]:
        return {"company_id": company_id, "feature_flags": self.repo.feature_flags.get(company_id, {})}

    def command_center(self) -> dict[str, Any]:
        return {
            "top_operational_risks": self.repo.snapshot(self.repo.risks),
            "cross_module_dependencies": ["Supplier Delay -> Raw Material Shortage -> Production Delay -> Customer Order Delay -> Revenue Risk", "Machine Breakdown -> Production Loss -> Quality Risk -> Delivery Delay"],
            "delayed_orders": ["so-001"],
            "production_bottlenecks": [row for row in self.repo.bottlenecks if row["bottleneck_type"] in {"Material bottleneck", "Machine bottleneck"}],
            "inventory_bottlenecks": [row for row in self.repo.bottlenecks if row["entity_type"] == "Inventory Item"],
            "supplier_risks": [row for row in self.repo.risks if row["source_module"] == "Procurement"],
            "machine_risks": [row for row in self.repo.risks if row["source_module"] == "Maintenance"],
            "quality_risks": [{"risk": "Quality hold risk", "risk_level": "MEDIUM"}],
            "customer_impact": self.repo.customer_impacts,
            "cost_impact": self.repo.cost_impacts,
            "recommended_actions": self.recommendations(),
        }

    def risks(self) -> list[dict[str, Any]]:
        return [row for row in self.repo.risks if row["active_status"]]

    def impact_graph(self, entity_type: str, entity_id: str) -> dict[str, Any]:
        start = self.repo.node_for(entity_type, entity_id)
        if not start:
            raise KeyError(f"{entity_type}:{entity_id}")
        connected_ids = {start["id"]}
        for edge in self.repo.graph_edges:
            if edge["source_node_id"] in connected_ids or edge["target_node_id"] in connected_ids:
                connected_ids.add(edge["source_node_id"])
                connected_ids.add(edge["target_node_id"])
        nodes = [node for node in self.repo.graph_nodes if node["id"] in connected_ids]
        edges = [edge for edge in self.repo.graph_edges if edge["source_node_id"] in connected_ids and edge["target_node_id"] in connected_ids]
        return {"start": start, "nodes": nodes, "edges": edges}

    def root_cause(self, payload: dict[str, Any]) -> dict[str, Any]:
        likely = ["Material shortage", "Supplier delay", "Machine breakdown", "Quality hold"]
        evidence = [
            {"source_module": "Inventory", "evidence_text": "Steel item is a material bottleneck.", "sensitive": False},
            {"source_module": "Procurement", "evidence_text": "Supplier PO delivery is within risk window.", "sensitive": False},
            {"source_module": "Maintenance", "evidence_text": "Assembly machine breakdown is active.", "sensitive": False},
        ]
        confidence = 0.82 if self.repo.enabled_modules.get("Procurement") else 0.64
        run = self.repo.add(self.repo.root_cause_runs, {"problem_type": payload["problem_type"], "entity_type": payload["entity_type"], "entity_id": payload["entity_id"], "likely_causes": likely, "confidence": confidence, "created_at": datetime.utcnow().isoformat()}, "rca")
        for row in evidence:
            self.repo.add(self.repo.root_cause_evidence, {"root_cause_run_id": run["id"], **row}, "rca-evidence")
        return {"run": run, "likely_causes": likely, "evidence": evidence, "confidence": confidence, "impacted_orders": ["so-001"], "recommended_tasks": ["Draft supplier follow-up", "Draft maintenance escalation", "Draft production reschedule"]}

    def what_if(self, payload: dict[str, Any]) -> dict[str, Any]:
        scenario = payload["scenario_type"]
        delay_days = int(payload["parameters"].get("delay_days", 0))
        demand_multiplier = float(payload["parameters"].get("demand_multiplier", 1.0))
        cost_impact = round(float(np.mean([55000, 120000])) * max(delay_days, 1) * demand_multiplier, 2)
        result = {"inventory_impact": "Steel shortage risk increases" if "supplier" in scenario.lower() else "Inventory impact moderate", "production_impact": f"Production may slip {max(delay_days, 1)} day(s)", "sales_impact": "Customer order so-001 at risk", "quality_impact": "Quality hold risk unchanged", "maintenance_impact": "Maintenance escalation required" if "machine" in scenario.lower() else "No additional maintenance impact", "cost_impact": cost_impact, "recommended_actions": ["Draft transfer request", "Draft production reschedule", "Draft customer notification"]}
        simulation = self.repo.add(self.repo.what_if_simulations, {"scenario_type": scenario, "scenario_input": payload["parameters"], "created_by": payload["created_by"], "created_at": datetime.utcnow().isoformat()}, "whatif")
        self.repo.add(self.repo.what_if_results, {"simulation_id": simulation["id"], "result_json": result}, "whatif-result")
        return {"simulation": simulation, "result": result}

    def bottlenecks(self) -> list[dict[str, Any]]:
        return self.repo.snapshot(self.repo.bottlenecks)

    def health_score(self) -> dict[str, Any]:
        return {"scores": self.repo.snapshot(self.repo.health_scores), "method": "Weighted score from inventory, production, maintenance, quality, sales and costing factors"}

    def plant_health_score(self) -> list[dict[str, Any]]:
        return self.repo.snapshot(self.repo.plant_health_scores)

    def customer_impact(self) -> list[dict[str, Any]]:
        return self.repo.snapshot(self.repo.customer_impacts)

    def cost_impact(self) -> dict[str, Any]:
        total = sum(row["amount"] for row in self.repo.cost_impacts)
        return {"records": self.repo.snapshot(self.repo.cost_impacts), "total_estimated_impact": total, "impact_types": ["Delay cost", "Downtime cost", "Wastage cost", "Rework cost", "Lost sales risk", "Expedited procurement cost"]}

    def recommendations(self) -> list[dict[str, Any]]:
        allowed = [row for row in self.repo.recommendations if self._action_allowed(row["recommendation_type"])]
        return self.repo.snapshot(allowed)

    def draft_action(self, payload: dict[str, Any]) -> dict[str, Any]:
        sanitized = payload["reason"]
        for blocked, replacement in {
            "approve purchase orders": "purchase order review",
            "transfer inventory": "transfer request review",
            "change production schedule": "production schedule review",
            "release quarantine": "quality hold review",
            "dispatch goods": "dispatch review",
            "send external email": "email draft review",
            "write off inventory": "inventory loss review",
            "change pricing": "pricing review",
            "modify financial records": "finance review",
        }.items():
            sanitized = sanitized.replace(blocked, replacement)
        draft = self.repo.add(self.repo.draft_actions, {**payload, "reason": sanitized, "status": "DRAFT", "requires_human_approval": True, "ai_safety": self.ai_safety()}, "intel-draft")
        self.repo.add(self.repo.audit_logs, {"user_id": payload.get("owner", "operations-manager"), "action": "draft_action_created", "details_json": {"draft_id": draft["id"]}, "created_at": datetime.utcnow().isoformat()}, "intel-audit")
        return draft

    def executive_summary(self) -> dict[str, Any]:
        text = self.llm_provider.summarize("Weekly manufacturing intelligence summary", {"risks": self.risks()})
        summary = {"summary_type": "Weekly", "summary_text": text, "top_risks": [risk["risk_id"] for risk in self.risks()], "top_improvements": ["On-time delivery stable"], "critical_delays": ["so-001"], "customer_impact": self.customer_impact(), "cost_impact": self.cost_impact(), "recommended_decisions": ["Approve backup supplier review", "Authorize alternate line plan"]}
        self.repo.add(self.repo.executive_summaries, summary, "intel-summary")
        return summary

    def ai_safety(self) -> dict[str, list[str]]:
        return {"can": ["Analyze", "Explain", "Simulate", "Recommend", "Create Drafts"], "cannot": ["Approve Purchase Orders", "Transfer Inventory", "Change Production Schedule", "Release Quarantine", "Dispatch Goods", "Send External Email Without Approval", "Write Off Inventory", "Change Pricing", "Modify Financial Records"]}

    def _action_allowed(self, recommendation_type: str) -> bool:
        disabled_map = {"Create procurement request": "Procurement", "Transfer stock": "Inventory", "Reschedule production": "Production", "Schedule maintenance earlier": "Maintenance", "Create quality investigation": "Quality", "Notify customer": "Sales"}
        module = disabled_map.get(recommendation_type)
        return self.repo.enabled_modules.get(module, True)


manufacturing_intelligence_service = ManufacturingIntelligenceService()
