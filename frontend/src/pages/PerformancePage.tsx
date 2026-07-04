import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { DataTable } from '../components/DataTable';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { Panel } from '../components/Panel';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { collectNavigationMetrics } from '../lib/performance';
import { backend } from '../services/api';

export function PerformancePage() {
  const summary = useQuery({
    queryKey: ['performance-summary'],
    queryFn: backend.performanceSummary,
    refetchInterval: 30_000,
  });
  const pageMetrics = useMemo(() => collectNavigationMetrics(), []);

  if (summary.isLoading) return <LoadingState label="Loading performance dashboard on demand" />;
  if (summary.isError || !summary.data) return <ErrorState title="Performance data unavailable" error={summary.error ?? 'The performance endpoint did not respond.'} />;

  const data = summary.data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Performance"
        title="Application Performance Center"
        description="Lazy loading, API latency, database readiness, bundle budget, and recent slow-path indicators."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="API Requests" value={data.api.requests.toLocaleString()} helper="Observed by backend middleware" />
        <StatCard label="Avg API Latency" value={`${data.api.average_latency_ms} ms`} helper="Across observed requests" />
        <StatCard label="Error Rate" value={`${(data.api.error_rate * 100).toFixed(2)}%`} helper="5xx responses" />
        <StatCard label="Bundle Budget" value={`${data.frontend.bundle_budget_kb} KB`} helper="Route chunks load on demand" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Slowest API Paths" description="Backend paths sorted by average latency. Use this to find endpoints that need pagination, caching, or query tuning.">
          <DataTable
            rows={data.api.slowest_paths}
            emptyTitle="No API traffic yet"
            columns={[
              { key: 'path', label: 'Path' },
              { key: 'average_latency_ms', label: 'Avg ms' },
              { key: 'count', label: 'Count' },
              { key: 'errors', label: 'Errors' },
            ]}
          />
        </Panel>

        <Panel title="Frontend Page Metrics" description="Navigation timing captured in the browser for the current page session.">
          <div className="space-y-3">
            {pageMetrics.map((metric) => (
              <div key={metric.name} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <div>
                  <p className="font-semibold text-white">{metric.name}</p>
                  <p className="text-sm text-slate-400">{metric.value} ms</p>
                </div>
                <StatusBadge status={metric.rating} />
              </div>
            ))}
            {!pageMetrics.length ? <p className="text-sm text-slate-400">Navigation timing is not available in this browser session.</p> : null}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Panel title="Lazy Loading" description={data.frontend.lazy_loading}>
          <StatusBadge status={data.frontend.route_chunks} />
        </Panel>
        <Panel title="Database Optimization" description={data.database.query_mode}>
          <div className="flex flex-wrap gap-2">
            {data.database.index_strategy.map((item) => <StatusBadge key={item} status={item} />)}
          </div>
        </Panel>
        <Panel title="Background Processing" description={data.jobs.background_workers}>
          <StatusBadge status={data.jobs.queue_status} />
        </Panel>
      </div>
    </div>
  );
}
