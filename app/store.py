from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from uuid import uuid4

from .schemas import ModuleDefinition, ModuleKey


MODULES = [
    ModuleDefinition(key=ModuleKey.AUTH, name="Auth", description="Login and tenant user context", permissions=["auth.login"]),
    ModuleDefinition(key=ModuleKey.PLATFORM, name="Platform", description="Tenants, companies, plants, users, roles, feature flags", permissions=["platform.read", "platform.admin"]),
    ModuleDefinition(key=ModuleKey.INVENTORY, name="Inventory", description="Items, stock balances, movements, reservations", permissions=["inventory.read", "inventory.movements.create"]),
    ModuleDefinition(key=ModuleKey.WAREHOUSE, name="Warehouse", description="Warehouses, zones, racks, shelves, bins", permissions=["warehouse.read"], dependencies=[ModuleKey.INVENTORY]),
    ModuleDefinition(key=ModuleKey.SUPPLIER, name="Supplier", description="Suppliers, contacts, ratings, item sourcing", permissions=["supplier.read"]),
    ModuleDefinition(key=ModuleKey.PROCUREMENT, name="Procurement", description="Purchase requisitions and purchase orders", permissions=["procurement.read", "procurement.requisitions.create"], dependencies=[ModuleKey.INVENTORY, ModuleKey.SUPPLIER]),
    ModuleDefinition(key=ModuleKey.PRODUCTION, name="Production", description="BOM, routing, work centers, production orders", permissions=["production.read", "production.orders.create"], dependencies=[ModuleKey.INVENTORY, ModuleKey.WAREHOUSE]),
    ModuleDefinition(key=ModuleKey.MAINTENANCE, name="Maintenance", description="Machines, maintenance plans, work orders", permissions=["maintenance.read", "maintenance.work_orders.create"]),
    ModuleDefinition(key=ModuleKey.QUALITY, name="Quality", description="Inspections, CAPA, quarantine and rework", permissions=["quality.read", "quality.inspections.create"], dependencies=[ModuleKey.INVENTORY]),
    ModuleDefinition(key=ModuleKey.REPORTING, name="Reporting", description="Operational reports, KPIs and exports", permissions=["reporting.read"]),
    ModuleDefinition(key=ModuleKey.AI, name="AI", description="Recommendations and draft actions requiring approval", permissions=["ai.recommendations.read"]),
    ModuleDefinition(key=ModuleKey.SUPPLY_CHAIN, name="Supply Chain", description="Forecasting and truck-load optimization", permissions=["supply_chain.read"], dependencies=[ModuleKey.INVENTORY, ModuleKey.SUPPLIER]),
]


class DemoStore:
    def __init__(self) -> None:
        self.tenants = {
            "precision-components": {
                "id": "tenant-demo-001",
                "name": "Precision Components Demo",
                "slug": "precision-components",
                "enabled_modules": [module.key for module in MODULES],
            }
        }
        self.users = {
            "admin@mop.local": {
                "id": "user-admin-001",
                "tenant_slug": "precision-components",
                "name": "MOP Admin",
                "password": "ChangeMe123!",
                "permissions": ["platform.admin"],
            }
        }
        self.companies = [{"id": "company-c", "name": "Company C", "code": "CO-C"}]
        self.plants = [{"id": "plant-north", "company_id": "company-c", "name": "North Plant", "timezone": "Asia/Kolkata"}]
        self.inventory_items = [
            {"id": "item-steel", "sku": "RM-STL-001", "description": "Cold rolled steel coil", "uom": "KG", "reorder_level": 8000, "safety_stock": 5000},
            {"id": "item-bearing", "sku": "SP-BRG-014", "description": "CNC spindle bearing", "uom": "EA", "reorder_level": 12, "safety_stock": 6},
        ]
        self.balances = [
            {"item_id": "item-steel", "location_id": "bin-a-01-01", "physical": 18400, "reserved": 3200, "available": 15200},
            {"item_id": "item-bearing", "location_id": "bin-mro-02", "physical": 18, "reserved": 4, "available": 14},
        ]
        self.locations = [
            {"id": "bin-a-01-01", "warehouse": "WH-NORTH", "type": "BIN", "code": "A-01-01", "occupancy_percent": 76},
            {"id": "bin-mro-02", "warehouse": "WH-NORTH", "type": "BIN", "code": "MRO-02", "occupancy_percent": 42},
        ]
        self.suppliers = [
            {"id": "supplier-apex", "name": "Apex Steel Components", "lead_time_days": 12, "quality_rating": 96.4, "delivery_reliability": 94.1},
            {"id": "supplier-mech", "name": "MechWorks Spares", "lead_time_days": 5, "quality_rating": 92.0, "delivery_reliability": 90.5},
        ]
        self.movements: list[dict] = []
        self.requisitions: list[dict] = []
        self.production_orders: list[dict] = []
        self.work_orders: list[dict] = []
        self.inspections: list[dict] = []

    @staticmethod
    def snapshot(value):
        return deepcopy(value)

    @staticmethod
    def create_record(collection: list[dict], payload: dict) -> dict:
        record = {"id": str(uuid4()), "created_at": datetime.now(timezone.utc).isoformat(), **payload}
        collection.append(record)
        return record


store = DemoStore()
