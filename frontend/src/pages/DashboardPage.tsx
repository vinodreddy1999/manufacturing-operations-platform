import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, Bell, Boxes, CheckCircle2, Link2, PackageCheck, ShoppingCart } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { DataTable } from '../components/DataTable';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { Panel } from '../components/Panel';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { formatCurrency, formatNumber, toTitle } from '../lib/format';
import { backend } from '../services/api';
import type { ModuleRecord, RuntimeUser } from '../types';

function statusScore(records: ModuleRecord[] | undefined, moduleKey: string, fallback: number) {
  const moduleRecords = records?.filter((record) => record.module_key === moduleKey) ?? [];
  if (!moduleRecords.length) return fallback;
  const closedStatuses = ['approved', 'published', 'released', 'completed', 'signed', 'passed', 'ready', 'active'];
  const healthy = moduleRecords.filter((record) => closedStatuses.includes(record.status.toLowerCase())).length;
  return Math.max(35, Math.round((healthy / moduleRecords.length) * 100));
}

function moduleRoute(moduleKey: string) {
  const directRoutes = new Set([
    'planning',
    'inventory',
    'production',
    'maintenance',
    'quality',
    'procurement',
    'sales',
    'costing',
    'compliance',
    'customer-portal',
    'supplier-portal',
    'reports',
    'documents',
  ]);
  const routeMap: Record<string, string> = {
    reporting: '/reports',
    reports: '/reports',
    integrations: '/data-hub',
    mobile: '/operations',
    ai_copilot: '/intelligence',
    ai: '/intelligence',
  };
  if (directRoutes.has(moduleKey)) return `/${moduleKey}`;
  return routeMap[moduleKey] ?? '/operations';
}

