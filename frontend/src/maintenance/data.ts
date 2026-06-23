export const maintenanceCompany = {
  clientId: 'CLT-000001',
  clientName: 'ABC Manufacturing',
  region: 'North America',
  market: 'United States',
  currency: 'USD',
  plants: ['Hyderabad Plant', 'Bangalore Plant'],
  departments: ['Production', 'Packaging', 'Utilities', 'Quality'],
  lines: ['Line 1', 'Line 2', 'Packaging Line'],
  assets: ['Mixer 01', 'Oven 01', 'Filler 01', 'Packaging Machine 01', 'Compressor 01', 'Conveyor 01'],
  technicians: ['Ravi Kumar', 'Suresh Reddy', 'Anita Sharma', 'Imran Khan'],
};

export const assets = [
  { id: 'AST-1001', name: 'Mixer 01', category: 'Mixer', plant: 'Hyderabad Plant', department: 'Production', line: 'Line 1', machine: 'Mixer 01', manufacturer: 'GEA', model: 'MX-500', serial: 'MX500-HYD-001', criticality: 'Critical', status: 'Running', healthScore: 86, lastMaintenance: '2026-06-02', nextMaintenance: '2026-07-02', owner: 'Ravi Kumar' },
  { id: 'AST-1002', name: 'Oven 01', category: 'Oven', plant: 'Hyderabad Plant', department: 'Production', line: 'Line 1', machine: 'Oven 01', manufacturer: 'BakerPro', model: 'OV-900', serial: 'OV900-HYD-001', criticality: 'Critical', status: 'Attention Needed', healthScore: 68, lastMaintenance: '2026-05-28', nextMaintenance: '2026-06-28', owner: 'Suresh Reddy' },
  { id: 'AST-1003', name: 'Filler 01', category: 'Filler', plant: 'Bangalore Plant', department: 'Packaging', line: 'Packaging Line', machine: 'Filler 01', manufacturer: 'Krones', model: 'FL-320', serial: 'FL320-BLR-001', criticality: 'High', status: 'Running', healthScore: 91, lastMaintenance: '2026-06-08', nextMaintenance: '2026-07-08', owner: 'Anita Sharma' },
  { id: 'AST-1004', name: 'Packaging Machine 01', category: 'Packaging', plant: 'Bangalore Plant', department: 'Packaging', line: 'Packaging Line', machine: 'Packaging Machine 01', manufacturer: 'Bosch', model: 'PK-700', serial: 'PK700-BLR-001', criticality: 'Critical', status: 'Running', healthScore: 74, lastMaintenance: '2026-06-01', nextMaintenance: '2026-06-26', owner: 'Imran Khan' },
  { id: 'AST-1005', name: 'Compressor 01', category: 'Utility', plant: 'Hyderabad Plant', department: 'Utilities', line: 'Line 2', machine: 'Compressor 01', manufacturer: 'Atlas Copco', model: 'CP-110', serial: 'CP110-HYD-001', criticality: 'High', status: 'Down', healthScore: 42, lastMaintenance: '2026-05-18', nextMaintenance: '2026-06-24', owner: 'Ravi Kumar' },
  { id: 'AST-1006', name: 'Conveyor 01', category: 'Conveyor', plant: 'Bangalore Plant', department: 'Packaging', line: 'Packaging Line', machine: 'Conveyor 01', manufacturer: 'Dorner', model: 'CV-220', serial: 'CV220-BLR-001', criticality: 'Medium', status: 'Running', healthScore: 82, lastMaintenance: '2026-06-06', nextMaintenance: '2026-07-06', owner: 'Suresh Reddy' },
  { id: 'AST-1007', name: 'Mixer 02', category: 'Mixer', plant: 'Hyderabad Plant', department: 'Production', line: 'Line 2', machine: 'Mixer 02', manufacturer: 'GEA', model: 'MX-500', serial: 'MX500-HYD-002', criticality: 'High', status: 'Running', healthScore: 88, lastMaintenance: '2026-06-10', nextMaintenance: '2026-07-10', owner: 'Anita Sharma' },
  { id: 'AST-1008', name: 'Oven 02', category: 'Oven', plant: 'Hyderabad Plant', department: 'Production', line: 'Line 2', machine: 'Oven 02', manufacturer: 'BakerPro', model: 'OV-900', serial: 'OV900-HYD-002', criticality: 'High', status: 'Running', healthScore: 79, lastMaintenance: '2026-06-05', nextMaintenance: '2026-07-05', owner: 'Imran Khan' },
  { id: 'AST-1009', name: 'Quality Scanner 01', category: 'Inspection', plant: 'Bangalore Plant', department: 'Quality', line: 'Packaging Line', machine: 'Quality Scanner 01', manufacturer: 'Keyence', model: 'QS-80', serial: 'QS80-BLR-001', criticality: 'Medium', status: 'Running', healthScore: 93, lastMaintenance: '2026-06-12', nextMaintenance: '2026-07-12', owner: 'Anita Sharma' },
  { id: 'AST-1010', name: 'Cooling Tunnel 01', category: 'Cooling', plant: 'Hyderabad Plant', department: 'Production', line: 'Line 1', machine: 'Cooling Tunnel 01', manufacturer: 'Frigoscandia', model: 'CT-400', serial: 'CT400-HYD-001', criticality: 'High', status: 'Attention Needed', healthScore: 64, lastMaintenance: '2026-05-30', nextMaintenance: '2026-06-25', owner: 'Ravi Kumar' },
];

