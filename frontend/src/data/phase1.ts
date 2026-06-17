import {
  Archive,
  BadgeDollarSign,
  ClipboardCheck,
  FileText,
  Forklift,
  Gauge,
  Handshake,
  PackageCheck,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Wrench,
} from 'lucide-react';

export const dashboardMetrics = [
  { label: 'Revenue', value: '$4.8M', helper: 'Month to date', accent: 'emerald' as const },
  { label: 'Orders', value: '1,284', helper: 'Open and completed', accent: 'blue' as const },
  { label: 'Inventory Value', value: '$12.4M', helper: 'Across warehouses', accent: 'amber' as const },
  { label: 'Open Approvals', value: '27', helper: 'Waiting for action', accent: 'violet' as const },
  { label: 'Active Integrations', value: '18', helper: 'ERP, files, APIs, SFTP', accent: 'blue' as const },
];

export const operationalStatus = [
  { area: 'Production', status: 'On Track', value: 82 },
  { area: 'Maintenance', status: 'Attention', value: 64 },
  { area: 'Quality', status: 'Stable', value: 91 },
  { area: 'Procurement', status: 'Pending', value: 73 },
  { area: 'Inventory', status: 'Stable', value: 88 },
];

export const notifications = [
  { title: 'Purchase request requires approval', owner: 'Procurement Manager', status: 'Pending' },
  { title: 'Cycle count variance posted', owner: 'Warehouse Manager', status: 'Review' },
  { title: 'Maintenance work order completed', owner: 'Maintenance Manager', status: 'Closed' },
  { title: 'Quality inspection lot waiting', owner: 'Quality Manager', status: 'Open' },
];

