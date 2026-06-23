export const warehouseCompany = {
  clientId: 'CLT-000001',
  clientName: 'ABC Manufacturing',
  region: 'North America',
  market: 'United States',
  currency: 'USD',
  plants: ['Hyderabad Plant', 'Bangalore Plant'],
  warehouses: ['Raw Material Warehouse', 'Finished Goods Warehouse', 'Spare Parts Warehouse'],
  zones: ['Zone A', 'Zone B', 'Cold Storage', 'Dispatch Zone', 'Quality Hold Zone'],
  bins: ['BIN-A-001', 'BIN-A-002', 'BIN-B-001', 'BIN-CS-001', 'BIN-D-001'],
  products: ['Chocolate Cake', 'Vanilla Cake', 'Plastic Container', 'Food Packaging Film', 'Industrial Component'],
  materials: ['Sugar', 'Flour', 'Milk Powder', 'Plastic Resin', 'Packaging Film'],
};

export const receivingRecords = [
  { id: 'RCV-1001', sourceType: 'Purchase Order', sourceReference: 'PO-4501001', source: 'SweetFarm Suppliers', warehouse: 'Raw Material Warehouse', item: 'Sugar', expectedQty: 1200, receivedQty: 1000, pendingQty: 200, receivedDate: '2026-06-21', status: 'Pending', owner: 'Receiving Lead' },
  { id: 'RCV-1002', sourceType: 'Purchase Order', sourceReference: 'PO-4501002', source: 'DairyBest', warehouse: 'Raw Material Warehouse', item: 'Milk Powder', expectedQty: 800, receivedQty: 800, pendingQty: 0, receivedDate: '2026-06-21', status: 'Received', owner: 'Receiving Lead' },
  { id: 'RCV-1003', sourceType: 'Production Receipt', sourceReference: 'PRD-8001', source: 'Line 1', warehouse: 'Finished Goods Warehouse', item: 'Chocolate Cake', expectedQty: 1800, receivedQty: 1600, pendingQty: 200, receivedDate: '2026-06-22', status: 'Pending Putaway', owner: 'FG Supervisor' },
  { id: 'RCV-1004', sourceType: 'Stock Transfer', sourceReference: 'TR-3002', source: 'Bangalore Plant', warehouse: 'Raw Material Warehouse', item: 'Plastic Resin', expectedQty: 900, receivedQty: 900, pendingQty: 0, receivedDate: '2026-06-22', status: 'Received', owner: 'Transfer Desk' },
  { id: 'RCV-1005', sourceType: 'Customer Return', sourceReference: 'RET-2201', source: 'North Retail', warehouse: 'Quality Hold Zone', item: 'Vanilla Cake', expectedQty: 90, receivedQty: 70, pendingQty: 20, receivedDate: '2026-06-23', status: 'Inspection', owner: 'Quality Receiver' },
  { id: 'RCV-1006', sourceType: 'Purchase Order', sourceReference: 'PO-4501006', source: 'PackWell', warehouse: 'Raw Material Warehouse', item: 'Packaging Film', expectedQty: 2400, receivedQty: 2200, pendingQty: 200, receivedDate: '2026-06-23', status: 'Delayed', owner: 'Receiving Lead' },
  { id: 'RCV-1007', sourceType: 'Production Receipt', sourceReference: 'PRD-8002', source: 'Line 2', warehouse: 'Finished Goods Warehouse', item: 'Plastic Container', expectedQty: 3500, receivedQty: 3500, pendingQty: 0, receivedDate: '2026-06-23', status: 'Received', owner: 'FG Supervisor' },
  { id: 'RCV-1008', sourceType: 'Purchase Order', sourceReference: 'PO-4501008', source: 'MillPrime', warehouse: 'Raw Material Warehouse', item: 'Flour', expectedQty: 1500, receivedQty: 1200, pendingQty: 300, receivedDate: '2026-06-24', status: 'Pending', owner: 'Receiving Lead' },
  { id: 'RCV-1009', sourceType: 'Stock Transfer', sourceReference: 'TR-3005', source: 'Spare Parts Warehouse', warehouse: 'Finished Goods Warehouse', item: 'Industrial Component', expectedQty: 120, receivedQty: 120, pendingQty: 0, receivedDate: '2026-06-24', status: 'Received', owner: 'Transfer Desk' },
  { id: 'RCV-1010', sourceType: 'Customer Return', sourceReference: 'RET-2204', source: 'Metro Distributor', warehouse: 'Quality Hold Zone', item: 'Chocolate Cake', expectedQty: 60, receivedQty: 50, pendingQty: 10, receivedDate: '2026-06-24', status: 'Inspection', owner: 'Quality Receiver' },
];