export const hierarchyRecords = [
  { nodeId: 'H-1001', name: 'Hyderabad Plant', parent: '-', level: 'Plant', criticality: 'Critical', linkedSpares: 12, status: 'Active', owner: 'Company Admin' },
  { nodeId: 'H-1002', name: 'Line 1', parent: 'Hyderabad Plant', level: 'Production Line', criticality: 'Critical', linkedSpares: 8, status: 'Active', owner: 'Plant Manager' },
  { nodeId: 'H-1003', name: 'Mixer 01', parent: 'Line 1', level: 'Machine', criticality: 'Critical', linkedSpares: 5, status: 'Active', owner: 'Ravi Kumar' },
  { nodeId: 'H-1004', name: 'Mixer Gearbox', parent: 'Mixer 01', level: 'Sub Assembly', criticality: 'High', linkedSpares: 2, status: 'Active', owner: 'Ravi Kumar' },
  { nodeId: 'H-1005', name: 'Bearing Set', parent: 'Mixer Gearbox', level: 'Spare Part', criticality: 'High', linkedSpares: 1, status: 'Active', owner: 'Stores' },
  { nodeId: 'H-1006', name: 'Oven 01', parent: 'Line 1', level: 'Machine', criticality: 'Critical', linkedSpares: 6, status: 'Attention Needed', owner: 'Suresh Reddy' },
  { nodeId: 'H-1007', name: 'Heating Element', parent: 'Oven 01', level: 'Component', criticality: 'Critical', linkedSpares: 2, status: 'Active', owner: 'Suresh Reddy' },
  { nodeId: 'H-1008', name: 'Packaging Line', parent: 'Bangalore Plant', level: 'Production Line', criticality: 'High', linkedSpares: 9, status: 'Active', owner: 'Packaging Manager' },
  { nodeId: 'H-1009', name: 'Filler 01', parent: 'Packaging Line', level: 'Machine', criticality: 'High', linkedSpares: 4, status: 'Active', owner: 'Anita Sharma' },
  { nodeId: 'H-1010', name: 'Seal Kit Assembly', parent: 'Filler 01', level: 'Component', criticality: 'High', linkedSpares: 1, status: 'Active', owner: 'Anita Sharma' },
];

