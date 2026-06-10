from copy import deepcopy


class FrontendAdminRepository:
    def __init__(self) -> None:
        self.navigation = [
            {"section": "Platform Management", "super_admin_only": True, "items": ["Tenant Management", "Subscription Management", "Billing", "Feature Flags", "Industry Templates", "Connector Marketplace", "AI Marketplace", "Usage Analytics", "Global Audit Logs"]},
            {"section": "Operations", "items": ["Dashboard", "Admin", "Planning", "Inventory", "Production", "Maintenance", "Quality", "Procurement", "Sales & Distribution", "Costing & Profitability", "Compliance"]},
            {"section": "External Portals", "items": ["Customer Portal", "Supplier Portal"]},
            {"section": "Intelligence", "items": ["AI Command Center", "Digital Twin", "Digital Operations Center"]},
        ]
        self.roles = [
            "Super Admin", "Company Admin", "Plant Manager", "Production Manager", "Inventory Manager", "Warehouse Manager", "Maintenance Manager", "Quality Manager", "Procurement Manager", "Sales Manager", "Planning Manager", "Finance Manager", "Supervisor", "Operator", "Technician", "Customer User", "Supplier User", "Viewer",
        ]
        self.permission_matrix = [
            {"permission": "View", "roles": ["Company Admin", "Plant Manager", "Inventory Manager", "Viewer"]},
            {"permission": "Create", "roles": ["Company Admin", "Production Manager", "Inventory Manager", "Procurement Manager"]},
            {"permission": "Edit", "roles": ["Company Admin", "Production Manager", "Maintenance Manager", "Quality Manager"]},
            {"permission": "Delete", "roles": ["Company Admin"]},
            {"permission": "Approve", "roles": ["Company Admin", "Plant Manager", "Finance Manager"]},
            {"permission": "Export", "roles": ["Company Admin", "Finance Manager", "Viewer"]},
            {"permission": "Import", "roles": ["Company Admin", "Integration Owner"]},
            {"permission": "Configure", "roles": ["Company Admin"]},
            {"permission": "Administer", "roles": ["Super Admin", "Company Admin"]},
        ]
        self.dashboard_policies = [
            {"dashboard_key": "EXECUTIVE", "enabled_for_company": True, "allowed_roles": ["Company Admin", "Plant Manager"], "allowed_users": ["admin-user"], "data_scope": {"company": "company-c", "plants": ["plant-hyd", "plant-blr"]}},
            {"dashboard_key": "INVENTORY", "enabled_for_company": True, "allowed_roles": ["Inventory Manager", "Warehouse Manager"], "allowed_users": ["inventory-manager-hyd"], "data_scope": {"company": "company-c", "plants": ["plant-hyd"], "warehouses": ["wh-hyd-main"]}},
            {"dashboard_key": "AI", "enabled_for_company": True, "allowed_roles": ["Company Admin", "Plant Manager"], "allowed_users": ["admin-user"], "data_scope": {"company": "company-c"}},
        ]
        self.data_scopes = [
            {"role_name": "Inventory Manager Hyderabad", "can_see": {"plant": "Hyderabad", "warehouses": ["Hyderabad Main"]}, "cannot_see": {"plant": "Bangalore", "warehouses": ["Bangalore Main"]}},
            {"role_name": "Plant Manager", "can_see": {"plant": "Hyderabad", "departments": ["Production", "Quality", "Maintenance"]}, "cannot_see": {"other_companies": True}},
        ]
        self.workflows = [
            {"id": "wf-pr", "workflow_name": "Purchase Request Approval", "trigger": "Purchase Request", "steps": ["Manager Approval", "Finance Approval", "Purchase Order"], "no_code_designer_ready": True},
            {"id": "wf-maint", "workflow_name": "Maintenance Request Approval", "trigger": "Maintenance Request", "steps": ["Approval", "Work Order"], "no_code_designer_ready": True},
            {"id": "wf-prod-change", "workflow_name": "Production Change Approval", "trigger": "Production Change", "steps": ["Approval", "Execution"], "no_code_designer_ready": True},
        ]
        self.kpis = [
            {"kpi_code": "OEE", "name": "Overall Equipment Effectiveness", "owner": "Production Manager", "target": 85},
            {"kpi_code": "MTTR", "name": "Mean Time To Repair", "owner": "Maintenance Manager", "target": 120},
            {"kpi_code": "FORECAST_ACCURACY", "name": "Forecast Accuracy", "owner": "Planning Manager", "target": 90},
            {"kpi_code": "INVENTORY_TURNS", "name": "Inventory Turns", "owner": "Inventory Manager", "target": 8},
            {"kpi_code": "REJECTION_PERCENT", "name": "Rejection %", "owner": "Quality Manager", "target": 2},
        ]
        self.alert_rules = [
            {"alert": "Stock Below Safety Stock", "level_1": "Inventory Manager", "level_2_after": "2 hours -> Plant Manager", "level_3_after": "24 hours -> Company Admin"},
            {"alert": "Machine Down", "level_1": "Maintenance Manager", "level_2_after": "1 hour -> Plant Manager", "level_3_after": "8 hours -> Company Admin"},
        ]
        self.notification_channels = ["Email", "SMS", "WhatsApp", "Teams", "Slack", "Push Notification", "In-App Notification"]
        self.security_center = {"sso": "Planned", "mfa": "Supported by policy model", "password_policies": "Defined", "session_control": "Defined", "device_control": "Mobile module ready", "ip_restrictions": "Policy-ready"}
        self.document_management = {"stores": ["SOP", "Work Instructions", "Manuals", "Certificates", "Audit Documents", "Contracts"], "features": ["Version Control", "Approval Workflow", "AI Search", "OCR"]}
        self.compliance_center = {"standards": ["ISO", "GMP", "HACCP", "FDA"], "features": ["Electronic Signatures", "Audit Trails", "Compliance Reports"]}
        self.platform_management = {
            "tenant_count": 1,
            "subscription_plans": ["Starter", "Professional", "Enterprise"],
            "billing_status": "Active",
            "feature_flags": ["Inventory", "Production", "Maintenance", "Quality", "AI", "Integrations"],
            "industry_templates": ["Discrete Manufacturing", "Process Manufacturing", "Food & Beverage"],
            "marketplaces": {"connectors": ["SAP", "Oracle", "Dynamics 365", "Odoo"], "ai": ["Inventory Copilot", "Production Copilot", "Executive Copilot"]},
            "usage_analytics": {"api_calls_today": 1240, "storage_used_gb": 18, "ai_requests_today": 42},
        }
        self.connections = [
            {"id": "conn-sap", "system_name": "SAP S/4HANA", "system_type": "ERP", "connection_status": "Healthy", "last_sync": "2026-06-10T01:00:00", "health_score": 94, "record_count": 24000},
            {"id": "conn-plc", "system_name": "Assembly PLC", "system_type": "PLC", "connection_status": "Warning", "last_sync": "2026-06-10T00:45:00", "health_score": 72, "record_count": 180000},
        ]
        self.catalog = [
            {"data_type": "Inventory", "source_system": "SAP S/4HANA", "owner": "Inventory Manager", "quality_score": 91, "ai_ready": True},
            {"data_type": "Production", "source_system": "MES", "owner": "Production Manager", "quality_score": 86, "ai_ready": True},
            {"data_type": "Machine Data", "source_system": "PLC", "owner": "Maintenance Manager", "quality_score": 74, "ai_ready": False},
        ]
        self.mappings = [
            {"id": "map-material", "source_system": "SAP S/4HANA", "source_field": "SAP Material Code", "target_entity": "InventoryItem", "target_field": "SKU", "transform_rule": "trim_uppercase", "confidence": 0.98},
            {"id": "map-plant", "source_system": "SAP S/4HANA", "source_field": "SAP Plant", "target_entity": "Plant", "target_field": "plant_code", "transform_rule": "lookup_company_plant", "confidence": 0.95},
            {"id": "map-vendor", "source_system": "SAP S/4HANA", "source_field": "SAP Vendor", "target_entity": "Supplier", "target_field": "supplier_code", "transform_rule": "lookup_supplier", "confidence": 0.94},
        ]
        self.pending_updates = [
            {"id": "erp-upd-001", "recommendation": "Increase safety stock for item-steel", "entity_type": "InventoryItem", "entity_id": "item-steel", "current_value": {"safety_stock": 500}, "recommended_value": {"safety_stock": 750}, "approval_status": "Pending", "erp_status": "Draft"},
            {"id": "erp-upd-002", "recommendation": "Update supplier lead time", "entity_type": "Supplier", "entity_id": "supplier-apex", "current_value": {"lead_time_days": 7}, "recommended_value": {"lead_time_days": 10}, "approval_status": "Draft", "erp_status": "Not Exported"},
        ]

    def snapshot(self, data):
        return deepcopy(data)

    def pending_update(self, update_id: str):
        return next((item for item in self.pending_updates if item["id"] == update_id), None)


frontend_admin_repo = FrontendAdminRepository()
