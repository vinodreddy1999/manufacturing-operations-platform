export const inventoryCompany = {
  clientId: 'CLT-000001',
  clientName: 'ABC Manufacturing',
  region: 'North America',
  market: 'United States',
  currency: 'USD',
  plants: ['Hyderabad Plant', 'Bangalore Plant'],
  warehouses: ['Raw Material Warehouse', 'Finished Goods Warehouse', 'Spare Parts Warehouse'],
  categories: ['Raw Material', 'Finished Goods', 'Packaging', 'Spare Parts', 'Consumables'],
  products: ['Chocolate Cake', 'Vanilla Cake', 'Plastic Container', 'Food Packaging Film', 'Industrial Component'],
};

export const inventoryItems = [
  { code: 'FG-CAKE-CHOC', name: 'Chocolate Cake', category: 'Finished Goods', plant: 'Hyderabad Plant', warehouse: 'Finished Goods Warehouse', availableQty: 1800, reservedQty: 620, blockedQty: 40, inTransitQty: 200, uom: 'EA', value: 126000, coverageDays: 13, turns: 8.4, status: 'Warning' },
  { code: 'FG-CAKE-VAN', name: 'Vanilla Cake', category: 'Finished Goods', plant: 'Hyderabad Plant', warehouse: 'Finished Goods Warehouse', availableQty: 1450, reservedQty: 480, blockedQty: 25, inTransitQty: 160, uom: 'EA', value: 94250, coverageDays: 14, turns: 7.9, status: 'Warning' },
  { code: 'FG-CONTAINER', name: 'Plastic Container', category: 'Finished Goods', plant: 'Bangalore Plant', warehouse: 'Finished Goods Warehouse', availableQty: 6100, reservedQty: 1900, blockedQty: 130, inTransitQty: 500, uom: 'EA', value: 183000, coverageDays: 19, turns: 10.1, status: 'Healthy' },
  { code: 'RM-SUGAR', name: 'Sugar', category: 'Raw Material', plant: 'Hyderabad Plant', warehouse: 'Raw Material Warehouse', availableQty: 1100, reservedQty: 700, blockedQty: 0, inTransitQty: 300, uom: 'KG', value: 38500, coverageDays: 6, turns: 14.2, status: 'Critical' },
  { code: 'RM-FLOUR', name: 'Flour', category: 'Raw Material', plant: 'Hyderabad Plant', warehouse: 'Raw Material Warehouse', availableQty: 1200, reservedQty: 880, blockedQty: 30, inTransitQty: 0, uom: 'KG', value: 31200, coverageDays: 7, turns: 13.5, status: 'Critical' },
  { code: 'RM-MILK', name: 'Milk Powder', category: 'Raw Material', plant: 'Hyderabad Plant', warehouse: 'Raw Material Warehouse', availableQty: 760, reservedQty: 430, blockedQty: 20, inTransitQty: 0, uom: 'KG', value: 60800, coverageDays: 11, turns: 9.2, status: 'Review' },
  { code: 'RM-RESIN', name: 'Plastic Resin', category: 'Raw Material', plant: 'Bangalore Plant', warehouse: 'Raw Material Warehouse', availableQty: 3900, reservedQty: 2100, blockedQty: 80, inTransitQty: 900, uom: 'KG', value: 273000, coverageDays: 22, turns: 6.1, status: 'Healthy' },
  { code: 'PKG-FILM', name: 'Packaging Film', category: 'Packaging', plant: 'Bangalore Plant', warehouse: 'Raw Material Warehouse', availableQty: 4800, reservedQty: 900, blockedQty: 50, inTransitQty: 600, uom: 'M', value: 144000, coverageDays: 32, turns: 4.8, status: 'Healthy' },
  { code: 'SP-BEARING', name: 'Bearing Kit', category: 'Spare Parts', plant: 'Hyderabad Plant', warehouse: 'Spare Parts Warehouse', availableQty: 18, reservedQty: 5, blockedQty: 1, inTransitQty: 0, uom: 'EA', value: 21600, coverageDays: 210, turns: 0.7, status: 'Slow Moving' },
  { code: 'SP-MOTOR', name: 'Servo Motor', category: 'Spare Parts', plant: 'Bangalore Plant', warehouse: 'Spare Parts Warehouse', availableQty: 9, reservedQty: 2, blockedQty: 0, inTransitQty: 0, uom: 'EA', value: 40500, coverageDays: 260, turns: 0.4, status: 'Dead Stock' },
];

