import axios from 'axios';

import type {
  AdminDashboard,
  AiReadiness,
  ApiEnvelope,
  CommandCenter,
  ConnectedSystem,
  DataCatalogEntry,
  DataMappingRule,
  DashboardAccessResult,
  DataQuality,
  Company,
  FeatureFlag,
  HealthResponse,
  InventoryDashboard,
  AuditLog,
  ModuleRecord,
  ModuleInfo,
  NavigationSection,
  OperationalFootprint,
  RuntimeAnalytics,
  DataHubUpload,
  RuntimeLoginResult,
  RuntimeUser,
} from '../types';

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
const apiBaseUrl = configuredBaseUrl?.replace(/\/$/, '') ?? '';
const tokenStorageKey = 'metam.runtime.token';

export const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10_000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

export const apiConfig = {
  baseUrl: apiBaseUrl || 'same-origin',
};

api.interceptors.request.use((config) => {
  const token = window.localStorage.getItem(tokenStorageKey);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

async function getEnvelope<T>(url: string): Promise<T> {
  const response = await api.get<ApiEnvelope<T>>(url);
  return response.data.data;
}

export const backend = {
  health: async () => {
    const response = await api.get<HealthResponse>('/health');
    return response.data;
  },
  modules: async () => {
    const response = await api.get<ModuleInfo[]>('/modules');
    return response.data;
  },
  companies: async () => {
    const response = await api.get<Company[]>('/companies');
    return response.data;
  },
  createCompany: async (payload: { name: string; code: string }) => {
    const response = await api.post<Company>('/companies', {
      tenant_id: 'tenant-demo-001',
      name: payload.name,
      code: payload.code,
    });
    return response.data;
  },
  featureFlags: async () => {
    const response = await api.get<FeatureFlag[]>('/feature-flags');
    return response.data;
  },
  setFeatureFlag: async (payload: { company_id: string; module_key: string; enabled: boolean }) => {
    const response = await api.post<FeatureFlag>('/feature-flags', {
      tenant_id: 'tenant-demo-001',
      company_id: payload.company_id,
      module_key: payload.module_key,
      enabled: payload.enabled,
    });
    return response.data;
  },
  navigation: () => getEnvelope<NavigationSection[]>('/frontend/navigation'),
  adminDashboard: () => getEnvelope<AdminDashboard>('/admin/dashboard'),
  operationalFootprint: () => getEnvelope<OperationalFootprint>('/admin/operational-footprint'),
  updateOperationalFootprint: async (payload: OperationalFootprint) => {
    const response = await api.put<ApiEnvelope<OperationalFootprint>>('/admin/operational-footprint', payload);
    return response.data.data;
  },
  dataQuality: () => getEnvelope<DataQuality>('/manufacturing-data-hub/data-quality'),
  aiReadiness: () => getEnvelope<AiReadiness>('/manufacturing-data-hub/ai-readiness'),
  updateAiReadiness: async (payload: { readiness: AiReadiness['readiness'] }) => {
    const response = await api.put<ApiEnvelope<AiReadiness>>('/manufacturing-data-hub/ai-readiness', payload);
    return response.data.data;
  },
  connectedSystems: () => getEnvelope<ConnectedSystem[]>('/manufacturing-data-hub/connected-systems'),
  createConnectedSystem: async (payload: Omit<ConnectedSystem, 'id'>) => {
    const response = await api.post<ApiEnvelope<ConnectedSystem>>('/manufacturing-data-hub/connected-systems', payload);
    return response.data.data;
  },
  updateConnectedSystem: async (id: string, payload: Omit<ConnectedSystem, 'id'>) => {
    const response = await api.put<ApiEnvelope<ConnectedSystem>>(`/manufacturing-data-hub/connected-systems/${id}`, payload);
    return response.data.data;
  },
  deleteConnectedSystem: async (id: string) => {
    const response = await api.delete<ApiEnvelope<{ id: string }>>(`/manufacturing-data-hub/connected-systems/${id}`);
    return response.data.data;
  },
  dataCatalog: () => getEnvelope<DataCatalogEntry[]>('/manufacturing-data-hub/catalog'),
  createDataCatalogEntry: async (payload: Omit<DataCatalogEntry, 'id'>) => {
    const response = await api.post<ApiEnvelope<DataCatalogEntry>>('/manufacturing-data-hub/catalog', payload);
    return response.data.data;
  },
  updateDataCatalogEntry: async (id: string, payload: Omit<DataCatalogEntry, 'id'>) => {
    const response = await api.put<ApiEnvelope<DataCatalogEntry>>(`/manufacturing-data-hub/catalog/${id}`, payload);
    return response.data.data;
  },
  deleteDataCatalogEntry: async (id: string) => {
    const response = await api.delete<ApiEnvelope<{ id: string }>>(`/manufacturing-data-hub/catalog/${id}`);
    return response.data.data;
  },
  dataMappings: () => getEnvelope<DataMappingRule[]>('/manufacturing-data-hub/mappings'),
  createDataMapping: async (payload: Omit<DataMappingRule, 'id'>) => {
    const response = await api.post<ApiEnvelope<DataMappingRule>>('/manufacturing-data-hub/mappings', payload);
    return response.data.data;
  },
  updateDataMapping: async (id: string, payload: Omit<DataMappingRule, 'id'>) => {
    const response = await api.put<ApiEnvelope<DataMappingRule>>(`/manufacturing-data-hub/mappings/${id}`, payload);
    return response.data.data;
  },
  deleteDataMapping: async (id: string) => {
    const response = await api.delete<ApiEnvelope<{ id: string }>>(`/manufacturing-data-hub/mappings/${id}`);
    return response.data.data;
  },
  uploads: () => getEnvelope<DataHubUpload[]>('/manufacturing-data-hub/uploads'),
  uploadFile: async (file: File, companyId?: string) => {
    const form = new FormData();
    form.append('file', file);
    if (companyId) {
      form.append('company_id', companyId);
    }
    const response = await api.post<ApiEnvelope<DataHubUpload>>('/manufacturing-data-hub/uploads', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },
  createCloudSource: async (payload: {
    company_id?: string;
    provider: string;
    resource_name: string;
    resource_url: string;
    file_format: string;
    sync_mode: string;
    auth_method?: string;
    connection_details?: Record<string, unknown>;
  }) => {
    const response = await api.post<ApiEnvelope<DataHubUpload>>('/manufacturing-data-hub/cloud-sources', payload);
    return response.data.data;
  },
  commandCenter: () => getEnvelope<CommandCenter>('/manufacturing-intelligence/command-center'),
  inventoryDashboard: () => getEnvelope<InventoryDashboard>('/inventory/dashboard'),
  evaluateDashboardAccess: async () => {
    const response = await api.post<ApiEnvelope<DashboardAccessResult>>('/admin/access-control/evaluate-dashboard', {
      tenant_dashboard_enabled: true,
      role_permission: true,
      user_permission: true,
      data_scope_permission: true,
    });
    return response.data.data;
  },
  login: async (email: string, password: string) => {
    const response = await api.post<ApiEnvelope<RuntimeLoginResult>>('/runtime/auth/login', { email, password });
    window.localStorage.setItem(tokenStorageKey, response.data.data.access_token);
    return response.data.data;
  },
  logout: () => {
    window.localStorage.removeItem(tokenStorageKey);
  },
  currentUser: () => getEnvelope<RuntimeUser>('/runtime/auth/me'),
  users: () => getEnvelope<RuntimeUser[]>('/runtime/users'),
  createUser: async (payload: {
    email: string;
    name: string;
    password: string;
    role: RuntimeUser['role'];
    is_active: boolean;
    company_id?: string | null;
    plant_id?: string | null;
  }) => {
    const response = await api.post<ApiEnvelope<RuntimeUser>>('/runtime/users', payload);
    return response.data.data;
  },
  updateUser: async (id: string, payload: Partial<Pick<RuntimeUser, 'name' | 'role' | 'is_active'>>) => {
    const response = await api.put<ApiEnvelope<RuntimeUser>>(`/runtime/users/${id}`, payload);
    return response.data.data;
  },
  records: (moduleKey?: string) => getEnvelope<ModuleRecord[]>(moduleKey ? `/runtime/records?module_key=${moduleKey}` : '/runtime/records'),
  createRecord: async (payload: Omit<ModuleRecord, 'id' | 'created_at'>) => {
    const response = await api.post<ApiEnvelope<ModuleRecord>>('/runtime/records', payload);
    return response.data.data;
  },
  updateRecord: async (id: string, payload: Partial<Omit<ModuleRecord, 'id' | 'created_at'>>) => {
    const response = await api.put<ApiEnvelope<ModuleRecord>>(`/runtime/records/${id}`, payload);
    return response.data.data;
  },
  deleteRecord: async (id: string) => {
    const response = await api.delete<ApiEnvelope<{ id: string }>>(`/runtime/records/${id}`);
    return response.data.data;
  },
  analytics: () => getEnvelope<RuntimeAnalytics>('/runtime/analytics/summary'),
  auditLogs: () => getEnvelope<AuditLog[]>('/runtime/audit-logs'),
};
