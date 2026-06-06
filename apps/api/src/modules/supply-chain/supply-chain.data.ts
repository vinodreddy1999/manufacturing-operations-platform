export type ProductPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface FactoryProduct {
  id: string;
  name: string;
  currentStock: number;
  safetyStock: number;
  reorderPoint: number;
  unitCost: number;
  warehouseLocation: string;
  priority: ProductPriority;
  demandHistory: number[];
  compatibleWith: string[];
}

export interface DistributionStock {
  inventoryId: string;
  locationName: string;
  productId: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  averageDailyConsumption: number;
}

export interface Truck {
  truckNumber: string;
  truckCapacity: number;
  weightCapacity: number;
  volumeCapacity: number;
  driverName: string;
  status: "AVAILABLE" | "LOADING" | "IN_TRANSIT" | "MAINTENANCE";
}

export interface ShipmentRequest {
  requestNumber: string;
  sourceInventory: string;
  destinationInventory: string;
  productId: string;
  requestedQuantity: number;
  priority: ProductPriority;
  requestedDate: string;
}

export const priorityWeights: Record<ProductPriority, number> = {
  LOW: 0.25,
  MEDIUM: 0.5,
  HIGH: 0.75,
  URGENT: 1,
};

export const factoryInventory: FactoryProduct[] = [
  {
    id: "P1",
    name: "Product P1",
    currentStock: 100,
    safetyStock: 20,
    reorderPoint: 60,
    unitCost: 18,
    warehouseLocation: "Central Warehouse / A-01",
    priority: "URGENT",
    demandHistory: [92, 104, 98, 108, 111, 116, 121],
    compatibleWith: ["P2", "P3", "P5"],
  },
  {
    id: "P2",
    name: "Product P2",
    currentStock: 500,
    safetyStock: 120,
    reorderPoint: 210,
    unitCost: 12,
    warehouseLocation: "Central Warehouse / A-02",
    priority: "HIGH",
    demandHistory: [34, 38, 41, 44, 47, 50, 53],
    compatibleWith: ["P1", "P3", "P4", "P5"],
  },
  {
    id: "P3",
    name: "Product P3",
    currentStock: 400,
    safetyStock: 90,
    reorderPoint: 160,
    unitCost: 15,
    warehouseLocation: "Central Warehouse / B-01",
    priority: "HIGH",
    demandHistory: [29, 31, 30, 34, 36, 38, 40],
    compatibleWith: ["P1", "P2", "P5"],
  },
  {
    id: "P4",
    name: "Product P4",
    currentStock: 300,
    safetyStock: 80,
    reorderPoint: 130,
    unitCost: 9,
    warehouseLocation: "Central Warehouse / B-02",
    priority: "MEDIUM",
    demandHistory: [18, 16, 19, 20, 18, 21, 22],
    compatibleWith: ["P2", "P5"],
  },
  {
    id: "P5",
    name: "Product P5",
    currentStock: 600,
    safetyStock: 140,
    reorderPoint: 240,
    unitCost: 7,
    warehouseLocation: "Central Warehouse / C-01",
    priority: "HIGH",
    demandHistory: [26, 30, 33, 35, 39, 42, 44],
    compatibleWith: ["P1", "P2", "P3", "P4"],
  },
];

export const distributionInventory: DistributionStock[] = [
  { inventoryId: "DI-A", locationName: "Distribution Inventory A", productId: "P1", currentStock: 42, minStock: 80, maxStock: 180, averageDailyConsumption: 16 },
  { inventoryId: "DI-A", locationName: "Distribution Inventory A", productId: "P2", currentStock: 90, minStock: 120, maxStock: 260, averageDailyConsumption: 22 },
  { inventoryId: "DI-A", locationName: "Distribution Inventory A", productId: "P3", currentStock: 105, minStock: 110, maxStock: 230, averageDailyConsumption: 18 },
  { inventoryId: "DI-A", locationName: "Distribution Inventory A", productId: "P4", currentStock: 190, minStock: 80, maxStock: 220, averageDailyConsumption: 9 },
  { inventoryId: "DI-A", locationName: "Distribution Inventory A", productId: "P5", currentStock: 150, minStock: 130, maxStock: 250, averageDailyConsumption: 17 },
  { inventoryId: "DI-B", locationName: "Distribution Inventory B", productId: "P1", currentStock: 70, minStock: 90, maxStock: 200, averageDailyConsumption: 14 },
  { inventoryId: "DI-B", locationName: "Distribution Inventory B", productId: "P2", currentStock: 210, minStock: 100, maxStock: 260, averageDailyConsumption: 15 },
  { inventoryId: "DI-C", locationName: "Distribution Inventory C", productId: "P3", currentStock: 52, minStock: 120, maxStock: 240, averageDailyConsumption: 20 },
  { inventoryId: "DI-D", locationName: "Distribution Inventory D", productId: "P5", currentStock: 88, minStock: 125, maxStock: 260, averageDailyConsumption: 24 },
];

export const trucks: Truck[] = [
  { truckNumber: "TRK-1001", truckCapacity: 200, weightCapacity: 2600, volumeCapacity: 34, driverName: "Raj Mehta", status: "AVAILABLE" },
  { truckNumber: "TRK-1002", truckCapacity: 320, weightCapacity: 4100, volumeCapacity: 46, driverName: "Anita Rao", status: "LOADING" },
  { truckNumber: "TRK-1003", truckCapacity: 500, weightCapacity: 6200, volumeCapacity: 74, driverName: "Karan Shah", status: "AVAILABLE" },
];

export const shipmentRequests: ShipmentRequest[] = [
  {
    requestNumber: "SR-2026-001",
    sourceInventory: "Central Warehouse",
    destinationInventory: "DI-A",
    productId: "P1",
    requestedQuantity: 100,
    priority: "URGENT",
    requestedDate: "2026-06-04",
  },
  {
    requestNumber: "SR-2026-002",
    sourceInventory: "Central Warehouse",
    destinationInventory: "DI-C",
    productId: "P3",
    requestedQuantity: 80,
    priority: "HIGH",
    requestedDate: "2026-06-04",
  },
];
