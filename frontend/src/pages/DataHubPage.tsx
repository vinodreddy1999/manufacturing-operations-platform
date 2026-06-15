import { FormEvent, useMemo, useRef, useState } from 'react';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { Cable, CloudUpload, Database, Gauge, RadioTower, Trash2, UploadCloud } from 'lucide-react';

import { DataTable } from '../components/DataTable';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { Panel } from '../components/Panel';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { canManagePlatform, canUseDataHubUploads } from '../lib/rbac';
import { backend } from '../services/api';
import type { ConnectedSystem, DataCatalogEntry, DataMappingRule, RuntimeUser } from '../types';

const acceptedFormats = '.csv,.tsv,.xls,.xlsx,.xlsm,.json,.xml,.txt,.ods';

export function DataHubPage({ user }: { user: RuntimeUser }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canUpload = canUseDataHubUploads(user);
  const [isDragging, setIsDragging] = useState(false);
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
  const [cloudSource, setCloudSource] = useState({
    provider: 'Google Drive',
    resource_name: '',
    resource_url: '',
    file_format: 'xlsx',
    sync_mode: 'manual',
  });
  const [systems, quality, readiness, catalog, mappings, uploads] = useQueries({
    queries: [
      { queryKey: ['connected-systems'], queryFn: backend.connectedSystems },
      { queryKey: ['data-quality'], queryFn: backend.dataQuality },
      { queryKey: ['ai-readiness'], queryFn: backend.aiReadiness },
      { queryKey: ['data-catalog'], queryFn: backend.dataCatalog },
      { queryKey: ['data-mappings'], queryFn: backend.dataMappings },
      { queryKey: ['datahub-uploads'], queryFn: backend.uploads },
    ],
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['connected-systems'] });
    queryClient.invalidateQueries({ queryKey: ['data-quality'] });
    queryClient.invalidateQueries({ queryKey: ['ai-readiness'] });
    queryClient.invalidateQueries({ queryKey: ['data-catalog'] });
    queryClient.invalidateQueries({ queryKey: ['data-mappings'] });
    queryClient.invalidateQueries({ queryKey: ['datahub-uploads'] });
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
  const uploadFile = useMutation({ mutationFn: backend.uploadFile, onSuccess: invalidate });
  const createCloudSource = useMutation({
    mutationFn: backend.createCloudSource,
    onSuccess: () => {
      setCloudSource({ provider: 'Google Drive', resource_name: '', resource_url: '', file_format: 'xlsx', sync_mode: 'manual' });
      invalidate();
    },
  });

  const uploadRows = useMemo(() => uploads.data ?? [], [uploads.data]);
  const uploadPreview = useMemo(() => uploadRows[0]?.metadata?.preview?.sample_rows ?? [], [uploadRows]);

  if ([systems, quality, readiness, catalog, mappings, uploads].some((query) => query.isLoading)) {
    return <LoadingState label="Loading company-scoped Manufacturing Data Hub responses" />;
  }

  const firstError = [systems, quality, readiness, catalog, mappings, uploads].find((query) => query.isError)?.error;
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

  function submitCloudSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createCloudSource.mutate(cloudSource);
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList?.length || !canUpload) return;
    uploadFile.mutate(fileList[0]);
  }

  return (
    <>
      <PageHeader
        eyebrow="Manufacturing Data Hub"
        title="Data ingestion, mapping, and readiness orchestration"
        description={`This workspace is connected to live company-scoped backend metadata for ${user.company_id ?? 'your company'}. Admin users can manage metadata, while only Admin and Super Admin users can perform DataHub uploads and cloud intake setup.`}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Connected Systems" value={rows.length} helper="Persisted company integrations" icon={<Database className="h-5 w-5" />} accent="blue" />
        <StatCard label="Data Quality" value={`${quality.data?.overall_score ?? 0}%`} helper="Computed from company catalog entries" icon={<Gauge className="h-5 w-5" />} accent="amber" />
        <StatCard label="AI Readiness" value={`${readiness.data?.overall_ai_readiness ?? 0}%`} helper="Only from this company's metadata" icon={<RadioTower className="h-5 w-5" />} accent="violet" />
        <StatCard label="Upload Queue" value={uploadRows.length} helper="Local and cloud manifests" icon={<CloudUpload className="h-5 w-5" />} accent="emerald" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <Panel title="Connected Systems" description="Admins can create, edit, and delete only their own company connections.">
          <form className="mb-4 grid gap-3 md:grid-cols-2" onSubmit={submitConnection}>
            <input className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500" placeholder="System name" value={newConnection.system_name} onChange={(event) => setNewConnection({ ...newConnection, system_name: event.target.value })} required />
            <input className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500" placeholder="System type" value={newConnection.system_type} onChange={(event) => setNewConnection({ ...newConnection, system_type: event.target.value })} required />
            <input className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500" placeholder="Status" value={newConnection.connection_status} onChange={(event) => setNewConnection({ ...newConnection, connection_status: event.target.value })} required />
            <input className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500" placeholder="Last sync" value={newConnection.last_sync} onChange={(event) => setNewConnection({ ...newConnection, last_sync: event.target.value })} required />
            <input className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none" type="number" placeholder="Health score" value={newConnection.health_score} onChange={(event) => setNewConnection({ ...newConnection, health_score: Number(event.target.value) })} required />
            <input className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none" type="number" placeholder="Record count" value={newConnection.record_count} onChange={(event) => setNewConnection({ ...newConnection, record_count: Number(event.target.value) })} required />
            <button className="rounded-2xl border border-cyan-300/20 bg-cyan-400/15 px-3 py-2 text-sm font-semibold text-cyan-50 disabled:opacity-60 md:col-span-2" disabled={createConnection.isPending}>
              {createConnection.isPending ? 'Saving...' : 'Add Connected System'}
            </button>
          </form>
          <DataTable
            rows={rows as Array<ConnectedSystem & Record<string, unknown>>}
            emptyTitle="No systems connected"
            columns={[
              { key: 'system_name', label: 'System' },
              { key: 'system_type', label: 'Type' },
              { key: 'connection_status', label: 'Status', render: (value, row) => <input className="w-28 rounded-xl border border-white/10 bg-white/10 px-2 py-1 text-xs text-white" value={String(value)} onChange={(event) => updateConnection.mutate({ id: String(row.id), payload: { ...(row as ConnectedSystem), company_id: row.company_id, connection_status: event.target.value } })} /> },
              { key: 'health_score', label: 'Health', render: (value, row) => <input className="w-20 rounded-xl border border-white/10 bg-white/10 px-2 py-1 text-xs text-white" type="number" value={Number(value)} onChange={(event) => updateConnection.mutate({ id: String(row.id), payload: { ...(row as ConnectedSystem), company_id: row.company_id, health_score: Number(event.target.value) } })} /> },
              { key: 'id', label: 'Action', render: (value) => <button className="rounded-xl border border-red-300/20 bg-red-400/10 px-2 py-1 text-xs text-red-100 hover:bg-red-400/20" onClick={() => deleteConnection.mutate(String(value))}><Trash2 className="mr-1 inline h-3 w-3" />Delete</button> },
            ]}
          />
        </Panel>

        <Panel title="DataHub Upload Center" description="Drag files from your desktop or link cloud storage exports. Supports ERP exports, SAP files, Excel, Google Sheets exports, and similar table formats.">
          {canUpload ? (
            <>
              <button
                type="button"
                className={`mb-4 flex min-h-[220px] w-full flex-col items-center justify-center rounded-[28px] border border-dashed px-6 py-8 text-center transition ${isDragging ? 'border-cyan-300/60 bg-cyan-400/10' : 'border-white/15 bg-white/6 hover:bg-white/10'}`}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                  handleFiles(event.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="h-10 w-10 text-cyan-200" />
                <p className="mt-4 text-lg font-semibold text-white">Drop files here or click to browse</p>
                <p className="mt-2 max-w-xl text-sm text-slate-300">
                  Accepted formats: ERP CSV exports, SAP spreadsheets, Excel workbooks, TSV, JSON, XML, and Google Sheets downloads.
                </p>
                <span className="mt-4 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-xs uppercase tracking-[0.18em] text-slate-200">
                  Upload from local computer
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedFormats}
                className="hidden"
                onChange={(event) => handleFiles(event.target.files)}
              />

              <form className="grid gap-3 rounded-[24px] border border-white/10 bg-white/6 p-4" onSubmit={submitCloudSource}>
                <div className="grid gap-3 md:grid-cols-2">
                  <select className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none" value={cloudSource.provider} onChange={(event) => setCloudSource({ ...cloudSource, provider: event.target.value })}>
                    <option value="Google Drive">Google Drive</option>
                    <option value="OneDrive">OneDrive</option>
                    <option value="SharePoint">SharePoint</option>
                    <option value="Dropbox">Dropbox</option>
                  </select>
                  <input className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500" placeholder="Resource name" value={cloudSource.resource_name} onChange={(event) => setCloudSource({ ...cloudSource, resource_name: event.target.value })} required />
                  <input className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 md:col-span-2" placeholder="Cloud file URL" value={cloudSource.resource_url} onChange={(event) => setCloudSource({ ...cloudSource, resource_url: event.target.value })} required />
                  <input className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500" placeholder="Format (xlsx, csv, gsheets)" value={cloudSource.file_format} onChange={(event) => setCloudSource({ ...cloudSource, file_format: event.target.value })} required />
                  <select className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none" value={cloudSource.sync_mode} onChange={(event) => setCloudSource({ ...cloudSource, sync_mode: event.target.value })}>
                    <option value="manual">Manual</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
                <button className="rounded-2xl border border-violet-300/20 bg-violet-400/15 px-3 py-2 text-sm font-semibold text-violet-50 disabled:opacity-60" disabled={createCloudSource.isPending}>
                  {createCloudSource.isPending ? 'Linking...' : 'Add Cloud Source'}
                </button>
              </form>
            </>
          ) : (
            <div className="rounded-[24px] border border-amber-300/20 bg-amber-400/10 p-4 text-sm text-amber-100">
              Only Admin and Super Admin users can upload local files or connect cloud storage sources in the DataHub.
            </div>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Panel title="Data Catalog" description="Catalog quality drives the company AI readiness score.">
          <form className="mb-4 grid gap-3 md:grid-cols-2" onSubmit={submitCatalog}>
            <input className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500" placeholder="Data type" value={newCatalogEntry.data_type} onChange={(event) => setNewCatalogEntry({ ...newCatalogEntry, data_type: event.target.value })} required />
            <input className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500" placeholder="Source system" value={newCatalogEntry.source_system} onChange={(event) => setNewCatalogEntry({ ...newCatalogEntry, source_system: event.target.value })} required />
            <input className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500" placeholder="Owner" value={newCatalogEntry.owner} onChange={(event) => setNewCatalogEntry({ ...newCatalogEntry, owner: event.target.value })} required />
            <input className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none" type="number" placeholder="Quality score" value={newCatalogEntry.quality_score} onChange={(event) => setNewCatalogEntry({ ...newCatalogEntry, quality_score: Number(event.target.value) })} required />
            <label className="flex items-center gap-2 text-sm text-slate-200">
              <input type="checkbox" checked={newCatalogEntry.ai_ready} onChange={(event) => setNewCatalogEntry({ ...newCatalogEntry, ai_ready: event.target.checked })} />
              AI ready
            </label>
            <button className="rounded-2xl border border-cyan-300/20 bg-cyan-400/15 px-3 py-2 text-sm font-semibold text-cyan-50 disabled:opacity-60" disabled={createCatalog.isPending}>
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
              { key: 'quality_score', label: 'Quality', render: (value, row) => <input className="w-20 rounded-xl border border-white/10 bg-white/10 px-2 py-1 text-xs text-white" type="number" value={Number(value)} onChange={(event) => updateCatalog.mutate({ id: String(row.id), payload: { ...(row as DataCatalogEntry), company_id: row.company_id, quality_score: Number(event.target.value) } })} /> },
              { key: 'ai_ready', label: 'AI Ready', render: (value, row) => <button className="rounded-xl border border-white/10 bg-white/10 px-2 py-1 text-xs text-white" onClick={() => updateCatalog.mutate({ id: String(row.id), payload: { ...(row as DataCatalogEntry), company_id: row.company_id, ai_ready: !value } })}>{value ? 'Enabled' : 'Disabled'}</button> },
              { key: 'id', label: 'Action', render: (value) => <button className="rounded-xl border border-red-300/20 bg-red-400/10 px-2 py-1 text-xs text-red-100 hover:bg-red-400/20" onClick={() => deleteCatalog.mutate(String(value))}><Trash2 className="mr-1 inline h-3 w-3" />Delete</button> },
            ]}
          />
        </Panel>

        <Panel title="Upload Manifests" description="Stored metadata for local uploads and cloud-linked sources.">
          <DataTable
            rows={uploadRows as Array<Record<string, unknown>>}
            emptyTitle="No upload manifests yet"
            columns={[
              { key: 'provider', label: 'Provider' },
              { key: 'resource_name', label: 'Resource' },
              { key: 'file_format', label: 'Format', render: (value) => <StatusBadge status={String(value).toUpperCase()} /> },
              { key: 'source', label: 'Source' },
              { key: 'status', label: 'Status', render: (value) => <StatusBadge status={String(value)} /> },
            ]}
          />
          {uploadPreview.length ? (
            <div className="mt-4 rounded-[22px] border border-white/10 bg-white/6 p-4">
              <p className="text-sm font-semibold text-white">Latest preview rows</p>
              <pre className="mt-3 overflow-x-auto rounded-2xl bg-slate-950/40 p-3 text-xs text-slate-200">
                {JSON.stringify(uploadPreview, null, 2)}
              </pre>
            </div>
          ) : null}
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Mapping Studio" description="These rules stay isolated per company and are editable only by admin users.">
          <form className="mb-4 grid gap-3 md:grid-cols-3" onSubmit={submitMapping}>
            <input className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500" placeholder="Source system" value={newMapping.source_system} onChange={(event) => setNewMapping({ ...newMapping, source_system: event.target.value })} required />
            <input className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500" placeholder="Source field" value={newMapping.source_field} onChange={(event) => setNewMapping({ ...newMapping, source_field: event.target.value })} required />
            <input className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500" placeholder="Target entity" value={newMapping.target_entity} onChange={(event) => setNewMapping({ ...newMapping, target_entity: event.target.value })} required />
            <input className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500" placeholder="Target field" value={newMapping.target_field} onChange={(event) => setNewMapping({ ...newMapping, target_field: event.target.value })} required />
            <input className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500" placeholder="Transform rule" value={newMapping.transform_rule ?? ''} onChange={(event) => setNewMapping({ ...newMapping, transform_rule: event.target.value })} />
            <input className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none" type="number" step="0.01" min="0" max="1" placeholder="Confidence" value={newMapping.confidence} onChange={(event) => setNewMapping({ ...newMapping, confidence: Number(event.target.value) })} required />
            <button className="rounded-2xl border border-cyan-300/20 bg-cyan-400/15 px-3 py-2 text-sm font-semibold text-cyan-50 disabled:opacity-60 md:col-span-3" disabled={createMapping.isPending}>
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
                  <input className="w-20 rounded-xl border border-white/10 bg-white/10 px-2 py-1 text-xs text-white" type="number" step="0.01" min="0" max="1" value={Number(value)} onChange={(event) => updateMapping.mutate({ id: String(row.id), payload: { ...(row as DataMappingRule), company_id: row.company_id, confidence: Number(event.target.value) } })} />
                  <StatusBadge status={`${Math.round(Number(value) * 100)}%`} />
                </div>
              ) },
              { key: 'id', label: 'Action', render: (value) => <button className="rounded-xl border border-red-300/20 bg-red-400/10 px-2 py-1 text-xs text-red-100 hover:bg-red-400/20" onClick={() => deleteMapping.mutate(String(value))}><Trash2 className="mr-1 inline h-3 w-3" />Delete</button> },
            ]}
          />
        </Panel>
      </div>

      <div className="mt-6 rounded-[24px] border border-white/15 bg-white/8 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.14)]">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-cyan-400/15 p-2.5 text-cyan-100">
            <Cable className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Company isolation is active</p>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              This DataHub tab only reads and manages records belonging to your assigned company. Cross-company fetch, edit, delete, upload, and link requests are blocked by the backend.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