export const putawayTasks = [
  { id: 'PUT-2001', receiptId: 'RCV-1001', item: 'Sugar', quantity: 1000, suggestedZone: 'Zone A', suggestedBin: 'BIN-A-001', assignedUser: 'Asha R', priority: 'High', createdDate: '2026-06-21', completedDate: '-', status: 'Open' },
  { id: 'PUT-2002', receiptId: 'RCV-1002', item: 'Milk Powder', quantity: 800, suggestedZone: 'Cold Storage', suggestedBin: 'BIN-CS-001', assignedUser: 'Ravi K', priority: 'High', createdDate: '2026-06-21', completedDate: '2026-06-21', status: 'Completed' },
  { id: 'PUT-2003', receiptId: 'RCV-1003', item: 'Chocolate Cake', quantity: 1600, suggestedZone: 'Dispatch Zone', suggestedBin: 'BIN-D-001', assignedUser: 'Nina P', priority: 'Medium', createdDate: '2026-06-22', completedDate: '-', status: 'In Progress' },
  { id: 'PUT-2004', receiptId: 'RCV-1004', item: 'Plastic Resin', quantity: 900, suggestedZone: 'Zone B', suggestedBin: 'BIN-B-001', assignedUser: 'Asha R', priority: 'Medium', createdDate: '2026-06-22', completedDate: '2026-06-22', status: 'Completed' },
  { id: 'PUT-2005', receiptId: 'RCV-1005', item: 'Vanilla Cake', quantity: 70, suggestedZone: 'Quality Hold Zone', suggestedBin: 'BIN-QH-001', assignedUser: 'Quality Team', priority: 'High', createdDate: '2026-06-23', completedDate: '-', status: 'Blocked' },
  { id: 'PUT-2006', receiptId: 'RCV-1006', item: 'Packaging Film', quantity: 2200, suggestedZone: 'Zone B', suggestedBin: 'BIN-B-002', assignedUser: 'Ravi K', priority: 'Medium', createdDate: '2026-06-23', completedDate: '-', status: 'Open' },
  { id: 'PUT-2007', receiptId: 'RCV-1007', item: 'Plastic Container', quantity: 3500, suggestedZone: 'Dispatch Zone', suggestedBin: 'BIN-D-002', assignedUser: 'Nina P', priority: 'Low', createdDate: '2026-06-23', completedDate: '2026-06-23', status: 'Completed' },
  { id: 'PUT-2008', receiptId: 'RCV-1008', item: 'Flour', quantity: 1200, suggestedZone: 'Zone A', suggestedBin: 'BIN-A-002', assignedUser: 'Asha R', priority: 'High', createdDate: '2026-06-24', completedDate: '-', status: 'Open' },
  { id: 'PUT-2009', receiptId: 'RCV-1009', item: 'Industrial Component', quantity: 120, suggestedZone: 'Zone B', suggestedBin: 'BIN-B-003', assignedUser: 'Ravi K', priority: 'Medium', createdDate: '2026-06-24', completedDate: '-', status: 'In Progress' },
  { id: 'PUT-2010', receiptId: 'RCV-1010', item: 'Chocolate Cake', quantity: 50, suggestedZone: 'Quality Hold Zone', suggestedBin: 'BIN-QH-002', assignedUser: 'Quality Team', priority: 'High', createdDate: '2026-06-24', completedDate: '-', status: 'Open' },
];

