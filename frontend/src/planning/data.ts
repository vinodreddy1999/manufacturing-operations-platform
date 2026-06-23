export const planningCompany = {
  clientId: 'CLT-000001',
  clientName: 'ABC Manufacturing',
  region: 'North America',
  market: 'United States',
  currency: 'USD',
  plants: ['Hyderabad Plant', 'Bangalore Plant'],
  warehouses: ['Raw Material Warehouse', 'Finished Goods Warehouse', 'Spare Parts Warehouse'],
  lines: ['Line 1', 'Line 2', 'Packaging Line'],
  products: ['Chocolate Cake', 'Vanilla Cake', 'Plastic Container', 'Food Packaging Film', 'Industrial Component'],
  materials: ['Sugar', 'Flour', 'Milk Powder', 'Plastic Resin', 'Packaging Film'],
};

export const planningFilters = {
  plants: planningCompany.plants,
  warehouses: planningCompany.warehouses,
  products: planningCompany.products,
  categories: ['Finished Goods', 'Raw Material', 'Packaging', 'Industrial'],
  planners: ['Anita Sharma', 'Pavan Reddy', 'Meera Iyer', 'Rohan Patel'],
  statuses: ['Draft', 'Pending Approval', 'Approved', 'Published', 'Review', 'Critical'],
};

export const demandPlans = [
  { id: 'DMD-001', product: 'Chocolate Cake', customer: 'North Retail Group', region: 'North America', market: 'United States', period: 'Jul 2026', forecastQty: 4200, confirmedOrders: 3600, variance: 600, status: 'Approved', owner: 'Anita Sharma', updated: '2026-06-21' },
  { id: 'DMD-002', product: 'Vanilla Cake', customer: 'FreshMart', region: 'North America', market: 'United States', period: 'Jul 2026', forecastQty: 3100, confirmedOrders: 2650, variance: 450, status: 'Pending Approval', owner: 'Pavan Reddy', updated: '2026-06-22' },
  { id: 'DMD-003', product: 'Plastic Container', customer: 'PackPro', region: 'North America', market: 'United States', period: 'Aug 2026', forecastQty: 9800, confirmedOrders: 9100, variance: 700, status: 'Published', owner: 'Meera Iyer', updated: '2026-06-20' },
  { id: 'DMD-004', product: 'Food Packaging Film', customer: 'SafeFoods', region: 'North America', market: 'United States', period: 'Aug 2026', forecastQty: 7600, confirmedOrders: 6900, variance: 700, status: 'Review', owner: 'Rohan Patel', updated: '2026-06-19' },
  { id: 'DMD-005', product: 'Industrial Component', customer: 'Apex Machines', region: 'North America', market: 'United States', period: 'Sep 2026', forecastQty: 1800, confirmedOrders: 1560, variance: 240, status: 'Draft', owner: 'Anita Sharma', updated: '2026-06-18' },
];

export const inventoryPlans = [
  { id: 'INVPLAN-001', product: 'Chocolate Cake', plant: 'Hyderabad Plant', warehouse: 'Finished Goods Warehouse', currentStock: 1800, forecastDemand: 4200, safetyStock: 600, reorderPoint: 1200, targetStock: 3000, coverageDays: 13, status: 'Critical', owner: 'Pavan Reddy' },
  { id: 'INVPLAN-002', product: 'Vanilla Cake', plant: 'Hyderabad Plant', warehouse: 'Finished Goods Warehouse', currentStock: 1450, forecastDemand: 3100, safetyStock: 500, reorderPoint: 1000, targetStock: 2400, coverageDays: 14, status: 'Review', owner: 'Anita Sharma' },
  { id: 'INVPLAN-003', product: 'Plastic Container', plant: 'Bangalore Plant', warehouse: 'Finished Goods Warehouse', currentStock: 6100, forecastDemand: 9800, safetyStock: 1400, reorderPoint: 2600, targetStock: 7800, coverageDays: 19, status: 'Approved', owner: 'Meera Iyer' },
  { id: 'INVPLAN-004', product: 'Food Packaging Film', plant: 'Bangalore Plant', warehouse: 'Raw Material Warehouse', currentStock: 8200, forecastDemand: 7600, safetyStock: 1200, reorderPoint: 2200, targetStock: 7200, coverageDays: 32, status: 'Approved', owner: 'Rohan Patel' },
  { id: 'INVPLAN-005', product: 'Industrial Component', plant: 'Hyderabad Plant', warehouse: 'Spare Parts Warehouse', currentStock: 520, forecastDemand: 1800, safetyStock: 260, reorderPoint: 620, targetStock: 1500, coverageDays: 9, status: 'Critical', owner: 'Pavan Reddy' },
];

