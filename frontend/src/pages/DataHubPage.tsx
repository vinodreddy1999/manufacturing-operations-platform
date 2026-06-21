import { FormEvent, useMemo, useRef, useState } from 'react';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { Cable, Database, Gauge, RadioTower, Route, ShieldCheck, Trash2, UploadCloud } from 'lucide-react';

import { DataTable } from '../components/DataTable';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { Panel } from '../components/Panel';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { canManagePlatform, canUseDataHubUploads } from '../lib/rbac';
import { backend } from '../services/api';
import { ModuleImpactSummary } from '../impact/components/ModuleImpactSummary';
import type { Company, ConnectedSystem, DataCatalogEntry, DataMappingRule, RuntimeUser } from '../types';

const acceptedFormats = '.csv,.tsv,.xls,.xlsx,.xlsm,.json,.xml,.txt,.ods';

type SourceConfig = {
  value: string;
  label: string;
  description: string;
  defaultSystemType: string;
  formats: string[];
  authMethods: string[];
  fields: Array<{ key: string; label: string; type?: string; placeholder: string; required?: boolean }>;
};

const sourceTypes: SourceConfig[] = [
  {
    value: 'erp',
    label: 'ERP / SAP / Oracle',
    description: 'Master data, inventory, purchasing, production, finance and order exports.',
    defaultSystemType: 'ERP',
    formats: ['csv', 'xlsx', 'xml', 'json', 'idoc'],
    authMethods: ['API Key', 'OAuth2', 'Basic Auth', 'SFTP Credentials'],
    fields: [
      { key: 'base_url', label: 'ERP/API URL', placeholder: 'https://sap.company.com/odata', required: true },
      { key: 'client_id', label: 'Client / Tenant ID', placeholder: 'SAP client, Oracle tenant, or ERP company code' },
      { key: 'username', label: 'Username', placeholder: 'integration.user' },
      { key: 'password', label: 'Password / Secret', type: 'password', placeholder: 'Stored securely in production vault' },
    ],
  },
  {
    value: 'database',
    label: 'Database',
    description: 'PostgreSQL, SQL Server, MySQL, Oracle or data warehouse tables.',
    defaultSystemType: 'DATABASE',
    formats: ['table', 'view', 'query', 'parquet'],
    authMethods: ['Database Password', 'IAM / Managed Identity', 'Connection String'],
    fields: [
      { key: 'host', label: 'Host', placeholder: 'db.company.local', required: true },
      { key: 'port', label: 'Port', placeholder: '5432' },
      { key: 'database', label: 'Database', placeholder: 'manufacturing_ops', required: true },
      { key: 'schema', label: 'Schema / Table', placeholder: 'inventory.stock_balance' },
      { key: 'username', label: 'Username', placeholder: 'readonly_user' },
      { key: 'password', label: 'Password', type: 'password', placeholder: 'Stored securely in production vault' },
    ],
  },
  {
    value: 'cloud_storage',
    label: 'Cloud Storage',
    description: 'Google Drive, OneDrive, SharePoint, S3, Azure Blob or Dropbox sources.',
    defaultSystemType: 'CLOUD_STORAGE',
    formats: ['xlsx', 'csv', 'gsheets', 'json', 'parquet'],
    authMethods: ['OAuth2', 'Shared Link', 'Service Account', 'SAS / Presigned URL'],
    fields: [
      { key: 'resource_url', label: 'File / Folder Link', placeholder: 'https://drive.google.com/...', required: true },
      { key: 'folder_path', label: 'Folder / Path', placeholder: '/exports/inventory' },
      { key: 'client_id', label: 'Client ID', placeholder: 'OAuth client id' },
      { key: 'client_secret', label: 'Client Secret', type: 'password', placeholder: 'OAuth secret or service account key' },
    ],
  },
  {
    value: 'machine_iot',
    label: 'Machine / IoT / OPC-UA',
    description: 'PLC, OPC-UA, MQTT, sensor, machine and edge data feeds.',
    defaultSystemType: 'IOT',
    formats: ['mqtt', 'opcua', 'json', 'timeseries'],
    authMethods: ['Certificate', 'Token', 'Basic Auth', 'No Auth'],
    fields: [
      { key: 'endpoint', label: 'Broker / Endpoint', placeholder: 'opc.tcp://edge.local:4840', required: true },
      { key: 'topic_or_node', label: 'Topic / Node Path', placeholder: 'factory/line1/machine5/#' },
      { key: 'certificate_ref', label: 'Certificate Reference', placeholder: 'certificate alias or thumbprint' },
      { key: 'token', label: 'Token', type: 'password', placeholder: 'Access token when required' },
    ],
  },
  {
    value: 'file_upload',
    label: 'Local File Upload',
    description: 'Manual ERP exports, SAP spreadsheets, Excel sheets and data extracts.',
    defaultSystemType: 'FILE_UPLOAD',
    formats: ['csv', 'xlsx', 'xlsm', 'tsv', 'json', 'xml'],
    authMethods: ['No Auth'],
    fields: [
      { key: 'expected_file_name', label: 'Expected File Name', placeholder: 'inventory_export_*.xlsx' },
      { key: 'sheet_name', label: 'Sheet / Tab Name', placeholder: 'Stock Balance' },
    ],
  },
];

