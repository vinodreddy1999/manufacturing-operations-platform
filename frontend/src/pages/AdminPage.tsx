import { FormEvent, useState } from 'react';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, LockKeyhole, Route, Workflow } from 'lucide-react';

import { DataTable } from '../components/DataTable';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { Panel } from '../components/Panel';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { backend } from '../services/api';
import type { RuntimeUser } from '../types';

const roleOptions: Array<{ value: RuntimeUser['role']; label: string }> = [
  { value: 'user', label: 'User' },
  { value: 'operator', label: 'Operator' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'team_manager', label: 'Team Manager' },
  { value: 'organization_admin', label: 'Organization Admin' },
  { value: 'account_owner', label: 'Account Owner' },
  { value: 'auditor', label: 'Auditor' },
  { value: 'qa_tester', label: 'QA/Tester' },
  { value: 'custom', label: 'Custom Role' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
];

export function AdminPage() {
  const queryClient = useQueryClient();
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    password: 'User12345!',
    role: 'user' as RuntimeUser['role'],
    is_active: true,
    company_id: 'company-c',
    plant_id: 'plant-north',
  });
  const [navigation, dashboard, access, users, auditLogs, companies, featureFlags] = useQueries({
    queries: [
      { queryKey: ['frontend-navigation'], queryFn: backend.navigation },
      { queryKey: ['admin-dashboard'], queryFn: backend.adminDashboard },
      { queryKey: ['dashboard-access-evaluation'], queryFn: backend.evaluateDashboardAccess },
      { queryKey: ['runtime-users'], queryFn: backend.users },
      { queryKey: ['runtime-audit-logs'], queryFn: backend.auditLogs },
      { queryKey: ['companies'], queryFn: backend.companies },
      { queryKey: ['feature-flags'], queryFn: backend.featureFlags },
    ],
  });
  const createUser = useMutation({
    mutationFn: backend.createUser,
    onSuccess: () => {
      setNewUser({ email: '', name: '', password: 'User12345!', role: 'user', is_active: true, company_id: 'company-c', plant_id: 'plant-north' });
      queryClient.invalidateQueries({ queryKey: ['runtime-users'] });
      queryClient.invalidateQueries({ queryKey: ['runtime-audit-logs'] });
    },
  });
  const updateUser = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Pick<RuntimeUser, 'name' | 'role' | 'is_active'>> }) => backend.updateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['runtime-users'] });
      queryClient.invalidateQueries({ queryKey: ['runtime-audit-logs'] });
    },
  });
  const setFeatureFlag = useMutation({
    mutationFn: backend.setFeatureFlag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      queryClient.invalidateQueries({ queryKey: ['runtime-audit-logs'] });
    },
  });

  if ([navigation, dashboard, access, users, auditLogs, companies, featureFlags].some((query) => query.isLoading)) {
    return <LoadingState label="Loading admin contracts from backend APIs" />;
  }

  const firstError = [navigation, dashboard, access, users, auditLogs, companies, featureFlags].find((query) => query.isError)?.error;
  if (firstError) {
    return <ErrorState error={firstError} title="Admin API integration failed" />;
  }

  const companyNameById = new Map((companies.data ?? []).map((company) => [company.id, company.name]));
  const companyRows = companies.data ?? [];
  const moduleRows = (featureFlags.data ?? []).map((flag) => ({
    ...flag,
    company_name: companyNameById.get(flag.company_id) ?? flag.company_id,
    status: flag.enabled ? 'Enabled' : 'Disabled',
  }));

  const navigationRows = (navigation.data ?? []).map((section) => ({
    section: section.section,
    items: section.items.join(', '),
    scope: section.super_admin_only ? 'Super Admin' : 'Company / role scoped',
  }));

  function submitUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createUser.mutate(newUser);
  }

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Admin Control Center"
        description="RBAC, navigation, dashboard access, and setup views are driven by backend Admin and Frontend Contract APIs."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Users" value={dashboard.data?.user_count ?? 0} helper={`${dashboard.data?.active_users ?? 0} active`} icon={<LockKeyhole className="h-5 w-5" />} />
        <StatCard label="Pending Actions" value={dashboard.data?.pending_actions ?? 0} helper="Approval and data hub queue" icon={<Workflow className="h-5 w-5" />} />
        <StatCard label="Dashboard Access" value={access.data?.decision ?? 'Unknown'} helper="Tenant + role + user + scope" icon={<CheckCircle2 className="h-5 w-5" />} />
        <StatCard label="Plants" value={dashboard.data?.plants ?? 0} helper={`${dashboard.data?.warehouses ?? 0} warehouses`} icon={<Route className="h-5 w-5" />} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="User Access Control" description="Create users, assign roles, assign company scope, and enable or disable access. Super admin has the highest authority.">
          <form className="mb-4 grid gap-3 md:grid-cols-6" onSubmit={submitUser}>
            <input className="rounded-md border border-border px-3 py-2 text-sm" placeholder="Name" value={newUser.name} onChange={(event) => setNewUser({ ...newUser, name: event.target.value })} required />
            <input className="rounded-md border border-border px-3 py-2 text-sm" placeholder="Email" value={newUser.email} onChange={(event) => setNewUser({ ...newUser, email: event.target.value })} required />
            <input className="rounded-md border border-border px-3 py-2 text-sm" placeholder="Password" value={newUser.password} onChange={(event) => setNewUser({ ...newUser, password: event.target.value })} required />
            <select className="rounded-md border border-border px-3 py-2 text-sm" value={newUser.role} onChange={(event) => setNewUser({ ...newUser, role: event.target.value as RuntimeUser['role'] })}>
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
            <select className="rounded-md border border-border px-3 py-2 text-sm" value={newUser.company_id} onChange={(event) => setNewUser({ ...newUser, company_id: event.target.value })}>
              {companyRows.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            <button className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60" disabled={createUser.isPending}>
              {createUser.isPending ? 'Saving...' : 'Add User'}
            </button>
          </form>
          <DataTable
            rows={users.data ?? []}
            emptyTitle="No users"
            columns={[
              { key: 'name', label: 'Name' },
              { key: 'email', label: 'Email' },
              { key: 'company_id', label: 'Company', render: (value) => companyNameById.get(String(value)) ?? String(value ?? '') },
              { key: 'role', label: 'Role', render: (value, row) => (
                <select className="rounded-md border border-border px-2 py-1 text-xs" value={String(value)} onChange={(event) => updateUser.mutate({ id: String(row.id), payload: { role: event.target.value as RuntimeUser['role'] } })}>
                  {roleOptions.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              ) },
              { key: 'is_active', label: 'Access', render: (value, row) => (
                <button className="rounded-md border border-border px-2 py-1 text-xs font-medium" onClick={() => updateUser.mutate({ id: String(row.id), payload: { is_active: !value } })}>
                  {value ? 'Disable' : 'Enable'}
                </button>
              ) },
            ]}
          />
        </Panel>

        <Panel title="Companies" description="Super admin company visibility from /companies.">
          <DataTable
            rows={companyRows}
            emptyTitle="No companies"
            columns={[
              { key: 'name', label: 'Company' },
              { key: 'code', label: 'Code' },
              { key: 'id', label: 'Company ID' },
              { key: 'is_active', label: 'Status', render: (value) => <StatusBadge status={value ? 'Active' : 'Disabled'} /> },
            ]}
          />
        </Panel>

        <Panel title="Company Module Controls" description="Enable or disable backend modules per company using live feature flags.">
          <DataTable
            rows={moduleRows}
            emptyTitle="No module flags"
            columns={[
              { key: 'company_name', label: 'Company' },
              { key: 'module_key', label: 'Module' },
              { key: 'status', label: 'Status', render: (value) => <StatusBadge status={String(value)} /> },
              { key: 'enabled', label: 'Action', render: (value, row) => (
                <button
                  className="rounded-md border border-border px-2 py-1 text-xs font-medium disabled:opacity-60"
                  disabled={setFeatureFlag.isPending}
                  onClick={() => setFeatureFlag.mutate({ company_id: String(row.company_id), module_key: String(row.module_key), enabled: !value })}
                >
                  {value ? 'Disable' : 'Enable'}
                </button>
              ) },
            ]}
          />
        </Panel>

        <Panel title="Main Navigation Contract" description="Returned by /frontend/navigation for future React route generation.">
          <DataTable
            rows={navigationRows}
            emptyTitle="No navigation sections"
            columns={[
              { key: 'section', label: 'Section' },
              { key: 'items', label: 'Items' },
              { key: 'scope', label: 'Scope', render: (value) => <StatusBadge status={String(value)} /> },
            ]}
          />
        </Panel>

        <Panel title="Dashboard Visibility Rule" description="Backend evaluates the complete permission rule.">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
              <span>Tenant dashboard enabled</span>
              <StatusBadge status={access.data?.tenant_dashboard_enabled ? 'Enabled' : 'Disabled'} />
            </div>
            <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
              <span>Role permission</span>
              <StatusBadge status={access.data?.role_permission ? 'Allowed' : 'Denied'} />
            </div>
            <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
              <span>User permission</span>
              <StatusBadge status={access.data?.user_permission ? 'Allowed' : 'Denied'} />
            </div>
            <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
              <span>Data scope permission</span>
              <StatusBadge status={access.data?.data_scope_permission ? 'Allowed' : 'Denied'} />
            </div>
          </div>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Latest Audit Trail" description="Every runtime write creates an audit record in the backend database.">
          <DataTable
            rows={auditLogs.data ?? []}
            emptyTitle="No audit logs yet"
            columns={[
              { key: 'action', label: 'Action' },
              { key: 'entity_type', label: 'Entity' },
              { key: 'entity_id', label: 'Entity ID' },
              { key: 'created_at', label: 'Created' },
            ]}
          />
        </Panel>
      </div>
    </>
  );
}
