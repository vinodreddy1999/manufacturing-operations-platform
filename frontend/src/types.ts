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
  company_id?: string;
  company_name?: string;
  system_name: string;
  system_type: string;
  connection_status: string;
  last_sync: string;
  health_score: number;
  record_count: number;
  source_category?: string | null;
  auth_method?: string | null;
  connection_details?: Record<string, unknown>;
};

export type DataCatalogEntry = {
  id: string;
  company_id?: string;
  company_name?: string;
  data_type: string;
  source_system: string;
  owner: string;
  ai_ready: boolean;
  quality_score: number;
  lineage: Record<string, unknown>;
};

export type DataMappingRule = {
  id: string;
  company_id?: string;
  company_name?: string;
  source_system: string;
  source_field: string;
  target_entity: string;
  target_field: string;
  transform_rule?: string | null;
  confidence: number;
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

export type Company = {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  is_active: boolean;
  created_at?: string;
};

export type FeatureFlag = {
  id: string;
  tenant_id: string;
  company_id: string;
  module_key: string;
  enabled: boolean;
  rules?: Record<string, unknown>;
};

export type RuntimeUser = {
  id: string;
  tenant_id: string;
  company_id?: string | null;
  plant_id?: string | null;
  email: string;
  name: string;
  role:
    | 'super_admin'
    | 'account_owner'
    | 'organization_admin'
    | 'team_manager'
    | 'supervisor'
    | 'operator'
    | 'auditor'
    | 'qa_tester'
    | 'custom'
    | 'admin'
    | 'user';
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
  tenant_id?: string;
  company_id?: string | null;
  plant_id?: string | null;
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
  company_record_counts?: Record<string, number>;
  inventory_quantity_by_company?: Record<string, number>;
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

export type OperationalFootprint = {
  user_count?: number;
  active_users?: number;
  plants: number;
  warehouses: number;
  integrations: number;
  open_approvals: number;
};

export type DataHubUpload = {
  id: string;
  company_id?: string | null;
  company_name?: string | null;
  source: 'local_upload' | 'cloud_link' | string;
  provider: string;
  resource_name: string;
  file_format: string;
  resource_url?: string | null;
  uploaded_by: string;
  status: string;
  metadata?: {
    content_type?: string;
    size_bytes?: number;
    sync_mode?: string;
    auth_method?: string | null;
    connection_details?: Record<string, unknown>;
    preview?: {
      detected_format?: string;
      columns?: string[];
      sample_rows?: Array<Record<string, unknown>>;
    };
  };
};