const dataDomains = [
  { value: 'Inventory', route: 'Inventory module', description: 'Stock, batches, bins, reservations, movement ledger and valuation.' },
  { value: 'Production', route: 'Production module', description: 'Work orders, BOM, routing, WIP, capacity and production status.' },
  { value: 'Procurement', route: 'Procurement module', description: 'Purchase requests, suppliers, POs, lead time and receiving.' },
  { value: 'Warehouse', route: 'Warehouse module', description: 'Plants, warehouses, zones, racks, shelves, bins and occupancy.' },
  { value: 'Quality', route: 'Quality module', description: 'Inspection lots, defects, quarantine, rejection and audit results.' },
  { value: 'Maintenance', route: 'Maintenance module', description: 'Assets, work orders, downtime, spares and preventive maintenance.' },
  { value: 'Machine Data', route: 'AI / Machine Data readiness', description: 'IoT, PLC, OPC-UA and edge telemetry for intelligence models.' },
  { value: 'Supplier', route: 'Supplier performance module', description: 'Supplier master, quality rating, SLA and delay patterns.' },
  { value: 'Finance / Costing', route: 'Costing and reporting module', description: 'Inventory valuation, wastage, expiry loss and operational cost.' },
];

const inputClass = 'rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/60 focus:shadow-[0_0_18px_rgba(79,172,254,0.25)]';
const selectClass = `${inputClass} appearance-none`;

function canSelectCompany(user: RuntimeUser) {
  return ['super_admin', 'account_owner'].includes(user.role);
}

function getSourceConfig(value: string) {
  return sourceTypes.find((source) => source.value === value) ?? sourceTypes[0];
}

function getDomain(value: string) {
  return dataDomains.find((domain) => domain.value === value) ?? dataDomains[0];
}

function CompanySelector({
  companies,
  selectedCompanyId,
  user,
  onChange,
}: {
  companies: Company[];
  selectedCompanyId: string;
  user: RuntimeUser;
  onChange: (companyId: string) => void;
}) {
  const activeCompany = companies.find((company) => company.id === selectedCompanyId);
  if (!canSelectCompany(user)) {
    return (
      <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Company scope</p>
        <p className="mt-2 text-lg font-semibold text-white">{activeCompany?.name ?? user.company_id ?? 'Assigned company'}</p>
        <p className="mt-1 text-sm text-slate-300">Admin users can only add, change, and read DataHub data for their own company.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-cyan-300/15 bg-cyan-400/8 p-4 shadow-[0_18px_60px_rgba(8,145,178,0.12)]">
      <label className="text-xs uppercase tracking-[0.22em] text-cyan-100">Super Admin target company</label>
      <select className={`${selectClass} mt-3 w-full`} value={selectedCompanyId} onChange={(event) => onChange(event.target.value)}>
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {company.name} ({company.code})
          </option>
        ))}
      </select>
      <p className="mt-2 text-sm text-slate-300">
        New connected systems, catalog entries, mappings, uploads, and cloud links will be added to this selected company.
      </p>
    </div>
  );
}