export const workOrders = [
  { id: 'MWO-2001', asset: 'Oven 01', type: 'Breakdown', priority: 'Critical', plant: 'Hyderabad Plant', line: 'Line 1', technician: 'Suresh Reddy', plannedStart: '2026-06-24 08:00', plannedEnd: '2026-06-24 12:00', actualStart: '2026-06-24 08:15', actualEnd: '-', status: 'In Progress', cost: 18500, downtimeHours: 3.4 },
  { id: 'MWO-2002', asset: 'Mixer 01', type: 'Preventive', priority: 'High', plant: 'Hyderabad Plant', line: 'Line 1', technician: 'Ravi Kumar', plannedStart: '2026-06-25 06:00', plannedEnd: '2026-06-25 08:00', actualStart: '-', actualEnd: '-', status: 'Assigned', cost: 4200, downtimeHours: 0 },
  { id: 'MWO-2003', asset: 'Filler 01', type: 'Calibration', priority: 'Medium', plant: 'Bangalore Plant', line: 'Packaging Line', technician: 'Anita Sharma', plannedStart: '2026-06-24 14:00', plannedEnd: '2026-06-24 16:00', actualStart: '-', actualEnd: '-', status: 'Open', cost: 3200, downtimeHours: 0 },
  { id: 'MWO-2004', asset: 'Packaging Machine 01', type: 'Corrective', priority: 'High', plant: 'Bangalore Plant', line: 'Packaging Line', technician: 'Imran Khan', plannedStart: '2026-06-24 10:00', plannedEnd: '2026-06-24 13:00', actualStart: '2026-06-24 10:20', actualEnd: '-', status: 'In Progress', cost: 9800, downtimeHours: 1.1 },
  { id: 'MWO-2005', asset: 'Compressor 01', type: 'Breakdown', priority: 'Critical', plant: 'Hyderabad Plant', line: 'Line 2', technician: 'Ravi Kumar', plannedStart: '2026-06-24 07:00', plannedEnd: '2026-06-24 11:00', actualStart: '2026-06-24 07:10', actualEnd: '-', status: 'On Hold', cost: 26500, downtimeHours: 5.2 },
  { id: 'MWO-2006', asset: 'Conveyor 01', type: 'Lubrication', priority: 'Low', plant: 'Bangalore Plant', line: 'Packaging Line', technician: 'Suresh Reddy', plannedStart: '2026-06-25 09:00', plannedEnd: '2026-06-25 10:00', actualStart: '-', actualEnd: '-', status: 'Assigned', cost: 1200, downtimeHours: 0 },
  { id: 'MWO-2007', asset: 'Mixer 02', type: 'Inspection', priority: 'Medium', plant: 'Hyderabad Plant', line: 'Line 2', technician: 'Anita Sharma', plannedStart: '2026-06-25 11:00', plannedEnd: '2026-06-25 12:30', actualStart: '-', actualEnd: '-', status: 'Open', cost: 1600, downtimeHours: 0 },
  { id: 'MWO-2008', asset: 'Oven 02', type: 'Preventive', priority: 'High', plant: 'Hyderabad Plant', line: 'Line 2', technician: 'Imran Khan', plannedStart: '2026-06-26 06:00', plannedEnd: '2026-06-26 09:00', actualStart: '-', actualEnd: '-', status: 'Open', cost: 5100, downtimeHours: 0 },
  { id: 'MWO-2009', asset: 'Quality Scanner 01', type: 'Calibration', priority: 'Medium', plant: 'Bangalore Plant', line: 'Packaging Line', technician: 'Anita Sharma', plannedStart: '2026-06-23 13:00', plannedEnd: '2026-06-23 15:00', actualStart: '2026-06-23 13:05', actualEnd: '2026-06-23 14:45', status: 'Completed', cost: 2800, downtimeHours: 0 },
  { id: 'MWO-2010', asset: 'Cooling Tunnel 01', type: 'Corrective', priority: 'High', plant: 'Hyderabad Plant', line: 'Line 1', technician: 'Ravi Kumar', plannedStart: '2026-06-24 16:00', plannedEnd: '2026-06-24 19:00', actualStart: '-', actualEnd: '-', status: 'Open', cost: 11500, downtimeHours: 0 },
  { id: 'MWO-2011', asset: 'Mixer 01', type: 'Inspection', priority: 'Low', plant: 'Hyderabad Plant', line: 'Line 1', technician: 'Suresh Reddy', plannedStart: '2026-06-20 10:00', plannedEnd: '2026-06-20 11:00', actualStart: '2026-06-20 10:05', actualEnd: '2026-06-20 10:55', status: 'Closed', cost: 900, downtimeHours: 0 },
  { id: 'MWO-2012', asset: 'Filler 01', type: 'Preventive', priority: 'Medium', plant: 'Bangalore Plant', line: 'Packaging Line', technician: 'Imran Khan', plannedStart: '2026-06-21 08:00', plannedEnd: '2026-06-21 10:00', actualStart: '2026-06-21 08:10', actualEnd: '2026-06-21 09:50', status: 'Closed', cost: 2400, downtimeHours: 0 },
  { id: 'MWO-2013', asset: 'Packaging Machine 01', type: 'Corrective', priority: 'Medium', plant: 'Bangalore Plant', line: 'Packaging Line', technician: 'Anita Sharma', plannedStart: '2026-06-22 12:00', plannedEnd: '2026-06-22 14:00', actualStart: '2026-06-22 12:20', actualEnd: '2026-06-22 14:10', status: 'Completed', cost: 5200, downtimeHours: 0.6 },
  { id: 'MWO-2014', asset: 'Conveyor 01', type: 'Corrective', priority: 'High', plant: 'Bangalore Plant', line: 'Packaging Line', technician: 'Suresh Reddy', plannedStart: '2026-06-23 15:00', plannedEnd: '2026-06-23 18:00', actualStart: '2026-06-23 15:10', actualEnd: '2026-06-23 17:40', status: 'Completed', cost: 7600, downtimeHours: 1.2 },
  { id: 'MWO-2015', asset: 'Oven 01', type: 'Inspection', priority: 'Critical', plant: 'Hyderabad Plant', line: 'Line 1', technician: 'Imran Khan', plannedStart: '2026-06-22 06:00', plannedEnd: '2026-06-22 08:00', actualStart: '-', actualEnd: '-', status: 'Overdue', cost: 3500, downtimeHours: 0 },
];

