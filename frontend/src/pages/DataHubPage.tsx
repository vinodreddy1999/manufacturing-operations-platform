import { useQueries } from '@tanstack/react-query';
import { Database, Gauge, RadioTower } from 'lucide-react';

import { DataTable } from '../components/DataTable';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { Panel } from '../components/Panel';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { formatNumber } from '../lib/format';
import { backend } from '../services/api';
import type { ConnectedSystem } from '../types';

export function DataHubPage() {
  const [systems, quality, readiness] = useQueries({
    queries: [
      { queryKey: ['connected-systems'], queryFn: backend.connectedSystems },
      { queryKey: ['data-quality'], queryFn: backend.dataQuality },
      { queryKey: ['ai-readiness'], queryFn: backend.aiReadiness },
    ],
  });

  if ([systems, quality, readiness].some((query) => query.isLoading)) {
    return <LoadingState label="Loading Manufacturing Data Hub responses" />;
  }

  const firstError = [systems, quality, readiness].find((query) => query.isError)?.error;
  if (firstError) {
    return <ErrorState error={firstError} title="Manufacturing Data Hub integration failed" />;
  }

  const rows = (systems.data ?? []) as Array<ConnectedSystem & Record<string, unknown>>;

  return (
    <>
      <PageHeader
        eyebrow="Manufacturing Data Hub"
        title="Connected Systems, Quality, and AI Readiness"
        description="This view reads connected systems, data quality, and AI readiness directly from backend Data Hub endpoints."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Connected Systems" value={systems.data?.length ?? 0} helper="ERP, PLC, MES, IoT-ready" icon={<Database className="h-5 w-5" />} />
        <StatCard label="Data Quality" value={`${quality.data?.overall_score ?? 0}%`} helper="Accuracy, completeness, consistency, timeliness" icon={<Gauge className="h-5 w-5" />} />
        <StatCard label="AI Readiness" value={`${readiness.data?.overall_ai_readiness ?? 0}%`} helper="Domain-level readiness center" icon={<RadioTower className="h-5 w-5" />} />
      </div>

      <div className="mt-6">
        <Panel title="Connected Systems" description="Returned by /manufacturing-data-hub/connected-systems.">
          <DataTable
            rows={rows}
            emptyTitle="No systems connected"
            columns={[
              { key: 'system_name', label: 'System' },
              { key: 'system_type', label: 'Type' },
              { key: 'connection_status', label: 'Status', render: (value) => <StatusBadge status={String(value)} /> },
              { key: 'health_score', label: 'Health', render: (value) => `${formatNumber(Number(value))}%` },
              { key: 'record_count', label: 'Records', render: (value) => formatNumber(Number(value)) },
            ]}
          />
        </Panel>
      </div>
    </>
  );
}
