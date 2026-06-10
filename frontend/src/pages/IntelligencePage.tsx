import { useQuery } from '@tanstack/react-query';
import { BrainCircuit, CircleDollarSign, Route, Users } from 'lucide-react';

import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { Panel } from '../components/Panel';
import { StatCard } from '../components/StatCard';
import { formatCurrency, formatNumber } from '../lib/format';
import { backend } from '../services/api';

export function IntelligencePage() {
  const command = useQuery({
    queryKey: ['manufacturing-intelligence-command-center'],
    queryFn: backend.commandCenter,
  });

  if (command.isLoading) {
    return <LoadingState label="Loading Manufacturing Intelligence command center" />;
  }

  if (command.isError) {
    return <ErrorState error={command.error} title="Manufacturing Intelligence integration failed" />;
  }

  const costImpact = command.data?.cost_impact as { total_estimated_impact?: number } | undefined;
  const customerImpact = Array.isArray(command.data?.customer_impact) ? command.data.customer_impact : [];

  return (
    <>
      <PageHeader
        eyebrow="AI Command Center"
        title="Manufacturing Intelligence"
        description="Cross-module risk, impact, and recommendation data from /manufacturing-intelligence/command-center."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Operational Risks" value={formatNumber(command.data?.top_operational_risks?.length)} helper="Cross-module risks" icon={<BrainCircuit className="h-5 w-5" />} />
        <StatCard label="Customer Impacts" value={formatNumber(customerImpact.length)} helper="Sales/customer risk links" icon={<Users className="h-5 w-5" />} />
        <StatCard label="Cost Impact" value={formatCurrency(costImpact?.total_estimated_impact)} helper="Estimated financial exposure" icon={<CircleDollarSign className="h-5 w-5" />} />
        <StatCard label="Recommendations" value={formatNumber(command.data?.recommendations?.length)} helper="Draft-only actions" icon={<Route className="h-5 w-5" />} />
      </div>

      <div className="mt-6">
        <Panel title="Command Center Payload" description="Raw backend response preview for traceability.">
          <pre className="max-h-[460px] overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-5 text-slate-100">
            {JSON.stringify(command.data, null, 2)}
          </pre>
        </Panel>
      </div>
    </>
  );
}