export const goodsReceipts = [
  { receiptNo: 'GR-1001', source: 'Purchase Order', supplier: 'SweetSource', poNumber: 'PO-771', warehouse: 'Raw Material Warehouse', item: 'Sugar', quantity: 300, lotNumber: 'LOT-SUG-0626', expiryDate: '2026-12-30', valueUpdate: 10500, status: 'Posted' },
  { receiptNo: 'GR-1002', source: 'Production Order', supplier: 'Internal Production', poNumber: 'WO-552', warehouse: 'Finished Goods Warehouse', item: 'Chocolate Cake', quantity: 600, lotNumber: 'LOT-CHC-0701', expiryDate: '2026-07-18', valueUpdate: 42000, status: 'Posted' },
  { receiptNo: 'GR-1003', source: 'Transfer', supplier: 'Bangalore Plant', poNumber: 'TR-204', warehouse: 'Raw Material Warehouse', item: 'Packaging Film', quantity: 600, lotNumber: 'LOT-FLM-0618', expiryDate: '2027-01-10', valueUpdate: 18000, status: 'In Transit' },
  { receiptNo: 'GR-1004', source: 'Returns', supplier: 'North Retail Group', poNumber: 'RET-088', warehouse: 'Finished Goods Warehouse', item: 'Vanilla Cake', quantity: 40, lotNumber: 'LOT-VAN-0630', expiryDate: '2026-07-16', valueUpdate: 2600, status: 'Inspection' },
  { receiptNo: 'GR-1005', source: 'Purchase Order', supplier: 'PolyChem', poNumber: 'PO-779', warehouse: 'Raw Material Warehouse', item: 'Plastic Resin', quantity: 900, lotNumber: 'LOT-RES-0628', expiryDate: '2028-06-01', valueUpdate: 63000, status: 'Posted' },
];

export const goodsIssues = [
  { issueNo: 'GI-2001', type: 'Production', warehouse: 'Raw Material Warehouse', department: 'Production', item: 'Sugar', quantity: 700, reason: 'Chocolate Cake batch', status: 'Posted' },
  { issueNo: 'GI-2002', type: 'Production', warehouse: 'Raw Material Warehouse', department: 'Production', item: 'Flour', quantity: 880, reason: 'Vanilla Cake batch', status: 'Posted' },
  { issueNo: 'GI-2003', type: 'Maintenance', warehouse: 'Spare Parts Warehouse', department: 'Maintenance', item: 'Bearing Kit', quantity: 5, reason: 'Line 2 repair', status: 'Posted' },
  { issueNo: 'GI-2004', type: 'Sales', warehouse: 'Finished Goods Warehouse', department: 'Sales', item: 'Plastic Container', quantity: 1600, reason: 'PackPro dispatch', status: 'Posted' },
  { issueNo: 'GI-2005', type: 'Scrap', warehouse: 'Raw Material Warehouse', department: 'Quality', item: 'Milk Powder', quantity: 20, reason: 'Quality rejection', status: 'Approved' },
];