export const preventiveSchedules = [
  { id: 'PM-3001', asset: 'Mixer 01', frequency: 'Monthly', lastPm: '2026-06-02', nextPm: '2026-07-02', technician: 'Ravi Kumar', checklist: 'Mixer PM v2', status: 'Scheduled', compliance: 96 },
  { id: 'PM-3002', asset: 'Oven 01', frequency: 'Monthly', lastPm: '2026-05-28', nextPm: '2026-06-28', technician: 'Suresh Reddy', checklist: 'Oven Thermal PM', status: 'Due Soon', compliance: 82 },
  { id: 'PM-3003', asset: 'Filler 01', frequency: 'Quarterly', lastPm: '2026-06-08', nextPm: '2026-09-08', technician: 'Anita Sharma', checklist: 'Filler PM', status: 'Healthy', compliance: 100 },
  { id: 'PM-3004', asset: 'Packaging Machine 01', frequency: 'Weekly', lastPm: '2026-06-17', nextPm: '2026-06-24', technician: 'Imran Khan', checklist: 'Packaging Weekly', status: 'Overdue', compliance: 74 },
  { id: 'PM-3005', asset: 'Compressor 01', frequency: 'Runtime Hours Based', lastPm: '2026-05-18', nextPm: '2026-06-24', technician: 'Ravi Kumar', checklist: 'Compressor Runtime', status: 'Overdue', compliance: 61 },
  { id: 'PM-3006', asset: 'Conveyor 01', frequency: 'Weekly', lastPm: '2026-06-18', nextPm: '2026-06-25', technician: 'Suresh Reddy', checklist: 'Conveyor PM', status: 'Scheduled', compliance: 94 },
  { id: 'PM-3007', asset: 'Mixer 02', frequency: 'Monthly', lastPm: '2026-06-10', nextPm: '2026-07-10', technician: 'Anita Sharma', checklist: 'Mixer PM v2', status: 'Healthy', compliance: 98 },
  { id: 'PM-3008', asset: 'Oven 02', frequency: 'Monthly', lastPm: '2026-06-05', nextPm: '2026-07-05', technician: 'Imran Khan', checklist: 'Oven Thermal PM', status: 'Scheduled', compliance: 91 },
  { id: 'PM-3009', asset: 'Quality Scanner 01', frequency: 'Quarterly', lastPm: '2026-06-12', nextPm: '2026-09-12', technician: 'Anita Sharma', checklist: 'Scanner Calibration', status: 'Healthy', compliance: 100 },
  { id: 'PM-3010', asset: 'Cooling Tunnel 01', frequency: 'Monthly', lastPm: '2026-05-30', nextPm: '2026-06-25', technician: 'Ravi Kumar', checklist: 'Cooling Tunnel PM', status: 'Due Soon', compliance: 79 },
];

export const correctiveRecords = [
  { id: 'CM-4001', asset: 'Packaging Machine 01', issue: 'Seal temperature drift', priority: 'High', reportedBy: 'Line Supervisor', technician: 'Imran Khan', plannedDate: '2026-06-24', status: 'In Progress', cost: 9800 },
  { id: 'CM-4002', asset: 'Cooling Tunnel 01', issue: 'Low cooling efficiency', priority: 'High', reportedBy: 'Quality Lead', technician: 'Ravi Kumar', plannedDate: '2026-06-24', status: 'Open', cost: 11500 },
  { id: 'CM-4003', asset: 'Conveyor 01', issue: 'Belt misalignment', priority: 'Medium', reportedBy: 'Operator', technician: 'Suresh Reddy', plannedDate: '2026-06-23', status: 'Completed', cost: 7600 },
  { id: 'CM-4004', asset: 'Mixer 02', issue: 'Abnormal vibration', priority: 'Medium', reportedBy: 'Operator', technician: 'Anita Sharma', plannedDate: '2026-06-25', status: 'Open', cost: 6400 },
  { id: 'CM-4005', asset: 'Oven 02', issue: 'Door gasket leak', priority: 'Low', reportedBy: 'Maintenance Audit', technician: 'Imran Khan', plannedDate: '2026-06-26', status: 'Open', cost: 2100 },
  { id: 'CM-4006', asset: 'Filler 01', issue: 'Nozzle drip', priority: 'Medium', reportedBy: 'Quality Inspector', technician: 'Anita Sharma', plannedDate: '2026-06-25', status: 'Assigned', cost: 3800 },
  { id: 'CM-4007', asset: 'Mixer 01', issue: 'Gear oil seepage', priority: 'Low', reportedBy: 'PM Team', technician: 'Ravi Kumar', plannedDate: '2026-06-27', status: 'Open', cost: 1800 },
  { id: 'CM-4008', asset: 'Quality Scanner 01', issue: 'Lens cleaning required', priority: 'Low', reportedBy: 'QA Team', technician: 'Anita Sharma', plannedDate: '2026-06-23', status: 'Completed', cost: 900 },
  { id: 'CM-4009', asset: 'Compressor 01', issue: 'Pressure fluctuation', priority: 'Critical', reportedBy: 'Utilities', technician: 'Ravi Kumar', plannedDate: '2026-06-24', status: 'On Hold', cost: 26500 },
  { id: 'CM-4010', asset: 'Oven 01', issue: 'Uneven heat zone', priority: 'High', reportedBy: 'Production', technician: 'Suresh Reddy', plannedDate: '2026-06-24', status: 'In Progress', cost: 18500 },
];

