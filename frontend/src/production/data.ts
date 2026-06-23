export const productionCompany = {
  clientId: 'CLT-000001',
  clientName: 'ABC Manufacturing',
  region: 'North America',
  market: 'United States',
  currency: 'USD',
  plants: ['Hyderabad Plant', 'Bangalore Plant'],
  lines: ['Line 1', 'Line 2', 'Packaging Line'],
  machines: ['Mixer 01', 'Oven 01', 'Filler 01', 'Packaging Machine 01'],
  products: ['Chocolate Cake', 'Vanilla Cake', 'Plastic Container', 'Food Packaging Film'],
  shifts: ['Shift A', 'Shift B', 'Shift C'],
};

export const productionOrders = [
  { orderNo: 'PROD-1001', product: 'Chocolate Cake', plannedQty: 5200, producedQty: 4720, plant: 'Hyderabad Plant', line: 'Line 1', startDate: '2026-06-20', endDate: '2026-06-24', priority: 'High', status: 'In Progress' },
  { orderNo: 'PROD-1002', product: 'Vanilla Cake', plannedQty: 4100, producedQty: 4100, plant: 'Hyderabad Plant', line: 'Line 2', startDate: '2026-06-19', endDate: '2026-06-23', priority: 'Medium', status: 'Completed' },
  { orderNo: 'PROD-1003', product: 'Plastic Container', plannedQty: 9200, producedQty: 7600, plant: 'Bangalore Plant', line: 'Packaging Line', startDate: '2026-06-21', endDate: '2026-06-25', priority: 'High', status: 'In Progress' },
  { orderNo: 'PROD-1004', product: 'Food Packaging Film', plannedQty: 6800, producedQty: 0, plant: 'Bangalore Plant', line: 'Packaging Line', startDate: '2026-06-25', endDate: '2026-06-28', priority: 'Medium', status: 'Released' },
  { orderNo: 'PROD-1005', product: 'Chocolate Cake', plannedQty: 3000, producedQty: 3000, plant: 'Hyderabad Plant', line: 'Line 1', startDate: '2026-06-18', endDate: '2026-06-20', priority: 'Low', status: 'Closed' },
  { orderNo: 'PROD-1006', product: 'Vanilla Cake', plannedQty: 3600, producedQty: 2820, plant: 'Hyderabad Plant', line: 'Line 2', startDate: '2026-06-22', endDate: '2026-06-26', priority: 'High', status: 'In Progress' },
  { orderNo: 'PROD-1007', product: 'Plastic Container', plannedQty: 5000, producedQty: 0, plant: 'Bangalore Plant', line: 'Packaging Line', startDate: '2026-06-27', endDate: '2026-06-29', priority: 'Medium', status: 'Draft' },
  { orderNo: 'PROD-1008', product: 'Food Packaging Film', plannedQty: 4200, producedQty: 3900, plant: 'Bangalore Plant', line: 'Packaging Line', startDate: '2026-06-19', endDate: '2026-06-23', priority: 'Medium', status: 'Completed' },
  { orderNo: 'PROD-1009', product: 'Chocolate Cake', plannedQty: 2600, producedQty: 0, plant: 'Hyderabad Plant', line: 'Line 1', startDate: '2026-06-26', endDate: '2026-06-27', priority: 'High', status: 'Released' },
  { orderNo: 'PROD-1010', product: 'Vanilla Cake', plannedQty: 1800, producedQty: 300, plant: 'Hyderabad Plant', line: 'Line 2', startDate: '2026-06-24', endDate: '2026-06-25', priority: 'High', status: 'In Progress' },
];

