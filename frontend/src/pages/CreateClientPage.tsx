import { FormEvent, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { MultiSelectAccessGrid, type AccessGridItem } from '../components/MultiSelectAccessGrid';
import { PageHeader } from '../components/PageHeader';
import { Panel } from '../components/Panel';
import { platformApplications, platformModules } from '../platform/data';
import { usePlatform } from '../platform/PlatformContext';
import type { ClientStatus, CurrencyCode } from '../platform/types';

const markets = [
  { market: 'United States', region: 'North America', currency: 'USD' },
  { market: 'India', region: 'Asia', currency: 'INR' },
  { market: 'European Union', region: 'Europe', currency: 'EUR' },
  { market: 'United Kingdom', region: 'Europe', currency: 'GBP' },
  { market: 'United Arab Emirates', region: 'Middle East', currency: 'AED' },
] as const;

const currencies: CurrencyCode[] = ['USD', 'INR', 'EUR', 'GBP', 'AED'];
const clientApplications = platformApplications.filter((item) => item !== 'Platform Management');
const clientModules = platformModules.filter((item) => item !== 'Admin');

const applicationGroups: Record<string, string> = {
  Admin: 'Platform',
  Operations: 'Operations',
  'Customer Portal': 'Portals',
  'Supplier Portal': 'Portals',
  'Reports & Analytics': 'Data & Integration',
  'Manufacturing Data Hub': 'Data & Integration',
  'Integration Hub': 'Data & Integration',
  'AI Intelligence': 'Intelligence',
};

const moduleGroups: Record<string, string> = {
  Planning: 'Operations Core',
  Inventory: 'Operations Core',
  Warehouse: 'Operations Core',
  Production: 'Operations Core',
  Maintenance: 'Asset, Quality & Governance',
  Quality: 'Asset, Quality & Governance',
  Compliance: 'Asset, Quality & Governance',
  'Document Management': 'Asset, Quality & Governance',
  Procurement: 'Commercial & Finance',
  'Sales & Distribution': 'Commercial & Finance',
  'Costing & Profitability': 'Commercial & Finance',
  'Customer Portal': 'Portals',
  'Supplier Portal': 'Portals',
  'Reports & Analytics': 'Data & Intelligence',
  'Manufacturing Data Hub': 'Data & Intelligence',
  'Integration Hub': 'Data & Intelligence',
  'AI Intelligence': 'Data & Intelligence',
};

const applicationItems: AccessGridItem[] = clientApplications.map((label) => ({ label, group: applicationGroups[label] ?? 'Applications' }));
const moduleItems: AccessGridItem[] = clientModules.map((label) => ({ label, group: moduleGroups[label] ?? 'Modules' }));

type ClientForm = {
  clientName: string;
  market: string;
  region: string;
  currency: CurrencyCode;
  status: ClientStatus;
  enabledApplications: string[];
  enabledModules: string[];
};

type ValidationErrors = Partial<Record<'clientName' | 'market' | 'region' | 'currency' | 'enabledApplications' | 'enabledModules', string>>;

export function CreateClientPage() {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const { state, createClient, updateClient } = usePlatform();
  const existingClient = clientId ? state.clients.find((client) => client.clientId === clientId) : undefined;
  const editing = Boolean(clientId);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [form, setForm] = useState<ClientForm>(() => existingClient ? {
    clientName: existingClient.clientName,
    market: existingClient.market,
    region: existingClient.region,
    currency: existingClient.currency,
    status: existingClient.status,
    enabledApplications: [...existingClient.enabledApplications],
    enabledModules: [...existingClient.enabledModules],
  } : {
    clientName: '',
    market: 'United States',
    region: 'North America',
    currency: 'USD',
    status: 'Trial',
    enabledApplications: [...clientApplications],
    enabledModules: [...clientModules],
  });

  if (editing && !existingClient) {
    return <Panel title="Client not found" description="The requested client does not exist."><button className="form-button-primary" onClick={() => navigate('/admin/clients')}>Return to Clients</button></Panel>;
  }

  function validate() {
    const nextErrors: ValidationErrors = {};
    if (!form.clientName.trim()) nextErrors.clientName = 'Client Name is required.';
    if (!form.market.trim()) nextErrors.market = 'Market is required.';
    if (!form.region.trim()) nextErrors.region = 'Region is required.';
    if (!form.currency) nextErrors.currency = 'Currency is required.';
    if (!form.enabledApplications.length) nextErrors.enabledApplications = 'Select at least one application.';
    if (!form.enabledModules.length) nextErrors.enabledModules = 'Select at least one module.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    const payload = { ...form, clientName: form.clientName.trim() };
    const client = existingClient ? updateClient(existingClient.clientId, payload) : createClient(payload);
    navigate(`/admin/clients/${client.clientId}/health`);
  }

  function updateAccess(field: 'enabledApplications' | 'enabledModules', selectedItems: string[]) {
    setForm((current) => ({ ...current, [field]: selectedItems }));
    if (selectedItems.length) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Client Administration"
        title={editing ? `Edit ${existingClient?.clientName}` : 'Create Client'}
        description="Configure the client profile, high-level applications, and functional module capabilities. Client ID and audit history are managed automatically."
      />
      <Panel title="Client access profile" description={editing ? `Editing ${existingClient?.clientId}` : 'Commercial, regional, subscription, and access configuration for the new tenant.'}>
        <form className="space-y-6" onSubmit={submit} noValidate>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <FormField label="Client Name" error={errors.clientName} className="md:col-span-2 xl:col-span-1">
              <input className="form-input mt-1 w-full" value={form.clientName} onChange={(event) => { setForm({ ...form, clientName: event.target.value }); setErrors({ ...errors, clientName: undefined }); }} required />
            </FormField>
            <FormField label="Market" error={errors.market}>
              <select className="form-input mt-1 w-full" value={form.market} onChange={(event) => { const item = markets.find((market) => market.market === event.target.value)!; setForm({ ...form, market: item.market, region: item.region, currency: item.currency }); setErrors({ ...errors, market: undefined, region: undefined, currency: undefined }); }} required>
                {markets.map((item) => <option key={item.market}>{item.market}</option>)}
              </select>
            </FormField>
            <FormField label="Region" error={errors.region}>
              <input className="form-input mt-1 w-full" value={form.region} onChange={(event) => { setForm({ ...form, region: event.target.value }); setErrors({ ...errors, region: undefined }); }} required />
            </FormField>
            <FormField label="Currency" error={errors.currency}>
              <select className="form-input mt-1 w-full" value={form.currency} onChange={(event) => { setForm({ ...form, currency: event.target.value as CurrencyCode }); setErrors({ ...errors, currency: undefined }); }} required>
                {currencies.map((currency) => <option key={currency}>{currency}</option>)}
              </select>
              <span className="mt-1 block text-xs text-slate-500">Auto-filled from market; Super Admin can override.</span>
            </FormField>
            <FormField label="Status">
              <select className="form-input mt-1 w-full" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ClientStatus })}>
                <option>Active</option><option>Trial</option><option>Suspended</option>
              </select>
            </FormField>
          </div>

          <div>
            <MultiSelectAccessGrid
              title="Enabled Applications"
              description="High-level products available to this client."
              items={applicationItems}
              selectedItems={form.enabledApplications}
              onChange={(items) => updateAccess('enabledApplications', items)}
              searchPlaceholder="Search applications..."
              columns={3}
              showSelectAll
              showClear
              showSelectedCount
            />
            {errors.enabledApplications ? <p className="mt-2 text-sm text-rose-300">{errors.enabledApplications}</p> : null}
          </div>

          <div>
            <MultiSelectAccessGrid
              title="Enabled Modules"
              description="Functional capabilities available inside the selected applications."
              items={moduleItems}
              selectedItems={form.enabledModules}
              onChange={(items) => updateAccess('enabledModules', items)}
              searchPlaceholder="Search modules..."
              columns={3}
              showSelectAll
              showClear
              showSelectedCount
            />
            {errors.enabledModules ? <p className="mt-2 text-sm text-rose-300">{errors.enabledModules}</p> : null}
          </div>

          <div className="sticky bottom-3 flex justify-end gap-3 rounded-2xl border border-white/10 bg-slate-950/85 p-4 shadow-2xl backdrop-blur-xl">
            <button type="button" className="form-button-subtle" onClick={() => navigate('/admin/clients')}>Cancel</button>
            <button className="form-button-primary">{editing ? 'Save Client' : 'Create Client'}</button>
          </div>
        </form>
      </Panel>
    </div>
  );
}

function FormField({ label, error, className = '', children }: { label: string; error?: string; className?: string; children: ReactNode }) {
  return <label className={`text-sm text-slate-300 ${className}`}>{label}{children}{error ? <span className="mt-1 block text-xs text-rose-300">{error}</span> : null}</label>;
}
