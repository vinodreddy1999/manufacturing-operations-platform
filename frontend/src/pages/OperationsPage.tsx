import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Boxes, Factory, ShieldCheck, Trash2, Wrench } from 'lucide-react';

import { DataTable } from '../components/DataTable';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { Panel } from '../components/Panel';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { formatCurrency, formatNumber } from '../lib/format';
import { canWriteOperationalData } from '../lib/rbac';
import { backend } from '../services/api';
import type { ModuleRecord, RuntimeUser } from '../types';

export function OperationsPage({ user }: { user: RuntimeUser }) {
  const queryClient = useQueryClient();
  const [newRecord, setNewRecord] = useState({
    module_key: 'inventory',
    record_type: 'raw_material',
    record_code: '',
    name: '',
    status: 'AVAILABLE',
    quantity: 0,
    payload: { uom: 'ea', reorder_level: 10, warehouse: 'WH-A', bin: 'A-01-01' } as Record<string, unknown>,
  });
  const [selectedModule, setSelectedModule] = useState('inventory');
  const [inventory, modules, records, analytics, companies, featureFlags] = useQueries({
    queries: [
      { queryKey: ['inventory-dashboard'], queryFn: backend.inventoryDashboard },
      { queryKey: ['modules'], queryFn: backend.modules },
      { queryKey: ['runtime-records'], queryFn: () => backend.records() },
      { queryKey: ['runtime-analytics'], queryFn: backend.analytics },
      { queryKey: ['companies'], queryFn: backend.companies },
      { queryKey: ['feature-flags'], queryFn: backend.featureFlags },
    ],
  });
  const createRecord = useMutation({
    mutationFn: backend.createRecord,
    onSuccess: () => {
      setNewRecord({ ...newRecord, record_code: '', name: '', quantity: 0 });
      queryClient.invalidateQueries({ queryKey: ['runtime-records'] });
      queryClient.invalidateQueries({ queryKey: ['runtime-analytics'] });
    },
  });
  const updateRecord = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Omit<ModuleRecord, 'id' | 'created_at'>> }) => backend.updateRecord(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['runtime-records'] });
      queryClient.invalidateQueries({ queryKey: ['runtime-analytics'] });
    },
  });
  const deleteRecord = useMutation({
    mutationFn: backend.deleteRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['runtime-records'] });
      queryClient.invalidateQueries({ queryKey: ['runtime-analytics'] });
    },
  });
  const chartRows = useMemo(
    () => Object.entries(analytics.data?.module_record_counts ?? {}).map(([module, count]) => ({ module, count })),
    [analytics.data?.module_record_counts],
  );
  const moduleOptions = useMemo(
    () => (modules.data ?? []).map((module) => ({ key: module.key.toLowerCase(), label: module.label ?? module.key })),
    [modules.data],
  );
  const selectedModuleLabel = moduleOptions.find((module) => module.key === selectedModule)?.label ?? selectedModule.toUpperCase();
  const companyNameById = useMemo(
    () => new Map((companies.data ?? []).map((company) => [company.id, company.name])),
    [companies.data],
  );
  const moduleAllocationRows = useMemo(() => {
    const flags = featureFlags.data ?? [];
    return (companies.data ?? []).map((company) => {
      const flag = flags.find((item) => item.company_id === company.id && item.module_key.toLowerCase() === selectedModule);
      return {
        company_id: company.id,
        company_name: company.name,
        company_code: company.code,
        module_key: selectedModule,
        allocation: flag?.enabled ? 'Enabled' : 'Disabled',
      };
    });
  }, [companies.data, featureFlags.data, selectedModule]);
  const allocatedCompanies = moduleAllocationRows.filter((row) => row.allocation === 'Enabled');
  const canWrite = canWriteOperationalData(user);

  if ([inventory, modules, records, analytics, companies, featureFlags].some((query) => query.isLoading)) {
    return <LoadingState label="Loading operations data from backend APIs" />;
  }

  const firstError = [inventory, modules, records, analytics, companies, featureFlags].find((query) => query.isError)?.error;
  if (firstError) {
    return <ErrorState error={firstError} title="Operations API integration failed" />;
  }

  function submitRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createRecord.mutate(newRecord);
  }

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Operational Modules"
        description="A live frontend shell over the backend source of truth. Each card uses available backend module or dashboard responses."
      />

      {!canWrite ? (
        <div className="mb-6 rounded-[24px] border border-sky-200/70 bg-sky-50/90 px-4 py-3 text-sm text-sky-900 shadow-panel">
          Your role is active in read-only mode. You can inspect live operational data, but write actions are intentionally disabled.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Inventory Value" value={formatCurrency(inventory.data?.total_inventory_value)} helper="Inventory dashboard" icon={<Boxes className="h-5 w-5" />} />
        <StatCard label="Backend Modules" value={formatNumber(modules.data?.length)} helper="Registered module list" icon={<Factory className="h-5 w-5" />} />
        <StatCard label="Low Stock Risks" value={formatNumber(analytics.data?.inventory_low_stock_count ?? inventory.data?.low_stock_risks?.length)} helper="Database analytics" icon={<ShieldCheck className="h-5 w-5" />} />
        <StatCard label="Maintenance Ready" value="Active" helper="Maintenance APIs mounted" icon={<Wrench className="h-5 w-5" />} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <Panel title="Create Operational Record" description="Writes to the shared backend database and immediately updates analytics.">
          <form className="grid gap-3 md:grid-cols-2" onSubmit={submitRecord}>
            <select className="rounded-md border border-border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60" value={newRecord.module_key} onChange={(event) => setNewRecord({ ...newRecord, module_key: event.target.value })} disabled={!canWrite}>
              <option value="inventory">Inventory</option>
              <option value="production">Production</option>
              <option value="maintenance">Maintenance</option>
              <option value="quality">Quality</option>
              <option value="procurement">Procurement</option>
            </select>
            <input className="rounded-md border border-border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60" placeholder="Record type" value={newRecord.record_type} onChange={(event) => setNewRecord({ ...newRecord, record_type: event.target.value })} required disabled={!canWrite} />
            <input className="rounded-md border border-border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60" placeholder="Code" value={newRecord.record_code} onChange={(event) => setNewRecord({ ...newRecord, record_code: event.target.value })} required disabled={!canWrite} />
            <input className="rounded-md border border-border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60" placeholder="Name" value={newRecord.name} onChange={(event) => setNewRecord({ ...newRecord, name: event.target.value })} required disabled={!canWrite} />
            <select className="rounded-md border border-border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60" value={newRecord.status} onChange={(event) => setNewRecord({ ...newRecord, status: event.target.value })} disabled={!canWrite}>
              <option value="AVAILABLE">Available</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="QUARANTINE">Quarantine</option>
              <option value="OPEN">Open</option>
              <option value="SCHEDULED">Scheduled</option>
            </select>
            <input className="rounded-md border border-border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60" type="number" value={newRecord.quantity} onChange={(event) => setNewRecord({ ...newRecord, quantity: Number(event.target.value) })} disabled={!canWrite} />
            <button className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60 md:col-span-2" disabled={createRecord.isPending || !canWrite}>
              {canWrite ? (createRecord.isPending ? 'Creating...' : 'Create Record') : 'Read-only role'}
            </button>
          </form>
        </Panel>

        <Panel title="Live Module Record Counts" description="Visualization generated from /runtime/analytics/summary.">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartRows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="module" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Database Records" description="Full read/write operational records across modules.">
          <DataTable
            rows={records.data ?? []}
            emptyTitle="No database records"
            columns={[
              { key: 'module_key', label: 'Module' },
              { key: 'record_code', label: 'Code' },
              { key: 'name', label: 'Name' },
              { key: 'quantity', label: 'Quantity', render: (value, row) => (
                <input className="w-24 rounded-md border border-border px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-60" type="number" value={Number(value ?? 0)} onChange={(event) => updateRecord.mutate({ id: String(row.id), payload: { quantity: Number(event.target.value) } })} disabled={!canWrite} />
              ) },
              { key: 'status', label: 'Status', render: (value, row) => (
                <select className="rounded-md border border-border px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-60" value={String(value)} onChange={(event) => updateRecord.mutate({ id: String(row.id), payload: { status: event.target.value } })} disabled={!canWrite}>
                  <option value="AVAILABLE">Available</option>
                  <option value="LOW_STOCK">Low Stock</option>
                  <option value="QUARANTINE">Quarantine</option>
                  <option value="OPEN">Open</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="CLOSED">Closed</option>
                </select>
              ) },
              { key: 'record_type', label: 'Type', render: (value) => <StatusBadge status={String(value)} /> },
              { key: 'id', label: 'Action', render: (value) => (
                <button className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60" onClick={() => deleteRecord.mutate(String(value))} disabled={!canWrite}>
                  <Trash2 className="mr-1 inline h-3 w-3" />
                  {canWrite ? 'Delete' : 'Locked'}
                </button>
              ) },
            ]}
          />
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Registered Backend Modules" description="Select a module to see which companies have it allocated from live /feature-flags data.">
          <div className="mb-4 grid gap-3 md:grid-cols-[minmax(240px,360px)_1fr]">
            <label className="block text-sm font-medium text-slate-700">
              Module
              <select className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm" value={selectedModule} onChange={(event) => setSelectedModule(event.target.value)}>
                {moduleOptions.map((module) => (
                  <option key={module.key} value={module.key}>
                    {module.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="rounded-md border border-border bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <p className="font-semibold text-foreground">{selectedModuleLabel}</p>
              <p className="text-xs text-muted-foreground">
                Allocated to {allocatedCompanies.length} of {companies.data?.length ?? 0} companies:
                {' '}
                {allocatedCompanies.map((company) => companyNameById.get(company.company_id) ?? company.company_id).join(', ') || 'none'}
              </p>
            </div>
          </div>
          <DataTable
            rows={moduleAllocationRows}
            emptyTitle="No company allocations"
            columns={[
              { key: 'company_name', label: 'Company' },
              { key: 'company_code', label: 'Code' },
              { key: 'module_key', label: 'Selected Module' },
              { key: 'allocation', label: 'Allocation', render: (value) => <StatusBadge status={String(value)} /> },
            ]}
          />
        </Panel>
      </div>
    </>
  );
}
