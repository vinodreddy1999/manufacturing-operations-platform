import type { PlatformAuditLog, PlatformClient, PlatformState, PlatformUser, WidgetConfig } from './types';

export const platformApplications = ['Platform Management', 'Admin', 'Operations', 'Customer Portal', 'Supplier Portal', 'Reports & Analytics', 'Manufacturing Data Hub', 'Integration Hub', 'AI Intelligence'];
export const platformModules = ['Admin', 'Planning', 'Inventory', 'Warehouse', 'Production', 'Maintenance', 'Quality', 'Procurement', 'Sales & Distribution', 'Costing & Profitability', 'Compliance', 'Customer Portal', 'Supplier Portal', 'Reports & Analytics', 'Document Management', 'Manufacturing Data Hub', 'Integration Hub', 'AI Intelligence'];
export const platformRoles = ['Super Admin', 'Company Admin', 'Plant Manager', 'Planning Manager', 'Inventory Manager', 'Warehouse Manager', 'Production Manager', 'Maintenance Manager', 'Quality Manager', 'Procurement Manager', 'Sales Manager', 'Finance Manager', 'Supervisor', 'Operator', 'Technician', 'Customer User', 'Supplier User', 'Viewer'];

const allClientModules = platformModules.filter((module) => module !== 'Admin');

export const initialClients: PlatformClient[] = [
  { clientId: 'CLT-000001', clientName: 'ABC Manufacturing', region: 'North America', market: 'United States', currency: 'USD', enabledApplications: platformApplications.filter((item) => item !== 'Platform Management'), enabledModules: allClientModules, disabledModules: [], status: 'Active', createdDate: '2025-01-15' },
  { clientId: 'CLT-000002', clientName: 'Green Valley Foods', region: 'Asia', market: 'India', currency: 'INR', enabledApplications: platformApplications.filter((item) => !['Platform Management', 'AI Intelligence'].includes(item)), enabledModules: allClientModules.filter((item) => item !== 'AI Intelligence'), disabledModules: ['AI Intelligence'], status: 'Active', createdDate: '2025-03-08' },
  { clientId: 'CLT-000003', clientName: 'EuroPack Industries', region: 'Europe', market: 'European Union', currency: 'EUR', enabledApplications: platformApplications.filter((item) => item !== 'Platform Management'), enabledModules: allClientModules.filter((item) => item !== 'Supplier Portal'), disabledModules: ['Supplier Portal'], status: 'Trial', createdDate: '2026-04-10' },
  { clientId: 'CLT-000004', clientName: 'Gulf Plastics', region: 'Middle East', market: 'United Arab Emirates', currency: 'AED', enabledApplications: platformApplications.filter((item) => !['Platform Management', 'AI Intelligence'].includes(item)), enabledModules: allClientModules.filter((item) => !['Maintenance', 'AI Intelligence'].includes(item)), disabledModules: ['Maintenance', 'AI Intelligence'], status: 'Active', createdDate: '2025-08-22' },
  { clientId: 'CLT-000005', clientName: 'BritTech Components', region: 'Europe', market: 'United Kingdom', currency: 'GBP', enabledApplications: platformApplications.filter((item) => item !== 'Platform Management'), enabledModules: allClientModules.filter((item) => item !== 'Compliance'), disabledModules: ['Compliance'], status: 'Suspended', createdDate: '2025-11-05' },
];

const names = [
  ['Pavan', 'Reddy'], ['Anita', 'Sharma'], ['Michael', 'Carter'], ['Sofia', 'Martinez'],
  ['Arjun', 'Mehta'], ['Kavya', 'Nair'], ['Rohan', 'Patel'], ['Meera', 'Iyer'],
  ['Lukas', 'Weber'], ['Emma', 'Fischer'], ['Marco', 'Rossi'], ['Elena', 'Kovac'],
  ['Omar', 'Hassan'], ['Layla', 'Khalid'], ['Zaid', 'Rahman'], ['Noor', 'Ali'],
  ['Oliver', 'Smith'], ['Amelia', 'Jones'], ['Harry', 'Wilson'], ['Isla', 'Taylor'],
];