export const warehouseBins = Array.from({ length: 20 }, (_, index) => {
  const zones = warehouseCompany.zones;
  const zone = zones[index % zones.length];
  const capacity = [1200, 900, 1500, 700, 600][index % 5];
  const occupied = Math.round(capacity * ([0.72, 0.84, 0.51, 0.96, 0.38][index % 5]));
  const utilization = Math.round((occupied / capacity) * 100);
  return {
    id: `BIN-${String(index + 1).padStart(3, '0')}`,
    warehouse: warehouseCompany.warehouses[index % warehouseCompany.warehouses.length],
    zone,
    aisle: `Aisle ${String.fromCharCode(65 + (index % 4))}`,
    rack: `R-${Math.floor(index / 4) + 1}`,
    shelf: `S-${(index % 5) + 1}`,
    binCode: `${zone.replace(/\s/g, '').slice(0, 3).toUpperCase()}-${String(index + 1).padStart(3, '0')}`,
    capacity,
    occupied,
    available: capacity - occupied,
    utilization,
    storageType: index % 4 === 0 ? 'Cold' : index % 3 === 0 ? 'Quality Hold' : 'Standard',
    status: utilization > 95 ? 'Critical' : utilization > 80 ? 'Warning' : 'Healthy',
  };
});

export const pickingTasks = [
  { id: 'PICK-3001', sourceType: 'Sales Order', sourceReference: 'SO-7001', item: 'Chocolate Cake', requiredQty: 900, pickedQty: 900, warehouse: 'Finished Goods Warehouse', bin: 'DIS-001', picker: 'Nina P', priority: 'High', dueDate: '2026-06-24', status: 'Completed' },
  { id: 'PICK-3002', sourceType: 'Production Order', sourceReference: 'MO-9001', item: 'Sugar', requiredQty: 700, pickedQty: 650, warehouse: 'Raw Material Warehouse', bin: 'ZON-001', picker: 'Asha R', priority: 'High', dueDate: '2026-06-24', status: 'Short Pick' },
  { id: 'PICK-3003', sourceType: 'Maintenance Order', sourceReference: 'WO-5101', item: 'Industrial Component', requiredQty: 20, pickedQty: 20, warehouse: 'Spare Parts Warehouse', bin: 'ZON-008', picker: 'Ravi K', priority: 'Medium', dueDate: '2026-06-25', status: 'Completed' },
  { id: 'PICK-3004', sourceType: 'Transfer Order', sourceReference: 'TR-3008', item: 'Packaging Film', requiredQty: 400, pickedQty: 0, warehouse: 'Raw Material Warehouse', bin: 'ZON-007', picker: 'Asha R', priority: 'Medium', dueDate: '2026-06-25', status: 'Open' },
  { id: 'PICK-3005', sourceType: 'Sales Order', sourceReference: 'SO-7005', item: 'Plastic Container', requiredQty: 1200, pickedQty: 1200, warehouse: 'Finished Goods Warehouse', bin: 'DIS-002', picker: 'Nina P', priority: 'Low', dueDate: '2026-06-26', status: 'Completed' },
  { id: 'PICK-3006', sourceType: 'Production Order', sourceReference: 'MO-9006', item: 'Flour', requiredQty: 850, pickedQty: 840, warehouse: 'Raw Material Warehouse', bin: 'ZON-002', picker: 'Ravi K', priority: 'High', dueDate: '2026-06-26', status: 'Review' },
  { id: 'PICK-3007', sourceType: 'Sales Order', sourceReference: 'SO-7007', item: 'Vanilla Cake', requiredQty: 450, pickedQty: 450, warehouse: 'Finished Goods Warehouse', bin: 'DIS-003', picker: 'Nina P', priority: 'Medium', dueDate: '2026-06-27', status: 'Completed' },
  { id: 'PICK-3008', sourceType: 'Maintenance Order', sourceReference: 'WO-5108', item: 'Plastic Resin', requiredQty: 90, pickedQty: 0, warehouse: 'Raw Material Warehouse', bin: 'ZON-010', picker: 'Asha R', priority: 'Low', dueDate: '2026-06-27', status: 'Open' },
  { id: 'PICK-3009', sourceType: 'Transfer Order', sourceReference: 'TR-3010', item: 'Milk Powder', requiredQty: 210, pickedQty: 210, warehouse: 'Raw Material Warehouse', bin: 'COL-004', picker: 'Ravi K', priority: 'High', dueDate: '2026-06-28', status: 'Completed' },
  { id: 'PICK-3010', sourceType: 'Sales Order', sourceReference: 'SO-7010', item: 'Food Packaging Film', requiredQty: 600, pickedQty: 560, warehouse: 'Raw Material Warehouse', bin: 'ZON-012', picker: 'Asha R', priority: 'Medium', dueDate: '2026-06-28', status: 'Short Pick' },
];