export const productionPlans = [
  { id: 'PRODPLAN-001', product: 'Chocolate Cake', forecastDemand: 4200, currentStock: 1800, requiredProduction: 3000, plannedProduction: 2900, plant: 'Hyderabad Plant', line: 'Line 1', startDate: '2026-07-01', endDate: '2026-07-07', status: 'Pending Approval', owner: 'Anita Sharma' },
  { id: 'PRODPLAN-002', product: 'Vanilla Cake', forecastDemand: 3100, currentStock: 1450, requiredProduction: 2150, plannedProduction: 2200, plant: 'Hyderabad Plant', line: 'Line 2', startDate: '2026-07-03', endDate: '2026-07-10', status: 'Approved', owner: 'Pavan Reddy' },
  { id: 'PRODPLAN-003', product: 'Plastic Container', forecastDemand: 9800, currentStock: 6100, requiredProduction: 5100, plannedProduction: 5200, plant: 'Bangalore Plant', line: 'Packaging Line', startDate: '2026-07-05', endDate: '2026-07-15', status: 'Published', owner: 'Meera Iyer' },
  { id: 'PRODPLAN-004', product: 'Food Packaging Film', forecastDemand: 7600, currentStock: 8200, requiredProduction: 600, plannedProduction: 900, plant: 'Bangalore Plant', line: 'Packaging Line', startDate: '2026-07-12', endDate: '2026-07-18', status: 'Draft', owner: 'Rohan Patel' },
  { id: 'PRODPLAN-005', product: 'Industrial Component', forecastDemand: 1800, currentStock: 520, requiredProduction: 1540, plannedProduction: 1300, plant: 'Hyderabad Plant', line: 'Line 2', startDate: '2026-07-08', endDate: '2026-07-20', status: 'Critical', owner: 'Anita Sharma' },
];

export const capacityPlans = [
  { id: 'CAP-001', plant: 'Hyderabad Plant', line: 'Line 1', workCenter: 'Mixing', availableCapacity: 480, requiredCapacity: 410, utilization: 85, capacityGap: -70, status: 'Healthy', owner: 'Pavan Reddy' },
  { id: 'CAP-002', plant: 'Hyderabad Plant', line: 'Line 2', workCenter: 'Baking', availableCapacity: 520, requiredCapacity: 590, utilization: 113, capacityGap: 70, status: 'Critical', owner: 'Anita Sharma' },
  { id: 'CAP-003', plant: 'Bangalore Plant', line: 'Packaging Line', workCenter: 'Packing', availableCapacity: 720, requiredCapacity: 670, utilization: 93, capacityGap: -50, status: 'Warning', owner: 'Meera Iyer' },
  { id: 'CAP-004', plant: 'Bangalore Plant', line: 'Packaging Line', workCenter: 'Film Extrusion', availableCapacity: 650, requiredCapacity: 520, utilization: 80, capacityGap: -130, status: 'Healthy', owner: 'Rohan Patel' },
  { id: 'CAP-005', plant: 'Hyderabad Plant', line: 'Line 2', workCenter: 'CNC Cell', availableCapacity: 360, requiredCapacity: 410, utilization: 114, capacityGap: 50, status: 'Critical', owner: 'Pavan Reddy' },
];