function makeUser(index: number): PlatformUser {
  const client = initialClients[Math.floor(index / 4)];
  const [firstName, lastName] = names[index];
  const manager = index % 4 === 0;
  return {
    userId: `USR-${String(index + 4).padStart(6, '0')}`,
    firstName, lastName, fullName: `${firstName} ${lastName}`,
    loginName: `${firstName}.${lastName}`.toLowerCase(),
    email: `${firstName}.${lastName}@${client.clientName.toLowerCase().replace(/[^a-z]+/g, '')}.demo`,
    clientId: client.clientId, clientName: client.clientName, region: client.region, market: client.market,
    department: manager ? 'Administration' : index % 4 === 1 ? 'Operations' : index % 4 === 2 ? 'Production' : 'Warehouse',
    plant: index % 2 === 0 ? 'Plant A' : 'Plant B', warehouse: index % 3 === 0 ? 'Warehouse A' : 'Warehouse B',
    roles: [manager ? 'Company Admin' : index % 4 === 1 ? 'Plant Manager' : index % 4 === 2 ? 'Supervisor' : 'Operator'],
    assignedApplications: client.enabledApplications,
    assignedModules: manager ? client.enabledModules : client.enabledModules.slice(0, 8 + (index % 5)),
    status: index === 18 ? 'Disabled' : 'Active', lastLogin: `2026-06-${String(20 - (index % 9)).padStart(2, '0')} 09:30`, createdDate: client.createdDate,
  };
}

export const initialUsers: PlatformUser[] = [
  { userId: 'USR-000001', firstName: 'Metam', lastName: 'Administrator', fullName: 'Metam Administrator', loginName: 'super', email: 'super@metam.local', clientId: null, clientName: 'Platform', region: 'Global', market: 'Global', department: 'Platform Operations', plant: 'All Plants', warehouse: 'All Warehouses', roles: ['Super Admin'], assignedApplications: platformApplications, assignedModules: platformModules, status: 'Active', lastLogin: '2026-06-21 08:00', createdDate: '2025-01-01' },
  { userId: 'USR-000002', firstName: 'ABC', lastName: 'Administrator', fullName: 'ABC Administrator', loginName: 'admin', email: 'admin@metam.local', clientId: 'CLT-000001', clientName: 'ABC Manufacturing', region: 'North America', market: 'United States', department: 'Administration', plant: 'All Plants', warehouse: 'All Warehouses', roles: ['Company Admin'], assignedApplications: initialClients[0].enabledApplications, assignedModules: initialClients[0].enabledModules, status: 'Active', lastLogin: '2026-06-20 16:20', createdDate: '2025-01-15' },
  { userId: 'USR-000003', firstName: 'Demo', lastName: 'Viewer', fullName: 'Demo Viewer', loginName: 'user', email: 'user@metam.local', clientId: 'CLT-000001', clientName: 'ABC Manufacturing', region: 'North America', market: 'United States', department: 'Operations', plant: 'Plant A', warehouse: 'Warehouse A', roles: ['Viewer'], assignedApplications: ['Operations', 'Reports & Analytics'], assignedModules: ['Planning', 'Inventory', 'Production', 'Quality', 'Reports & Analytics'], status: 'Active', lastLogin: '2026-06-19 14:10', createdDate: '2025-02-01' },
  ...names.map((_, index) => makeUser(index)),
];

export const initialWidgets: WidgetConfig[] = platformModules.slice(0, 15).map((moduleName, index) => ({ widgetId: `WGT-${String(index + 1).padStart(4, '0')}`, widgetName: `${moduleName} Health`, moduleName, owner: moduleName === 'Admin' ? 'Platform Operations' : `${moduleName} Owner`, clientCount: initialClients.filter((client) => client.enabledModules.includes(moduleName) || moduleName === 'Admin').length, status: index === 8 ? 'Critical' : index % 5 === 0 ? 'Attention Needed' : 'Healthy', visible: true, displayOrder: index + 1 }));

export const initialAuditLogs: PlatformAuditLog[] = initialUsers.slice(0, 15).map((user, index) => ({ logId: `LOG-${String(index + 1).padStart(6, '0')}`, clientId: user.clientId, clientName: user.clientName, userId: user.userId, moduleName: user.assignedModules[index % Math.max(1, user.assignedModules.length)] ?? 'Admin', action: index % 3 === 0 ? 'Updated User' : index % 3 === 1 ? 'Module Access Updated' : 'Dashboard Access Updated', description: `${user.fullName} access and governance activity was completed.`, status: 'Completed', timestamp: `2026-06-${String(20 - (index % 7)).padStart(2, '0')} ${String(8 + (index % 9)).padStart(2, '0')}:15` }));

export const initialPlatformState: PlatformState = { clients: initialClients, users: initialUsers, auditLogs: initialAuditLogs, widgets: initialWidgets };
