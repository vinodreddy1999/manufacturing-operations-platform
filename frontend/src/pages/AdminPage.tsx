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

export function AdminPage() {
  const queryClient = useQueryClient();
  const [newUser, setNewUser] = useState({ email: '', name: '', password: 'User12345!', role: 'user' as RuntimeUser['role'], is_active: true });
  const [navigation, dashboard, access, users, auditLogs] = useQueries({
    queries: [
      { queryKey: ['frontend-navigation'], queryFn: backend.navigation },
      { queryKey: ['admin-dashboard'], queryFn: backend.adminDashboard },
      { queryKey: ['dashboard-access-evaluation'], queryFn: backend.evaluateDashboardAccess },
      { queryKey: ['runtime-users'], queryFn: backend.users },
      { queryKey: ['runtime-audit-logs'], queryFn: backend.auditLogs },
    ],
  });
  const createUser = useMutation({
    mutationFn: backend.createUser,
    onSuccess: () => {
      setNewUser({ email: '', name: '', password: 'User12345!', role: 'user', is_active: true });
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

  if ([navigation, dashboard, access, users, auditLogs].some((query) => query.isLoading)) {
    return <LoadingState label="Loading admin contracts from backend APIs" />;
  }

  const firstError = [navigation, dashboard, access, users, auditLogs].find((query) => query.isError)?.error;
  if (firstError) {
    return <ErrorState error={firstError} title="Admin API integration failed" />;
  }

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
        <Panel title="User Access Control" description="Create users, assign roles, and enable or disable access. Super admin has the highest authority.">
          <form className="mb-4 grid gap-3 md:grid-cols-5" onSubmit={submitUser}>
            <input className="rounded-md border border-border px-3 py-2 text-sm" placeholder="Name" value={newUser.name} onChange={(event) => setNewUser({ ...newUser, name: event.target.value })} required />
            <input className="rounded-md border border-border px-3 py-2 text-sm" placeholder="Email" value={newUser.email} onChange={(event) => setNewUser({ ...newUser, email: event.target.value })} required />
            <input className="rounded-md border border-border px-3 py-2 text-sm" placeholder="Password" value={newUser.password} onChange={(event) => setNewUser({ ...newUser, password: event.target.value })} required />
            <select className="rounded-md border border-border px-3 py-2 text-sm" value={newUser.role} onChange={(event) => setNewUser({ ...newUser, role: event.target.value as RuntimeUser['role'] })}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
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
              { key: 'role', label: 'Role', render: (value, row) => (
                <select className="rounded-md border border-border px-2 py-1 text-xs" value={String(value)} onChange={(event) => updateUser.mutate({ id: String(row.id), payload: { role: event.target.value as RuntimeUser['role'] } })}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
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