export function DashboardPage({ user }: { user: RuntimeUser }) {
  const navigate = useNavigate();
  const admin = useQuery({ queryKey: ['admin-dashboard'], queryFn: backend.adminDashboard });
  const inventory = useQuery({ queryKey: ['inventory-dashboard'], queryFn: backend.inventoryDashboard });
  const analytics = useQuery({ queryKey: ['runtime-analytics'], queryFn: backend.analytics });
  const systems = useQuery({ queryKey: ['connected-systems'], queryFn: backend.connectedSystems });
  const uploads = useQuery({ queryKey: ['data-hub-uploads'], queryFn: backend.uploads });
  const records = useQuery({ queryKey: ['runtime-records'], queryFn: () => backend.records() });

  const isLoading = admin.isLoading || inventory.isLoading || analytics.isLoading || systems.isLoading || uploads.isLoading || records.isLoading;
  const firstError = admin.error ?? inventory.error ?? analytics.error ?? systems.error ?? uploads.error ?? records.error;

  if (isLoading) {
    return <LoadingState label="Loading backend dashboard data" />;
  }

  if (firstError) {
    return <ErrorState title="Dashboard backend data failed" error={firstError} />;
  }

  const allRecords = records.data ?? [];
  const connectedSystems = systems.data ?? [];
  const fileUploads = uploads.data ?? [];
  const moduleCounts = analytics.data?.module_record_counts ?? {};
  const lowStockItems = analytics.data?.inventory_low_stock_items ?? [];
  const productionScore = statusScore(allRecords, 'production', 82);
  const maintenanceScore = statusScore(allRecords, 'maintenance', 64);
  const qualityScore = admin.data?.data_quality ?? statusScore(allRecords, 'quality', 91);
  const procurementScore = statusScore(allRecords, 'procurement', 73);
  const inventoryScore = Math.max(20, 100 - (analytics.data?.inventory_low_stock_count ?? 0) * 8);

  const dashboardMetrics = [
    {
      label: 'Active Users',
      value: formatNumber(admin.data?.active_users ?? analytics.data?.active_users),
      helper: `${formatNumber(admin.data?.user_count)} total users`,
      accent: 'emerald' as const,
      route: '/admin',
    },
    {
      label: 'Backend Records',
      value: formatNumber(allRecords.length),
      helper: 'All module records',
      accent: 'blue' as const,
      route: '/operations',
    },
    {
      label: 'Inventory Value',
      value: formatCurrency(inventory.data?.total_inventory_value),
      helper: `${formatNumber(analytics.data?.inventory_total_quantity)} units tracked`,
      accent: 'amber' as const,
      route: '/inventory',
    },
    {
      label: 'Open Approvals',
      value: formatNumber(admin.data?.open_approvals ?? admin.data?.pending_actions),
      helper: 'Waiting for action',
      accent: 'violet' as const,
      route: '/admin',
    },
    {
      label: 'Active Integrations',
      value: formatNumber(connectedSystems.length || admin.data?.integrations),
      helper: 'ERP, files, APIs, SFTP',
      accent: 'blue' as const,
      route: '/data-hub',
    },
  ];

  const operationalStatus = [
    { area: 'Production', status: 'Backend', value: productionScore, route: '/production' },
    { area: 'Maintenance', status: 'Backend', value: maintenanceScore, route: '/maintenance' },
    { area: 'Quality', status: 'Backend', value: qualityScore, route: '/quality' },
    { area: 'Procurement', status: 'Backend', value: procurementScore, route: '/procurement' },
    { area: 'Inventory', status: 'Backend', value: inventoryScore, route: '/inventory' },
  ];

  const notifications = [
    ...lowStockItems.slice(0, 2).map((item) => ({
      title: `${item.name} is low stock`,
      owner: item.record_code,
      status: 'Review',
      route: '/inventory',
    })),
    {
      title: `${formatNumber(admin.data?.pending_actions)} pending admin actions`,
      owner: 'Admin workflow',
      status: (admin.data?.pending_actions ?? 0) > 0 ? 'Pending' : 'Closed',
      route: '/admin',
    },
    {
      title: `${formatNumber(fileUploads.length)} DataHub uploads available`,
      owner: 'DataHub',
      status: fileUploads.length ? 'Ready' : 'Open',
      route: '/data-hub',
    },
  ];

  const widgetRows = Object.entries(moduleCounts).map(([module, count]) => ({
    widget: `${toTitle(module)} Workspace`,
    owner: user.role.replace('_', ' '),
    records: count,
    status: count > 0 ? 'Enabled' : 'Empty',
    route: moduleRoute(module),
  }));

  return (
    <>
      <PageHeader
        eyebrow="Executive Dashboard"
        title="Operations overview"
        description="Phase 1 operational dashboard focused on management visibility, approvals, notifications, integrations, and module status."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge status="Operational" />
        <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-slate-300">
          {user.role.replace('_', ' ')}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {dashboardMetrics.map((metric) => (
          <StatCard key={metric.label} label={metric.label} value={metric.value} helper={metric.helper} accent={metric.accent} onClick={() => navigate(metric.route)} />
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <Panel title="Operational Status" description="High-level operational health across core business functions.">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={operationalStatus}>
                <XAxis dataKey="area" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="value" fill="#22d3ee" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Open Notifications" description="Operational items that require review or action.">
          <div className="space-y-3">
            {notifications.map((item) => (
              <button key={item.title} className="w-full rounded-xl border border-white/10 bg-slate-950/25 p-3 text-left transition hover:border-cyan-300/30 hover:bg-slate-900/50" onClick={() => navigate(item.route)}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{item.owner}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              </button>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Production Status" value={`${productionScore}%`} helper="Open production workspace" icon={<PackageCheck className="h-5 w-5" />} accent="blue" onClick={() => navigate('/production')} />
        <StatCard label="Quality Status" value={`${qualityScore}%`} helper="Open quality workspace" icon={<CheckCircle2 className="h-5 w-5" />} accent="emerald" onClick={() => navigate('/quality')} />
        <StatCard label="Procurement Status" value={`${procurementScore}%`} helper="Open procurement workspace" icon={<ShoppingCart className="h-5 w-5" />} accent="amber" onClick={() => navigate('/procurement')} />
        <StatCard label="Inventory Status" value={`${inventoryScore}%`} helper="Open inventory workspace" icon={<Boxes className="h-5 w-5" />} accent="violet" onClick={() => navigate('/inventory')} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Panel title="Configurable Widgets" description="Dashboard blocks that can be enabled, disabled, or assigned by administrator roles.">
          <DataTable
            rows={widgetRows}
            emptyTitle="No widgets configured"
            columns={[
              { key: 'widget', label: 'Widget' },
              { key: 'owner', label: 'Owner' },
              { key: 'records', label: 'Records' },
              { key: 'status', label: 'Status', render: (value) => <StatusBadge status={String(value)} /> },
              {
                key: 'route',
                label: 'Open',
                render: (value) => (
                  <button className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100 hover:bg-cyan-400/20" onClick={() => navigate(String(value))}>
                    View
                  </button>
                ),
              },
            ]}
          />
        </Panel>

        <Panel title="Integration Snapshot" description="ERP, database, upload, REST API, and SFTP connection overview.">
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard label="ERP Systems" value={formatNumber(connectedSystems.filter((system) => system.system_type.toLowerCase().includes('erp')).length)} helper="Open Data Hub connections" icon={<Link2 className="h-5 w-5" />} onClick={() => navigate('/data-hub')} />
            <StatCard label="File Uploads" value={formatNumber(fileUploads.length)} helper="Open upload center" icon={<Activity className="h-5 w-5" />} accent="emerald" onClick={() => navigate('/data-hub')} />
            <StatCard label="Open Alerts" value={formatNumber((admin.data?.pending_actions ?? 0) + (analytics.data?.inventory_low_stock_count ?? 0))} helper="Open admin and inventory queues" icon={<Bell className="h-5 w-5" />} accent="amber" onClick={() => navigate('/admin')} />
            <StatCard label="REST APIs" value={formatNumber(connectedSystems.filter((system) => system.system_type.toLowerCase().includes('api')).length)} helper="Open Data Hub integrations" icon={<Link2 className="h-5 w-5" />} accent="violet" onClick={() => navigate('/data-hub')} />
          </div>
        </Panel>
      </div>
    </>
  );
}