export function DataHubPage({ user }: { user: RuntimeUser }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canUpload = canUseDataHubUploads(user);
  const [isDragging, setIsDragging] = useState(false);
  const [activeView, setActiveView] = useState<'sources' | 'catalog' | 'mapping'>('sources');
  const [selectedCompanyId, setSelectedCompanyId] = useState(user.company_id ?? '');
  const [sourceCategory, setSourceCategory] = useState('erp');
  const [catalogSourceCategory, setCatalogSourceCategory] = useState('erp');
  const [catalogFormat, setCatalogFormat] = useState('xlsx');
  const [catalogAuthMethod, setCatalogAuthMethod] = useState('OAuth2');
  const [connectionDetails, setConnectionDetails] = useState<Record<string, string>>({});
  const [catalogDetails, setCatalogDetails] = useState<Record<string, string>>({});
  const [cloudDetails, setCloudDetails] = useState<Record<string, string>>({});
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
    data_type: 'Inventory',
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
    target_entity: 'InventoryItem',
    target_field: '',
    transform_rule: 'trim_uppercase',
    confidence: 0.95,
  });
  const [cloudSource, setCloudSource] = useState({
    company_id: user.company_id ?? undefined,
    provider: 'Google Drive',
    resource_name: '',
    resource_url: '',
    file_format: 'xlsx',
    sync_mode: 'manual',
    auth_method: 'OAuth2',
  });
  const [companies, systems, quality, readiness, catalog, mappings, uploads] = useQueries({
    queries: [
      { queryKey: ['companies'], queryFn: backend.companies },
      { queryKey: ['connected-systems'], queryFn: backend.connectedSystems },
      { queryKey: ['data-quality'], queryFn: backend.dataQuality },
      { queryKey: ['ai-readiness'], queryFn: backend.aiReadiness },
      { queryKey: ['data-catalog'], queryFn: backend.dataCatalog },
      { queryKey: ['data-mappings'], queryFn: backend.dataMappings },
      { queryKey: ['datahub-uploads'], queryFn: backend.uploads },
    ],
  });

  const companyRows = companies.data ?? [];
  const targetCompanyId = selectedCompanyId || user.company_id || companyRows[0]?.id || '';
  const targetCompany = companyRows.find((company) => company.id === targetCompanyId);
  const activeSource = getSourceConfig(sourceCategory);
  const activeCatalogSource = getSourceConfig(catalogSourceCategory);
  const activeDomain = getDomain(newCatalogEntry.data_type);

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
        company_id: targetCompanyId,
        system_name: '',
        system_type: activeSource.defaultSystemType,
        connection_status: 'Healthy',
        last_sync: '2026-06-15T09:00:00Z',
        health_score: 90,
        record_count: 0,
      });
      setConnectionDetails({});
      invalidate();
    },
  });
  const updateConnection = useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Omit<ConnectedSystem, 'id'> }) => backend.updateConnectedSystem(id, payload), onSuccess: invalidate });
  const deleteConnection = useMutation({ mutationFn: backend.deleteConnectedSystem, onSuccess: invalidate });

  const createCatalog = useMutation({
    mutationFn: backend.createDataCatalogEntry,
    onSuccess: () => {
      setNewCatalogEntry({
        company_id: targetCompanyId,
        data_type: 'Inventory',
        source_system: '',
        owner: '',
        ai_ready: true,
        quality_score: 90,
        lineage: {},
      });
      setCatalogDetails({});
      invalidate();
    },
  });
  const updateCatalog = useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Omit<DataCatalogEntry, 'id'> }) => backend.updateDataCatalogEntry(id, payload), onSuccess: invalidate });
  const deleteCatalog = useMutation({ mutationFn: backend.deleteDataCatalogEntry, onSuccess: invalidate });

  const createMapping = useMutation({
    mutationFn: backend.createDataMapping,
    onSuccess: () => {
      setNewMapping({
        company_id: targetCompanyId,
        source_system: '',
        source_field: '',
        target_entity: `${newCatalogEntry.data_type.replaceAll(' ', '')}Record`,
        target_field: '',
        transform_rule: 'trim_uppercase',
        confidence: 0.95,
      });
      invalidate();
    },
  });
  const updateMapping = useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Omit<DataMappingRule, 'id'> }) => backend.updateDataMapping(id, payload), onSuccess: invalidate });
  const deleteMapping = useMutation({ mutationFn: backend.deleteDataMapping, onSuccess: invalidate });
  const uploadFile = useMutation({ mutationFn: ({ file, companyId }: { file: File; companyId?: string }) => backend.uploadFile(file, companyId), onSuccess: invalidate });
  const createCloudSource = useMutation({
    mutationFn: backend.createCloudSource,
    onSuccess: () => {
      setCloudSource({ company_id: targetCompanyId, provider: 'Google Drive', resource_name: '', resource_url: '', file_format: 'xlsx', sync_mode: 'manual', auth_method: 'OAuth2' });
      setCloudDetails({});
      invalidate();
    },
  });

  const uploadRows = useMemo(() => uploads.data ?? [], [uploads.data]);
  const uploadPreview = useMemo(() => uploadRows[0]?.metadata?.preview?.sample_rows ?? [], [uploadRows]);
  const rows = systems.data ?? [];
  const catalogRows = catalog.data ?? [];
  const mappingRows = mappings.data ?? [];

  if ([companies, systems, quality, readiness, catalog, mappings, uploads].some((query) => query.isLoading)) {
    return <LoadingState label="Loading company-scoped Manufacturing Data Hub responses" />;
  }

  const firstError = [companies, systems, quality, readiness, catalog, mappings, uploads].find((query) => query.isError)?.error;
  if (firstError) {
    return <ErrorState error={firstError} title="Manufacturing Data Hub integration failed" />;
  }

  if (!canManagePlatform(user)) {
    return <ErrorState error={new Error('This workspace is reserved for platform administrators.')} title="DataHub is restricted to admin roles" />;
  }

  function setDetail(setter: (details: Record<string, string>) => void, current: Record<string, string>, key: string, value: string) {
    setter({ ...current, [key]: value });
  }

  function renderDetailFields(config: SourceConfig, values: Record<string, string>, setter: (details: Record<string, string>) => void) {
    return config.fields.map((field) => (
      <input
        key={field.key}
        className={inputClass}
        type={field.type ?? 'text'}
        placeholder={field.label}
        value={values[field.key] ?? ''}
        onChange={(event) => setDetail(setter, values, field.key, event.target.value)}
        required={field.required}
        title={field.placeholder}
      />
    ));
  }

  function submitConnection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createConnection.mutate({
      ...newConnection,
      company_id: targetCompanyId,
      system_type: activeSource.defaultSystemType,
      source_category: activeSource.label,
      auth_method: newConnection.auth_method ?? activeSource.authMethods[0],
      connection_details: connectionDetails,
    });
  }

  function submitCatalog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createCatalog.mutate({
      ...newCatalogEntry,
      company_id: targetCompanyId,
      lineage: {
        ...newCatalogEntry.lineage,
        source_category: activeCatalogSource.label,
        source_format: catalogFormat,
        auth_method: catalogAuthMethod,
        routing_target: activeDomain.route,
        routing_description: activeDomain.description,
        required_connection: catalogDetails,
      },
    });
  }

  function submitMapping(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createMapping.mutate({ ...newMapping, company_id: targetCompanyId });
  }

  function submitCloudSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createCloudSource.mutate({ ...cloudSource, company_id: targetCompanyId, connection_details: cloudDetails });
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList?.length || !canUpload) return;
    uploadFile.mutate({ file: fileList[0], companyId: targetCompanyId });
  }

  function changeTargetCompany(companyId: string) {
    setSelectedCompanyId(companyId);
    setNewConnection((current) => ({ ...current, company_id: companyId }));
    setNewCatalogEntry((current) => ({ ...current, company_id: companyId }));
    setNewMapping((current) => ({ ...current, company_id: companyId }));
    setCloudSource((current) => ({ ...current, company_id: companyId }));
  }

  return (
    <>
      <PageHeader
        eyebrow="Manufacturing Data Hub"
        title="Connect data, catalog it, and map it"
        description={`Target company: ${targetCompany?.name ?? targetCompanyId}. Pick a company, choose a source type, then move through sources, catalog, and mapping one step at a time.`}
      />

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <CompanySelector companies={companyRows} selectedCompanyId={targetCompanyId} user={user} onChange={changeTargetCompany} />
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Connected Systems" value={rows.length} helper="Persisted company integrations" icon={<Database className="h-5 w-5" />} accent="blue" />
          <StatCard label="Data Quality" value={`${quality.data?.overall_score ?? 0}%`} helper="Computed from catalog entries" icon={<Gauge className="h-5 w-5" />} accent="amber" />
          <StatCard label="AI Readiness" value={`${readiness.data?.overall_ai_readiness ?? 0}%`} helper="Catalog readiness score" icon={<RadioTower className="h-5 w-5" />} accent="violet" />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-slate-900/45 p-2">
        {[
          { key: 'sources', label: '1. Sources' },
          { key: 'catalog', label: '2. Catalog & Uploads' },
          { key: 'mapping', label: '3. Mapping' },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeView === item.key ? 'bg-cyan-400/15 text-cyan-50' : 'text-slate-400 hover:bg-white/8 hover:text-white'
            }`}
            onClick={() => setActiveView(item.key as typeof activeView)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {activeView === 'sources' ? (
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel title="Connected Systems" description="Choose the company, source type, auth pattern, and required connection fields before adding the integration.">
          <form className="mb-4 grid gap-3 md:grid-cols-2" onSubmit={submitConnection}>
            <select
              className={selectClass}
              value={sourceCategory}
              onChange={(event) => {
                const config = getSourceConfig(event.target.value);
                setSourceCategory(config.value);
                setNewConnection({ ...newConnection, system_type: config.defaultSystemType, auth_method: config.authMethods[0] });
                setConnectionDetails({});
              }}
            >
              {sourceTypes.map((source) => (
                <option key={source.value} value={source.value}>
                  {source.label}
                </option>
              ))}
            </select>
            <select className={selectClass} value={newConnection.auth_method ?? activeSource.authMethods[0]} onChange={(event) => setNewConnection({ ...newConnection, auth_method: event.target.value })}>
              {activeSource.authMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
            <input className={inputClass} placeholder="System name" value={newConnection.system_name} onChange={(event) => setNewConnection({ ...newConnection, system_name: event.target.value })} required />
            <input className={inputClass} placeholder="Status" value={newConnection.connection_status} onChange={(event) => setNewConnection({ ...newConnection, connection_status: event.target.value })} required />
            <input className={inputClass} placeholder="Last sync" value={newConnection.last_sync} onChange={(event) => setNewConnection({ ...newConnection, last_sync: event.target.value })} required />
            <input className={inputClass} type="number" placeholder="Health score" value={newConnection.health_score} onChange={(event) => setNewConnection({ ...newConnection, health_score: Number(event.target.value) })} required />
            <input className={inputClass} type="number" placeholder="Record count" value={newConnection.record_count} onChange={(event) => setNewConnection({ ...newConnection, record_count: Number(event.target.value) })} required />
            {renderDetailFields(activeSource, connectionDetails, setConnectionDetails)}
            <div className="rounded-2xl border border-white/10 bg-white/6 p-3 text-sm text-slate-300 md:col-span-2">
              <ShieldCheck className="mr-2 inline h-4 w-4 text-cyan-200" />
              {activeSource.description}
            </div>
            <button className="rounded-2xl border border-cyan-300/20 bg-cyan-400/15 px-3 py-2 text-sm font-semibold text-cyan-50 disabled:opacity-60 md:col-span-2" disabled={createConnection.isPending}>
              {createConnection.isPending ? 'Saving...' : `Add Source for ${targetCompany?.name ?? targetCompanyId}`}
            </button>
          </form>
          <DataTable
            rows={rows as Array<ConnectedSystem & Record<string, unknown>>}
            emptyTitle="No systems connected"
            columns={[
              { key: 'company_name', label: 'Company' },
              { key: 'system_name', label: 'System' },
              { key: 'system_type', label: 'Type / Source / Auth' },
              { key: 'connection_status', label: 'Status', render: (value, row) => <input className="w-28 rounded-xl border border-white/10 bg-white/10 px-2 py-1 text-xs text-white" value={String(value)} onChange={(event) => updateConnection.mutate({ id: String(row.id), payload: { ...(row as ConnectedSystem), company_id: String(row.company_id), connection_status: event.target.value } })} /> },
              { key: 'health_score', label: 'Health', render: (value, row) => <input className="w-20 rounded-xl border border-white/10 bg-white/10 px-2 py-1 text-xs text-white" type="number" value={Number(value)} onChange={(event) => updateConnection.mutate({ id: String(row.id), payload: { ...(row as ConnectedSystem), company_id: String(row.company_id), health_score: Number(event.target.value) } })} /> },
              { key: 'id', label: 'Action', render: (value) => <button className="rounded-xl border border-red-300/20 bg-red-400/10 px-2 py-1 text-xs text-red-100 hover:bg-red-400/20" onClick={() => deleteConnection.mutate(String(value))}><Trash2 className="mr-1 inline h-3 w-3" />Delete</button> },
            ]}
          />
        </Panel>

        <Panel title="DataHub Upload Center" description="Upload local data or connect cloud files for the selected company. Auth requirements change by provider/source.">
          {canUpload ? (
            <>
              <button
                type="button"
                className={`mb-4 flex min-h-[210px] w-full flex-col items-center justify-center rounded-[28px] border border-dashed px-6 py-8 text-center transition ${isDragging ? 'border-cyan-300/60 bg-cyan-400/10' : 'border-white/15 bg-white/6 hover:bg-white/10'}`}
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
                <p className="mt-4 text-lg font-semibold text-white">Drop files for {targetCompany?.name ?? targetCompanyId}</p>
                <p className="mt-2 max-w-xl text-sm text-slate-300">ERP exports, SAP files, Excel, Google Sheets exports, CSV, XML, JSON and other table formats.</p>
                <span className="mt-4 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-xs uppercase tracking-[0.18em] text-slate-200">Upload from local computer</span>
              </button>
              <input ref={fileInputRef} type="file" accept={acceptedFormats} className="hidden" onChange={(event) => handleFiles(event.target.files)} />

              <form className="grid gap-3 rounded-[24px] border border-white/10 bg-white/6 p-4" onSubmit={submitCloudSource}>
                <div className="grid gap-3 md:grid-cols-2">
                  <select className={selectClass} value={cloudSource.provider} onChange={(event) => setCloudSource({ ...cloudSource, provider: event.target.value })}>
                    <option value="Google Drive">Google Drive</option>
                    <option value="OneDrive">OneDrive</option>
                    <option value="SharePoint">SharePoint</option>
                    <option value="AWS S3">AWS S3</option>
                    <option value="Azure Blob">Azure Blob</option>
                    <option value="Dropbox">Dropbox</option>
                  </select>
                  <select className={selectClass} value={cloudSource.auth_method} onChange={(event) => setCloudSource({ ...cloudSource, auth_method: event.target.value })}>
                    {getSourceConfig('cloud_storage').authMethods.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                  <input className={inputClass} placeholder="Resource name" value={cloudSource.resource_name} onChange={(event) => setCloudSource({ ...cloudSource, resource_name: event.target.value })} required />
                  <select className={selectClass} value={cloudSource.file_format} onChange={(event) => setCloudSource({ ...cloudSource, file_format: event.target.value })}>
                    {getSourceConfig('cloud_storage').formats.map((format) => (
                      <option key={format} value={format}>
                        {format.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <input className={`${inputClass} md:col-span-2`} placeholder="Cloud file or folder URL" value={cloudSource.resource_url} onChange={(event) => setCloudSource({ ...cloudSource, resource_url: event.target.value })} required />
                  {renderDetailFields(getSourceConfig('cloud_storage'), cloudDetails, setCloudDetails)}
                  <select className={selectClass} value={cloudSource.sync_mode} onChange={(event) => setCloudSource({ ...cloudSource, sync_mode: event.target.value })}>
                    <option value="manual">Manual</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
                <button className="rounded-2xl border border-violet-300/20 bg-violet-400/15 px-3 py-2 text-sm font-semibold text-violet-50 disabled:opacity-60" disabled={createCloudSource.isPending}>
                  {createCloudSource.isPending ? 'Linking...' : `Add Cloud Source for ${targetCompany?.name ?? targetCompanyId}`}
                </button>
              </form>
            </>
          ) : (
            <div className="rounded-[24px] border border-amber-300/20 bg-amber-400/10 p-4 text-sm text-amber-100">Only Admin and Super Admin users can upload local files or connect cloud storage sources in the DataHub.</div>
          )}
        </Panel>
      </div>
      ) : null}

      {activeView === 'catalog' ? (
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Data Catalog" description="Select data domain, source type, format, auth, and routing target before cataloging the dataset.">
          <form className="mb-4 grid gap-3 md:grid-cols-2" onSubmit={submitCatalog}>
            <select className={selectClass} value={newCatalogEntry.data_type} onChange={(event) => setNewCatalogEntry({ ...newCatalogEntry, data_type: event.target.value })}>
              {dataDomains.map((domain) => (
                <option key={domain.value} value={domain.value}>
                  {domain.value}
                </option>
              ))}
            </select>
            <select
              className={selectClass}
              value={catalogSourceCategory}
              onChange={(event) => {
                const config = getSourceConfig(event.target.value);
                setCatalogSourceCategory(config.value);
                setCatalogFormat(config.formats[0]);
                setCatalogAuthMethod(config.authMethods[0]);
                setCatalogDetails({});
              }}
            >
              {sourceTypes.map((source) => (
                <option key={source.value} value={source.value}>
                  {source.label}
                </option>
              ))}
            </select>
            <select className={selectClass} value={newCatalogEntry.source_system} onChange={(event) => setNewCatalogEntry({ ...newCatalogEntry, source_system: event.target.value })} required>
              <option value="">Select connected source</option>
              {rows.map((system) => (
                <option key={system.id} value={system.system_name}>
                  {system.system_name}
                </option>
              ))}
              <option value="Manual Upload">Manual Upload</option>
            </select>
            <select className={selectClass} value={catalogFormat} onChange={(event) => setCatalogFormat(event.target.value)}>
              {activeCatalogSource.formats.map((format) => (
                <option key={format} value={format}>
                  {format.toUpperCase()}
                </option>
              ))}
            </select>
            <select className={selectClass} value={catalogAuthMethod} onChange={(event) => setCatalogAuthMethod(event.target.value)}>
              {activeCatalogSource.authMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
            <input className={inputClass} placeholder="Data owner" value={newCatalogEntry.owner} onChange={(event) => setNewCatalogEntry({ ...newCatalogEntry, owner: event.target.value })} required />
            <input className={inputClass} type="number" placeholder="Quality score" value={newCatalogEntry.quality_score} onChange={(event) => setNewCatalogEntry({ ...newCatalogEntry, quality_score: Number(event.target.value) })} required />
            {renderDetailFields(activeCatalogSource, catalogDetails, setCatalogDetails)}
            <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/8 p-3 text-sm text-slate-200 md:col-span-2">
              <Route className="mr-2 inline h-4 w-4 text-cyan-200" />
              Routes to <strong>{activeDomain.route}</strong>: {activeDomain.description}
            </div>
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
              { key: 'company_name', label: 'Company' },
              { key: 'data_type', label: 'Data Type' },
              { key: 'source_system', label: 'Source' },
              { key: 'owner', label: 'Owner' },
              { key: 'lineage', label: 'Route', render: (value) => <span>{String((value as Record<string, unknown>)?.routing_target ?? 'DataHub')}</span> },
              { key: 'quality_score', label: 'Quality', render: (value, row) => <input className="w-20 rounded-xl border border-white/10 bg-white/10 px-2 py-1 text-xs text-white" type="number" value={Number(value)} onChange={(event) => updateCatalog.mutate({ id: String(row.id), payload: { ...(row as DataCatalogEntry), company_id: String(row.company_id), quality_score: Number(event.target.value) } })} /> },
              { key: 'ai_ready', label: 'AI Ready', render: (value, row) => <button className="rounded-xl border border-white/10 bg-white/10 px-2 py-1 text-xs text-white" onClick={() => updateCatalog.mutate({ id: String(row.id), payload: { ...(row as DataCatalogEntry), company_id: String(row.company_id), ai_ready: !value } })}>{value ? 'Enabled' : 'Disabled'}</button> },
              { key: 'id', label: 'Action', render: (value) => <button className="rounded-xl border border-red-300/20 bg-red-400/10 px-2 py-1 text-xs text-red-100 hover:bg-red-400/20" onClick={() => deleteCatalog.mutate(String(value))}><Trash2 className="mr-1 inline h-3 w-3" />Delete</button> },
            ]}
          />
        </Panel>

        <Panel title="Upload Manifests" description="Local uploads and cloud-linked source manifests show their company ownership and intake metadata.">
          <DataTable
            rows={uploadRows as Array<Record<string, unknown>>}
            emptyTitle="No upload manifests yet"
            columns={[
              { key: 'company_name', label: 'Company' },
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
              <pre className="mt-3 overflow-x-auto rounded-2xl bg-slate-950/40 p-3 text-xs text-slate-200">{JSON.stringify(uploadPreview, null, 2)}</pre>
            </div>
          ) : null}
        </Panel>
      </div>
      ) : null}

      {activeView === 'mapping' ? (
      <div className="mt-4">
        <Panel title="Mapping Studio" description="Mapping rules stay isolated per company and document how source fields transform into target module fields.">
          <form className="mb-4 grid gap-3 md:grid-cols-3" onSubmit={submitMapping}>
            <select className={selectClass} value={newMapping.source_system} onChange={(event) => setNewMapping({ ...newMapping, source_system: event.target.value })} required>
              <option value="">Select source system</option>
              {rows.map((system) => (
                <option key={system.id} value={system.system_name}>
                  {system.system_name}
                </option>
              ))}
            </select>
            <input className={inputClass} placeholder="Source field" value={newMapping.source_field} onChange={(event) => setNewMapping({ ...newMapping, source_field: event.target.value })} required />
            <input className={inputClass} placeholder="Target entity" value={newMapping.target_entity} onChange={(event) => setNewMapping({ ...newMapping, target_entity: event.target.value })} required />
            <input className={inputClass} placeholder="Target field" value={newMapping.target_field} onChange={(event) => setNewMapping({ ...newMapping, target_field: event.target.value })} required />
            <input className={inputClass} placeholder="Transform rule" value={newMapping.transform_rule ?? ''} onChange={(event) => setNewMapping({ ...newMapping, transform_rule: event.target.value })} />
            <input className={inputClass} type="number" step="0.01" min="0" max="1" placeholder="Confidence" value={newMapping.confidence} onChange={(event) => setNewMapping({ ...newMapping, confidence: Number(event.target.value) })} required />
            <button className="rounded-2xl border border-cyan-300/20 bg-cyan-400/15 px-3 py-2 text-sm font-semibold text-cyan-50 disabled:opacity-60 md:col-span-3" disabled={createMapping.isPending}>
              {createMapping.isPending ? 'Saving...' : 'Add Mapping Rule'}
            </button>
          </form>
          <DataTable
            rows={mappingRows as Array<DataMappingRule & Record<string, unknown>>}
            emptyTitle="No mapping rules"
            columns={[
              { key: 'company_name', label: 'Company' },
              { key: 'source_system', label: 'Source System' },
              { key: 'source_field', label: 'Source Field' },
              { key: 'target_entity', label: 'Target Entity' },
              { key: 'target_field', label: 'Target Field' },
              { key: 'confidence', label: 'Confidence', render: (value, row) => (
                <div className="flex items-center gap-2">
                  <input className="w-20 rounded-xl border border-white/10 bg-white/10 px-2 py-1 text-xs text-white" type="number" step="0.01" min="0" max="1" value={Number(value)} onChange={(event) => updateMapping.mutate({ id: String(row.id), payload: { ...(row as DataMappingRule), company_id: String(row.company_id), confidence: Number(event.target.value) } })} />
                  <StatusBadge status={`${Math.round(Number(value) * 100)}%`} />
                </div>
              ) },
              { key: 'id', label: 'Action', render: (value) => <button className="rounded-xl border border-red-300/20 bg-red-400/10 px-2 py-1 text-xs text-red-100 hover:bg-red-400/20" onClick={() => deleteMapping.mutate(String(value))}><Trash2 className="mr-1 inline h-3 w-3" />Delete</button> },
            ]}
          />
        </Panel>
      </div>
      ) : null}

      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/45 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-cyan-400/15 p-2.5 text-cyan-100">
            <Cable className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Company isolation and source-specific intake are active</p>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              Super Admin explicitly chooses the company before adding data. Admin users remain company-scoped. Source forms adapt to ERP, database, cloud, IoT, and file upload requirements, including links, credentials, tokens, and route metadata.
            </p>
          </div>
        </div>
      </div>
      <ModuleImpactSummary moduleKey="integration-hub" />
      <ModuleImpactSummary moduleKey="data-hub" />
    </>
  );
}
