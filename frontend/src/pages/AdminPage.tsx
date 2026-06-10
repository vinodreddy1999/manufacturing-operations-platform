import { useQueries } from '@tanstack/react-query';
import { CheckCircle2, LockKeyhole, Route, Workflow } from 'lucide-react';

import { DataTable } from '../components/DataTable';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { Panel } from '../components/Panel';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { backend } from '../services/api';

export function AdminPage() {
  const [navigation, dashboard, access] = useQueries({
    queries: [
      { queryKey: ['frontend-navigation'], queryFn: backend.navigation },
      { queryKey: ['admin-dashboard'], queryFn: backend.adminDashboard },
      { queryKey: ['dashboard-access-evaluation'], queryFn: backend.evaluateDashboardAccess },
    ],
  });

  if ([navigation, dashboard, access].some((query) => query.isLoading)) {
    return <LoadingState label="Loading admin contracts from backend APIs" />;
  }

  const firstError = [navigation, dashboard, access].find((query) => query.isError)?.error;
  if (firstError) {
    return <ErrorState error={firstError} title="Admin API integration failed" />;
  }

  const navigationRows = (navigation.data ?? []).map((section) => ({
    section: section.section,
    items: section.items.join(', '),
    scope: section.super_admin_only ? 'Super Admin' : 'Company / role scoped',
  }));

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
    </>
  );
}