export const materialRequirements = [
  { id: 'MRP-001', material: 'Sugar', product: 'Chocolate Cake', requiredQty: 1800, availableQty: 1100, onOrderQty: 300, shortageQty: 400, requiredDate: '2026-06-29', supplier: 'SweetSource', status: 'Critical' },
  { id: 'MRP-002', material: 'Flour', product: 'Chocolate Cake', requiredQty: 2200, availableQty: 1800, onOrderQty: 200, shortageQty: 200, requiredDate: '2026-06-29', supplier: 'AgriMills', status: 'Review' },
  { id: 'MRP-003', material: 'Milk Powder', product: 'Vanilla Cake', requiredQty: 900, availableQty: 760, onOrderQty: 0, shortageQty: 140, requiredDate: '2026-07-02', supplier: 'DairyPure', status: 'Review' },
  { id: 'MRP-004', material: 'Plastic Resin', product: 'Plastic Container', requiredQty: 4600, availableQty: 3900, onOrderQty: 900, shortageQty: 0, requiredDate: '2026-07-04', supplier: 'PolyChem', status: 'Approved' },
  { id: 'MRP-005', material: 'Packaging Film', product: 'Food Packaging Film', requiredQty: 5200, availableQty: 4800, onOrderQty: 600, shortageQty: 0, requiredDate: '2026-07-05', supplier: 'PackFlex', status: 'Approved' },
  { id: 'MRP-006', material: 'Sugar', product: 'Vanilla Cake', requiredQty: 1200, availableQty: 1100, onOrderQty: 300, shortageQty: 0, requiredDate: '2026-07-08', supplier: 'SweetSource', status: 'Approved' },
  { id: 'MRP-007', material: 'Flour', product: 'Vanilla Cake', requiredQty: 1600, availableQty: 1200, onOrderQty: 0, shortageQty: 400, requiredDate: '2026-07-08', supplier: 'AgriMills', status: 'Critical' },
  { id: 'MRP-008', material: 'Plastic Resin', product: 'Industrial Component', requiredQty: 900, availableQty: 320, onOrderQty: 200, shortageQty: 380, requiredDate: '2026-07-10', supplier: 'PolyChem', status: 'Critical' },
  { id: 'MRP-009', material: 'Packaging Film', product: 'Chocolate Cake', requiredQty: 700, availableQty: 980, onOrderQty: 0, shortageQty: 0, requiredDate: '2026-07-11', supplier: 'PackFlex', status: 'Approved' },
  { id: 'MRP-010', material: 'Milk Powder', product: 'Chocolate Cake', requiredQty: 600, availableQty: 760, onOrderQty: 0, shortageQty: 0, requiredDate: '2026-07-12', supplier: 'DairyPure', status: 'Approved' },
];

export const procurementPlans = [
  { id: 'PRC-001', material: 'Sugar', supplier: 'SweetSource', requiredQty: 400, purchaseQty: 500, leadTime: 5, requiredDate: '2026-06-29', suggestedPoDate: '2026-06-24', status: 'Pending Approval', owner: 'Rohan Patel' },
  { id: 'PRC-002', material: 'Flour', supplier: 'AgriMills', requiredQty: 600, purchaseQty: 750, leadTime: 6, requiredDate: '2026-07-08', suggestedPoDate: '2026-07-02', status: 'Draft', owner: 'Pavan Reddy' },
  { id: 'PRC-003', material: 'Milk Powder', supplier: 'DairyPure', requiredQty: 140, purchaseQty: 200, leadTime: 7, requiredDate: '2026-07-02', suggestedPoDate: '2026-06-25', status: 'Approved', owner: 'Anita Sharma' },
  { id: 'PRC-004', material: 'Plastic Resin', supplier: 'PolyChem', requiredQty: 380, purchaseQty: 500, leadTime: 10, requiredDate: '2026-07-10', suggestedPoDate: '2026-06-30', status: 'Critical', owner: 'Meera Iyer' },
  { id: 'PRC-005', material: 'Packaging Film', supplier: 'PackFlex', requiredQty: 0, purchaseQty: 0, leadTime: 4, requiredDate: '2026-07-11', suggestedPoDate: '2026-07-07', status: 'Approved', owner: 'Rohan Patel' },
];

export const workforcePlans = [
  { id: 'WRK-001', plant: 'Hyderabad Plant', line: 'Line 1', shift: 'A', requiredWorkers: 38, availableWorkers: 36, gap: 2, overtimeHours: 18, status: 'Review', owner: 'Pavan Reddy' },
  { id: 'WRK-002', plant: 'Hyderabad Plant', line: 'Line 2', shift: 'B', requiredWorkers: 44, availableWorkers: 38, gap: 6, overtimeHours: 52, status: 'Critical', owner: 'Anita Sharma' },
  { id: 'WRK-003', plant: 'Bangalore Plant', line: 'Packaging Line', shift: 'A', requiredWorkers: 32, availableWorkers: 34, gap: -2, overtimeHours: 0, status: 'Approved', owner: 'Meera Iyer' },
  { id: 'WRK-004', plant: 'Bangalore Plant', line: 'Packaging Line', shift: 'C', requiredWorkers: 30, availableWorkers: 28, gap: 2, overtimeHours: 14, status: 'Review', owner: 'Rohan Patel' },
  { id: 'WRK-005', plant: 'Hyderabad Plant', line: 'Line 2', shift: 'C', requiredWorkers: 26, availableWorkers: 22, gap: 4, overtimeHours: 31, status: 'Critical', owner: 'Pavan Reddy' },
];