export const schedules = [
  { id: 'SCH-2001', productionOrder: 'PROD-1001', product: 'Chocolate Cake', line: 'Line 1', shift: 'Shift A', plannedStart: '2026-06-24 06:00', plannedEnd: '2026-06-24 14:00', status: 'Running' },
  { id: 'SCH-2002', productionOrder: 'PROD-1001', product: 'Chocolate Cake', line: 'Line 1', shift: 'Shift B', plannedStart: '2026-06-24 14:00', plannedEnd: '2026-06-24 22:00', status: 'Planned' },
  { id: 'SCH-2003', productionOrder: 'PROD-1006', product: 'Vanilla Cake', line: 'Line 2', shift: 'Shift A', plannedStart: '2026-06-24 06:00', plannedEnd: '2026-06-24 14:00', status: 'Running' },
  { id: 'SCH-2004', productionOrder: 'PROD-1003', product: 'Plastic Container', line: 'Packaging Line', shift: 'Shift A', plannedStart: '2026-06-24 07:00', plannedEnd: '2026-06-24 15:00', status: 'Running' },
  { id: 'SCH-2005', productionOrder: 'PROD-1004', product: 'Food Packaging Film', line: 'Packaging Line', shift: 'Shift B', plannedStart: '2026-06-25 14:00', plannedEnd: '2026-06-25 22:00', status: 'Planned' },
  { id: 'SCH-2006', productionOrder: 'PROD-1008', product: 'Food Packaging Film', line: 'Packaging Line', shift: 'Shift C', plannedStart: '2026-06-23 22:00', plannedEnd: '2026-06-24 06:00', status: 'Completed' },
  { id: 'SCH-2007', productionOrder: 'PROD-1002', product: 'Vanilla Cake', line: 'Line 2', shift: 'Shift B', plannedStart: '2026-06-23 14:00', plannedEnd: '2026-06-23 22:00', status: 'Completed' },
  { id: 'SCH-2008', productionOrder: 'PROD-1005', product: 'Chocolate Cake', line: 'Line 1', shift: 'Shift A', plannedStart: '2026-06-20 06:00', plannedEnd: '2026-06-20 14:00', status: 'Completed' },
  { id: 'SCH-2009', productionOrder: 'PROD-1009', product: 'Chocolate Cake', line: 'Line 1', shift: 'Shift A', plannedStart: '2026-06-26 06:00', plannedEnd: '2026-06-26 14:00', status: 'Planned' },
  { id: 'SCH-2010', productionOrder: 'PROD-1010', product: 'Vanilla Cake', line: 'Line 2', shift: 'Shift C', plannedStart: '2026-06-24 22:00', plannedEnd: '2026-06-25 06:00', status: 'Risk' },
];

export const workOrders = [
  { id: 'WO-3001', productionOrder: 'PROD-1001', operation: 'Mixing', workCenter: 'Mixer 01', operator: 'Asha R', plannedQty: 5200, actualQty: 5000, status: 'In Progress' },
  { id: 'WO-3002', productionOrder: 'PROD-1001', operation: 'Baking', workCenter: 'Oven 01', operator: 'Ravi K', plannedQty: 5200, actualQty: 4720, status: 'In Progress' },
  { id: 'WO-3003', productionOrder: 'PROD-1002', operation: 'Packing', workCenter: 'Packaging Machine 01', operator: 'Nina P', plannedQty: 4100, actualQty: 4100, status: 'Completed' },
  { id: 'WO-3004', productionOrder: 'PROD-1003', operation: 'Filling', workCenter: 'Filler 01', operator: 'Omar S', plannedQty: 9200, actualQty: 7600, status: 'In Progress' },
  { id: 'WO-3005', productionOrder: 'PROD-1004', operation: 'Extrusion', workCenter: 'Packaging Machine 01', operator: 'Meera N', plannedQty: 6800, actualQty: 0, status: 'Released' },
  { id: 'WO-3006', productionOrder: 'PROD-1006', operation: 'Mixing', workCenter: 'Mixer 01', operator: 'Asha R', plannedQty: 3600, actualQty: 2820, status: 'In Progress' },
  { id: 'WO-3007', productionOrder: 'PROD-1008', operation: 'Packing', workCenter: 'Packaging Machine 01', operator: 'Nina P', plannedQty: 4200, actualQty: 3900, status: 'Completed' },
  { id: 'WO-3008', productionOrder: 'PROD-1005', operation: 'Baking', workCenter: 'Oven 01', operator: 'Ravi K', plannedQty: 3000, actualQty: 3000, status: 'Completed' },
  { id: 'WO-3009', productionOrder: 'PROD-1009', operation: 'Mixing', workCenter: 'Mixer 01', operator: 'Asha R', plannedQty: 2600, actualQty: 0, status: 'Released' },
  { id: 'WO-3010', productionOrder: 'PROD-1010', operation: 'Baking', workCenter: 'Oven 01', operator: 'Ravi K', plannedQty: 1800, actualQty: 300, status: 'At Risk' },
];

