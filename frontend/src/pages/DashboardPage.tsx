import { useQueries } from '@tanstack/react-query';
import { BarChart3, Boxes, Factory, ShieldCheck, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { Panel } from '../components/Panel';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { formatCurrency, formatNumber } from '../lib/format';
import { backend } from '../services/api';

export function DashboardPage() {
  const [health, admin, inventory, quality, readiness] = useQueries({
    queries: [
      { queryKey: ['health'], queryFn: backend.health },
      { queryKey: ['admin-dashboard'], queryFn: backend.adminDashboard },
      { queryKey: ['inventory-dashboard'], queryFn: backend.inventoryDashboard },
      { queryKey: ['data-quality'], queryFn: backend.dataQuality },
      { queryKey: ['ai-readiness'], queryFn: backend.aiReadiness },
    ],
  });

  if ([health, admin, inventory, quality, readiness].some((query) => query.isLoading)) {
    return <LoadingState label="Loading platform dashboard from backend APIs" />;
  }

  const firstError = [health, admin, inventory, quality, readiness].find((query) => query.isError)?.error;
  if (firstError) {
    return <ErrorState error={firstError} title="Dashboard API integration failed" />;
  }

  const readinessRows = readiness.data?.readiness ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Live Backend Dashboard"
        title="Manufacturing Operations Overview"
        description="This dashboard is rendered from the existing FastAPI backend. No frontend mock data is used."
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <StatusBadge status={health.data?.status ?? 'unknown'} />
        <span className="text-sm text-muted-foreground">{health.data?.service}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active Users" value={formatNumber(admin.data?.active_users)} helper={`${formatNumber(admin.data?.user_count)} total users`} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Inventory Value" value={formatCurrency(inventory.data?.total_inventory_value)} helper="From /inventory/dashboard" icon={<Boxes className="h-5 w-5" />} />
        <StatCard label="Data Quality" value={`${quality.data?.overall_score ?? 0}%`} helper="Manufacturing Data Hub score" icon={<ShieldCheck className="h-5 w-5" />} />
        <StatCard label="AI Readiness" value={`${readiness.data?.overall_ai_readiness ?? 0}%`} helper="Readiness center aggregate" icon={<BarChart3 className="h-5 w-5" />} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Panel title="AI Readiness by Domain" description="Scores returned by /manufacturing-data-hub/ai-readiness.">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={readinessRows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="area" tick={{ fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={70} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Operational Footprint" description="Admin dashboard metrics from the backend contract.">
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard label="Plants" value={formatNumber(admin.data?.plants)} icon={<Factory className="h-5 w-5" />} />
            <StatCard label="Warehouses" value={formatNumber(admin.data?.warehouses)} />
            <StatCard label="Integrations" value={formatNumber(admin.data?.integrations)} />
            <StatCard label="Open Approvals" value={formatNumber(admin.data?.open_approvals)} />
          </div>
        </Panel>
      </div>
    </>
  );
}