export const packingRecords = [
  { id: 'PKG-4001', pickTaskId: 'PICK-3001', orderReference: 'SO-7001', itemCount: 3, packedQty: 900, packageType: 'Carton', packedBy: 'Packing Team A', packingDate: '2026-06-24', status: 'Packed' },
  { id: 'PKG-4002', pickTaskId: 'PICK-3003', orderReference: 'WO-5101', itemCount: 1, packedQty: 20, packageType: 'Crate', packedBy: 'Packing Team B', packingDate: '2026-06-24', status: 'Packed' },
  { id: 'PKG-4003', pickTaskId: 'PICK-3005', orderReference: 'SO-7005', itemCount: 4, packedQty: 1200, packageType: 'Pallet', packedBy: 'Packing Team A', packingDate: '2026-06-25', status: 'Ready for Dispatch' },
  { id: 'PKG-4004', pickTaskId: 'PICK-3007', orderReference: 'SO-7007', itemCount: 2, packedQty: 450, packageType: 'Carton', packedBy: 'Packing Team C', packingDate: '2026-06-25', status: 'Packed' },
  { id: 'PKG-4005', pickTaskId: 'PICK-3009', orderReference: 'TR-3010', itemCount: 1, packedQty: 210, packageType: 'Cold Box', packedBy: 'Packing Team B', packingDate: '2026-06-25', status: 'Label Pending' },
  { id: 'PKG-4006', pickTaskId: 'PICK-3002', orderReference: 'MO-9001', itemCount: 1, packedQty: 650, packageType: 'Bulk Bag', packedBy: 'Packing Team A', packingDate: '2026-06-25', status: 'Review' },
  { id: 'PKG-4007', pickTaskId: 'PICK-3006', orderReference: 'MO-9006', itemCount: 1, packedQty: 840, packageType: 'Bulk Bag', packedBy: 'Packing Team A', packingDate: '2026-06-26', status: 'Packed' },
  { id: 'PKG-4008', pickTaskId: 'PICK-3010', orderReference: 'SO-7010', itemCount: 2, packedQty: 560, packageType: 'Roll Pack', packedBy: 'Packing Team C', packingDate: '2026-06-26', status: 'Review' },
  { id: 'PKG-4009', pickTaskId: 'PICK-3004', orderReference: 'TR-3008', itemCount: 0, packedQty: 0, packageType: 'Pallet', packedBy: '-', packingDate: '-', status: 'Waiting Pick' },
  { id: 'PKG-4010', pickTaskId: 'PICK-3008', orderReference: 'WO-5108', itemCount: 0, packedQty: 0, packageType: 'Crate', packedBy: '-', packingDate: '-', status: 'Waiting Pick' },
];

