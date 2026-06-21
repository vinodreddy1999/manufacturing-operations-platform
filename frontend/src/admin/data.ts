export const adminPermissions = ['View', 'Create', 'Edit', 'Delete', 'Approve', 'Export', 'Import', 'Configure', 'Administer'];

export const roleDefinitions = [
  ['ROLE-001', 'Super Admin', 'Platform', 'Full platform governance across every client'],
  ['ROLE-002', 'Company Admin', 'Company', 'Company users, access, dashboards, scopes, and governance'],
  ['ROLE-003', 'Plant Manager', 'Plant', 'Operational responsibility for an assigned plant'],
  ['ROLE-004', 'Planning Manager', 'Department', 'Demand, capacity, and production planning'],
  ['ROLE-005', 'Inventory Manager', 'Warehouse', 'Inventory availability, movement, and controls'],
  ['ROLE-006', 'Warehouse Manager', 'Warehouse', 'Warehouse execution and occupancy'],
  ['ROLE-007', 'Production Manager', 'Plant', 'Production orders and line execution'],
  ['ROLE-008', 'Maintenance Manager', 'Plant', 'Asset reliability and maintenance delivery'],
  ['ROLE-009', 'Quality Manager', 'Plant', 'Inspection, defects, CAPA, and quality release'],
  ['ROLE-010', 'Procurement Manager', 'Company', 'Supplier and purchasing governance'],
  ['ROLE-011', 'Sales Manager', 'Company', 'Customer demand, orders, and distribution'],
  ['ROLE-012', 'Finance Manager', 'Company', 'Costing, profitability, and financial review'],
  ['ROLE-013', 'Supervisor', 'Department', 'Team work execution and approval'],
  ['ROLE-014', 'Operator', 'Production Line', 'Assigned shop-floor work'],
  ['ROLE-015', 'Technician', 'Department', 'Assigned maintenance work'],
  ['ROLE-016', 'Customer User', 'Company', 'Customer portal access'],
  ['ROLE-017', 'Supplier User', 'Company', 'Supplier portal access'],
  ['ROLE-018', 'Viewer', 'Company', 'Read-only assigned information'],
] as const;

export const accessResources = ['Dashboard', 'Admin', 'Planning', 'Inventory', 'Warehouse', 'Production', 'Maintenance', 'Quality', 'Procurement', 'Sales & Distribution', 'Costing & Profitability', 'Compliance', 'Customer Portal', 'Supplier Portal', 'Reports & Analytics', 'Document Management', 'Manufacturing Data Hub', 'Integration Hub', 'AI Intelligence'];

export const dashboardDefinitions = ['Executive Dashboard', 'Admin Dashboard', 'Planning Dashboard', 'Inventory Dashboard', 'Warehouse Dashboard', 'Production Dashboard', 'Maintenance Dashboard', 'Quality Dashboard', 'Procurement Dashboard', 'Sales Dashboard', 'Costing Dashboard', 'Compliance Dashboard', 'Reports Dashboard', 'Data Hub Dashboard', 'Business Impact Dashboard'];

export const dataScopes = [
  ['Company Admin', 'Client', 'Entire assigned company', 'Active'],
  ['Plant Manager', 'Plant', 'Assigned Plant only', 'Active'],
  ['Inventory Manager', 'Warehouse', 'Warehouse A only', 'Active'],
  ['Production Manager', 'Production Line', 'Lines 1 and 2', 'Active'],
  ['Quality Manager', 'Department', 'Quality and production records', 'Active'],
  ['Viewer', 'Market', 'Assigned market, read only', 'Active'],
] as const;

export const recommendations = [
  ['Optimize safety stock policy', 'Inventory', 'Static reorder levels', 'Demand-aware safety stock', 'Reduce shortages and excess', 184000, 'Inventory Manager', 'High', 'Open'],
  ['Prioritize preventive maintenance', 'Maintenance', 'Reactive work concentration', 'Risk-ranked maintenance plan', 'Lower unplanned downtime', 265000, 'Maintenance Manager', 'Critical', 'In Progress'],
  ['Improve supplier delivery controls', 'Procurement', 'Variable lead times', 'Supplier performance escalation', 'Protect production schedule', 142000, 'Procurement Manager', 'High', 'Accepted'],
  ['Reduce quality rework', 'Quality', 'Repeated defect family', 'Focused CAPA and process check', 'Improve first-pass yield', 98000, 'Quality Manager', 'Medium', 'Open'],
  ['Consolidate slow-moving stock', 'Warehouse', 'Inventory across two sites', 'Inter-plant transfer proposal', 'Release working capital', 76000, 'Warehouse Manager', 'Low', 'Completed'],
] as const;