export const breakdownRecords = [
  { id: 'BD-5001', asset: 'Oven 01', plant: 'Hyderabad Plant', line: 'Line 1', start: '2026-06-24 08:10', end: '-', downtimeHours: 3.4, rootCause: 'Temperature controller fault', technician: 'Suresh Reddy', productionImpact: 'Chocolate Cake delay', status: 'In Progress', cost: 61200 },
  { id: 'BD-5002', asset: 'Compressor 01', plant: 'Hyderabad Plant', line: 'Line 2', start: '2026-06-24 07:10', end: '-', downtimeHours: 5.2, rootCause: 'Pressure valve failure', technician: 'Ravi Kumar', productionImpact: 'Line 2 pneumatic supply', status: 'On Hold', cost: 93600 },
  { id: 'BD-5003', asset: 'Packaging Machine 01', plant: 'Bangalore Plant', line: 'Packaging Line', start: '2026-06-22 16:20', end: '2026-06-22 18:10', downtimeHours: 1.8, rootCause: 'Conveyor belt slip', technician: 'Imran Khan', productionImpact: 'Dispatch delay', status: 'Closed', cost: 32400 },
  { id: 'BD-5004', asset: 'Filler 01', plant: 'Bangalore Plant', line: 'Packaging Line', start: '2026-06-21 09:30', end: '2026-06-21 10:10', downtimeHours: 0.7, rootCause: 'Sensor misread', technician: 'Anita Sharma', productionImpact: 'Minor output loss', status: 'Closed', cost: 12600 },
  { id: 'BD-5005', asset: 'Mixer 01', plant: 'Hyderabad Plant', line: 'Line 1', start: '2026-06-20 11:30', end: '2026-06-20 12:10', downtimeHours: 0.7, rootCause: 'Operator handover issue', technician: 'Ravi Kumar', productionImpact: 'Short output gap', status: 'Closed', cost: 12600 },
  { id: 'BD-5006', asset: 'Cooling Tunnel 01', plant: 'Hyderabad Plant', line: 'Line 1', start: '2026-06-19 13:00', end: '2026-06-19 14:30', downtimeHours: 1.5, rootCause: 'Fan bearing wear', technician: 'Suresh Reddy', productionImpact: 'Batch hold', status: 'Closed', cost: 27000 },
  { id: 'BD-5007', asset: 'Conveyor 01', plant: 'Bangalore Plant', line: 'Packaging Line', start: '2026-06-18 15:20', end: '2026-06-18 16:05', downtimeHours: 0.8, rootCause: 'Belt tension', technician: 'Imran Khan', productionImpact: 'Packing delay', status: 'Closed', cost: 14400 },
  { id: 'BD-5008', asset: 'Oven 02', plant: 'Hyderabad Plant', line: 'Line 2', start: '2026-06-17 10:15', end: '2026-06-17 11:00', downtimeHours: 0.8, rootCause: 'Door switch fault', technician: 'Imran Khan', productionImpact: 'Line 2 hold', status: 'Closed', cost: 14400 },
  { id: 'BD-5009', asset: 'Mixer 02', plant: 'Hyderabad Plant', line: 'Line 2', start: '2026-06-16 12:05', end: '2026-06-16 12:45', downtimeHours: 0.7, rootCause: 'Overload trip', technician: 'Anita Sharma', productionImpact: 'Mixing delay', status: 'Closed', cost: 12600 },
  { id: 'BD-5010', asset: 'Quality Scanner 01', plant: 'Bangalore Plant', line: 'Packaging Line', start: '2026-06-15 08:40', end: '2026-06-15 09:10', downtimeHours: 0.5, rootCause: 'Lens contamination', technician: 'Anita Sharma', productionImpact: 'QA inspection delay', status: 'Closed', cost: 9000 },
];

