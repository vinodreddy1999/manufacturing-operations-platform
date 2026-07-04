import { FormEvent, useMemo, useRef, useState } from 'react';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { Cable, CheckCircle2, Database, Gauge, KeyRound, RadioTower, Route, ShieldCheck, Trash2, UploadCloud } from 'lucide-react';

import { DataTable } from '../components/DataTable';
import { ErrorState } from '../components/ErrorState';
import { LazyImpactSummary } from '../components/LazyImpactSummary';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { Panel } from '../components/Panel';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { canManagePlatform, canUseDataHubUploads } from '../lib/rbac';
import { backend } from '../services/api';
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

type DataSourceOption = {
  value: string;
  label: string;
  group: string;
  description: string;
  auth: string;
  connectorType: string;
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

const powerBiSourceGroups: Array<{ group: string; sources: Omit<DataSourceOption, 'group'>[] }> = [
  {
    group: 'Files',
    sources: [
      { value: 'excel', label: 'Excel', description: 'Workbook, sheet, named table, and multi-sheet imports.', auth: 'File upload or cloud link', connectorType: 'FILE' },
      { value: 'csv', label: 'CSV', description: 'Delimited files with encoding, header, and schema detection.', auth: 'File upload or folder path', connectorType: 'FILE' },
      { value: 'json', label: 'JSON', description: 'Nested JSON documents with flattening and array expansion.', auth: 'File upload, URL, or API key', connectorType: 'FILE' },
      { value: 'xml', label: 'XML', description: 'XML feeds and exported ERP document structures.', auth: 'File upload or URL', connectorType: 'FILE' },
      { value: 'pdf', label: 'PDF table extraction', description: 'Extract tabular data from invoices, statements, and reports.', auth: 'File upload', connectorType: 'DOCUMENT' },
      { value: 'folder', label: 'Folder import', description: 'Combine files from a local, network, or cloud folder.', auth: 'Folder permission', connectorType: 'FOLDER' },
    ],
  },
  {
    group: 'Databases',
    sources: [
      { value: 'sql_server', label: 'SQL Server', description: 'Read-only SQL Server tables, views, or queries.', auth: 'Database credentials / AD', connectorType: 'DATABASE' },
      { value: 'mysql', label: 'MySQL', description: 'MySQL operational tables and reporting views.', auth: 'Database credentials', connectorType: 'DATABASE' },
      { value: 'postgresql', label: 'PostgreSQL', description: 'PostgreSQL schemas, tables, views, and warehouse marts.', auth: 'Database credentials', connectorType: 'DATABASE' },
      { value: 'oracle', label: 'Oracle', description: 'Oracle ERP and operational data schemas.', auth: 'Database credentials / wallet', connectorType: 'DATABASE' },
      { value: 'mongodb', label: 'MongoDB', description: 'Document collections with flattening and schema inference.', auth: 'Connection string', connectorType: 'DATABASE' },
      { value: 'sqlite', label: 'SQLite', description: 'Embedded database files for local exports and edge stores.', auth: 'File permission', connectorType: 'DATABASE' },
      { value: 'warehouse', label: 'Data warehouse connection', description: 'Cloud warehouse views and curated analytics datasets.', auth: 'OAuth / key / IAM', connectorType: 'WAREHOUSE' },
    ],
  },
  {
    group: 'APIs and Web',
    sources: [
      { value: 'rest_api', label: 'REST API', description: 'JSON/XML endpoints with headers, params, and pagination.', auth: 'API key / OAuth2 / Basic', connectorType: 'API' },
      { value: 'graphql', label: 'GraphQL API', description: 'GraphQL queries and variables for business entities.', auth: 'Bearer token / OAuth2', connectorType: 'API' },
      { value: 'web_url', label: 'Web URL', description: 'Web table import from a public or internal URL.', auth: 'No auth / header auth', connectorType: 'WEB' },
      { value: 'portal_login', label: 'Web portal login-based import', description: 'Portal-driven downloads requiring credentials and approval.', auth: 'Username/password / MFA handoff', connectorType: 'WEB' },
      { value: 'odata', label: 'OData feed', description: 'SAP, Dynamics, and service feeds with entity selection.', auth: 'OAuth2 / Basic / API key', connectorType: 'API' },
      { value: 'webhook', label: 'Webhook receiver', description: 'Real-time inbound events for machine or business updates.', auth: 'Signed webhook secret', connectorType: 'WEBHOOK' },
    ],
  },
  {
    group: 'Cloud Apps',
    sources: [
      { value: 'google_sheets', label: 'Google Sheets', description: 'Sheets, ranges, and shared spreadsheets.', auth: 'OAuth2 / service account', connectorType: 'CLOUD_APP' },
      { value: 'sharepoint', label: 'SharePoint', description: 'SharePoint lists, libraries, and Excel files.', auth: 'Microsoft OAuth2', connectorType: 'CLOUD_APP' },
      { value: 'onedrive', label: 'OneDrive', description: 'OneDrive files and folders.', auth: 'Microsoft OAuth2', connectorType: 'CLOUD_APP' },
      { value: 'google_drive', label: 'Google Drive', description: 'Drive files, folders, and exported Sheets.', auth: 'Google OAuth2', connectorType: 'CLOUD_APP' },
      { value: 'salesforce', label: 'Salesforce', description: 'CRM accounts, orders, service, and custom objects.', auth: 'OAuth2', connectorType: 'CLOUD_APP' },
      { value: 'sap', label: 'SAP', description: 'SAP S/4HANA, ECC, OData, IDoc, and exported files.', auth: 'OAuth2 / Basic / SAP client', connectorType: 'ERP' },
      { value: 'zoho', label: 'Zoho', description: 'Zoho CRM, inventory, books, and custom modules.', auth: 'OAuth2', connectorType: 'CLOUD_APP' },
      { value: 'servicenow', label: 'ServiceNow', description: 'Tickets, assets, workflow, and service records.', auth: 'OAuth2 / Basic', connectorType: 'CLOUD_APP' },
    ],
  },
  {
    group: 'Manufacturing / Operations Sources',
    sources: [
      { value: 'erp', label: 'ERP', description: 'Master data, purchasing, inventory, finance, and orders.', auth: 'API / database / file export', connectorType: 'ERP' },
      { value: 'mes', label: 'MES', description: 'Production execution, work orders, line status, and OEE.', auth: 'API / database / OPC bridge', connectorType: 'MES' },
      { value: 'wms', label: 'WMS', description: 'Warehouse receiving, bin, picking, packing, and dispatch.', auth: 'API / database / file export', connectorType: 'WMS' },
      { value: 'scm', label: 'SCM', description: 'Supply chain plans, shipment, suppliers, and lead times.', auth: 'API / file / EDI', connectorType: 'SCM' },
      { value: 'iot_machine', label: 'IoT machine data', description: 'Machine telemetry, runtime, temperature, and throughput.', auth: 'Token / certificate', connectorType: 'IOT' },
      { value: 'plc', label: 'PLC/device data', description: 'PLC values through gateway, OPC-UA, or edge bridge.', auth: 'Certificate / gateway token', connectorType: 'DEVICE' },
      { value: 'barcode_rfid', label: 'Barcode/RFID data', description: 'Scan events, goods movement, pallet, and bin tracking.', auth: 'Device key / file feed', connectorType: 'EVENT' },
      { value: 'sensor', label: 'Sensor data', description: 'Environmental, quality, safety, and condition monitoring.', auth: 'Token / MQTT cert', connectorType: 'IOT' },
    ],
  },
  {
    group: 'Manual Data',
    sources: [
      { value: 'manual_entry', label: 'Manual entry form', description: 'Controlled entry for small master-data or correction sets.', auth: 'Platform RBAC', connectorType: 'MANUAL' },
      { value: 'bulk_paste', label: 'Bulk copy-paste table', description: 'Paste tabular rows and validate before import.', auth: 'Platform RBAC', connectorType: 'MANUAL' },
      { value: 'template_upload', label: 'Template-based upload', description: 'Download template, fill data, upload and validate.', auth: 'Platform RBAC', connectorType: 'MANUAL' },
    ],
  },
];

const flatPowerBiSources = powerBiSourceGroups.flatMap((group) => group.sources.map((source) => ({ ...source, group: group.group })));
const guidedSteps = ['Select source', 'Connection details', 'Test connection', 'Select data', 'Preview', 'Transform', 'Map fields', 'Validate', 'Destination', 'Import or refresh'];
const transformOptions = ['Rename columns', 'Remove columns', 'Change data type', 'Filter rows', 'Remove duplicates', 'Replace values', 'Split columns', 'Merge columns', 'Trim/clean text', 'Date formatting', 'Currency formatting', 'Join/merge datasets', 'Append datasets', 'Create calculated columns'];
const refreshOptions = ['One-time import', 'Manual refresh', 'Scheduled refresh', 'Incremental refresh', 'Real-time webhook update', 'Retry failed refresh'];
const destinationModules = ['Inventory', 'Planning', 'Production', 'Maintenance', 'Finance', 'Reports', 'Admin master data'];
const previewRows = [
  { item_code: 'RM-STEEL-001', item_name: 'Steel Coil', quantity: '680', plant: 'Plant 01', status: 'Available' },
  { item_code: 'FG-PUMP-041', item_name: 'Pump Assembly', quantity: '94', plant: 'Plant 01', status: 'Reserved' },
  { item_code: 'SP-BEAR-009', item_name: 'Bearing Kit', quantity: '12', plant: 'Plant 02', status: 'Low Stock' },
];
const validationRows = [
  { rule: 'Required destination fields mapped', result: 'Passed', severity: 'Info' },
  { rule: 'Duplicate item code check', result: '2 warnings', severity: 'Warning' },
  { rule: 'Critical import approval', result: 'Required before posting', severity: 'Approval' },
];
const refreshHistoryRows = [
  { time: '2026-06-22 09:00', source: 'SAP S/4HANA Inventory', mode: 'Scheduled refresh', status: 'Completed', rows: '12,480' },
  { time: '2026-06-22 08:15', source: 'WMS Barcode Events', mode: 'Incremental refresh', status: 'Completed', rows: '3,128' },
  { time: '2026-06-21 23:45', source: 'Supplier REST API', mode: 'Retry failed refresh', status: 'Attention Needed', rows: '0' },
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

function PowerBiGetDataExperience({
  selectedSource,
  selectedSourceValue,
  onSelectSource,
  wizardStep,
  setWizardStep,
  selectedTransforms,
  setSelectedTransforms,
  selectedDestination,
  setSelectedDestination,
  selectedRefresh,
  setSelectedRefresh,
  connectionTested,
  setConnectionTested,
  targetCompanyName,
  moduleFilter,
  onCreateDraft,
}: {
  selectedSource: DataSourceOption;
  selectedSourceValue: string;
  onSelectSource: (source: DataSourceOption) => void;
  wizardStep: number;
  setWizardStep: (step: number) => void;
  selectedTransforms: string[];
  setSelectedTransforms: (items: string[]) => void;
  selectedDestination: string;
  setSelectedDestination: (module: string) => void;
  selectedRefresh: string;
  setSelectedRefresh: (refresh: string) => void;
  connectionTested: boolean;
  setConnectionTested: (tested: boolean) => void;
  targetCompanyName: string;
  moduleFilter: string;
  onCreateDraft: () => void;
}) {
  const [sourceSearch, setSourceSearch] = useState('');
  const [sourceMenuOpen, setSourceMenuOpen] = useState(false);
  const visibleDestinations = destinationModules.filter((module) => !moduleFilter || module === moduleFilter);
  const detailFields = connectionFieldsFor(selectedSource);
  const commonSourceValues = ['excel', 'sql_server', 'csv', 'web_url', 'odata', 'postgresql', 'google_sheets', 'manual_entry'];
  const commonSources = commonSourceValues
    .map((value) => flatPowerBiSources.find((source) => source.value === value))
    .filter(Boolean) as DataSourceOption[];
  const quickCards = [
    { title: 'Import from Excel', source: flatPowerBiSources.find((source) => source.value === 'excel') },
    { title: 'Import from SQL Server', source: flatPowerBiSources.find((source) => source.value === 'sql_server') },
    { title: 'Paste data into table', source: flatPowerBiSources.find((source) => source.value === 'bulk_paste') },
    { title: 'Connect web or API', source: flatPowerBiSources.find((source) => source.value === 'rest_api') },
  ].filter((item): item is { title: string; source: DataSourceOption } => Boolean(item.source));
  const normalizedSearch = sourceSearch.trim().toLowerCase();
  const matchingSourceGroups = powerBiSourceGroups
    .map((group) => ({
      ...group,
      sources: group.sources.filter((source) =>
        !normalizedSearch
        || `${group.group} ${source.label} ${source.description} ${source.auth} ${source.connectorType}`.toLowerCase().includes(normalizedSearch)),
    }))
    .filter((group) => group.sources.length);
  const stepLabel = guidedSteps[wizardStep - 1] ?? guidedSteps[0];
  const completedCount = Math.max(0, wizardStep - 1);
  return (
    <div className="mt-4 space-y-4">
      <Panel title="Home" description="Power BI-style ribbon for choosing sources, entering data, transforming data, and creating import drafts.">
        <div className="overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/40">
          <div className="flex flex-wrap gap-1 border-b border-white/10 bg-white/[0.03] px-4 pt-3">
            {['File', 'Home', 'Insert', 'Modeling', 'View', 'Optimize', 'Help'].map((tab) => (
              <button
                key={tab}
                className={`rounded-t-xl px-4 py-2 text-sm font-semibold transition ${tab === 'Home' ? 'border-b-2 border-cyan-300 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="relative flex flex-wrap gap-2 border-b border-white/10 bg-white/[0.04] p-3">
            <button
              type="button"
              className={`min-w-[92px] rounded-2xl border px-3 py-3 text-center text-sm transition ${sourceMenuOpen ? 'border-cyan-300/35 bg-cyan-400/14 text-white' : 'border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/8'}`}
              onClick={() => setSourceMenuOpen((value) => !value)}
            >
              <Database className="mx-auto mb-1 h-5 w-5 text-cyan-200" />
              Get data
              <span className="ml-1 text-slate-500">v</span>
            </button>
            {[
              ['Excel workbook', 'excel'],
              ['SQL Server', 'sql_server'],
              ['Enter data', 'manual_entry'],
              ['Recent sources', 'folder'],
              ['Transform data', 'csv'],
              ['Refresh', 'webhook'],
              ['New visual', 'reports'],
              ['Text box', 'bulk_paste'],
              ['More visuals', 'template_upload'],
            ].map(([label, value]) => {
              const source = flatPowerBiSources.find((item) => item.value === value);
              return (
                <button
                  key={label}
                  type="button"
                  className="min-w-[92px] rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-center text-sm text-slate-300 transition hover:bg-white/8 hover:text-white"
                  onClick={() => {
                    if (source) {
                      onSelectSource(source);
                      setSourceMenuOpen(false);
                    }
                  }}
                >
                  <Database className="mx-auto mb-1 h-5 w-5 text-slate-300" />
                  {label}
                </button>
              );
            })}
            {sourceMenuOpen ? (
              <div className="absolute left-3 top-[96px] z-20 w-full max-w-[360px] rounded-2xl border border-white/10 bg-slate-950/95 p-3 shadow-[0_28px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                <p className="px-3 py-2 text-sm font-semibold text-white">Common data sources</p>
                <div className="space-y-1">
                  {commonSources.map((source) => (
                    <button
                      key={source.value}
                      type="button"
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${selectedSourceValue === source.value ? 'bg-cyan-400/14 text-cyan-50' : 'text-slate-300 hover:bg-white/8 hover:text-white'}`}
                      onClick={() => {
                        onSelectSource(source);
                        setSourceMenuOpen(false);
                      }}
                    >
                      <Database className="h-4 w-4 text-cyan-200" />
                      <span>
                        <span className="block font-medium">{source.label}</span>
                        <span className="block text-xs text-slate-500">{source.group}</span>
                      </span>
                    </button>
                  ))}
                </div>
                <div className="mt-2 border-t border-white/10 pt-2">
                  <button
                    type="button"
                    className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-cyan-100 hover:bg-cyan-400/10"
                    onClick={() => {
                      setSourceMenuOpen(false);
                      setSourceSearch('');
                    }}
                  >
                    More...
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          <div className="grid min-h-[320px] place-items-center bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.14),transparent_42%),rgba(15,23,42,0.18)] p-8 text-center">
            <div className="w-full max-w-5xl">
              <h2 className="text-3xl font-semibold tracking-tight text-white">Add data to your platform</h2>
              <p className="mt-3 text-lg text-slate-300">Once loaded, your data can be previewed, transformed, mapped, validated, and routed to the selected module.</p>
              <div className="mt-8 grid gap-4 md:grid-cols-4">
                {quickCards.map(({ title, source }) => (
                  <button
                    key={title}
                    type="button"
                    className={`rounded-[24px] border p-5 text-left transition hover:-translate-y-0.5 ${selectedSourceValue === source.value ? 'border-cyan-300/45 bg-cyan-400/14 shadow-[0_0_34px_rgba(34,211,238,0.14)]' : 'border-white/10 bg-white/[0.05] hover:bg-white/8'}`}
                    onClick={() => onSelectSource(source)}
                  >
                    <Database className="h-8 w-8 text-cyan-200" />
                    <p className="mt-5 font-semibold text-white">{title}</p>
                    <p className="mt-2 text-sm leading-5 text-slate-400">{source.description}</p>
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="mt-6 text-sm font-semibold text-cyan-200 hover:text-cyan-100"
                onClick={() => {
                  setSourceMenuOpen(true);
                  setSourceSearch('');
                }}
              >
                Get data from another source -&gt;
              </button>
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Start a Data Import" description="Follow this guided path. Nothing is posted into a module until you create a draft and send it for approval.">
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          {[
            ['1', 'Pick a source', 'Choose Excel, SAP, database, API, cloud app, machine data, or manual entry.'],
            ['2', 'Check and shape data', 'Test the connection, preview rows, clean values, and map fields.'],
            ['3', 'Create a safe draft', 'Select destination module and refresh mode. Critical imports require approval.'],
          ].map(([number, title, body]) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-400/12 text-sm font-bold text-cyan-100">{number}</span>
                <p className="font-semibold text-white">{title}</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
            </div>
          ))}
        </div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-300/15 bg-cyan-400/[0.06] p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-100">Current step</p>
            <p className="mt-1 text-lg font-semibold text-white">{wizardStep}. {stepLabel}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={`${completedCount} completed`} />
            <StatusBadge status={connectionTested ? 'Connection tested' : 'Connection not tested'} />
            <StatusBadge status={selectedDestination} />
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-10">
          {guidedSteps.map((step, index) => {
            const active = wizardStep === index + 1;
            const complete = wizardStep > index + 1;
            return (
              <button key={step} className={`rounded-2xl border p-3 text-left text-xs transition ${active ? 'border-cyan-300/40 bg-cyan-400/15 text-white' : complete ? 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100' : 'border-white/10 bg-white/[0.04] text-slate-400'}`} onClick={() => setWizardStep(index + 1)}>
                <span className="block text-[10px] uppercase tracking-[0.16em] text-slate-500">Step {index + 1}</span>
                <span className="mt-1 block font-semibold">{step}</span>
              </button>
            );
          })}
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
        <Panel title="Select Data Source" description={`Target client: ${targetCompanyName}. Search by source name, system type, file type, or authentication method.`}>
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              className={inputClass}
              placeholder="Search sources: Excel, SAP, PostgreSQL, API, Google Drive..."
              value={sourceSearch}
              onChange={(event) => setSourceSearch(event.target.value)}
            />
            <button type="button" className="form-button-subtle" onClick={() => setSourceSearch('')}>
              Clear Search
            </button>
          </div>
          <div className="mb-4 grid gap-3 rounded-2xl border border-white/10 bg-slate-950/25 p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Selected source</p>
              <p className="mt-1 font-semibold text-white">{selectedSource.label}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Source group</p>
              <p className="mt-1 font-semibold text-white">{selectedSource.group}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Authentication</p>
              <p className="mt-1 font-semibold text-white">{selectedSource.auth}</p>
            </div>
          </div>
          <div className="space-y-4">
            {matchingSourceGroups.map((group) => (
              <div key={group.group} className="rounded-2xl border border-white/10 bg-slate-950/25 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">{group.group}</p>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-slate-400">{group.sources.length} options</span>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {group.sources.map((source) => {
                    const fullSource = { ...source, group: group.group };
                    const active = selectedSourceValue === source.value;
                    return (
                      <button key={source.value} type="button" className={`rounded-2xl border p-3 text-left transition ${active ? 'border-cyan-300/40 bg-cyan-400/15 shadow-[0_0_24px_rgba(34,211,238,0.12)]' : 'border-white/10 bg-white/[0.04] hover:border-cyan-300/25 hover:bg-white/8'}`} onClick={() => onSelectSource(fullSource)}>
                        <span className="block font-semibold text-white">{source.label}</span>
                        <span className="mt-1 block text-xs leading-5 text-slate-400">{source.description}</span>
                        <span className="mt-2 inline-flex rounded-full border border-white/10 bg-slate-950/40 px-2 py-1 text-[11px] text-slate-300">{source.auth}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {!matchingSourceGroups.length ? (
              <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm text-amber-100">
                No sources matched your search. Try a broader term like file, database, API, SAP, or cloud.
              </div>
            ) : null}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Connection Details" description={`${selectedSource.group} / ${selectedSource.label}. Fill only the fields relevant to this source, then test before previewing data.`}>
            <div className="grid gap-3 md:grid-cols-2">
              {detailFields.map((field) => (
                <label key={field} className="text-sm font-medium text-slate-300">
                  {field}
                  <input className={`${inputClass} mt-1 w-full`} type={/password|secret|token|key/i.test(field) ? 'password' : 'text'} placeholder={`Enter ${field.toLowerCase()}`} />
                </label>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="form-button-primary" onClick={() => { setConnectionTested(true); setWizardStep(Math.max(wizardStep, 4)); }}>
                Test Connection
              </button>
              <StatusBadge status={connectionTested ? 'Connection Tested' : 'Not Tested'} />
              <StatusBadge status="Read-only mode" />
            </div>
          </Panel>

          <Panel title="Select Data to Load" description="Choose one dataset to preview. These examples show how the selector will work for tables, files, or API endpoints.">
            <div className="grid gap-2">
              {['inventory_stock_balance', 'production_work_orders', 'maintenance_assets', 'supplier_lead_times'].map((entity) => (
                <label key={entity} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200">
                  <span>{entity}</span>
                  <input type="radio" name="source-entity" defaultChecked={entity === 'inventory_stock_balance'} onChange={() => setWizardStep(Math.max(wizardStep, 5))} />
                </label>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel title="Preview Data" description="Check a small sample before you transform or map fields. This prevents wrong data entering a module.">
          <DataTable
            rows={previewRows}
            emptyTitle="No preview rows"
            columns={[
              { key: 'item_code', label: 'Item Code' },
              { key: 'item_name', label: 'Item Name' },
              { key: 'quantity', label: 'Quantity' },
              { key: 'plant', label: 'Plant' },
              { key: 'status', label: 'Status', render: (value) => <StatusBadge status={String(value)} /> },
            ]}
          />
        </Panel>

        <Panel title="Clean and Transform" description="Select transformations to apply to the import draft. You can change these before approval.">
          <div className="grid gap-2 sm:grid-cols-2">
            {transformOptions.map((option) => {
              const selected = selectedTransforms.includes(option);
              return (
                <button key={option} type="button" className={`rounded-2xl border px-3 py-2 text-left text-sm transition ${selected ? 'border-cyan-300/35 bg-cyan-400/12 text-cyan-50' : 'border-white/10 bg-white/[0.04] text-slate-400 hover:text-white'}`} onClick={() => setSelectedTransforms(selected ? selectedTransforms.filter((item) => item !== option) : [...selectedTransforms, option])}>
                  {selected ? <CheckCircle2 className="mr-2 inline h-4 w-4 text-cyan-200" /> : null}
                  {option}
                </button>
              );
            })}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Map Fields" description="Tell the platform where each source column belongs.">
          <div className="space-y-2">
            {[
              ['item_code', 'Inventory.Item Code'],
              ['quantity', 'Inventory.On Hand Quantity'],
              ['plant', 'Admin Plant ID'],
              ['status', 'Inventory Status'],
            ].map(([source, target]) => (
              <div key={source} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/25 p-3 text-sm">
                <span className="text-slate-200">{source}</span>
                <span className="text-cyan-200">to</span>
                <span className="text-white">{target}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Validate Before Import" description="Warnings and approval requirements are shown before any module data changes.">
          <div className="space-y-2">
            {validationRows.map((row) => (
              <div key={row.rule} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{row.rule}</p>
                  <StatusBadge status={row.severity} />
                </div>
                <p className="mt-1 text-sm text-slate-400">{row.result}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Create Import Draft" description="Choose destination and refresh behavior. This creates a draft, not an automatic production import.">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-300">
              Destination module
              <select className={`${selectClass} mt-1 w-full`} value={selectedDestination} onChange={(event) => setSelectedDestination(event.target.value)}>
                {visibleDestinations.map((module) => <option key={module}>{module}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-300">
              Refresh mode
              <select className={`${selectClass} mt-1 w-full`} value={selectedRefresh} onChange={(event) => setSelectedRefresh(event.target.value)}>
                {refreshOptions.map((mode) => <option key={mode}>{mode}</option>)}
              </select>
            </label>
            <button className="form-button-primary w-full" onClick={onCreateDraft}>Create Import Draft</button>
            <button className="form-button-subtle w-full" onClick={() => setWizardStep(10)}>Send for Approval</button>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function connectionFieldsFor(source: DataSourceOption) {
  if (source.connectorType === 'DATABASE' || source.connectorType === 'WAREHOUSE') return ['Server / Host', 'Port', 'Database', 'Schema or query', 'Read-only username', 'Password'];
  if (source.connectorType === 'API' || source.connectorType === 'WEBHOOK') return ['Endpoint URL', 'Auth method', 'API key / token', 'Headers', 'Pagination rule', 'Retry policy'];
  if (source.connectorType === 'CLOUD_APP' || source.connectorType === 'ERP') return ['Tenant / Client ID', 'Resource URL', 'OAuth client id', 'Client secret', 'Scope', 'Refresh policy'];
  if (source.connectorType === 'IOT' || source.connectorType === 'DEVICE' || source.connectorType === 'EVENT') return ['Gateway endpoint', 'Topic / tag path', 'Certificate alias', 'Token', 'Sampling interval', 'Device group'];
  if (source.connectorType === 'MANUAL') return ['Template name', 'Owner', 'Approval group', 'Data notes'];
  return ['File, folder, or URL', 'Sheet/table name', 'Delimiter or format', 'Encoding', 'Password if protected'];
}

export function DataHubPage({ user }: { user: RuntimeUser }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canUpload = canUseDataHubUploads(user);
  const [isDragging, setIsDragging] = useState(false);
  const [activeView, setActiveView] = useState<'get-data' | 'sources' | 'catalog' | 'mapping' | 'refresh'>('get-data');
  const [selectedSourceValue, setSelectedSourceValue] = useState('excel');
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedTransforms, setSelectedTransforms] = useState<string[]>(['Trim/clean text', 'Change data type', 'Remove duplicates']);
  const [selectedDestination, setSelectedDestination] = useState('Inventory');
  const [selectedRefresh, setSelectedRefresh] = useState('One-time import');
  const [connectionTested, setConnectionTested] = useState(false);
  const [selectedModuleFilter, setSelectedModuleFilter] = useState('');
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
  const selectedPowerSource = flatPowerBiSources.find((source) => source.value === selectedSourceValue) ?? flatPowerBiSources[0];

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
        eyebrow="Data Integration Hub"
        title="Get data, transform it, and send it to modules"
        description={`Target client: ${targetCompany?.name ?? targetCompanyId}. Use one guided flow to connect, preview, clean, map, validate, and create an approval-safe import draft.`}
      />

      <div className="mb-5 grid gap-3 md:grid-cols-4">
        {[
          ['Choose client', targetCompany?.name ?? targetCompanyId],
          ['Pick source', selectedPowerSource.label],
          ['Route to module', selectedDestination],
          ['Approval safety', connectionTested ? 'Ready for draft' : 'Test connection first'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
            <p className="mt-2 truncate font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <CompanySelector companies={companyRows} selectedCompanyId={targetCompanyId} user={user} onChange={changeTargetCompany} />
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Connected Systems" value={rows.length} helper="Persisted company integrations" icon={<Database className="h-5 w-5" />} accent="blue" />
          <StatCard label="Data Quality" value={`${quality.data?.overall_score ?? 0}%`} helper="Computed from catalog entries" icon={<Gauge className="h-5 w-5" />} accent="amber" />
          <StatCard label="AI Readiness" value={`${readiness.data?.overall_ai_readiness ?? 0}%`} helper="Catalog readiness score" icon={<RadioTower className="h-5 w-5" />} accent="violet" />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_260px]">
        <div className="rounded-2xl border border-white/10 bg-white/6 p-4 text-sm text-slate-300">
          <KeyRound className="mr-2 inline h-4 w-4 text-cyan-200" />
          Credentials are masked in the UI, stored as connection metadata only, and critical imports remain approval-first. Database connections are presented as read-only.
        </div>
        <label className="rounded-2xl border border-white/10 bg-white/6 p-3 text-sm font-medium text-slate-300">
          Destination filter
          <select className={`${selectClass} mt-2 w-full`} value={selectedModuleFilter} onChange={(event) => setSelectedModuleFilter(event.target.value)}>
            <option value="">All destination modules</option>
            {destinationModules.map((module) => <option key={module}>{module}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-slate-900/45 p-2">
        {[
          { key: 'get-data', label: 'Get Data' },
          { key: 'sources', label: 'Source Connectors' },
          { key: 'catalog', label: 'Catalog & Uploads' },
          { key: 'mapping', label: 'Field Mapping' },
          { key: 'refresh', label: 'Refresh / Logs' },
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

      {activeView === 'get-data' ? (
        <PowerBiGetDataExperience
          selectedSource={selectedPowerSource}
          selectedSourceValue={selectedSourceValue}
          onSelectSource={(source) => {
            setSelectedSourceValue(source.value);
            setConnectionTested(false);
            setWizardStep(2);
            setNewConnection((current) => ({
              ...current,
              company_id: targetCompanyId,
              system_name: current.system_name || `${source.label} connector`,
              system_type: source.connectorType,
              source_category: source.group,
              auth_method: source.auth,
            }));
          }}
          wizardStep={wizardStep}
          setWizardStep={setWizardStep}
          selectedTransforms={selectedTransforms}
          setSelectedTransforms={setSelectedTransforms}
          selectedDestination={selectedDestination}
          setSelectedDestination={setSelectedDestination}
          selectedRefresh={selectedRefresh}
          setSelectedRefresh={setSelectedRefresh}
          connectionTested={connectionTested}
          setConnectionTested={setConnectionTested}
          targetCompanyName={targetCompany?.name ?? targetCompanyId}
          moduleFilter={selectedModuleFilter}
          onCreateDraft={() => {
            createConnection.mutate({
              ...newConnection,
              company_id: targetCompanyId,
              system_name: newConnection.system_name || `${selectedPowerSource.label} connector`,
              system_type: selectedPowerSource.connectorType,
              source_category: selectedPowerSource.group,
              auth_method: selectedPowerSource.auth,
              connection_status: connectionTested ? 'Tested - Draft' : 'Draft',
              connection_details: {
                selected_source: selectedPowerSource.label,
                selected_group: selectedPowerSource.group,
                destination_module: selectedDestination,
                refresh_mode: selectedRefresh,
                transformations: selectedTransforms.join(', '),
                credentials: 'masked',
                import_policy: 'approval_required',
              },
            });
          }}
        />
      ) : null}

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

      {activeView === 'refresh' ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Panel title="Refresh History" description="One-time, scheduled, incremental, webhook, and retry refresh outcomes.">
            <DataTable
              rows={refreshHistoryRows.filter((row) => !selectedModuleFilter || row.source.toLowerCase().includes(selectedModuleFilter.toLowerCase()) || selectedModuleFilter === 'Reports')}
              emptyTitle="No refresh runs"
              columns={[
                { key: 'time', label: 'Time' },
                { key: 'source', label: 'Source' },
                { key: 'mode', label: 'Refresh Mode' },
                { key: 'rows', label: 'Rows' },
                { key: 'status', label: 'Status', render: (value) => <StatusBadge status={String(value)} /> },
              ]}
            />
          </Panel>
          <Panel title="Error Logs and Audit Trail" description="Every import decision is tracked before data reaches a module.">
            <div className="space-y-3">
              {[
                ['Credential policy', 'API keys masked, OAuth tokens stored outside visible forms, no hardcoded secrets.'],
                ['Read-only database mode', 'Database connectors request SELECT/read-only access by default.'],
                ['Approval gate', 'Critical imports and master-data overwrites require approval before execution.'],
                ['Audit log', 'Connector, client, module, mapping, validation, approver, and result are recorded.'],
              ].map(([title, body]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                  <p className="font-semibold text-white">{title}</p>
                  <p className="mt-1 text-sm text-slate-400">{body}</p>
                </div>
              ))}
            </div>
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
      <LazyImpactSummary moduleKey="integration-hub" />
      <LazyImpactSummary moduleKey="data-hub" />
    </>
  );
}