export const moduleDefinitions = [
  {
    key: 'planning',
    title: 'Planning',
    icon: Gauge,
    description: 'Demand, inventory, production, capacity, procurement, distribution, workforce, and maintenance planning.',
    features: ['Demand Planning', 'Inventory Planning', 'Production Planning', 'Capacity Planning', 'Procurement Planning', 'Distribution Planning', 'Workforce Planning', 'Maintenance Planning'],
    sampleRows: [
      { code: 'PLAN-001', name: 'June demand plan', status: 'Approved', owner: 'Planning Manager', quantity: 1280 },
      { code: 'PLAN-002', name: 'Line 2 capacity review', status: 'Draft', owner: 'Plant Manager', quantity: 420 },
      { code: 'PLAN-003', name: 'Maintenance capacity window', status: 'Open', owner: 'Maintenance Manager', quantity: 18 },
    ],
  },
  {
    key: 'inventory',
    title: 'Inventory',
    icon: Archive,
    description: 'Item master, stock overview, warehouses, transfers, receipts, issues, adjustments, counts, reorder levels, and reports.',
    features: ['Item Master', 'Stock Overview', 'Warehouses', 'Transfers', 'Goods Receipt', 'Goods Issue', 'Stock Adjustments', 'Cycle Counts', 'Reorder Levels', 'Inventory Reports'],
    sampleRows: [
      { code: 'RM-STL-001', name: 'Steel coil', status: 'Available', owner: 'Inventory Manager', quantity: 680 },
      { code: 'FG-PUMP-200', name: 'Pump assembly', status: 'Reserved', owner: 'Warehouse Manager', quantity: 94 },
      { code: 'SP-BRG-018', name: 'Bearing kit', status: 'Low Stock', owner: 'Inventory Manager', quantity: 12 },
    ],
  },
  {
    key: 'production',
    title: 'Production',
    icon: PackageCheck,
    description: 'BOMs, routings, work centers, orders, schedules, capacity, tracking, and OEE.',
    features: ['BOM Management', 'Routing Management', 'Work Centers', 'Production Orders', 'Scheduling', 'Capacity Management', 'Production Tracking', 'OEE Dashboard'],
    sampleRows: [
      { code: 'WO-10024', name: 'Pump assembly run', status: 'In Progress', owner: 'Production Manager', quantity: 240 },
      { code: 'WO-10025', name: 'Valve machining', status: 'Scheduled', owner: 'Supervisor', quantity: 180 },
      { code: 'BOM-784', name: 'Pump assembly BOM', status: 'Released', owner: 'Production Manager', quantity: 32 },
    ],
  },
  {
    key: 'maintenance',
    title: 'Maintenance',
    icon: Wrench,
    description: 'Assets, hierarchy, work orders, preventive/breakdown maintenance, spare parts, and calendars.',
    features: ['Asset Register', 'Asset Hierarchy', 'Work Orders', 'Preventive Maintenance', 'Breakdown Maintenance', 'Spare Parts Inventory', 'Maintenance Calendar'],
    sampleRows: [
      { code: 'WO-M-902', name: 'Compressor PM', status: 'Open', owner: 'Maintenance Manager', quantity: 1 },
      { code: 'AST-014', name: 'CNC machine 14', status: 'Running', owner: 'Technician', quantity: 1 },
      { code: 'WO-M-903', name: 'Line 2 motor inspection', status: 'Scheduled', owner: 'Technician', quantity: 1 },
    ],
  },
  {
    key: 'quality',
    title: 'Quality',
    icon: ClipboardCheck,
    description: 'Inspection plans, incoming/in-process/finished goods quality, NCR, CAPA, and audits.',
    features: ['Inspection Plans', 'Incoming Quality', 'In-Process Quality', 'Finished Goods Quality', 'NCR', 'CAPA', 'Audit Management'],
    sampleRows: [
      { code: 'LOT-Q-112', name: 'Incoming steel inspection', status: 'Passed', owner: 'Quality Manager', quantity: 60 },
      { code: 'NCR-044', name: 'Surface finish variance', status: 'Open', owner: 'Quality Manager', quantity: 8 },
      { code: 'CAPA-019', name: 'Supplier packaging issue', status: 'In Progress', owner: 'QA/Tester', quantity: 1 },
    ],
  },
  {
    key: 'procurement',
    title: 'Procurement',
    icon: ShoppingCart,
    description: 'Suppliers, RFQs, quotations, purchase requests, purchase orders, goods receipt, and vendor evaluation.',
    features: ['Suppliers', 'RFQ', 'Quotations', 'Purchase Requests', 'Purchase Orders', 'Goods Receipt', 'Vendor Evaluation'],
    sampleRows: [
      { code: 'PR-773', name: 'Bearing replenishment', status: 'Pending Approval', owner: 'Procurement Manager', quantity: 300 },
      { code: 'PO-1192', name: 'Steel coils', status: 'Released', owner: 'Procurement Manager', quantity: 22 },
      { code: 'RFQ-208', name: 'Pump castings', status: 'Open', owner: 'Procurement Manager', quantity: 4 },
    ],
  },
  {
    key: 'sales',
    title: 'Sales & Distribution',
    icon: Truck,
    description: 'Customers, sales orders, pricing, dispatch, deliveries, logistics tracking, and customer history.',
    features: ['Customers', 'Sales Orders', 'Pricing', 'Dispatch', 'Deliveries', 'Logistics Tracking', 'Customer History'],
    sampleRows: [
      { code: 'SO-3314', name: 'Apex pump order', status: 'Confirmed', owner: 'Sales Manager', quantity: 90 },
      { code: 'DEL-882', name: 'North region dispatch', status: 'In Transit', owner: 'Sales Manager', quantity: 18 },
      { code: 'CUS-102', name: 'Nova Textiles account', status: 'Active', owner: 'Customer User', quantity: 1 },
    ],
  },
  {
    key: 'costing',
    title: 'Costing & Profitability',
    icon: BadgeDollarSign,
    description: 'Material, labor, machine, energy, logistics, product, customer, and plant profitability.',
    features: ['Material Cost', 'Labor Cost', 'Machine Cost', 'Energy Cost', 'Logistics Cost', 'Product Costing', 'Customer Profitability', 'Plant Profitability'],
    sampleRows: [
      { code: 'COST-001', name: 'Pump model costing', status: 'Published', owner: 'Finance Manager', quantity: 1240 },
      { code: 'MACH-COST', name: 'Machine hourly rate', status: 'Review', owner: 'Finance Manager', quantity: 18 },
      { code: 'PLANT-PROF', name: 'Hyderabad plant margin', status: 'Active', owner: 'Finance Manager', quantity: 14 },
    ],
  },
  {
    key: 'compliance',
    title: 'Compliance',
    icon: ShieldCheck,
    description: 'Compliance records, audit tracking, electronic signatures, and compliance reports.',
    features: ['Compliance Records', 'Audit Tracking', 'Electronic Signatures', 'Compliance Reports'],
    sampleRows: [
      { code: 'COMP-771', name: 'ISO audit checklist', status: 'Open', owner: 'Auditor', quantity: 34 },
      { code: 'ESIGN-109', name: 'Batch release signature', status: 'Signed', owner: 'Quality Manager', quantity: 1 },
      { code: 'REG-204', name: 'Safety compliance record', status: 'Active', owner: 'Plant Manager', quantity: 12 },
    ],
  },
  {
    key: 'customer-portal',
    title: 'Customer Portal',
    icon: Handshake,
    description: 'Customer orders, deliveries, invoices, documents, and support tickets.',
    features: ['Orders', 'Deliveries', 'Invoices', 'Documents', 'Support Tickets'],
    sampleRows: [
      { code: 'C-ORD-210', name: 'Customer order status', status: 'Visible', owner: 'Customer User', quantity: 8 },
      { code: 'INV-802', name: 'Invoice download', status: 'Ready', owner: 'Customer User', quantity: 1 },
      { code: 'TICKET-55', name: 'Delivery query', status: 'Open', owner: 'Customer User', quantity: 1 },
    ],
  },
  {
    key: 'supplier-portal',
    title: 'Supplier Portal',
    icon: Forklift,
    description: 'Supplier RFQs, purchase orders, deliveries, documents, and performance scorecards.',
    features: ['RFQs', 'Purchase Orders', 'Deliveries', 'Documents', 'Performance Scorecards'],
    sampleRows: [
      { code: 'SUP-RFQ-44', name: 'Casting quotation', status: 'Submitted', owner: 'Supplier User', quantity: 1 },
      { code: 'SUP-PO-88', name: 'Steel PO acknowledgement', status: 'Accepted', owner: 'Supplier User', quantity: 1 },
      { code: 'SCORE-12', name: 'Supplier scorecard', status: 'Published', owner: 'Procurement Manager', quantity: 92 },
    ],
  },
  {
    key: 'reports',
    title: 'Reports & Analytics',
    icon: FileText,
    description: 'Standard operational reports with PDF, Excel, and CSV exports.',
    features: ['Inventory Reports', 'Production Reports', 'Maintenance Reports', 'Quality Reports', 'Procurement Reports', 'Sales Reports', 'Finance Reports', 'PDF Export', 'Excel Export', 'CSV Export'],
    sampleRows: [
      { code: 'REP-INV', name: 'Inventory status report', status: 'Ready', owner: 'Viewer', quantity: 1 },
      { code: 'REP-PROD', name: 'Production output report', status: 'Ready', owner: 'Production Manager', quantity: 1 },
      { code: 'REP-FIN', name: 'Finance summary report', status: 'Ready', owner: 'Finance Manager', quantity: 1 },
    ],
  },
  {
    key: 'documents',
    title: 'Document Management',
    icon: FileText,
    description: 'SOPs, work instructions, contracts, manuals, certificates, version control, approval workflow, and search.',
    features: ['SOPs', 'Work Instructions', 'Contracts', 'Machine Manuals', 'Certificates', 'Version Control', 'Approval Workflow', 'Search'],
    sampleRows: [
      { code: 'SOP-100', name: 'Goods receipt SOP', status: 'Approved', owner: 'Warehouse Manager', quantity: 3 },
      { code: 'WI-204', name: 'CNC setup instruction', status: 'Published', owner: 'Production Manager', quantity: 5 },
      { code: 'CERT-018', name: 'Supplier certificate', status: 'Active', owner: 'Quality Manager', quantity: 1 },
    ],
  },
];

export function getModuleDefinition(key: string) {
  return moduleDefinitions.find((module) => module.key === key) ?? moduleDefinitions[0];
}