export const stockTransfers = [
  { transferNo: 'TR-3001', type: 'Warehouse to Warehouse', source: 'Raw Material Warehouse', destination: 'Finished Goods Warehouse', item: 'Packaging Film', quantity: 400, transferDate: '2026-06-22', status: 'Posted' },
  { transferNo: 'TR-3002', type: 'Plant to Plant', source: 'Hyderabad Plant', destination: 'Bangalore Plant', item: 'Plastic Resin', quantity: 700, transferDate: '2026-06-21', status: 'In Transit' },
  { transferNo: 'TR-3003', type: 'Bin to Bin', source: 'RM-A-01', destination: 'RM-B-04', item: 'Flour', quantity: 240, transferDate: '2026-06-20', status: 'Posted' },
  { transferNo: 'TR-3004', type: 'Warehouse to Warehouse', source: 'Finished Goods Warehouse', destination: 'Spare Parts Warehouse', item: 'Industrial Component', quantity: 60, transferDate: '2026-06-19', status: 'Review' },
  { transferNo: 'TR-3005', type: 'Plant to Plant', source: 'Bangalore Plant', destination: 'Hyderabad Plant', item: 'Servo Motor', quantity: 2, transferDate: '2026-06-18', status: 'Posted' },
];

export const adjustments = [
  { adjustmentNo: 'ADJ-4001', reason: 'Damage', item: 'Milk Powder', warehouse: 'Raw Material Warehouse', quantity: -20, workflow: 'Operator -> Supervisor -> Inventory Manager', status: 'Approved' },
  { adjustmentNo: 'ADJ-4002', reason: 'Found Stock', item: 'Packaging Film', warehouse: 'Raw Material Warehouse', quantity: 120, workflow: 'Operator -> Supervisor -> Inventory Manager', status: 'Posted' },
  { adjustmentNo: 'ADJ-4003', reason: 'Audit Correction', item: 'Bearing Kit', warehouse: 'Spare Parts Warehouse', quantity: -1, workflow: 'Operator -> Supervisor -> Inventory Manager', status: 'Pending Approval' },
  { adjustmentNo: 'ADJ-4004', reason: 'Loss', item: 'Sugar', warehouse: 'Raw Material Warehouse', quantity: -30, workflow: 'Operator -> Supervisor -> Inventory Manager', status: 'Review' },
  { adjustmentNo: 'ADJ-4005', reason: 'Damage', item: 'Chocolate Cake', warehouse: 'Finished Goods Warehouse', quantity: -40, workflow: 'Operator -> Supervisor -> Inventory Manager', status: 'Approved' },
];

export const cycleCounts = [
  { countNo: 'CC-5001', warehouse: 'Raw Material Warehouse', item: 'Sugar', systemQty: 1130, countedQty: 1100, variance: -30, accuracy: 97.3, status: 'Posted' },
  { countNo: 'CC-5002', warehouse: 'Raw Material Warehouse', item: 'Flour', systemQty: 1180, countedQty: 1200, variance: 20, accuracy: 98.3, status: 'Posted' },
  { countNo: 'CC-5003', warehouse: 'Finished Goods Warehouse', item: 'Chocolate Cake', systemQty: 1840, countedQty: 1800, variance: -40, accuracy: 97.8, status: 'Approved' },
  { countNo: 'CC-5004', warehouse: 'Spare Parts Warehouse', item: 'Bearing Kit', systemQty: 19, countedQty: 18, variance: -1, accuracy: 94.7, status: 'Pending Approval' },
  { countNo: 'CC-5005', warehouse: 'Raw Material Warehouse', item: 'Plastic Resin', systemQty: 3880, countedQty: 3900, variance: 20, accuracy: 99.5, status: 'Posted' },
];

export const physicalInventorySteps = [
  { step: 'Freeze Inventory', owner: 'Inventory Manager', status: 'Completed', completedOn: '2026-06-18' },
  { step: 'Count', owner: 'Warehouse Supervisor', status: 'Completed', completedOn: '2026-06-19' },
  { step: 'Verify', owner: 'Inventory Controller', status: 'Completed', completedOn: '2026-06-20' },
  { step: 'Approve', owner: 'Company Admin', status: 'Pending Approval', completedOn: '-' },
  { step: 'Post Adjustments', owner: 'Inventory Manager', status: 'Not Started', completedOn: '-' },
];