export const shiftRecords = [
  { shift: 'Shift A', line: 'Line 1', operators: 12, plannedQty: 5200, actualQty: 4720, achievement: 91, downtime: 1.4, oee: 78 },
  { shift: 'Shift B', line: 'Line 1', operators: 10, plannedQty: 2600, actualQty: 0, achievement: 0, downtime: 0, oee: 0 },
  { shift: 'Shift A', line: 'Line 2', operators: 11, plannedQty: 3600, actualQty: 2820, achievement: 78, downtime: 2.1, oee: 69 },
  { shift: 'Shift B', line: 'Line 2', operators: 10, plannedQty: 4100, actualQty: 4100, achievement: 100, downtime: 0.7, oee: 84 },
  { shift: 'Shift A', line: 'Packaging Line', operators: 14, plannedQty: 9200, actualQty: 7600, achievement: 83, downtime: 1.9, oee: 74 },
  { shift: 'Shift C', line: 'Packaging Line', operators: 8, plannedQty: 4200, actualQty: 3900, achievement: 93, downtime: 0.8, oee: 81 },
];

export const lineRecords = [
  { line: 'Line 1', plannedOutput: 7800, actualOutput: 4720, utilization: 76, downtime: 1.4, oee: 78, status: 'Healthy' },
  { line: 'Line 2', plannedOutput: 9500, actualOutput: 7220, utilization: 81, downtime: 2.8, oee: 72, status: 'Warning' },
  { line: 'Packaging Line', plannedOutput: 20200, actualOutput: 15300, utilization: 86, downtime: 2.7, oee: 76, status: 'Warning' },
];

export const machineRecords = [
  { machine: 'Mixer 01', line: 'Line 1', runtime: 14.2, downtime: 1.1, availability: 92, oee: 79, status: 'Healthy' },
  { machine: 'Oven 01', line: 'Line 1', runtime: 13.4, downtime: 2.2, availability: 86, oee: 72, status: 'Warning' },
  { machine: 'Filler 01', line: 'Packaging Line', runtime: 15.1, downtime: 1.0, availability: 94, oee: 82, status: 'Healthy' },
  { machine: 'Packaging Machine 01', line: 'Packaging Line', runtime: 12.5, downtime: 2.6, availability: 83, oee: 68, status: 'Warning' },
];

export const downtimeRecords = [
  { id: 'DT-4001', machine: 'Oven 01', line: 'Line 1', type: 'Breakdown', startTime: '2026-06-24 08:10', endTime: '2026-06-24 09:05', duration: 0.9, rootCause: 'Temperature controller fault', status: 'Closed' },
  { id: 'DT-4002', machine: 'Mixer 01', line: 'Line 2', type: 'Material Shortage', startTime: '2026-06-24 10:20', endTime: '2026-06-24 11:05', duration: 0.8, rootCause: 'Sugar staging delay', status: 'Closed' },
  { id: 'DT-4003', machine: 'Packaging Machine 01', line: 'Packaging Line', type: 'Setup', startTime: '2026-06-24 07:00', endTime: '2026-06-24 07:35', duration: 0.6, rootCause: 'Film width change', status: 'Closed' },
  { id: 'DT-4004', machine: 'Filler 01', line: 'Packaging Line', type: 'Quality Issue', startTime: '2026-06-24 12:10', endTime: '2026-06-24 12:55', duration: 0.8, rootCause: 'Seal inspection failure', status: 'Open' },
  { id: 'DT-4005', machine: 'Oven 01', line: 'Line 2', type: 'Changeover', startTime: '2026-06-23 15:00', endTime: '2026-06-23 15:40', duration: 0.7, rootCause: 'Recipe changeover', status: 'Closed' },
  { id: 'DT-4006', machine: 'Mixer 01', line: 'Line 1', type: 'Operator Issue', startTime: '2026-06-23 11:30', endTime: '2026-06-23 12:10', duration: 0.7, rootCause: 'Shift handover gap', status: 'Closed' },
  { id: 'DT-4007', machine: 'Packaging Machine 01', line: 'Packaging Line', type: 'Breakdown', startTime: '2026-06-22 16:20', endTime: '2026-06-22 18:10', duration: 1.8, rootCause: 'Conveyor belt slip', status: 'Closed' },
  { id: 'DT-4008', machine: 'Filler 01', line: 'Packaging Line', type: 'Material Shortage', startTime: '2026-06-22 09:15', endTime: '2026-06-22 09:55', duration: 0.7, rootCause: 'Container feed delay', status: 'Closed' },
  { id: 'DT-4009', machine: 'Oven 01', line: 'Line 1', type: 'Setup', startTime: '2026-06-21 06:00', endTime: '2026-06-21 06:45', duration: 0.8, rootCause: 'Baking tray setup', status: 'Closed' },
  { id: 'DT-4010', machine: 'Mixer 01', line: 'Line 2', type: 'Quality Issue', startTime: '2026-06-21 13:05', endTime: '2026-06-21 13:45', duration: 0.7, rootCause: 'Batch consistency check', status: 'Closed' },
];

