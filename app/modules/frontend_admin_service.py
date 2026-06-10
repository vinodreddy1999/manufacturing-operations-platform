from statistics import mean

from .frontend_admin_repository import frontend_admin_repo


class FrontendAdminService:
    def __init__(self) -> None:
        self.repo = frontend_admin_repo

    def admin_dashboard(self) -> dict:
        return {
            "user_count": 18,
            "active_users": 15,
            "plants": 2,
            "warehouses": 3,
            "integrations": len(self.repo.connections),
            "data_quality": round(mean(item["quality_score"] for item in self.repo.catalog), 2),
            "ai_readiness": self.ai_readiness()["overall_ai_readiness"],
            "open_approvals": len([item for item in self.repo.pending_updates if item["approval_status"] == "Pending"]),
            "pending_actions": len(self.repo.pending_updates),
        }

    def company_setup(self) -> dict:
        return {
            "company_profile": {"company_id": "company-c", "name": "Precision Components", "currency": "INR", "timezone": "Asia/Kolkata"},
            "locations": ["Hyderabad", "Bangalore"],
            "branches": ["South India"],
            "plants": ["Hyderabad Plant", "Bangalore Plant"],
            "warehouses": ["Hyderabad Main", "Hyderabad FG", "Bangalore Main"],
            "fiscal_settings": {"fiscal_year_start_month": "April"},
        }

    def access_control(self) -> dict:
        return {
            "roles": self.repo.snapshot(self.repo.roles),
            "permission_matrix": self.repo.snapshot(self.repo.permission_matrix),
            "dashboard_policies": self.repo.snapshot(self.repo.dashboard_policies),
            "data_scopes": self.repo.snapshot(self.repo.data_scopes),
            "permission_logic": "Dashboard Visible = Tenant Enabled Dashboard AND Role Permission AND User Permission AND Data Scope Permission",
        }

    def evaluate_dashboard_access(self, payload: dict) -> dict:
        visible = all([
            payload["tenant_dashboard_enabled"],
            payload["role_permission"],
            payload["user_permission"],
            payload["data_scope_permission"],
        ])
        return {**payload, "dashboard_visible": visible, "decision": "Visible" if visible else "Hidden"}

    def workflow_simulation(self, payload: dict) -> dict:
        workflow = next((row for row in self.repo.workflows if row["workflow_name"] == payload["workflow_name"]), self.repo.workflows[0])
        steps = list(workflow["steps"])
        if payload.get("amount", 0) > 100000 and "Finance Approval" not in steps:
            steps.insert(1, "Finance Approval")
        return {"workflow_name": workflow["workflow_name"], "requester_role": payload["requester_role"], "steps": steps, "requires_human_approval": True}

    def data_quality(self) -> dict:
        scores = [{"data_type": item["data_type"], "accuracy": item["quality_score"], "completeness": max(item["quality_score"] - 3, 0), "consistency": max(item["quality_score"] - 5, 0), "timeliness": max(item["quality_score"] - 7, 0)} for item in self.repo.catalog]
        return {"overall_score": round(mean(item["accuracy"] for item in scores), 2), "scores": scores}

    def ai_readiness(self) -> dict:
        readiness = [
            {"area": "Inventory AI Readiness", "score": 92, "ready": True},
            {"area": "Production AI Readiness", "score": 86, "ready": True},
            {"area": "Maintenance AI Readiness", "score": 74, "ready": False},
            {"area": "Quality AI Readiness", "score": 88, "ready": True},
        ]
        return {"overall_ai_readiness": round(mean(item["score"] for item in readiness), 2), "readiness": readiness}

    def mapping_preview(self, payload: dict) -> dict:
        match = next((row for row in self.repo.mappings if row["source_system"] == payload["source_system"] and row["source_field"] == payload["source_field"]), None)
        target_field = match["target_field"] if match else payload["source_field"].lower().replace(" ", "_")
        transformed = str(payload["source_value"]).strip().upper() if match and match["transform_rule"] == "trim_uppercase" else payload["source_value"]
        return {
            "source_system": payload["source_system"],
            "source_field": payload["source_field"],
            "source_value": payload["source_value"],
            "target_entity": payload["target_entity"],
            "target_field": target_field,
            "transformed_value": transformed,
            "confidence": match["confidence"] if match else 0.65,
            "requires_human_review": (match["confidence"] if match else 0.65) < 0.9,
        }

    def approve_pending_update(self, update_id: str, payload: dict) -> dict:
        update = self.repo.pending_update(update_id)
        if not update:
            raise KeyError(update_id)
        update["approval_status"] = payload["decision"]
        update["erp_status"] = "Export Ready" if payload["decision"] == "Approved" else "Rejected"
        update["decided_by"] = payload["decided_by"]
        update["decision_comment"] = payload.get("comment")
        return self.repo.snapshot(update)

    def synchronization_dashboard(self) -> dict:
        failed = len([item for item in self.repo.connections if item["connection_status"] != "Healthy"])
        return {
            "sync_success_rate": 94.5,
            "pending_updates": len(self.repo.pending_updates),
            "failed_updates": failed,
            "integration_health": round(mean(item["health_score"] for item in self.repo.connections), 2),
            "write_modes": ["Read Only", "Export Only", "Approval Required", "Automatic Writeback", "Hybrid"],
        }

    def action_center(self) -> dict:
        return {
            "inventory_actions": [{"action": "Review safety stock", "status": "Pending", "source": "AI"}],
            "production_actions": [{"action": "Review capacity plan", "status": "Draft", "source": "Planning"}],
            "maintenance_actions": [{"action": "Schedule spindle inspection", "status": "Open", "source": "Machine Health"}],
            "quality_actions": [{"action": "Review supplier defect trend", "status": "Open", "source": "QMS"}],
        }

    def erp_feedback(self) -> dict:
        return {
            "recommendation_acceptance_rate": 68,
            "erp_update_status": {"exported": 8, "applied": 6, "failed": 1, "pending": 2},
            "business_impact": {"inventory_value_reduced": 240000, "stockout_risks_avoided": 3},
        }

    def reconciliation(self) -> dict:
        return {
            "comparisons": [
                {"entity": "item-steel", "erp_value": {"safety_stock": 500}, "platform_recommendation": {"safety_stock": 750}, "variance": 250, "status": "Approval Required"},
                {"entity": "supplier-apex", "erp_value": {"lead_time_days": 7}, "platform_recommendation": {"lead_time_days": 10}, "variance": 3, "status": "Review"},
            ]
        }

    def planning_overview(self) -> dict:
        return {
            "planning_areas": ["Demand Planning", "Inventory Planning", "Procurement Planning", "Production Planning", "Capacity Planning", "Supply Planning", "Distribution Planning", "Workforce Planning", "Maintenance Planning", "Scenario Planning"],
            "active_scenarios": [{"name": "Supplier delay and demand surge", "risk_level": "HIGH"}],
        }

    def ai_command_center(self) -> dict:
        return {
            "copilots": ["Executive", "Inventory", "Production", "Maintenance", "Quality", "Procurement", "Sales", "Supply Chain"],
            "scenario_simulator": "Available",
            "recommendation_center": {"open_recommendations": 7, "critical": 2},
            "ai_learning_center": {"feedback_items": 18},
            "ai_governance_dashboard": {"draft_only_actions": True, "policy_violations": 0},
            "autonomous_planning_engine": {"mode": "Recommendation Only"},
        }

    def digital_twin(self) -> dict:
        return {
            "twins": ["Enterprise Twin", "Factory Twin", "Warehouse Twin", "Machine Twin", "Supply Chain Twin", "Inventory Twin"],
            "knowledge_graph": {"connects": ["Products", "Materials", "Machines", "Suppliers", "Customers", "Inventory", "Production", "Maintenance", "Quality"], "used_by_ai": True},
            "sample_nodes": [{"entity": "M-ASM-01", "twin_type": "Machine Twin", "status": "At Risk"}, {"entity": "item-steel", "twin_type": "Inventory Twin", "status": "Shortage Risk"}],
        }

    def digital_operations_center(self) -> dict:
        return {
            "executive_layer": ["Executive Command Center", "Inventory Control Tower", "Production Control Tower", "Maintenance Control Tower", "Quality Control Tower", "Procurement Control Tower", "Sales Control Tower", "Supply Chain Control Tower", "AI Decision Center", "Enterprise Performance Center"],
            "top_risks": ["Supplier delay affecting production", "Machine downtime affecting output", "Quality rejection affecting delivery"],
            "decision_mode": "Human approval required for critical actions",
        }


frontend_admin_service = FrontendAdminService()
