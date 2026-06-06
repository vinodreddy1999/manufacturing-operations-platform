export const apiModuleRegistry = [
  {
    key: "INVENTORY",
    label: "Inventory",
    permissions: [
      "inventory.read",
      "inventory.items.manage",
      "inventory.movements.create",
      "inventory.reservations.manage",
      "inventory.adjustments.approve",
    ],
    dependencies: [],
  },
  {
    key: "WAREHOUSE",
    label: "Warehouse",
    permissions: ["warehouse.read", "warehouse.locations.manage", "warehouse.scans.create"],
    dependencies: ["INVENTORY"],
  },
  {
    key: "SUPPLIER",
    label: "Supplier",
    permissions: ["supplier.read", "supplier.manage", "supplier.ratings.manage"],
    dependencies: [],
  },
  {
    key: "PROCUREMENT",
    label: "Procurement",
    permissions: [
      "procurement.read",
      "procurement.requisitions.manage",
      "procurement.purchase-orders.manage",
      "procurement.purchase-orders.approve",
    ],
    dependencies: ["INVENTORY", "SUPPLIER"],
  },
  {
    key: "PRODUCTION",
    label: "Production",
    permissions: [
      "production.read",
      "production.bom.manage",
      "production.orders.manage",
      "production.schedules.manage",
    ],
    dependencies: ["INVENTORY", "WAREHOUSE"],
  },
  {
    key: "MAINTENANCE",
    label: "Maintenance",
    permissions: ["maintenance.read", "maintenance.assets.manage", "maintenance.work-orders.manage"],
    dependencies: ["INVENTORY"],
  },
  {
    key: "QUALITY",
    label: "Quality",
    permissions: ["quality.read", "quality.inspections.manage", "quality.capa.manage"],
    dependencies: ["INVENTORY"],
  },
  {
    key: "FORECASTING",
    label: "Reporting and Forecasting",
    permissions: ["reporting.read", "reporting.exports.create", "reporting.schedules.manage"],
    dependencies: ["INVENTORY"],
  },
  {
    key: "AI_COPILOT",
    label: "AI Copilot",
    permissions: ["ai.recommendations.read", "ai.drafts.create"],
    dependencies: [],
  },
] as const;
