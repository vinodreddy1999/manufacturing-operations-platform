export const platformModules = [
  "INVENTORY", "WAREHOUSE", "SUPPLIER", "PROCUREMENT", "PRODUCTION", "BOM", "MAINTENANCE", "QUALITY", "CUSTOMERS", "CUSTOMER_PORTAL", "SUPPLIER_PORTAL", "FORECASTING", "COSTING", "AI_COPILOT",
] as const;

export type PlatformModule = (typeof platformModules)[number];
export type ModuleLifecycle = "CORE" | "OPTIONAL" | "PORTAL" | "AI";

export interface PlatformModuleDefinition {
  key: PlatformModule;
  label: string;
  lifecycle: ModuleLifecycle;
  permissions: readonly string[];
  dependencies: readonly PlatformModule[];
}

export const moduleRegistry: readonly PlatformModuleDefinition[] = [
  { key: "INVENTORY", label: "Inventory", lifecycle: "CORE", permissions: ["inventory.read", "inventory.items.manage", "inventory.movements.create"], dependencies: [] },
  { key: "WAREHOUSE", label: "Warehouse", lifecycle: "CORE", permissions: ["warehouse.read", "warehouse.locations.manage"], dependencies: ["INVENTORY"] },
  { key: "SUPPLIER", label: "Supplier", lifecycle: "OPTIONAL", permissions: ["supplier.read", "supplier.manage"], dependencies: [] },
  { key: "PROCUREMENT", label: "Procurement", lifecycle: "OPTIONAL", permissions: ["procurement.read", "procurement.purchase-orders.manage"], dependencies: ["INVENTORY", "SUPPLIER"] },
  { key: "PRODUCTION", label: "Production", lifecycle: "OPTIONAL", permissions: ["production.read", "production.orders.manage"], dependencies: ["INVENTORY", "WAREHOUSE"] },
  { key: "BOM", label: "BOM", lifecycle: "OPTIONAL", permissions: ["production.bom.manage"], dependencies: ["PRODUCTION"] },
  { key: "MAINTENANCE", label: "Maintenance", lifecycle: "OPTIONAL", permissions: ["maintenance.read", "maintenance.work-orders.manage"], dependencies: ["INVENTORY"] },
  { key: "QUALITY", label: "Quality", lifecycle: "OPTIONAL", permissions: ["quality.read", "quality.inspections.manage"], dependencies: ["INVENTORY"] },
  { key: "CUSTOMERS", label: "Customers", lifecycle: "OPTIONAL", permissions: ["customer.read", "customer.manage"], dependencies: [] },
  { key: "CUSTOMER_PORTAL", label: "Customer Portal", lifecycle: "PORTAL", permissions: ["customer-portal.read"], dependencies: ["CUSTOMERS"] },
  { key: "SUPPLIER_PORTAL", label: "Supplier Portal", lifecycle: "PORTAL", permissions: ["supplier-portal.read"], dependencies: ["SUPPLIER", "PROCUREMENT"] },
  { key: "FORECASTING", label: "Forecasting", lifecycle: "OPTIONAL", permissions: ["reporting.read"], dependencies: ["INVENTORY"] },
  { key: "COSTING", label: "Costing", lifecycle: "OPTIONAL", permissions: ["reporting.read"], dependencies: ["INVENTORY", "PRODUCTION"] },
  { key: "AI_COPILOT", label: "AI Copilot", lifecycle: "AI", permissions: ["ai.recommendations.read", "ai.drafts.create"], dependencies: [] },
];