export const maintenancePlans = [
  { id: 'MNTPLAN-001', asset: 'Mixer MX-01', plant: 'Hyderabad Plant', line: 'Line 1', type: 'Preventive', plannedDate: '2026-07-03', productionImpact: 'Low', downtimeHours: 3, status: 'Approved', owner: 'Meera Iyer' },
  { id: 'MNTPLAN-002', asset: 'Oven OV-02', plant: 'Hyderabad Plant', line: 'Line 2', type: 'Preventive', plannedDate: '2026-07-08', productionImpact: 'High', downtimeHours: 8, status: 'Critical', owner: 'Anita Sharma' },
  { id: 'MNTPLAN-003', asset: 'Packing PK-01', plant: 'Bangalore Plant', line: 'Packaging Line', type: 'Inspection', plannedDate: '2026-07-06', productionImpact: 'Medium', downtimeHours: 4, status: 'Review', owner: 'Rohan Patel' },
  { id: 'MNTPLAN-004', asset: 'Film Extruder FE-03', plant: 'Bangalore Plant', line: 'Packaging Line', type: 'Preventive', plannedDate: '2026-07-14', productionImpact: 'Low', downtimeHours: 2, status: 'Approved', owner: 'Pavan Reddy' },
  { id: 'MNTPLAN-005', asset: 'CNC CN-07', plant: 'Hyderabad Plant', line: 'Line 2', type: 'Breakdown Risk', plannedDate: '2026-07-09', productionImpact: 'High', downtimeHours: 10, status: 'Critical', owner: 'Meera Iyer' },
];

export const scenarios = [
  { id: 'SCN-001', name: 'Demand +20% Cakes', type: 'Demand +20%', basePlan: 'PRODPLAN-001', impactArea: 'Production', estimatedImpact: '+840 units required', owner: 'Anita Sharma', status: 'Saved' },
  { id: 'SCN-002', name: 'Line 2 Machine Down', type: 'Machine Down', basePlan: 'CAP-002', impactArea: 'Capacity', estimatedImpact: '70 hours gap', owner: 'Pavan Reddy', status: 'Draft' },
  { id: 'SCN-003', name: 'Supplier Delay Sugar', type: 'Supplier Delay', basePlan: 'PRC-001', impactArea: 'Procurement', estimatedImpact: '2 days stockout risk', owner: 'Rohan Patel', status: 'Run' },
  { id: 'SCN-004', name: 'Workforce Shortage Shift B', type: 'Workforce Shortage', basePlan: 'WRK-002', impactArea: 'Workforce', estimatedImpact: '52 overtime hours', owner: 'Anita Sharma', status: 'Saved' },
  { id: 'SCN-005', name: 'Capacity Reduction Packaging', type: 'Capacity Reduction', basePlan: 'CAP-003', impactArea: 'Capacity', estimatedImpact: '93% utilization warning', owner: 'Meera Iyer', status: 'Run' },
];

export const approvals = [
  { id: 'APR-001', type: 'Demand Plan Approval', planId: 'DMD-002', requestedBy: 'Pavan Reddy', approver: 'Company Admin', submittedDate: '2026-06-22', status: 'Pending Approval', comments: 'Forecast increased for FreshMart.' },
  { id: 'APR-002', type: 'Production Plan Approval', planId: 'PRODPLAN-001', requestedBy: 'Anita Sharma', approver: 'Company Admin', submittedDate: '2026-06-21', status: 'Pending Approval', comments: 'Chocolate Cake production short by 100.' },
  { id: 'APR-003', type: 'Material Plan Approval', planId: 'MRP-001', requestedBy: 'Rohan Patel', approver: 'Company Admin', submittedDate: '2026-06-20', status: 'Approved', comments: 'Sugar shortage reviewed.' },
  { id: 'APR-004', type: 'Capacity Plan Approval', planId: 'CAP-002', requestedBy: 'Pavan Reddy', approver: 'Company Admin', submittedDate: '2026-06-19', status: 'Request Changes', comments: 'Need alternate shift proposal.' },
  { id: 'APR-005', type: 'Maintenance Plan Approval', planId: 'MNTPLAN-002', requestedBy: 'Meera Iyer', approver: 'Company Admin', submittedDate: '2026-06-18', status: 'Rejected', comments: 'Conflicts with published production plan.' },
];