export const calendarEvents = [
  { id: 'CAL-6001', type: 'PM Task', asset: 'Mixer 01', technician: 'Ravi Kumar', start: '2026-06-25 06:00', end: '2026-06-25 08:00', status: 'Scheduled' },
  { id: 'CAL-6002', type: 'Corrective Work Order', asset: 'Cooling Tunnel 01', technician: 'Ravi Kumar', start: '2026-06-24 16:00', end: '2026-06-24 19:00', status: 'Open' },
  { id: 'CAL-6003', type: 'Calibration Task', asset: 'Filler 01', technician: 'Anita Sharma', start: '2026-06-24 14:00', end: '2026-06-24 16:00', status: 'Open' },
  { id: 'CAL-6004', type: 'Planned Shutdown', asset: 'Oven 02', technician: 'Imran Khan', start: '2026-06-26 06:00', end: '2026-06-26 09:00', status: 'Scheduled' },
  { id: 'CAL-6005', type: 'Inspection Task', asset: 'Mixer 02', technician: 'Anita Sharma', start: '2026-06-25 11:00', end: '2026-06-25 12:30', status: 'Scheduled' },
  { id: 'CAL-6006', type: 'PM Task', asset: 'Conveyor 01', technician: 'Suresh Reddy', start: '2026-06-25 09:00', end: '2026-06-25 10:00', status: 'Scheduled' },
  { id: 'CAL-6007', type: 'Breakdown Repair', asset: 'Oven 01', technician: 'Suresh Reddy', start: '2026-06-24 08:00', end: '2026-06-24 12:00', status: 'In Progress' },
  { id: 'CAL-6008', type: 'Breakdown Repair', asset: 'Compressor 01', technician: 'Ravi Kumar', start: '2026-06-24 07:00', end: '2026-06-24 11:00', status: 'On Hold' },
  { id: 'CAL-6009', type: 'Calibration Task', asset: 'Quality Scanner 01', technician: 'Anita Sharma', start: '2026-06-23 13:00', end: '2026-06-23 15:00', status: 'Completed' },
  { id: 'CAL-6010', type: 'Corrective Work Order', asset: 'Packaging Machine 01', technician: 'Imran Khan', start: '2026-06-24 10:00', end: '2026-06-24 13:00', status: 'In Progress' },
];

export const spareParts = [
  { id: 'SP-7001', name: 'Bearing', asset: 'Cooling Tunnel 01', availableQty: 2, reservedQty: 1, requiredQty: 4, reorderPoint: 5, leadTime: '7 days', supplier: 'MechPro', criticality: 'High', status: 'Critical' },
  { id: 'SP-7002', name: 'Motor', asset: 'Conveyor 01', availableQty: 1, reservedQty: 0, requiredQty: 1, reorderPoint: 2, leadTime: '14 days', supplier: 'DriveTech', criticality: 'Critical', status: 'Low Stock' },
  { id: 'SP-7003', name: 'Belt', asset: 'Conveyor 01', availableQty: 6, reservedQty: 2, requiredQty: 2, reorderPoint: 3, leadTime: '5 days', supplier: 'BeltCo', criticality: 'High', status: 'Healthy' },
  { id: 'SP-7004', name: 'Seal Kit', asset: 'Filler 01', availableQty: 4, reservedQty: 1, requiredQty: 2, reorderPoint: 4, leadTime: '6 days', supplier: 'PackSeal', criticality: 'High', status: 'Healthy' },
  { id: 'SP-7005', name: 'Sensor', asset: 'Quality Scanner 01', availableQty: 0, reservedQty: 0, requiredQty: 1, reorderPoint: 2, leadTime: '10 days', supplier: 'SenseLab', criticality: 'Medium', status: 'Stockout' },
  { id: 'SP-7006', name: 'Gearbox', asset: 'Mixer 01', availableQty: 1, reservedQty: 1, requiredQty: 1, reorderPoint: 1, leadTime: '21 days', supplier: 'GearWorks', criticality: 'Critical', status: 'Low Stock' },
  { id: 'SP-7007', name: 'Heating Element', asset: 'Oven 01', availableQty: 3, reservedQty: 1, requiredQty: 2, reorderPoint: 3, leadTime: '9 days', supplier: 'ThermoParts', criticality: 'Critical', status: 'Healthy' },
  { id: 'SP-7008', name: 'Pressure Valve', asset: 'Compressor 01', availableQty: 0, reservedQty: 0, requiredQty: 1, reorderPoint: 2, leadTime: '12 days', supplier: 'AirSys', criticality: 'Critical', status: 'Stockout' },
  { id: 'SP-7009', name: 'Nozzle Kit', asset: 'Filler 01', availableQty: 5, reservedQty: 2, requiredQty: 2, reorderPoint: 4, leadTime: '6 days', supplier: 'PackSeal', criticality: 'Medium', status: 'Healthy' },
  { id: 'SP-7010', name: 'Temperature Controller', asset: 'Oven 01', availableQty: 1, reservedQty: 1, requiredQty: 1, reorderPoint: 2, leadTime: '11 days', supplier: 'ThermoParts', criticality: 'Critical', status: 'Low Stock' },
];

