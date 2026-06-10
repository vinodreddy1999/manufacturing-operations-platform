import axios from 'axios';

import type {
  AdminDashboard,
  AiReadiness,
  ApiEnvelope,
  CommandCenter,
  ConnectedSystem,
  DashboardAccessResult,
  DataQuality,
  HealthResponse,
  InventoryDashboard,
  ModuleInfo,
  NavigationSection,
} from '../types';

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
const apiBaseUrl = configuredBaseUrl?.replace(/\/$/, '') || 'http://127.0.0.1:8000';

export const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10_000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

export const apiConfig = {
  baseUrl: apiBaseUrl,
};

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
};
