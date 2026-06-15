import { FormEvent, useState } from 'react';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { Cable, Database, Gauge, RadioTower, Trash2 } from 'lucide-react';

import { DataTable } from '../components/DataTable';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { Panel } from '../components/Panel';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { canManagePlatform } from '../lib/rbac';
import { backend } from '../services/api';
import type { ConnectedSystem, DataCatalogEntry, DataMappingRule, RuntimeUser } from '../types';

export function DataHubPage({ user }: { user: RuntimeUser }) {
  const queryClient = useQueryClient();
  const [newConnection, setNewConnection] = useState<Omit<ConnectedSystem, 'id'>>({
    company_id: user.company_id ?? undefined,
    system_name: '',
    system_type: 'ERP',
    connection_status: 'Healthy',
    last_sync: '2026-06-15T09:00:00Z',
    health_score: 90,
    record_count: 0,
  });
  const [newCatalogEntry, setNewCatalogEntry] = useState<Omit<DataCatalogEntry, 'id'>>({
    company_id: user.company_id ?? undefined,
    data_type: '',
    source_system: '',
    owner: '',
    ai_ready: true,
    quality_score: 90,
    lineage: {},
  });
  const [newMapping, setNewMapping] = useState<Omit<DataMappingRule, 'id'>>({
    company_id: user.company_id ?? undefined,
    source_system: '',
    source_field: '',
    target_entity: '',
    target_field: '',
    transform_rule: 'trim_uppercase',
    confidence: 0.95,
  });
  const [systems, quality, readiness, catalog, mappings] = useQueries({
    queries: [
      { queryKey: ['connected-systems'], queryFn: backend.connectedSystems },
      { queryKey: ['data-quality'], queryFn: backend.dataQuality },
      { queryKey: ['ai-readiness'], queryFn: backend.aiReadiness },
      { queryKey: ['data-catalog'], queryFn: backend.dataCatalog },
      { queryKey: ['data-mappings'], queryFn: backend.dataMappings },
    ],
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['connected-systems'] });
    queryClient.invalidateQueries({ queryKey: ['data-quality'] });
    queryClient.invalidateQueries({ queryKey: ['ai-readiness'] });
    queryClient.invalidateQueries({ queryKey: ['data-catalog'] });
    queryClient.invalidateQueries({ queryKey: ['data-mappings'] });
  };

  const createConnection = useMutation({
    mutationFn: backend.createConnectedSystem,
    onSuccess: () => {
      setNewConnection({
        company_id: user.company_id ?? undefined,
        system_name: '',
        system_type: 'ERP',
        connection_status: 'Healthy',
        last_sync: '2026-06-15T09:00:00Z',
        health_score: 90,
        record_count: 0,
      });
      invalidate();
    },
  });
  const updateConnection = useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Omit<ConnectedSystem, 'id'> }) => backend.updateConnectedSystem(id, payload), onSuccess: invalidate });
  const deleteConnection = useMutation({ mutationFn: backend.deleteConnectedSystem, onSuccess: invalidate });

  const createCatalog = useMutation({
    mutationFn: backend.createDataCatalogEntry,
    onSuccess: () => {
      setNewCatalogEntry({
        company_id: user.company_id ?? undefined,
        data_type: '',
        source_system: '',
        owner: '',
        ai_ready: true,
        quality_score: 90,
        lineage: {},
      });
      invalidate();
    },
  });
  const updateCatalog = useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Omit<DataCatalogEntry, 'id'> }) => backend.updateDataCatalogEntry(id, payload), onSuccess: invalidate });
  const deleteCatalog = useMutation({ mutationFn: backend.deleteDataCatalogEntry, onSuccess: invalidate });

  const createMapping = useMutation({
    mutationFn: backend.createDataMapping,
    onSuccess: () => {
      setNewMapping({
        company_id: user.company_id ?? undefined,
        source_system: '',
        source_field: '',
        target_entity: '',
        target_field: '',
        transform_rule: 'trim_uppercase',
        confidence: 0.95,
      });
      invalidate();
    },
  });
  const updateMapping = useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Omit<DataMappingRule, 'id'> }) => backend.updateDataMapping(id, payload), onSuccess: invalidate });
  const deleteMapping = useMutation({ mutationFn: backend.deleteDataMapping, onSuccess: invalidate });

  if ([systems, quality, readiness, catalog, mappings].some((query) => query.isLoading)) {
    return <LoadingState label="Loading company-scoped Manufacturing Data Hub responses" />;
  }

  const firstError = [systems, quality, readiness, catalog, mappings].find((query) => query.isError)?.error;
  if (firstError) {
    return <ErrorState error={firstError} title="Manufacturing Data Hub integration failed" />;
  }

  if (!canManagePlatform(user)) {
    return <ErrorState error={new Error('This workspace is reserved for platform administrators.')} title="DataHub is restricted to admin roles" />;
  }

  const rows = systems.data ?? [];
  const catalogRows = catalog.data ?? [];
  const mappingRows = mappings.data ?? [];

  function submitConnection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createConnection.mutate(newConnection);
  }

  function submitCatalog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createCatalog.mutate(newCatalogEntry);
  }

  function submitMapping(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createMapping.mutate(newMapping);
  }

  return (
    <>
      <PageHeader
        eyebrow="Manufacturing Data Hub"
        title="Admin-only integration and metadata control"
        description={`This workspace is restricted to platform admins. Every record shown here is fetched from live, company-scoped backend metadata for ${user.company_id ?? 'your company'}.`}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Connected Systems" value={rows.length} helper="Persisted company integrations" icon={<Database className="h-5 w-5" />} />
        <StatCard label="Data Quality" value={`${quality.data?.overall_score ?? 0}%`} helper="Computed from company catalog entries" icon={<Gauge className="h-5 w-5" />} />
        <StatCard label="AI Readiness" value={`${readiness.data?.overall_ai_readiness ?? 0}%`} helper="Only from this company's metadata" icon={<RadioTower className="h-5 w-5" />} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Panel title="Connected Systems" description="Admins can create, edit, and delete only their own company connections.">
          <form className="mb-4 grid gap-3 md:grid-cols-2" onSubmit={submitConnection}>
            <input className="rounded-md border border-border px-3 py-2 text-sm" placeholder="System name" value={newConnection.system_name} onChange={(event) => setNewConnection({ ...newConnection, system_name: event.target.value })} required />
            <input className="rounded-md border border-border px-3 py-2 text-sm" placeholder="System type" value={newConnection.system_type} onChange={(event) => setNewConnection({ ...newConnection, system_type: event.target.value })} required />
            <input className="rounded-md border border-border px-3 py-2 text-sm" placeholder="Status" value={newConnection.connection_status} onChange={(event) => setNewConnection({ ...newConnection, connection_status: event.target.value })} required />
            <input className="rounded-md border border-border px-3 py-2 text-sm" placeholder="Last sync" value={newConnection.last_sync} onChange={(event) => setNewConnection({ ...newConnection, last_sync: event.target.value })} required />
            <input className="rounded-md border border-border px-3 py-2 text-sm" type="number" placeholder="Health score" value={newConnection.health_score} onChange={(event) => setNewConnection({ ...newConnection, health_score: Number(event.target.value) })} required />
            <input className="rounded-md border border-border px-3 py-2 text-sm" type="number" placeholder="Record count" value={newConnection.record_count} onChange={(event) => setNewConnection({ ...newConnection, record_count: Number(event.target.value) })} required />
            <button className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60 md:col-span-2" disabled={createConnection.isPending}>
              {createConnection.isPending ? 'Saving...' : 'Add Connected System'}
            </button>
          </form>
          <DataTable
            rows={rows as Array<ConnectedSystem & Record<string, unknown>>}
            emptyTitle="No systems connected"
            columns={[
              { key: 'system_name', label: 'System' },
              { key: 'system_type', label: 'Type' },
              { key: 'connection_status', label: 'Status', render: (value, row) => <input className="w-28 rounded-md border border-border px-2 py-1 text-xs" value={String(value)} onChange={(event) => updateConnection.mutate({ id: String(row.id), payload: { ...(row as ConnectedSystem), company_id: row.company_id, connection_status: event.target.value } })} /> },
              { key: 'health_score', label: 'Health', render: (value, row) => <input className="w-20 rounded-md border border-border px-2 py-1 text-xs" type="number" value={Number(value)} onChange={(event) => updateConnection.mutate({ id: String(row.id), payload: { ...(row as ConnectedSystem), company_id: row.company_id, health_score: Number(event.target.value) } })} /> },
              { key: 'id', label: 'Action', render: (value) => <button className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50" onClick={() => deleteConnection.mutate(String(value))}><Trash2 className="mr-1 inline h-3 w-3" />Delete</button> },
            ]}
          />
        </Panel>

        <Panel title="Data Catalog" description="Catalog quality drives the company AI readiness score.">
          <form className="mb-4 grid gap-3 md:grid-cols-2" onSubmit={submitCatalog}>
            <input className="rounded-md border border-border px-3 py-2 text-sm" placeholder="Data type" value={newCatalogEntry.data_type} onChange={(event) => setNewCatalogEntry({ ...newCatalogEntry, data_type: event.target.value })} required />
            <input className="rounded-md border border-border px-3 py-2 text-sm" placeholder="Source system" value={newCatalogEntry.source_system} onChange={(event) => setNewCatalogEntry({ ...newCatalogEntry, source_system: event.target.value })} required />
            <input className="rounded-md border border-border px-3 py-2 text-sm" placeholder="Owner" value={newCatalogEntry.owner} onChange={(event) => setNewCatalogEntry({ ...newCatalogEntry, owner: event.target.value })} required />
            <input className="rounded-md border border-border px-3 py-2 text-sm" type="number" placeholder="Quality score" value={newCatalogEntry.quality_score} onChange={(event) => setNewCatalogEntry({ ...newCatalogEntry, quality_score: Number(event.target.value) })} required />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={newCatalogEntry.ai_ready} onChange={(event) => setNewCatalogEntry({ ...newCatalogEntry, ai_ready: event.target.checked })} />
              AI ready
            </label>
            <button className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60" disabled={createCatalog.isPending}>
              {createCatalog.isPending ? 'Saving...' : 'Add Catalog Entry'}
            </button>
          </form>
          <DataTable
            rows={catalogRows as Array<DataCatalogEntry & Record<string, unknown>>}
            emptyTitle="No catalog entries"
            columns={[
              { key: 'data_type', label: 'Data Type' },
              { key: 'source_system', label: 'Source' },
              { key: 'owner', label: 'Owner' },
              { key: 'quality_score', label: 'Quality', render: (value, row) => <input className="w-20 rounded-md border border-border px-2 py-1 text-xs" type="number" value={Number(value)} onChange={(event) => updateCatalog.mutate({ id: String(row.id), payload: { ...(row as DataCatalogEntry), company_id: row.company_id, quality_score: Number(event.target.value) } })} /> },
              { key: 'ai_ready', label: 'AI Ready', render: (value, row) => <button className="rounded-md border border-border px-2 py-1 text-xs" onClick={() => updateCatalog.mutate({ id: String(row.id), payload: { ...(row as DataCatalogEntry), company_id: row.company_id, ai_ready: !value } })}>{value ? 'Enabled' : 'Disabled'}</button> },
              { key: 'id', label: 'Action', render: (value) => <button className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50" onClick={() => deleteCatalog.mutate(String(value))}><Trash2 className="mr-1 inline h-3 w-3" />Delete</button> },
            ]}
          />
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Mapping Studio" description="These rules stay isolated per company and are editable only by admin users.">
          <form className="mb-4 grid gap-3 md:grid-cols-3" onSubmit={submitMapping}>
            <input className="rounded-md border border-border px-3 py-2 text-sm" placeholder="Source system" value={newMapping.source_system} onChange={(event) => setNewMapping({ ...newMapping, source_system: event.target.value })} required />
            <input className="rounded-md border border-border px-3 py-2 text-sm" placeholder="Source field" value={newMapping.source_field} onChange={(event) => setNewMapping({ ...newMapping, source_field: event.target.value })} required />
            <input className="rounded-md border border-border px-3 py-2 text-sm" placeholder="Target entity" value={newMapping.target_entity} onChange={(event) => setNewMapping({ ...newMapping, target_entity: event.target.value })} required />
            <input className="rounded-md border border-border px-3 py-2 text-sm" placeholder="Target field" value={newMapping.target_field} onChange={(event) => setNewMapping({ ...newMapping, target_field: event.target.value })} required />
            <input className="rounded-md border border-border px-3 py-2 text-sm" placeholder="Transform rule" value={newMapping.transform_rule ?? ''} onChange={(event) => setNewMapping({ ...newMapping, transform_rule: event.target.value })} />
            <input className="rounded-md border border-border px-3 py-2 text-sm" type="number" step="0.01" min="0" max="1" placeholder="Confidence" value={newMapping.confidence} onChange={(event) => setNewMapping({ ...newMapping, confidence: Number(event.target.value) })} required />
            <button className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60 md:col-span-3" disabled={createMapping.isPending}>
              {createMapping.isPending ? 'Saving...' : 'Add Mapping Rule'}
            </button>
          </form>
          <DataTable
            rows={mappingRows as Array<DataMappingRule & Record<string, unknown>>}
            emptyTitle="No mapping rules"
            columns={[
              { key: 'source_system', label: 'Source System' },
              { key: 'source_field', label: 'Source Field' },
              { key: 'target_entity', label: 'Target Entity' },
              { key: 'target_field', label: 'Target Field' },
              { key: 'confidence', label: 'Confidence', render: (value, row) => (
                <div className="flex items-center gap-2">
                  <input className="w-20 rounded-md border border-border px-2 py-1 text-xs" type="number" step="0.01" min="0" max="1" value={Number(value)} onChange={(event) => updateMapping.mutate({ id: String(row.id), payload: { ...(row as DataMappingRule), company_id: row.company_id, confidence: Number(event.target.value) } })} />
                  <StatusBadge status={`${Math.round(Number(value) * 100)}%`} />
                </div>
              ) },
              { key: 'id', label: 'Action', render: (value) => <button className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50" onClick={() => deleteMapping.mutate(String(value))}><Trash2 className="mr-1 inline h-3 w-3" />Delete</button> },
            ]}
          />
        </Panel>
      </div>

      <div className="mt-6 rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-panel">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-primary/10 p-2.5 text-primary">
            <Cable className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-950">Company isolation is active</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              This DataHub tab only reads and manages records belonging to your assigned company. Cross-company fetch, edit, and delete requests are blocked by the backend.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