export const dispatchRecords = [
  { id: 'DSP-5001', destinationType: 'Customer', destination: 'North Retail', sourceReference: 'SO-7001', warehouse: 'Finished Goods Warehouse', packedItems: 900, dispatchDate: '2026-06-24', carrier: 'BlueLine', vehicle: 'KA-01-AB-1901', status: 'Dispatched' },
  { id: 'DSP-5002', destinationType: 'Department', destination: 'Maintenance', sourceReference: 'WO-5101', warehouse: 'Spare Parts Warehouse', packedItems: 20, dispatchDate: '2026-06-24', carrier: 'Internal', vehicle: 'FORK-12', status: 'Delivered' },
  { id: 'DSP-5003', destinationType: 'Customer', destination: 'Metro Distributor', sourceReference: 'SO-7005', warehouse: 'Finished Goods Warehouse', packedItems: 1200, dispatchDate: '2026-06-25', carrier: 'FastFleet', vehicle: 'TS-09-CD-4421', status: 'Ready' },
  { id: 'DSP-5004', destinationType: 'Customer', destination: 'FreshMart', sourceReference: 'SO-7007', warehouse: 'Finished Goods Warehouse', packedItems: 450, dispatchDate: '2026-06-25', carrier: 'BlueLine', vehicle: 'KA-05-QW-8102', status: 'Ready' },
  { id: 'DSP-5005', destinationType: 'Warehouse', destination: 'Bangalore Plant', sourceReference: 'TR-3010', warehouse: 'Raw Material Warehouse', packedItems: 210, dispatchDate: '2026-06-26', carrier: 'ColdMove', vehicle: 'TN-22-CC-9090', status: 'Carrier Assigned' },
  { id: 'DSP-5006', destinationType: 'Production Line', destination: 'Line 1', sourceReference: 'MO-9001', warehouse: 'Raw Material Warehouse', packedItems: 650, dispatchDate: '2026-06-26', carrier: 'Internal', vehicle: 'FORK-03', status: 'Review' },
  { id: 'DSP-5007', destinationType: 'Production Line', destination: 'Line 2', sourceReference: 'MO-9006', warehouse: 'Raw Material Warehouse', packedItems: 840, dispatchDate: '2026-06-26', carrier: 'Internal', vehicle: 'FORK-07', status: 'Ready' },
  { id: 'DSP-5008', destinationType: 'Customer', destination: 'PackPro', sourceReference: 'SO-7010', warehouse: 'Raw Material Warehouse', packedItems: 560, dispatchDate: '2026-06-27', carrier: 'FastFleet', vehicle: 'AP-16-HK-6811', status: 'Review' },
  { id: 'DSP-5009', destinationType: 'Warehouse', destination: 'Spare Parts Warehouse', sourceReference: 'TR-3008', warehouse: 'Raw Material Warehouse', packedItems: 0, dispatchDate: '2026-06-27', carrier: '-', vehicle: '-', status: 'Blocked' },
  { id: 'DSP-5010', destinationType: 'Department', destination: 'Maintenance', sourceReference: 'WO-5108', warehouse: 'Raw Material Warehouse', packedItems: 0, dispatchDate: '2026-06-28', carrier: '-', vehicle: '-', status: 'Blocked' },
];