export const costRecords = [
  { id: 'COST-8001', workOrder: 'MWO-2001', asset: 'Oven 01', type: 'Downtime Cost', amount: 61200, date: '2026-06-24', owner: 'Suresh Reddy', status: 'Open' },
  { id: 'COST-8002', workOrder: 'MWO-2005', asset: 'Compressor 01', type: 'Spare Parts', amount: 26500, date: '2026-06-24', owner: 'Ravi Kumar', status: 'Review' },
  { id: 'COST-8003', workOrder: 'MWO-2004', asset: 'Packaging Machine 01', type: 'Labor', amount: 9800, date: '2026-06-24', owner: 'Imran Khan', status: 'Open' },
  { id: 'COST-8004', workOrder: 'MWO-2013', asset: 'Packaging Machine 01', type: 'External Service', amount: 5200, date: '2026-06-22', owner: 'Anita Sharma', status: 'Posted' },
  { id: 'COST-8005', workOrder: 'MWO-2014', asset: 'Conveyor 01', type: 'Spare Parts', amount: 7600, date: '2026-06-23', owner: 'Suresh Reddy', status: 'Posted' },
  { id: 'COST-8006', workOrder: 'MWO-2012', asset: 'Filler 01', type: 'Consumables', amount: 2400, date: '2026-06-21', owner: 'Imran Khan', status: 'Posted' },
  { id: 'COST-8007', workOrder: 'MWO-2003', asset: 'Filler 01', type: 'Labor', amount: 3200, date: '2026-06-24', owner: 'Anita Sharma', status: 'Open' },
  { id: 'COST-8008', workOrder: 'MWO-2010', asset: 'Cooling Tunnel 01', type: 'Spare Parts', amount: 11500, date: '2026-06-24', owner: 'Ravi Kumar', status: 'Open' },
  { id: 'COST-8009', workOrder: 'MWO-2009', asset: 'Quality Scanner 01', type: 'Labor', amount: 2800, date: '2026-06-23', owner: 'Anita Sharma', status: 'Posted' },
  { id: 'COST-8010', workOrder: 'MWO-2002', asset: 'Mixer 01', type: 'Preventive Labor', amount: 4200, date: '2026-06-25', owner: 'Ravi Kumar', status: 'Planned' },
];

export const assetHealthRecords = [
  { asset: 'Mixer 01', plant: 'Hyderabad Plant', line: 'Line 1', healthScore: 86, availability: 94, mttr: 1.1, mtbf: 180, breakdownCount: 1, lastMaintenance: '2026-06-02', nextMaintenance: '2026-07-02', riskStatus: 'Healthy' },
  { asset: 'Oven 01', plant: 'Hyderabad Plant', line: 'Line 1', healthScore: 68, availability: 82, mttr: 3.4, mtbf: 96, breakdownCount: 3, lastMaintenance: '2026-05-28', nextMaintenance: '2026-06-28', riskStatus: 'Attention Needed' },
  { asset: 'Filler 01', plant: 'Bangalore Plant', line: 'Packaging Line', healthScore: 91, availability: 97, mttr: 0.7, mtbf: 220, breakdownCount: 1, lastMaintenance: '2026-06-08', nextMaintenance: '2026-07-08', riskStatus: 'Healthy' },
  { asset: 'Packaging Machine 01', plant: 'Bangalore Plant', line: 'Packaging Line', healthScore: 74, availability: 88, mttr: 1.8, mtbf: 130, breakdownCount: 2, lastMaintenance: '2026-06-01', nextMaintenance: '2026-06-26', riskStatus: 'Attention Needed' },
  { asset: 'Compressor 01', plant: 'Hyderabad Plant', line: 'Line 2', healthScore: 42, availability: 65, mttr: 5.2, mtbf: 72, breakdownCount: 4, lastMaintenance: '2026-05-18', nextMaintenance: '2026-06-24', riskStatus: 'Down' },
  { asset: 'Conveyor 01', plant: 'Bangalore Plant', line: 'Packaging Line', healthScore: 82, availability: 92, mttr: 1.0, mtbf: 160, breakdownCount: 1, lastMaintenance: '2026-06-06', nextMaintenance: '2026-07-06', riskStatus: 'Healthy' },
  { asset: 'Mixer 02', plant: 'Hyderabad Plant', line: 'Line 2', healthScore: 88, availability: 95, mttr: 0.7, mtbf: 190, breakdownCount: 1, lastMaintenance: '2026-06-10', nextMaintenance: '2026-07-10', riskStatus: 'Healthy' },
  { asset: 'Oven 02', plant: 'Hyderabad Plant', line: 'Line 2', healthScore: 79, availability: 90, mttr: 0.8, mtbf: 150, breakdownCount: 1, lastMaintenance: '2026-06-05', nextMaintenance: '2026-07-05', riskStatus: 'Healthy' },
  { asset: 'Quality Scanner 01', plant: 'Bangalore Plant', line: 'Packaging Line', healthScore: 93, availability: 98, mttr: 0.5, mtbf: 240, breakdownCount: 1, lastMaintenance: '2026-06-12', nextMaintenance: '2026-07-12', riskStatus: 'Healthy' },
  { asset: 'Cooling Tunnel 01', plant: 'Hyderabad Plant', line: 'Line 1', healthScore: 64, availability: 80, mttr: 1.5, mtbf: 92, breakdownCount: 2, lastMaintenance: '2026-05-30', nextMaintenance: '2026-06-25', riskStatus: 'Critical' },
];

