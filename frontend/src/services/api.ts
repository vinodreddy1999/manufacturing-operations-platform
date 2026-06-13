import axios from 'axios';

import type {
  AdminDashboard,
  AiReadiness,
  ApiEnvelope,
  CommandCenter,
  ConnectedSystem,
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
  RuntimeAnalytics,
  RuntimeLoginResult,
  RuntimeUser,
} from '../types';

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
const apiBaseUrl = configuredBaseUrl?.replace(/\/$/, '') ?? '';
const tokenStorageKey = 'mop.runtime.token';

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
  dataQuality: () => getEnvelope<DataQuality>('/manufacturing-data-hub/data-quality'),
  aiReadiness: () => getEnvelope<AiReadiness>('/manufacturing-data-hub/ai-readiness'),
  connectedSystems: () => getEnvelope<ConnectedSystem[]>('/manufacturing-data-hub/connected-systems'),
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