export const internalMovements = [
  { id: 'MOV-6001', type: 'Bin to Bin', item: 'Sugar', quantity: 300, from: 'BIN-A-001', to: 'BIN-A-002', movedBy: 'Asha R', movementDate: '2026-06-21', status: 'Completed' },
  { id: 'MOV-6002', type: 'Zone to Zone', item: 'Packaging Film', quantity: 400, from: 'Zone B', to: 'Dispatch Zone', movedBy: 'Ravi K', movementDate: '2026-06-21', status: 'Completed' },
  { id: 'MOV-6003', type: 'Warehouse to Warehouse', item: 'Industrial Component', quantity: 60, from: 'Spare Parts Warehouse', to: 'Finished Goods Warehouse', movedBy: 'Transfer Desk', movementDate: '2026-06-22', status: 'In Transit' },
  { id: 'MOV-6004', type: 'Replenishment Move', item: 'Chocolate Cake', quantity: 500, from: 'Storage', to: 'Dispatch Zone', movedBy: 'Nina P', movementDate: '2026-06-22', status: 'Completed' },
  { id: 'MOV-6005', type: 'Quality Hold Move', item: 'Vanilla Cake', quantity: 70, from: 'Receiving', to: 'Quality Hold Zone', movedBy: 'Quality Team', movementDate: '2026-06-23', status: 'Completed' },
  { id: 'MOV-6006', type: 'Bin to Bin', item: 'Flour', quantity: 220, from: 'BIN-A-002', to: 'BIN-B-001', movedBy: 'Asha R', movementDate: '2026-06-23', status: 'Completed' },
  { id: 'MOV-6007', type: 'Replenishment Move', item: 'Plastic Container', quantity: 700, from: 'Storage', to: 'Dispatch Zone', movedBy: 'Nina P', movementDate: '2026-06-23', status: 'Completed' },
  { id: 'MOV-6008', type: 'Warehouse to Warehouse', item: 'Milk Powder', quantity: 210, from: 'Raw Material Warehouse', to: 'Bangalore Plant', movedBy: 'Ravi K', movementDate: '2026-06-24', status: 'Open' },
  { id: 'MOV-6009', type: 'Quality Hold Move', item: 'Chocolate Cake', quantity: 50, from: 'Receiving', to: 'Quality Hold Zone', movedBy: 'Quality Team', movementDate: '2026-06-24', status: 'Open' },
  { id: 'MOV-6010', type: 'Bin to Bin', item: 'Plastic Resin', quantity: 180, from: 'BIN-B-001', to: 'BIN-B-002', movedBy: 'Asha R', movementDate: '2026-06-24', status: 'Open' },
];

export const cycleCounts = [
  { id: 'WCC-7001', warehouse: 'Raw Material Warehouse', zone: 'Zone A', bin: 'BIN-A-001', item: 'Sugar', systemQty: 1020, countedQty: 1000, variance: -20, countedBy: 'Cycle Team A', countDate: '2026-06-18', status: 'Posted' },
  { id: 'WCC-7002', warehouse: 'Raw Material Warehouse', zone: 'Zone A', bin: 'BIN-A-002', item: 'Flour', systemQty: 1210, countedQty: 1200, variance: -10, countedBy: 'Cycle Team A', countDate: '2026-06-18', status: 'Posted' },
  { id: 'WCC-7003', warehouse: 'Cold Storage', zone: 'Cold Storage', bin: 'BIN-CS-001', item: 'Milk Powder', systemQty: 800, countedQty: 800, variance: 0, countedBy: 'Cycle Team B', countDate: '2026-06-19', status: 'Posted' },
  { id: 'WCC-7004', warehouse: 'Finished Goods Warehouse', zone: 'Dispatch Zone', bin: 'BIN-D-001', item: 'Chocolate Cake', systemQty: 1600, countedQty: 1580, variance: -20, countedBy: 'Cycle Team C', countDate: '2026-06-19', status: 'Variance Review' },
  { id: 'WCC-7005', warehouse: 'Finished Goods Warehouse', zone: 'Dispatch Zone', bin: 'BIN-D-002', item: 'Plastic Container', systemQty: 3500, countedQty: 3500, variance: 0, countedBy: 'Cycle Team C', countDate: '2026-06-20', status: 'Posted' },
  { id: 'WCC-7006', warehouse: 'Raw Material Warehouse', zone: 'Zone B', bin: 'BIN-B-001', item: 'Plastic Resin', systemQty: 900, countedQty: 905, variance: 5, countedBy: 'Cycle Team B', countDate: '2026-06-20', status: 'Posted' },
  { id: 'WCC-7007', warehouse: 'Raw Material Warehouse', zone: 'Zone B', bin: 'BIN-B-002', item: 'Packaging Film', systemQty: 2200, countedQty: 2180, variance: -20, countedBy: 'Cycle Team A', countDate: '2026-06-21', status: 'Variance Review' },
  { id: 'WCC-7008', warehouse: 'Spare Parts Warehouse', zone: 'Zone B', bin: 'BIN-B-003', item: 'Industrial Component', systemQty: 120, countedQty: 120, variance: 0, countedBy: 'Cycle Team B', countDate: '2026-06-21', status: 'Posted' },
  { id: 'WCC-7009', warehouse: 'Quality Hold Zone', zone: 'Quality Hold Zone', bin: 'BIN-QH-001', item: 'Vanilla Cake', systemQty: 70, countedQty: 70, variance: 0, countedBy: 'Quality Team', countDate: '2026-06-22', status: 'Posted' },
  { id: 'WCC-7010', warehouse: 'Quality Hold Zone', zone: 'Quality Hold Zone', bin: 'BIN-QH-002', item: 'Chocolate Cake', systemQty: 50, countedQty: 48, variance: -2, countedBy: 'Quality Team', countDate: '2026-06-22', status: 'Variance Review' },
];