export const auditEntries = [
  { timestamp: '2026-06-22 09:30', user: 'Pavan Reddy', action: 'Plan Submitted', planType: 'Demand', planId: 'DMD-002', previousValue: 'Draft', newValue: 'Pending Approval', reason: 'FreshMart forecast updated' },
  { timestamp: '2026-06-22 11:15', user: 'Anita Sharma', action: 'Plan Updated', planType: 'Production', planId: 'PRODPLAN-001', previousValue: '2800', newValue: '2900', reason: 'Line 1 capacity confirmed' },
  { timestamp: '2026-06-21 14:10', user: 'Meera Iyer', action: 'Scenario Created', planType: 'Scenario', planId: 'SCN-005', previousValue: '-', newValue: 'Saved', reason: 'Packaging capacity risk' },
  { timestamp: '2026-06-21 16:40', user: 'Rohan Patel', action: 'Purchase Request Generated', planType: 'Procurement', planId: 'PRC-001', previousValue: '0', newValue: '500', reason: 'Sugar shortage' },
  { timestamp: '2026-06-20 10:00', user: 'Company Admin', action: 'Plan Approved', planType: 'Material', planId: 'MRP-001', previousValue: 'Pending', newValue: 'Approved', reason: 'Shortage validated' },
  { timestamp: '2026-06-20 13:25', user: 'Pavan Reddy', action: 'Plan Updated', planType: 'Capacity', planId: 'CAP-002', previousValue: '560', newValue: '590', reason: 'Line 2 load revised' },
  { timestamp: '2026-06-19 09:55', user: 'Anita Sharma', action: 'Plan Rejected', planType: 'Maintenance', planId: 'MNTPLAN-002', previousValue: 'Pending', newValue: 'Rejected', reason: 'Production conflict' },
  { timestamp: '2026-06-18 15:30', user: 'Meera Iyer', action: 'Plan Published', planType: 'Production', planId: 'PRODPLAN-003', previousValue: 'Approved', newValue: 'Published', reason: 'Container plan finalized' },
  { timestamp: '2026-06-17 12:10', user: 'Rohan Patel', action: 'Plan Created', planType: 'Workforce', planId: 'WRK-004', previousValue: '-', newValue: 'Draft', reason: 'Shift C planning' },
  { timestamp: '2026-06-16 08:45', user: 'Company Admin', action: 'Plan Approved', planType: 'Inventory', planId: 'INVPLAN-003', previousValue: 'Review', newValue: 'Approved', reason: 'Coverage accepted' },
];

export const impactMetrics = [
  { metric: 'Stockouts Prevented', previous: '7 risks', current: '3 risks', difference: '-4', financialImpact: 240000, owner: 'Anita Sharma', status: 'Improved' },
  { metric: 'Working Capital Released', previous: '$10.0M', current: '$8.5M', difference: '$1.5M', financialImpact: 1500000, owner: 'Pavan Reddy', status: 'Delivered' },
  { metric: 'Expedite Cost Avoided', previous: '$420K', current: '$260K', difference: '$160K', financialImpact: 160000, owner: 'Rohan Patel', status: 'Improved' },
  { metric: 'Capacity Utilization Improvement', previous: '78%', current: '86%', difference: '+8%', financialImpact: 310000, owner: 'Meera Iyer', status: 'Improved' },
  { metric: 'Material Shortage Reduction', previous: '9 shortages', current: '4 shortages', difference: '-5', financialImpact: 180000, owner: 'Rohan Patel', status: 'Improved' },
  { metric: 'Planning Accuracy Improvement', previous: '82%', current: '91%', difference: '+9%', financialImpact: 275000, owner: 'Anita Sharma', status: 'Improved' },
];

export const reports = ['Demand Forecast Report', 'Inventory Coverage Report', 'Production Plan Report', 'Capacity Report', 'MRP Report', 'Procurement Plan Report', 'Workforce Plan Report', 'Maintenance Plan Report', 'Planning Variance Report'];