export const agingBuckets = [
  { bucket: '0-30 Days', quantity: 10450, value: 313500, status: 'Healthy' },
  { bucket: '31-60 Days', quantity: 5220, value: 156600, status: 'Healthy' },
  { bucket: '61-90 Days', quantity: 1880, value: 75200, status: 'Review' },
  { bucket: '91-180 Days', quantity: 520, value: 46800, status: 'Warning' },
  { bucket: '180+ Days', quantity: 27, value: 62100, status: 'Critical' },
];

export const deadStock = [
  { item: 'Servo Motor', warehouse: 'Spare Parts Warehouse', lastMovementDate: '2025-09-18', daysSinceMovement: 279, value: 40500, status: 'Dead Stock' },
  { item: 'Bearing Kit', warehouse: 'Spare Parts Warehouse', lastMovementDate: '2025-11-20', daysSinceMovement: 216, value: 21600, status: 'Dead Stock' },
  { item: 'Industrial Component', warehouse: 'Spare Parts Warehouse', lastMovementDate: '2025-12-05', daysSinceMovement: 201, value: 18000, status: 'Dead Stock' },
];

export const slowMoving = [
  { item: 'Bearing Kit', movementCount: 2, inventoryValue: 21600, coverageDays: 210, status: 'Slow Moving' },
  { item: 'Servo Motor', movementCount: 1, inventoryValue: 40500, coverageDays: 260, status: 'Slow Moving' },
  { item: 'Packaging Film', movementCount: 5, inventoryValue: 144000, coverageDays: 32, status: 'Review' },
  { item: 'Plastic Resin', movementCount: 4, inventoryValue: 273000, coverageDays: 22, status: 'Healthy' },
];

export const reorderRules = [
  { item: 'Sugar', reorderPoint: 1200, safetyStock: 500, minimumStock: 800, maximumStock: 2600, status: 'Critical' },
  { item: 'Flour', reorderPoint: 1400, safetyStock: 600, minimumStock: 900, maximumStock: 2800, status: 'Critical' },
  { item: 'Milk Powder', reorderPoint: 650, safetyStock: 250, minimumStock: 500, maximumStock: 1400, status: 'Warning' },
  { item: 'Plastic Resin', reorderPoint: 2600, safetyStock: 1000, minimumStock: 2200, maximumStock: 6000, status: 'Healthy' },
  { item: 'Packaging Film', reorderPoint: 2200, safetyStock: 900, minimumStock: 1800, maximumStock: 7000, status: 'Healthy' },
];

export const lots = [
  { lotNumber: 'LOT-SUG-0626', item: 'Sugar', manufacturingDate: '2026-06-10', expiryDate: '2026-12-30', quantity: 300, status: 'Available' },
  { lotNumber: 'LOT-CHC-0701', item: 'Chocolate Cake', manufacturingDate: '2026-07-01', expiryDate: '2026-07-18', quantity: 600, status: 'Reserved' },
  { lotNumber: 'LOT-VAN-0630', item: 'Vanilla Cake', manufacturingDate: '2026-06-30', expiryDate: '2026-07-16', quantity: 40, status: 'Inspection' },
  { lotNumber: 'LOT-RES-0628', item: 'Plastic Resin', manufacturingDate: '2026-06-12', expiryDate: '2028-06-01', quantity: 900, status: 'Available' },
  { lotNumber: 'LOT-FLM-0618', item: 'Packaging Film', manufacturingDate: '2026-06-18', expiryDate: '2027-01-10', quantity: 600, status: 'In Transit' },
];