export const oeeRecords = [
  { name: 'Plant OEE', availability: 89, performance: 86, quality: 97, oee: 74, status: 'Warning' },
  { name: 'Line 1', availability: 90, performance: 88, quality: 98, oee: 78, status: 'Healthy' },
  { name: 'Line 2', availability: 85, performance: 84, quality: 96, oee: 69, status: 'Warning' },
  { name: 'Packaging Line', availability: 88, performance: 89, quality: 97, oee: 76, status: 'Healthy' },
  { name: 'Mixer 01', availability: 92, performance: 88, quality: 98, oee: 79, status: 'Healthy' },
  { name: 'Oven 01', availability: 86, performance: 85, quality: 97, oee: 71, status: 'Warning' },
  { name: 'Filler 01', availability: 94, performance: 90, quality: 97, oee: 82, status: 'Healthy' },
  { name: 'Packaging Machine 01', availability: 83, performance: 84, quality: 97, oee: 68, status: 'Warning' },
  { name: 'Shift A', availability: 89, performance: 87, quality: 97, oee: 75, status: 'Healthy' },
  { name: 'Shift B', availability: 84, performance: 82, quality: 96, oee: 66, status: 'Warning' },
];

export const yieldRecords = [
  { product: 'Chocolate Cake', inputQty: 5400, outputQty: 4720, yield: 87.4, status: 'Warning' },
  { product: 'Vanilla Cake', inputQty: 4400, outputQty: 4100, yield: 93.2, status: 'Healthy' },
  { product: 'Plastic Container', inputQty: 8000, outputQty: 7600, yield: 95.0, status: 'Healthy' },
  { product: 'Food Packaging Film', inputQty: 4200, outputQty: 3900, yield: 92.9, status: 'Healthy' },
  { product: 'Chocolate Cake - Batch B', inputQty: 3100, outputQty: 3000, yield: 96.8, status: 'Healthy' },
  { product: 'Vanilla Cake - Batch C', inputQty: 1900, outputQty: 1800, yield: 94.7, status: 'Healthy' },
  { product: 'Plastic Container - Batch D', inputQty: 5300, outputQty: 5000, yield: 94.3, status: 'Healthy' },
  { product: 'Food Packaging Film - Batch E', inputQty: 7000, outputQty: 6800, yield: 97.1, status: 'Healthy' },
  { product: 'Chocolate Cake - Batch F', inputQty: 2650, outputQty: 2600, yield: 98.1, status: 'Healthy' },
  { product: 'Vanilla Cake - Batch G', inputQty: 3700, outputQty: 2820, yield: 76.2, status: 'Critical' },
];

export const scrapRecords = [
  { product: 'Chocolate Cake', scrapQty: 180, scrapValue: 12600, reason: 'Overbake', date: '2026-06-24', status: 'Review' },
  { product: 'Vanilla Cake', scrapQty: 90, scrapValue: 5850, reason: 'Mix variation', date: '2026-06-24', status: 'Review' },
  { product: 'Plastic Container', scrapQty: 240, scrapValue: 7200, reason: 'Mold flash', date: '2026-06-23', status: 'Open' },
  { product: 'Food Packaging Film', scrapQty: 120, scrapValue: 4800, reason: 'Seal defect', date: '2026-06-23', status: 'Open' },
  { product: 'Chocolate Cake', scrapQty: 70, scrapValue: 4900, reason: 'Weight variance', date: '2026-06-22', status: 'Closed' },
  { product: 'Vanilla Cake', scrapQty: 50, scrapValue: 3250, reason: 'Packaging damage', date: '2026-06-22', status: 'Closed' },
  { product: 'Plastic Container', scrapQty: 160, scrapValue: 4800, reason: 'Color mismatch', date: '2026-06-21', status: 'Closed' },
  { product: 'Food Packaging Film', scrapQty: 95, scrapValue: 3800, reason: 'Thickness variance', date: '2026-06-21', status: 'Closed' },
  { product: 'Chocolate Cake', scrapQty: 40, scrapValue: 2800, reason: 'Line startup loss', date: '2026-06-20', status: 'Closed' },
  { product: 'Vanilla Cake', scrapQty: 65, scrapValue: 4225, reason: 'Quality hold loss', date: '2026-06-20', status: 'Closed' },
];