export const utilizationRecords = [
  { warehouse: 'Raw Material Warehouse', zone: 'Zone A', capacity: 9200, occupied: 7420, available: 1780, utilization: 81, status: 'Warning' },
  { warehouse: 'Raw Material Warehouse', zone: 'Zone B', capacity: 8600, occupied: 6100, available: 2500, utilization: 71, status: 'Healthy' },
  { warehouse: 'Finished Goods Warehouse', zone: 'Dispatch Zone', capacity: 6800, occupied: 6120, available: 680, utilization: 90, status: 'Warning' },
  { warehouse: 'Raw Material Warehouse', zone: 'Cold Storage', capacity: 2400, occupied: 2310, available: 90, utilization: 96, status: 'Critical' },
  { warehouse: 'Spare Parts Warehouse', zone: 'Quality Hold Zone', capacity: 1600, occupied: 780, available: 820, utilization: 49, status: 'Healthy' },
];

export const laborRecords = [
  { user: 'Asha R', role: 'Forklift Operator', assignedTasks: 18, completedTasks: 15, pendingTasks: 3, avgCompletionTime: '22 min', accuracy: 96.8, status: 'Healthy' },
  { user: 'Ravi K', role: 'Warehouse Associate', assignedTasks: 16, completedTasks: 13, pendingTasks: 3, avgCompletionTime: '26 min', accuracy: 97.1, status: 'Healthy' },
  { user: 'Nina P', role: 'Picker', assignedTasks: 21, completedTasks: 19, pendingTasks: 2, avgCompletionTime: '18 min', accuracy: 98.6, status: 'Healthy' },
  { user: 'Cycle Team A', role: 'Counter', assignedTasks: 12, completedTasks: 9, pendingTasks: 3, avgCompletionTime: '31 min', accuracy: 95.2, status: 'Warning' },
  { user: 'Packing Team A', role: 'Packing Team', assignedTasks: 20, completedTasks: 17, pendingTasks: 3, avgCompletionTime: '16 min', accuracy: 98.1, status: 'Healthy' },
];