export const auditEntries = [
  { timestamp: '2026-06-24 07:10', user: 'Ravi Kumar', action: 'Breakdown Logged', area: 'Breakdown', referenceId: 'BD-5002', previousValue: 'Running', newValue: 'Down', reason: 'Pressure valve failure' },
  { timestamp: '2026-06-24 08:15', user: 'Suresh Reddy', action: 'Work Order Assigned', area: 'Work Orders', referenceId: 'MWO-2001', previousValue: 'Open', newValue: 'In Progress', reason: 'Critical oven repair' },
  { timestamp: '2026-06-24 09:00', user: 'Company Admin', action: 'Cost Updated', area: 'Maintenance Cost', referenceId: 'COST-8001', previousValue: '$0', newValue: '$61,200', reason: 'Downtime cost calculated' },
  { timestamp: '2026-06-24 10:20', user: 'Imran Khan', action: 'Spare Issued', area: 'Spare Parts', referenceId: 'SP-7010', previousValue: '2', newValue: '1', reason: 'Oven controller repair' },
  { timestamp: '2026-06-23 14:45', user: 'Anita Sharma', action: 'PM Completed', area: 'Preventive Maintenance', referenceId: 'PM-3009', previousValue: 'Scheduled', newValue: 'Completed', reason: 'Scanner calibration done' },
  { timestamp: '2026-06-23 16:30', user: 'Suresh Reddy', action: 'Breakdown Closed', area: 'Breakdown', referenceId: 'BD-5007', previousValue: 'Open', newValue: 'Closed', reason: 'Belt tension corrected' },
  { timestamp: '2026-06-22 11:15', user: 'Maintenance Admin', action: 'Asset Updated', area: 'Asset Register', referenceId: 'AST-1004', previousValue: 'Healthy', newValue: 'Attention Needed', reason: 'Seal temperature drift' },
  { timestamp: '2026-06-22 13:25', user: 'Ravi Kumar', action: 'Calendar Rescheduled', area: 'Maintenance Calendar', referenceId: 'CAL-6001', previousValue: '2026-06-24', newValue: '2026-06-25', reason: 'Production locked window' },
  { timestamp: '2026-06-21 09:50', user: 'Imran Khan', action: 'Work Order Completed', area: 'Work Orders', referenceId: 'MWO-2012', previousValue: 'In Progress', newValue: 'Completed', reason: 'PM checklist confirmed' },
  { timestamp: '2026-06-20 10:55', user: 'Suresh Reddy', action: 'Work Order Closed', area: 'Work Orders', referenceId: 'MWO-2011', previousValue: 'Completed', newValue: 'Closed', reason: 'Inspection accepted' },
];

export const impactMetrics = [
  { metric: 'Downtime Reduction', previous: '120 hrs/month', current: '75 hrs/month', difference: '45 hrs reduced', financialImpact: 135000, owner: 'Maintenance Manager', status: 'Improved' },
  { metric: 'Breakdown Reduction', previous: '18/month', current: '10/month', difference: '8 fewer breakdowns', financialImpact: 98000, owner: 'Reliability Lead', status: 'Improved' },
  { metric: 'Asset Availability Improvement', previous: '84%', current: '92%', difference: '+8%', financialImpact: 210000, owner: 'Plant Manager', status: 'Delivered' },
  { metric: 'PM Compliance Improvement', previous: '72%', current: '91%', difference: '+19%', financialImpact: 72000, owner: 'PM Planner', status: 'Improved' },
  { metric: 'Maintenance Cost Reduction', previous: '$420K', current: '$338K', difference: '$82K saved', financialImpact: 82000, owner: 'Company Admin', status: 'Delivered' },
  { metric: 'Spare Stockout Avoided', previous: '7 risks', current: '2 risks', difference: '5 avoided', financialImpact: 54000, owner: 'Stores Lead', status: 'Improved' },
  { metric: 'Production Loss Avoided', previous: '$620K', current: '$410K', difference: '$210K avoided', financialImpact: 210000, owner: 'Operations Manager', status: 'Delivered' },
];

export const maintenanceReports = ['Asset Register Report', 'Work Order Report', 'Preventive Maintenance Report', 'Corrective Maintenance Report', 'Breakdown Report', 'Maintenance Calendar Report', 'Spare Parts Report', 'Maintenance Cost Report', 'Asset Health Report', 'MTTR Report', 'MTBF Report', 'Downtime Report', 'Maintenance Audit Report'];