export const auditEntries = [
  { timestamp: '2026-06-24 07:05', user: 'Production Admin', action: 'Order Released', entity: 'PROD-1009', previousValue: 'Draft', newValue: 'Released', reason: 'Approved production plan' },
  { timestamp: '2026-06-24 08:15', user: 'Line Supervisor', action: 'Downtime Logged', entity: 'DT-4001', previousValue: 'Running', newValue: 'Breakdown', reason: 'Oven temperature fault' },
  { timestamp: '2026-06-24 09:20', user: 'OEE Engine', action: 'OEE Recalculated', entity: 'Line 1', previousValue: '76%', newValue: '78%', reason: 'Shift A production update' },
  { timestamp: '2026-06-24 10:10', user: 'Operator Asha', action: 'Work Order Updated', entity: 'WO-3001', previousValue: '4200', newValue: '5000', reason: 'Actual output posted' },
  { timestamp: '2026-06-24 11:35', user: 'Quality Lead', action: 'Scrap Logged', entity: 'Chocolate Cake', previousValue: '0', newValue: '180', reason: 'Overbake lot isolated' },
  { timestamp: '2026-06-23 15:30', user: 'Production Planner', action: 'Schedule Updated', entity: 'SCH-2010', previousValue: 'Planned', newValue: 'Risk', reason: 'Material shortage risk' },
  { timestamp: '2026-06-23 16:00', user: 'Line Supervisor', action: 'Work Order Completed', entity: 'WO-3007', previousValue: 'In Progress', newValue: 'Completed', reason: 'Packaging complete' },
  { timestamp: '2026-06-22 14:45', user: 'Production Admin', action: 'Order Created', entity: 'PROD-1007', previousValue: '-', newValue: 'Draft', reason: 'Next demand cycle' },
  { timestamp: '2026-06-22 17:10', user: 'Maintenance Lead', action: 'Downtime Closed', entity: 'DT-4007', previousValue: 'Open', newValue: 'Closed', reason: 'Conveyor belt corrected' },
  { timestamp: '2026-06-21 12:00', user: 'Company Admin', action: 'Order Closed', entity: 'PROD-1005', previousValue: 'Completed', newValue: 'Closed', reason: 'Production confirmation approved' },
];

export const impactMetrics = [
  { metric: 'Production Increase', previous: '31.2K units', current: '38.5K units', difference: '+7.3K units', financialImpact: 365000, owner: 'Production Admin', status: 'Improved' },
  { metric: 'Downtime Reduction', previous: '18.4 hrs', current: '11.2 hrs', difference: '7.2 hrs saved', financialImpact: 124000, owner: 'Maintenance Lead', status: 'Improved' },
  { metric: 'OEE Improvement', previous: '62%', current: '78%', difference: '+16%', financialImpact: 450000, owner: 'Plant Manager', status: 'Delivered' },
  { metric: 'Yield Improvement', previous: '88.4%', current: '93.1%', difference: '+4.7%', financialImpact: 188000, owner: 'Quality Lead', status: 'Improved' },
  { metric: 'Scrap Reduction', previous: '$96K', current: '$54K', difference: '$42K saved', financialImpact: 42000, owner: 'Production Supervisor', status: 'Improved' },
  { metric: 'Capacity Utilization Improvement', previous: '71%', current: '84%', difference: '+13%', financialImpact: 235000, owner: 'Operations Manager', status: 'Delivered' },
  { metric: 'Manufacturing Cost Reduction', previous: '$2.4M', current: '$2.0M', difference: '$400K saved', financialImpact: 400000, owner: 'Company Admin', status: 'Delivered' },
];

export const productionReports = ['Production Output Report', 'Plan vs Actual Report', 'Shift Performance Report', 'Line Performance Report', 'Machine Performance Report', 'Downtime Report', 'OEE Report', 'Yield Report', 'Scrap Report', 'Production Audit Report'];