export const serials = [
  { serialNumber: 'SN-MOTOR-001', item: 'Servo Motor', warehouse: 'Spare Parts Warehouse', status: 'Available', history: 'Received -> Stored -> Cycle counted' },
  { serialNumber: 'SN-MOTOR-002', item: 'Servo Motor', warehouse: 'Spare Parts Warehouse', status: 'Reserved', history: 'Received -> Reserved for Line 2' },
  { serialNumber: 'SN-BEAR-010', item: 'Bearing Kit', warehouse: 'Spare Parts Warehouse', status: 'Issued', history: 'Received -> Issued to maintenance' },
  { serialNumber: 'SN-COMP-044', item: 'Industrial Component', warehouse: 'Finished Goods Warehouse', status: 'Available', history: 'Produced -> Stored' },
  { serialNumber: 'SN-COMP-045', item: 'Industrial Component', warehouse: 'Finished Goods Warehouse', status: 'Blocked', history: 'Produced -> Quality hold' },
];

export const valuationRows = [
  { item: 'Chocolate Cake', method: 'FIFO', inventoryValue: 126000, unitCost: 70, costVariance: 2.1, status: 'Healthy' },
  { item: 'Vanilla Cake', method: 'Weighted Average', inventoryValue: 94250, unitCost: 65, costVariance: 1.4, status: 'Healthy' },
  { item: 'Plastic Container', method: 'Standard Cost', inventoryValue: 183000, unitCost: 30, costVariance: -0.8, status: 'Healthy' },
  { item: 'Sugar', method: 'FIFO', inventoryValue: 38500, unitCost: 35, costVariance: 4.6, status: 'Warning' },
  { item: 'Plastic Resin', method: 'LIFO', inventoryValue: 273000, unitCost: 70, costVariance: 3.2, status: 'Review' },
];

export const inventoryAudit = [
  { timestamp: '2026-06-22 09:10', user: 'Warehouse Supervisor', action: 'Goods Receipt Posted', item: 'Sugar', previousValue: '800 KG', newValue: '1100 KG' },
  { timestamp: '2026-06-22 10:30', user: 'Inventory Manager', action: 'Stock Transfer Posted', item: 'Packaging Film', previousValue: '4400 M', newValue: '4800 M' },
  { timestamp: '2026-06-21 14:20', user: 'Company Admin', action: 'Adjustment Approved', item: 'Milk Powder', previousValue: '780 KG', newValue: '760 KG' },
  { timestamp: '2026-06-20 16:45', user: 'Cycle Count Team', action: 'Count Posted', item: 'Flour', previousValue: '1180 KG', newValue: '1200 KG' },
  { timestamp: '2026-06-19 11:05', user: 'Maintenance', action: 'Goods Issue Posted', item: 'Bearing Kit', previousValue: '23 EA', newValue: '18 EA' },
];

export const inventoryImpact = [
  { metric: 'Inventory Reduction', previous: '$10.0M', current: '$8.0M', difference: '$2.0M', financialImpact: 2000000, owner: 'Inventory Manager', status: 'Delivered' },
  { metric: 'Working Capital Released', previous: '$10.0M', current: '$8.0M', difference: '$2.0M', financialImpact: 2000000, owner: 'Company Admin', status: 'Delivered' },
  { metric: 'Dead Stock Reduction', previous: '$180K', current: '$80K', difference: '$100K', financialImpact: 100000, owner: 'Inventory Controller', status: 'Improved' },
  { metric: 'Slow Moving Reduction', previous: '$420K', current: '$279K', difference: '$141K', financialImpact: 141000, owner: 'Warehouse Manager', status: 'Improved' },
  { metric: 'Stockout Prevention', previous: '9 risks', current: '3 risks', difference: '-6', financialImpact: 240000, owner: 'Planning Manager', status: 'Improved' },
  { metric: 'Inventory Accuracy Improvement', previous: '94.2%', current: '98.1%', difference: '+3.9%', financialImpact: 175000, owner: 'Inventory Manager', status: 'Improved' },
];

export const inventoryReports = ['Inventory Balance', 'Inventory Value', 'Inventory Aging', 'Dead Stock', 'Slow Moving', 'Stockout', 'Cycle Count', 'Transfers', 'Adjustments', 'Audit Report'];