export const auditEntries = [
  { timestamp: '2026-06-24 09:12', user: 'Receiving Lead', action: 'Receipt Confirmed', area: 'Receiving', referenceId: 'RCV-1008', previousValue: 'Draft', newValue: 'Pending Putaway', reason: 'Supplier delivery completed' },
  { timestamp: '2026-06-24 09:40', user: 'Asha R', action: 'Putaway Created', area: 'Putaway', referenceId: 'PUT-2008', previousValue: '-', newValue: 'Open', reason: 'Flour received' },
  { timestamp: '2026-06-24 10:10', user: 'Quality Team', action: 'Internal Movement Completed', area: 'Quality Hold', referenceId: 'MOV-6009', previousValue: 'Receiving', newValue: 'Quality Hold Zone', reason: 'Return inspection' },
  { timestamp: '2026-06-24 10:55', user: 'Nina P', action: 'Pick Confirmed', area: 'Picking', referenceId: 'PICK-3007', previousValue: 'Open', newValue: 'Completed', reason: 'Customer order ready' },
  { timestamp: '2026-06-24 11:20', user: 'Packing Team A', action: 'Packing Confirmed', area: 'Packing', referenceId: 'PKG-4007', previousValue: 'Open', newValue: 'Packed', reason: 'Production line material staged' },
  { timestamp: '2026-06-24 12:05', user: 'Transfer Desk', action: 'Dispatch Confirmed', area: 'Dispatch', referenceId: 'DSP-5001', previousValue: 'Ready', newValue: 'Dispatched', reason: 'Carrier arrived' },
  { timestamp: '2026-06-23 15:30', user: 'Warehouse Admin', action: 'Bin Updated', area: 'Bin Management', referenceId: 'BIN-004', previousValue: '80%', newValue: '96%', reason: 'Capacity update after receipt' },
  { timestamp: '2026-06-23 16:15', user: 'Cycle Team C', action: 'Cycle Count Posted', area: 'Cycle Count', referenceId: 'WCC-7005', previousValue: 'Pending', newValue: 'Posted', reason: 'No variance' },
  { timestamp: '2026-06-22 13:20', user: 'Nina P', action: 'Pick Task Created', area: 'Picking', referenceId: 'PICK-3005', previousValue: '-', newValue: 'Open', reason: 'Sales order released' },
  { timestamp: '2026-06-22 17:35', user: 'Company Admin', action: 'Bin Created', area: 'Bin Management', referenceId: 'BIN-QH-002', previousValue: '-', newValue: 'Active', reason: 'Quality hold capacity' },
];

export const impactMetrics = [
  { metric: 'Receiving Time Reduction', previous: '7.2 hrs', current: '4.1 hrs', difference: '3.1 hrs faster', financialImpact: 22500, owner: 'Warehouse Manager', status: 'Improved' },
  { metric: 'Putaway Time Reduction', previous: '11.5 hrs', current: '6.8 hrs', difference: '4.7 hrs faster', financialImpact: 31000, owner: 'Putaway Lead', status: 'Improved' },
  { metric: 'Picking Error Reduction', previous: '120/month', current: '45/month', difference: '75 fewer errors', financialImpact: 18500, owner: 'Picking Lead', status: 'Delivered' },
  { metric: 'Dispatch Delay Reduction', previous: '18 delays', current: '6 delays', difference: '12 fewer delays', financialImpact: 42000, owner: 'Dispatch Lead', status: 'Improved' },
  { metric: 'Warehouse Space Improved', previous: '68%', current: '81%', difference: '+13% productive use', financialImpact: 56000, owner: 'Warehouse Manager', status: 'Delivered' },
  { metric: 'Labor Hours Saved', previous: '940 hrs', current: '780 hrs', difference: '160 hrs saved', financialImpact: 38400, owner: 'Operations Admin', status: 'Improved' },
  { metric: 'Handling Cost Reduction', previous: '$148K', current: '$104K', difference: '$44K saved', financialImpact: 44000, owner: 'Company Admin', status: 'Delivered' },
];

export const warehouseReports = ['Receiving Report', 'Putaway Report', 'Bin Utilization Report', 'Picking Report', 'Packing Report', 'Dispatch Report', 'Cycle Count Report', 'Warehouse Utilization Report', 'Warehouse Labor Report', 'Warehouse Audit Report'];
