export type CurrencyCode = 'USD' | 'INR' | 'EUR' | 'GBP' | 'AED';
export type ClientStatus = 'Active' | 'Trial' | 'Suspended';

export type PlatformClient = {
  clientId: string;
  clientName: string;
  region: string;
  market: string;
  currency: CurrencyCode;
  enabledApplications: string[];
  enabledModules: string[];
  disabledModules: string[];
  status: ClientStatus;
  createdDate: string;
  industry?: string;
  plants?: number;
  warehouses?: number;
  lastUpdated?: string;
};

export type PlatformUser = {
  userId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  loginName: string;
  email: string;
  clientId: string | null;
  clientName: string;
  region: string;
  market: string;
  department?: string;
  plant?: string;
  warehouse?: string;
  roles: string[];
  assignedApplications: string[];
  assignedModules: string[];
  status: 'Active' | 'Disabled';
  lastLogin: string;
  createdDate: string;
};

export type PlatformAuditLog = {
  logId: string;
  clientId: string | null;
  clientName: string;
  userId: string;
  moduleName: string;
  action: string;
  timestamp: string;
  description?: string;
  status?: 'Completed' | 'Pending' | 'Failed';
};

export type WidgetConfig = {
  widgetId: string;
  widgetName: string;
  moduleName: string;
  owner: string;
  clientCount: number;
  status: 'Healthy' | 'Attention Needed' | 'Critical';
  visible: boolean;
  displayOrder: number;
};

export type PlatformState = {
  clients: PlatformClient[];
  users: PlatformUser[];
  auditLogs: PlatformAuditLog[];
  widgets: WidgetConfig[];
};
