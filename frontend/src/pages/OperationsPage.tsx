import { useQueries } from '@tanstack/react-query';
import { Boxes, Factory, ShieldCheck, Wrench } from 'lucide-react';

import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { Panel } from '../components/Panel';
import { StatCard } from '../components/StatCard';
import { formatCurrency, formatNumber } from '../lib/format';
import { backend } from '../services/api';

export function OperationsPage() {
  const [inventory, modules] = useQueries({
    queries: [
      { queryKey: ['inventory-dashboard'], queryFn: backend.inventoryDashboard },
      { queryKey: ['modules'], queryFn: backend.modules },
    ],
  });

  if ([inventory, modules].some((query) => query.isLoading)) {
    return <LoadingState label="Loading operations data from backend APIs" />;
  }

  const firstError = [inventory, modules].find((query) => query.isError)?.error;
  if (firstError) {
    return <ErrorState error={firstError} title="Operations API integration failed" />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Operational Modules"
        description="A live frontend shell over the backend source of truth. Each card uses available backend module or dashboard responses."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Inventory Value" value={formatCurrency(inventory.data?.total_inventory_value)} helper="Inventory dashboard" icon={<Boxes className="h-5 w-5" />} />
        <StatCard label="Backend Modules" value={formatNumber(modules.data?.length)} helper="Registered module list" icon={<Factory className="h-5 w-5" />} />
        <StatCard label="Low Stock Risks" value={formatNumber(inventory.data?.low_stock_risks?.length)} helper="Inventory risk signal" icon={<ShieldCheck className="h-5 w-5" />} />
        <StatCard label="Maintenance Ready" value="Active" helper="Maintenance APIs mounted" icon={<Wrench className="h-5 w-5" />} />
      </div>

      <div className="mt-6">
        <Panel title="Registered Backend Modules" description="Rendered from /modules.">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(modules.data ?? []).map((module) => (
              <div key={module.key} className="rounded-md border border-border bg-white px-3 py-2 text-sm">
                <p className="font-medium text-foreground">{module.label ?? module.key}</p>
                <p className="text-xs text-muted-foreground">{module.key}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
