export type ApiEnvelope<T> = {
  action?: string;
  module?: string;
  message?: string;
  data: T;
};

export type HealthResponse = {
  status: string;
  runtime: string;
  service: string;
};

export type ModuleInfo = {
  key: string;
  label?: string;
  description?: string;
};

export type NavigationSection = {
  section: string;
  items: string[];
  super_admin_only?: boolean;
};

export type AdminDashboard = {
  user_count: number;
  active_users: number;
  plants: number;
  warehouses: number;
  integrations: number;
  data_quality: number;
  ai_readiness: number;
  open_approvals: number;
  pending_actions: number;
};

export type DataQuality = {
  overall_score: number;
  scores: Array<{
    data_type: string;
    accuracy: number;
    completeness: number;
    consistency: number;
    timeliness: number;
  }>;
};

export type AiReadiness = {
  overall_ai_readiness: number;
  readiness: Array<{
    area: string;
    score: number;
    ready: boolean;
  }>;
};

export type ConnectedSystem = {
  id: string;
  system_name: string;
  system_type: string;
  connection_status: string;
  last_sync: string;
  health_score: number;
  record_count: number;
};

export type CommandCenter = {
  top_operational_risks?: Array<Record<string, unknown>>;
  customer_impact?: unknown;
  cost_impact?: unknown;
  recommendations?: Array<Record<string, unknown>>;
};

export type InventoryDashboard = {
  total_inventory_value: number;
  available_stock?: number;
  reserved_stock?: number;
  low_stock_risks?: Array<Record<string, unknown>>;
  warehouse_occupancy?: Record<string, unknown>;
};

export type DashboardAccessResult = {
  tenant_dashboard_enabled: boolean;
  role_permission: boolean;
  user_permission: boolean;
  data_scope_permission: boolean;
  dashboard_visible: boolean;
  decision: string;
};

export type RuntimeUser = {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'user';
  is_active: boolean;
  permissions: string[];
};

export type RuntimeLoginResult = {
  access_token: string;
  token_type: string;
  user: RuntimeUser;
};

export type ModuleRecord = {
  id: string;
  module_key: string;
  record_type: string;
  record_code: string;
  name: string;
  status: string;
  quantity?: number | null;
  payload: Record<string, unknown>;
  created_at?: string | null;
};

export type RuntimeAnalytics = {
  active_users: number;
  disabled_users: number;
  module_record_counts: Record<string, number>;
  inventory_total_quantity: number;
  inventory_low_stock_count: number;
  inventory_low_stock_items: ModuleRecord[];
};

export type AuditLog = {
  id: string;
  actor_id?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value?: Record<string, unknown> | null;
  new_value?: Record<string, unknown> | null;
  created_at?: string | null;
};
