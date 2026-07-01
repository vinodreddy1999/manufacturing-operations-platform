import { Download, Plus, Search } from 'lucide-react';
import { useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { createPortal } from 'react-dom';

import { platformApplications, platformModules, platformRoles } from '../platform/data';
import { usePlatform } from '../platform/PlatformContext';
import type { ClientStatus, CurrencyCode, PlatformAuditLog, PlatformClient, PlatformState, PlatformUser } from '../platform/types';
import { MultiSelectAccessGrid } from './MultiSelectAccessGrid';
import { Panel } from './Panel';
import { StatusBadge } from './StatusBadge';

export type PlatformWorkspace = 'clients' | 'markets' | 'users' | 'modules' | 'subscriptions' | 'integrations' | 'audit' | 'impact';

const workspaceTabs: Array<[PlatformWorkspace, string]> = [
  ['clients', 'Clients'],
  ['markets', 'Markets'],
  ['users', 'Users'],
  ['modules', 'Modules'],
  ['subscriptions', 'Subscriptions'],
  ['integrations', 'Integrations'],
  ['audit', 'Audit'],
  ['impact', 'Business Impact'],
];

const marketOptions = [
  { region: 'North America', market: 'United States', currency: 'USD', timezone: 'America/New_York' },
  { region: 'North America', market: 'Canada', currency: 'USD', timezone: 'America/Toronto' },
  { region: 'North America', market: 'Mexico', currency: 'USD', timezone: 'America/Mexico_City' },
  { region: 'Asia', market: 'India', currency: 'INR', timezone: 'Asia/Kolkata' },
  { region: 'Asia', market: 'Singapore', currency: 'USD', timezone: 'Asia/Singapore' },
  { region: 'Asia', market: 'Japan', currency: 'USD', timezone: 'Asia/Tokyo' },
  { region: 'Europe', market: 'European Union', currency: 'EUR', timezone: 'Europe/Berlin' },
  { region: 'Europe', market: 'United Kingdom', currency: 'GBP', timezone: 'Europe/London' },
  { region: 'Europe', market: 'Germany', currency: 'EUR', timezone: 'Europe/Berlin' },
  { region: 'Europe', market: 'France', currency: 'EUR', timezone: 'Europe/Paris' },
  { region: 'Middle East', market: 'United Arab Emirates', currency: 'AED', timezone: 'Asia/Dubai' },
  { region: 'Middle East', market: 'Saudi Arabia', currency: 'AED', timezone: 'Asia/Riyadh' },
] as const;

const clientEditableModules = platformModules.filter((item) => item !== 'Admin');
const clientEditableApplications = platformApplications.filter((item) => item !== 'Platform Management');
type SubscriptionCycle = NonNullable<PlatformClient['subscriptionCycle']>;

export function PlatformEmbeddedWorkspace({ active, onChange }: { active: PlatformWorkspace; onChange: (workspace: PlatformWorkspace) => void }) {
  const { state } = usePlatform();
  const counts: Record<PlatformWorkspace, number> = {
    clients: state.clients.length,
    markets: marketRows(state.clients).length,
    users: state.users.length,
    modules: platformModules.length,
    subscriptions: state.clients.length,
    integrations: state.clients.length,
    audit: state.auditLogs.length,
    impact: 4,
  };

  return (
    <Panel title="Platform Management Services" description="Manage platform data without leaving this central workspace.">
      <div className="mb-5 flex gap-2 overflow-x-auto border-b border-white/10 pb-3">
        {workspaceTabs.map(([id, label]) => (
          <button key={id} className={`${active === id ? 'form-button-primary' : 'form-button-subtle'} inline-flex min-w-max items-center gap-2`} onClick={() => onChange(id)}>
            {label}
            <span className="rounded-full border border-white/10 bg-slate-950/40 px-2 py-0.5 text-xs">{counts[id]}</span>
          </button>
        ))}
      </div>
      {active === 'clients' && <ClientsWorkspace />}
      {active === 'markets' && <MarketsWorkspace />}
      {active === 'users' && <UsersWorkspace />}
      {active === 'modules' && <ModulesWorkspace />}
      {active === 'subscriptions' && <SubscriptionsWorkspace />}
      {active === 'integrations' && <IntegrationsWorkspace />}
      {active === 'audit' && <AuditWorkspace />}
      {active === 'impact' && <ImpactWorkspace />}
    </Panel>
  );
}

function ClientsWorkspace() {
  const { state, updateClient, platformUser } = usePlatform();
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('');
  const [status, setStatus] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<PlatformClient | null>(null);
  const [viewingClient, setViewingClient] = useState<PlatformClient | null>(null);
  const [reason, setReason] = useState('');
  const [notice, setNotice] = useState('');

  const clients = state.clients.filter((client) =>
    (!search || `${client.clientName} ${client.clientId}`.toLowerCase().includes(search.toLowerCase()))
    && (!region || client.region === region)
    && (!status || client.status === status));

  function toggleClient(client: PlatformClient) {
    if (!reason.trim()) {
      setNotice('Enter an action reason before enabling or disabling a client.');
      return;
    }
    const nextStatus: ClientStatus = client.status === 'Suspended' ? 'Active' : 'Suspended';
    updateClient(client.clientId, { ...client, status: nextStatus }, `${nextStatus === 'Active' ? 'Enabled' : 'Disabled'} client: ${reason.trim()}`);
    setNotice(`${client.clientName} is now ${nextStatus}. Audit reason recorded by ${platformUser.fullName}.`);
    setReason('');
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_190px_180px_auto]">
        <SearchField value={search} onChange={setSearch} placeholder="Search client name or ID..." />
        <Select value={region} onChange={setRegion} label="All regions" options={unique(state.clients.map((client) => client.region))} />
        <Select value={status} onChange={setStatus} label="All statuses" options={['Active', 'Trial', 'Suspended']} />
        <button className="form-button-primary inline-flex items-center justify-center gap-2" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" />Add Client</button>
      </div>
      <label className="block text-sm text-slate-400">
        Reason for enable/disable
        <input className="form-input mt-1 w-full" placeholder="Required before changing client status" value={reason} onChange={(event) => setReason(event.target.value)} />
      </label>
      {notice && <Notice>{notice}</Notice>}
      <Table headers={['Client ID', 'Client Name', 'Industry', 'Region', 'Market', 'Currency', 'Status', 'Active Modules', 'Users', 'Created', 'Actions']} minWidth="min-w-[1320px]" count={clients.length}>
        {clients.map((client) => (
          <tr key={client.clientId} className="border-b border-white/10 hover:bg-white/[0.04]">
            <Cell accent>{client.clientId}</Cell>
            <Cell strong>{client.clientName}</Cell>
            <Cell>{client.industry ?? 'Manufacturing'}</Cell>
            <Cell>{client.region}</Cell>
            <Cell>{client.market}</Cell>
            <Cell>{client.currency}</Cell>
            <Cell><StatusBadge status={client.status} /></Cell>
            <Cell>{client.enabledModules.length}</Cell>
            <Cell>{state.users.filter((user) => user.clientId === client.clientId).length}</Cell>
            <Cell>{client.createdDate}</Cell>
            <Cell>
              <div className="flex flex-wrap gap-2">
                <button className="form-button-subtle py-1 text-xs" onClick={() => setViewingClient(client)}>View</button>
                <button className="form-button-subtle py-1 text-xs" onClick={() => setEditingClient(client)}>Edit</button>
                <button className="form-button-subtle py-1 text-xs" onClick={() => toggleClient(client)}>{client.status === 'Suspended' ? 'Enable' : 'Disable'}</button>
              </div>
            </Cell>
          </tr>
        ))}
      </Table>
      {createOpen && <ClientCreateDrawer onClose={() => setCreateOpen(false)} />}
      {editingClient && <ClientEditDrawer client={editingClient} onClose={() => setEditingClient(null)} />}
      {viewingClient && <ClientDetailDrawer client={viewingClient} onClose={() => setViewingClient(null)} />}
    </div>
  );
}

function ClientCreateDrawer({ onClose }: { onClose: () => void }) {
  const { state, createClient, platformUser, recordAudit } = usePlatform();
  const clientIdPreview = nextClientId(state);
  const [form, setForm] = useState({
    clientName: '',
    industry: 'Manufacturing',
    region: 'North America',
    market: 'United States',
    currency: 'USD' as CurrencyCode,
    status: 'Trial' as ClientStatus,
    applications: [] as string[],
    modules: [] as string[],
    plants: [{ plantId: `${clientIdPreview}-PLT-001`, plantName: 'Plant A', status: 'Active' as 'Active' | 'Inactive' }],
    reason: '',
  });
  const [error, setError] = useState('');
  const markets = marketOptions.filter((item) => item.region === form.region);

  function submit() {
    const name = form.clientName.trim();
    if (!name) { setError('Client Name is required.'); return; }
    if (state.clients.some((client) => client.clientName.toLowerCase() === name.toLowerCase())) { setError('Client Name must be unique.'); return; }
    if (!form.reason.trim()) { setError('A business reason is required.'); return; }
    if (!form.applications.length || !form.modules.length) { setError('Assign at least one application and one module.'); return; }
    if (!form.plants.some((plant) => plant.plantName.trim())) { setError('Add at least one plant for the client.'); return; }
    const client = createClient({ clientName: name, industry: form.industry, region: form.region, market: form.market, currency: form.currency, status: form.status, enabledApplications: form.applications, enabledModules: form.modules, plants: form.plants.map((plant) => ({ ...plant, plantName: plant.plantName.trim() })) });
    recordAudit({ clientId: client.clientId, clientName: client.clientName, userId: platformUser.userId, moduleName: 'Admin', action: 'Client access assigned', description: `Reason: ${form.reason.trim()}. Client ID and plant IDs generated for database tracking.`, status: 'Completed' });
    onClose();
  }

  function changeRegion(region: string) {
    const market = marketOptions.find((item) => item.region === region)!;
    setForm({ ...form, region, market: market.market, currency: market.currency as CurrencyCode });
  }

  function changeMarket(marketName: string) {
    const market = marketOptions.find((item) => item.market === marketName);
    if (!market) { setForm({ ...form, market: marketName }); return; }
    setForm({ ...form, market: market.market, currency: market.currency as CurrencyCode });
  }

  function addPlant() {
    setForm({ ...form, plants: [...form.plants, { plantId: `${clientIdPreview}-PLT-${String(form.plants.length + 1).padStart(3, '0')}`, plantName: '', status: 'Active' }] });
  }

  return createPortal(
    <Drawer title="Create Client" description="Profile, regional defaults, access, and audit reason." onClose={onClose}>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Client Unique ID"><input className="form-input mt-1 w-full" value={clientIdPreview} disabled /></Field>
        <Field label="Client Name"><input className="form-input mt-1 w-full" value={form.clientName} onChange={(event) => setForm({ ...form, clientName: event.target.value })} /></Field>
        <Field label="Industry"><input className="form-input mt-1 w-full" value={form.industry} onChange={(event) => setForm({ ...form, industry: event.target.value })} /></Field>
        <Field label="Region"><select className="form-input mt-1 w-full" value={form.region} onChange={(event) => changeRegion(event.target.value)}>{unique(marketOptions.map((item) => item.region)).map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Market"><input className="form-input mt-1 w-full" list="create-client-markets" value={form.market} onChange={(event) => changeMarket(event.target.value)} /><datalist id="create-client-markets">{markets.map((item) => <option key={item.market} value={item.market} />)}</datalist></Field>
        <Field label="Currency"><select className="form-input mt-1 w-full" value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value as CurrencyCode })}>{['USD', 'INR', 'EUR', 'GBP', 'AED'].map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Status"><select className="form-input mt-1 w-full" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ClientStatus })}><option>Active</option><option>Trial</option><option>Suspended</option></select></Field>
      </div>
      <PlantEditor plants={form.plants} onChange={(plants) => setForm({ ...form, plants })} onAdd={addPlant} />
      <AccessSections applications={form.applications} modules={form.modules} setApplications={(applications) => setForm({ ...form, applications })} setModules={(modules) => setForm({ ...form, modules })} />
      <Field label="Assignment Reason"><select className="form-input mt-1 w-full" value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })}><option value="">Select required reason</option><option>Business Requirement</option><option>Client Request</option><option>Pilot</option><option>Subscription Upgrade</option><option>Other</option></select></Field>
      <DrawerActions error={error} cancel={onClose} submit={submit} submitLabel="Create Client" />
    </Drawer>,
    document.body,
  );
}

function ClientEditDrawer({ client, onClose }: { client: PlatformClient; onClose: () => void }) {
  const { state, platformUser, replacePlatformState } = usePlatform();
  const initialUserIds = state.users.filter((user) => user.clientId === client.clientId).map((user) => user.userId);
  const [form, setForm] = useState({
    clientName: client.clientName,
    industry: client.industry ?? 'Manufacturing',
    region: client.region,
    market: client.market,
    currency: client.currency,
    status: client.status,
    applications: [...client.enabledApplications],
    modules: [...client.enabledModules],
    userIds: initialUserIds,
    plants: clientPlants(client),
    reason: '',
  });
  const [error, setError] = useState('');
  const markets = marketOptions.filter((item) => item.region === form.region);

  function changeRegion(region: string) {
    const market = marketOptions.find((item) => item.region === region)!;
    setForm({ ...form, region, market: market.market, currency: market.currency as CurrencyCode });
  }

  function changeMarket(marketName: string) {
    const market = marketOptions.find((item) => item.market === marketName);
    if (!market) { setForm({ ...form, market: marketName }); return; }
    setForm({ ...form, market: market.market, currency: market.currency as CurrencyCode });
  }

  function addPlant() {
    setForm({ ...form, plants: [...form.plants, { plantId: makePlantId(client.clientId, form.plants.length + 1), plantName: '', status: 'Active' }] });
  }

  function submit() {
    const name = form.clientName.trim();
    if (!name) { setError('Client Name is required.'); return; }
    if (state.clients.some((item) => item.clientId !== client.clientId && item.clientName.toLowerCase() === name.toLowerCase())) { setError('Client Name must be unique.'); return; }
    if (!form.reason.trim()) { setError('A change reason is required.'); return; }
    if (!form.applications.length || !form.modules.length) { setError('Assign at least one application and one module.'); return; }

    const selectedUserIds = new Set(form.userIds);
    const updatedClient: PlatformClient = {
      ...client,
      clientName: name,
      industry: form.industry,
      region: form.region,
      market: form.market,
      currency: form.currency,
      status: form.status,
      enabledApplications: form.applications,
      enabledModules: form.modules,
      disabledModules: clientEditableModules.filter((module) => !form.modules.includes(module)),
      plants: form.plants.map((plant) => ({ ...plant, plantName: plant.plantName.trim() })).filter((plant) => plant.plantName),
      lastUpdated: new Date().toISOString(),
    };

    const nextUsers = state.users.map((user) => {
      const selected = selectedUserIds.has(user.userId);
      const currentlyAssigned = user.clientId === client.clientId;
      if (selected) {
        return {
          ...user,
          clientId: client.clientId,
          clientName: name,
          region: form.region,
          market: form.market,
          plant: normalizeUserPlant(user.plant, form.plants),
          assignedApplications: intersectOrDefault(user.assignedApplications, form.applications),
          assignedModules: intersectOrDefault(user.assignedModules, form.modules),
        };
      }
      if (currentlyAssigned && !selected) {
        return {
          ...user,
          clientId: null,
          clientName: 'Platform',
          region: 'Global',
          market: 'Global',
          assignedApplications: [],
          assignedModules: [],
          status: 'Disabled' as const,
        };
      }
      return user;
    });

    replacePlatformState(withAudit({ ...state, clients: state.clients.map((item) => item.clientId === client.clientId ? updatedClient : item), users: nextUsers }, platformUser, {
      clientId: client.clientId,
      clientName: name,
      moduleName: 'Admin',
      action: 'Edited Client',
      description: `Updated market, modules, applications, and assigned users. Reason: ${form.reason.trim()}.`,
      status: 'Completed',
    }));
    onClose();
  }

  return createPortal(
    <Drawer title="Edit Client" description="Change profile, market, modules, applications, and assigned users." onClose={onClose}>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Client Unique ID"><input className="form-input mt-1 w-full" value={client.clientId} disabled /></Field>
        <Field label="Client Name"><input className="form-input mt-1 w-full" value={form.clientName} onChange={(event) => setForm({ ...form, clientName: event.target.value })} /></Field>
        <Field label="Industry"><input className="form-input mt-1 w-full" value={form.industry} onChange={(event) => setForm({ ...form, industry: event.target.value })} /></Field>
        <Field label="Region"><select className="form-input mt-1 w-full" value={form.region} onChange={(event) => changeRegion(event.target.value)}>{unique(marketOptions.map((item) => item.region)).map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Market"><input className="form-input mt-1 w-full" list={`edit-client-markets-${client.clientId}`} value={form.market} onChange={(event) => changeMarket(event.target.value)} /><datalist id={`edit-client-markets-${client.clientId}`}>{markets.map((item) => <option key={item.market} value={item.market} />)}</datalist></Field>
        <Field label="Currency"><select className="form-input mt-1 w-full" value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value as CurrencyCode })}>{['USD', 'INR', 'EUR', 'GBP', 'AED'].map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Status"><select className="form-input mt-1 w-full" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ClientStatus })}><option>Active</option><option>Trial</option><option>Suspended</option></select></Field>
      </div>
      <PlantEditor plants={form.plants} onChange={(plants) => setForm({ ...form, plants })} onAdd={addPlant} />
      <AccessSections applications={form.applications} modules={form.modules} setApplications={(applications) => setForm({ ...form, applications })} setModules={(modules) => setForm({ ...form, modules })} />
      <UserAssignmentPanel
        title="Assigned Users"
        users={state.users.filter((user) => !user.roles.includes('Super Admin'))}
        selectedUserIds={form.userIds}
        onChange={(userIds) => setForm({ ...form, userIds })}
        onExport={() => exportRows(`${client.clientName}-users.xls`, clientUserExportRows(state.users.filter((user) => user.clientId === client.clientId || form.userIds.includes(user.userId)), client))}
      />
      <Field label="Change Reason"><input className="form-input mt-1 w-full" placeholder="Required audit reason" value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} /></Field>
      <DrawerActions error={error} cancel={onClose} submit={submit} submitLabel="Save Client" />
    </Drawer>,
    document.body,
  );
}

function ClientDetailDrawer({ client, onClose }: { client: PlatformClient; onClose: () => void }) {
  const { state } = usePlatform();
  const users = state.users.filter((user) => user.clientId === client.clientId);
  const audit = state.auditLogs.filter((log) => log.clientId === client.clientId || log.clientName === client.clientName);
  const subscription = getSubscription(client, state.clients.indexOf(client));

  return createPortal(
    <Drawer title={`${client.clientName} Data`} description="Client profile, subscriptions, access, users, and audit activity in one place." onClose={onClose}>
      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="Market" value={client.market} />
        <Metric label="Users" value={users.length} />
        <Metric label="Modules" value={client.enabledModules.length} />
        <Metric label="Audit Events" value={audit.length} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
          <h4 className="font-semibold text-white">Subscription Cycle</h4>
          <div className="mt-3 grid gap-2 text-sm text-slate-300">
            <span>Plan: {subscription.plan}</span>
            <span>Cycle: {subscription.cycle}</span>
            <span>Start: {subscription.startDate}</span>
            <span>End: {subscription.endDate}</span>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
          <h4 className="font-semibold text-white">Enabled Applications</h4>
          <p className="mt-3 text-sm text-slate-300">{client.enabledApplications.join(', ')}</p>
        </div>
      </div>
      <Table headers={['Module', 'Status']} count={clientEditableModules.length}>
        {clientEditableModules.map((module) => (
          <tr key={module} className="border-b border-white/10">
            <Cell strong>{module}</Cell>
            <Cell><StatusBadge status={client.enabledModules.includes(module) ? 'Enabled' : 'Disabled'} /></Cell>
          </tr>
        ))}
      </Table>
      <Table headers={['User ID', 'Name', 'Role', 'Status']} count={users.length}>
        {users.map((user) => (
          <tr key={user.userId} className="border-b border-white/10">
            <Cell accent>{user.userId}</Cell>
            <Cell strong>{user.fullName}</Cell>
            <Cell>{user.roles.join(', ')}</Cell>
            <Cell><StatusBadge status={user.status} /></Cell>
          </tr>
        ))}
      </Table>
      <Table headers={['Timestamp', 'Module', 'Action', 'Description']} minWidth="min-w-[900px]" count={audit.length}>
        {audit.map((log) => (
          <tr key={log.logId} className="border-b border-white/10">
            <Cell>{log.timestamp}</Cell>
            <Cell>{log.moduleName}</Cell>
            <Cell strong>{log.action}</Cell>
            <Cell>{log.description ?? 'Platform change recorded'}</Cell>
          </tr>
        ))}
      </Table>
    </Drawer>,
    document.body,
  );
}

function MarketsWorkspace() {
  const { state } = usePlatform();
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('');
  const [editingMarket, setEditingMarket] = useState<MarketRow | null>(null);
  const rows = marketRows(state.clients).filter((row) =>
    (!search || `${row.market} ${row.region} ${row.currency}`.toLowerCase().includes(search.toLowerCase()))
    && (!region || row.region === region));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[1fr_240px_auto]">
        <SearchField value={search} onChange={setSearch} placeholder="Search market, region, or currency..." />
        <Select value={region} onChange={setRegion} label="All regions" options={unique(rows.map((row) => row.region))} />
        <button className="form-button-primary inline-flex items-center justify-center gap-2" onClick={() => setEditingMarket(emptyMarketRow())}><Plus className="h-4 w-4" />Add Market</button>
      </div>
      <Table headers={['Region', 'Market', 'Currency', 'Timezone', 'Clients', 'Users', 'Actions']} count={rows.length}>
        {rows.map((row) => (
          <tr key={`${row.region}-${row.market}`} className="border-b border-white/10 hover:bg-white/[0.04]">
            <Cell>{row.region}</Cell>
            <Cell strong>{row.market}</Cell>
            <Cell>{row.currency}</Cell>
            <Cell>{row.timezone}</Cell>
            <Cell>{row.clientCount}</Cell>
            <Cell>{state.users.filter((user) => user.market === row.market).length}</Cell>
            <Cell><button className="form-button-subtle py-1 text-xs" onClick={() => setEditingMarket(row)}>Edit</button></Cell>
          </tr>
        ))}
      </Table>
      {editingMarket && <MarketEditDrawer market={editingMarket} onClose={() => setEditingMarket(null)} />}
    </div>
  );
}

function MarketEditDrawer({ market, onClose }: { market: MarketRow; onClose: () => void }) {
  const { state, platformUser, replacePlatformState } = usePlatform();
  const [form, setForm] = useState({
    region: market.region,
    market: market.market,
    currency: market.currency,
    timezone: market.timezone,
    clients: state.clients.filter((client) => client.market === market.market && client.region === market.region).map(clientLabel),
    reason: '',
  });
  const [error, setError] = useState('');

  function changeRegion(region: string) {
    const option = marketOptions.find((item) => item.region === region);
    setForm({ ...form, region, market: option?.market ?? form.market, currency: (option?.currency ?? form.currency) as CurrencyCode, timezone: option?.timezone ?? form.timezone });
  }

  function changeMarket(marketName: string) {
    const option = marketOptions.find((item) => item.market === marketName);
    setForm({ ...form, market: marketName, currency: (option?.currency ?? form.currency) as CurrencyCode, timezone: option?.timezone ?? form.timezone });
  }

  function submit() {
    const marketName = form.market.trim();
    if (!form.region.trim() || !marketName) { setError('Region and Market are required.'); return; }
    if (!form.clients.length) { setError('Assign at least one client to this market.'); return; }
    if (!form.reason.trim()) { setError('A change reason is required.'); return; }

    const selectedClientIds = new Set(form.clients.map(parseOptionId));
    const nextClients = state.clients.map((client) => selectedClientIds.has(client.clientId)
      ? { ...client, region: form.region, market: marketName, currency: form.currency, lastUpdated: new Date().toISOString() }
      : client);
    const nextUsers = state.users.map((user) => {
      const client = nextClients.find((item) => item.clientId === user.clientId);
      return client ? { ...user, region: client.region, market: client.market, clientName: client.clientName } : user;
    });

    replacePlatformState(withAudit({ ...state, clients: nextClients, users: nextUsers }, platformUser, {
      clientId: null,
      clientName: 'Platform',
      moduleName: 'Admin',
      action: market.market ? 'Edited Market' : 'Created Market',
      description: `Market ${marketName} assigned to ${form.clients.length} clients. Currency ${form.currency}. Timezone ${form.timezone}. Reason: ${form.reason.trim()}.`,
      status: 'Completed',
    }));
    onClose();
  }

  const regionMarkets = marketOptions.filter((item) => item.region === form.region);
  return createPortal(
    <Drawer title={market.market ? `Edit ${market.market}` : 'Add Market'} description="Manage market defaults and assign clients manually with audit reason." onClose={onClose}>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Region"><select className="form-input mt-1 w-full" value={form.region} onChange={(event) => changeRegion(event.target.value)}>{unique(marketOptions.map((item) => item.region)).map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Market"><input list="market-list" className="form-input mt-1 w-full" value={form.market} onChange={(event) => changeMarket(event.target.value)} /><datalist id="market-list">{regionMarkets.map((item) => <option key={item.market} value={item.market} />)}</datalist></Field>
        <Field label="Currency"><select className="form-input mt-1 w-full" value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value as CurrencyCode })}>{['USD', 'INR', 'EUR', 'GBP', 'AED'].map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Timezone"><input className="form-input mt-1 w-full" value={form.timezone} onChange={(event) => setForm({ ...form, timezone: event.target.value })} /></Field>
      </div>
      <MultiSelectAccessGrid title="Assigned Clients" description="Add or remove clients for this market." items={state.clients.map(clientLabel)} selectedItems={form.clients} onChange={(clients) => setForm({ ...form, clients })} searchPlaceholder="Search clients..." columns={2} showSelectAll showClear showSelectedCount />
      <Field label="Change Reason"><input className="form-input mt-1 w-full" placeholder="Required audit reason" value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} /></Field>
      <DrawerActions error={error} cancel={onClose} submit={submit} submitLabel="Save Market" />
    </Drawer>,
    document.body,
  );
}

function UsersWorkspace() {
  const { state, updateUser } = usePlatform();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<PlatformUser | null>(null);
  const [mode, setMode] = useState('Any field');
  const [search, setSearch] = useState('');
  const [client, setClient] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');

  const rows = state.users.filter((user) => {
    const values: Record<string, string> = { Email: user.email, 'First Name': user.firstName, 'Last Name': user.lastName, 'Full Name': user.fullName, 'Login Name': user.loginName, 'User ID': user.userId };
    const haystack = mode === 'Any field' ? Object.values(values).join(' ') : values[mode];
    return (!search || haystack.toLowerCase().includes(search.toLowerCase()))
      && (!client || user.clientId === client)
      && (!role || user.roles.includes(role))
      && (!status || user.status === status);
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[160px_minmax(220px,1fr)_210px_190px_170px_auto]">
        <Select value={mode} onChange={setMode} label="Search mode" options={['Any field', 'Email', 'First Name', 'Last Name', 'Full Name', 'Login Name', 'User ID']} includeBlank={false} />
        <SearchField value={search} onChange={setSearch} placeholder={`Search ${mode.toLowerCase()}...`} />
        <Select value={client} onChange={setClient} label="All clients" options={state.clients.map((item) => [item.clientId, item.clientName])} />
        <Select value={role} onChange={setRole} label="All roles" options={platformRoles} />
        <Select value={status} onChange={setStatus} label="All statuses" options={['Active', 'Disabled']} />
        <button className="form-button-primary inline-flex items-center justify-center gap-2" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" />Add User</button>
      </div>
      <Table headers={['User ID', 'Name', 'Email', 'Login', 'Role', 'Client', 'Market', 'Last Login', 'Status', 'Action']} minWidth="min-w-[1180px]" count={rows.length}>
        {rows.map((user) => (
          <tr key={user.userId} className="border-b border-white/10 hover:bg-white/[0.04]">
            <Cell accent>{user.userId}</Cell>
            <Cell strong>{user.fullName}</Cell>
            <Cell>{user.email}</Cell>
            <Cell>{user.loginName}</Cell>
            <Cell>{user.roles.join(', ')}</Cell>
            <Cell>{user.clientName}</Cell>
            <Cell>{user.market}</Cell>
            <Cell>{user.lastLogin}</Cell>
            <Cell><StatusBadge status={user.status} /></Cell>
            <Cell>
              <div className="flex gap-2">
                <button className="form-button-subtle py-1 text-xs" onClick={() => setEditingUser(user)}>Edit</button>
                <button className="form-button-subtle py-1 text-xs" onClick={() => updateUser(user.userId, { status: user.status === 'Active' ? 'Disabled' : 'Active' }, user.status === 'Active' ? 'Disabled User' : 'Enabled User')}>{user.status === 'Active' ? 'Disable' : 'Enable'}</button>
              </div>
            </Cell>
          </tr>
        ))}
      </Table>
      {createOpen && <UserCreateModal onClose={() => setCreateOpen(false)} />}
      {editingUser && <UserEditModal user={editingUser} onClose={() => setEditingUser(null)} />}
    </div>
  );
}

function UserCreateModal({ onClose }: { onClose: () => void }) {
  const { state, createUser, platformUser, recordAudit } = usePlatform();
  const initialClient = state.clients[0];
  const userIdPreview = nextUserId(state);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    loginName: '',
    clientId: initialClient.clientId,
    department: 'Operations',
    plant: 'Plant A',
    role: 'Viewer',
    applications: [...initialClient.enabledApplications],
    modules: [...initialClient.enabledModules],
    reason: '',
  });
  const [error, setError] = useState('');
  const client = state.clients.find((item) => item.clientId === form.clientId) ?? initialClient;
  const emailExists = Boolean(form.email.trim()) && state.users.some((user) => user.email.toLowerCase() === form.email.trim().toLowerCase());
  const loginExists = Boolean(form.loginName.trim()) && state.users.some((user) => user.loginName.toLowerCase() === form.loginName.trim().toLowerCase());

  function changeClient(clientId: string) {
    const next = state.clients.find((item) => item.clientId === clientId)!;
    setForm({ ...form, clientId, plant: clientPlants(next)[0]?.plantName ?? '', applications: [...next.enabledApplications], modules: [...next.enabledModules] });
  }

  function submit() {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.loginName.trim()) { setError('First name, last name, email, and login name are required.'); return; }
    if (emailExists) { setError('Email ID already exists.'); return; }
    if (loginExists) { setError('Login name already exists.'); return; }
    if (!form.applications.length || !form.modules.length) { setError('Assign at least one application and one module.'); return; }
    if (!form.reason) { setError('An access assignment reason is required.'); return; }
    const user = createUser({ firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim(), loginName: form.loginName.trim(), clientId: client.clientId, region: client.region, market: client.market, department: form.department, plant: form.plant, warehouse: 'Warehouse A', roles: [form.role], assignedApplications: form.applications, assignedModules: form.modules, status: 'Active' });
    recordAudit({ clientId: client.clientId, clientName: client.clientName, userId: platformUser.userId, moduleName: 'Admin', action: 'User access assigned', description: `Created ${user.fullName}. Reason: ${form.reason}.`, status: 'Completed' });
    onClose();
  }

  return createPortal(
    <Drawer title="Create User" description="Identity, organization, role, application, and module access." onClose={onClose}>
      <Field label="User Unique ID"><input className="form-input mt-1 w-full" value={userIdPreview} disabled /></Field>
      <UserFormFields form={form} setForm={setForm} clients={state.clients} client={client} changeClient={changeClient} mode="create" emailExists={emailExists} loginExists={loginExists} />
      <AccessSections applications={form.applications} modules={form.modules} appItems={client.enabledApplications} moduleItems={client.enabledModules} setApplications={(applications) => setForm({ ...form, applications })} setModules={(modules) => setForm({ ...form, modules })} />
      <Field label="Assignment Reason"><select className="form-input mt-1 w-full" value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })}><option value="">Select required reason</option><option>Business Requirement</option><option>Client Request</option><option>New Employee</option><option>Role Change</option><option>Other</option></select></Field>
      <DrawerActions error={error} cancel={onClose} submit={submit} submitLabel="Create User" />
    </Drawer>,
    document.body,
  );
}

function UserEditModal({ user, onClose }: { user: PlatformUser; onClose: () => void }) {
  const { state, updateUser } = usePlatform();
  const initialClient = state.clients.find((item) => item.clientId === user.clientId) ?? state.clients[0];
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    loginName: user.loginName,
    clientId: initialClient.clientId,
    department: user.department ?? 'Operations',
    plant: user.plant ?? 'Plant A',
    roles: [...user.roles],
    status: user.status,
    applications: intersectOrDefault(user.assignedApplications, initialClient.enabledApplications),
    modules: intersectOrDefault(user.assignedModules, initialClient.enabledModules),
    reason: '',
  });
  const [error, setError] = useState('');
  const client = state.clients.find((item) => item.clientId === form.clientId) ?? initialClient;
  const emailExists = Boolean(form.email.trim()) && state.users.some((item) => item.userId !== user.userId && item.email.toLowerCase() === form.email.trim().toLowerCase());
  const loginExists = Boolean(form.loginName.trim()) && state.users.some((item) => item.userId !== user.userId && item.loginName.toLowerCase() === form.loginName.trim().toLowerCase());

  function changeClient(clientId: string) {
    const next = state.clients.find((item) => item.clientId === clientId)!;
    setForm({ ...form, clientId, plant: clientPlants(next)[0]?.plantName ?? '', applications: intersectOrDefault(form.applications, next.enabledApplications), modules: intersectOrDefault(form.modules, next.enabledModules) });
  }

  function submit() {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.loginName.trim()) { setError('First name, last name, email, and login name are required.'); return; }
    if (emailExists) { setError('Email ID already exists.'); return; }
    if (loginExists) { setError('Login name already exists.'); return; }
    if (!form.roles.length) { setError('Assign at least one role.'); return; }
    if (!form.applications.length || !form.modules.length) { setError('Assign at least one application and one module.'); return; }
    if (!form.reason.trim()) { setError('A change reason is required.'); return; }
    updateUser(user.userId, {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      fullName: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
      email: form.email.trim(),
      loginName: form.loginName.trim(),
      clientId: client.clientId,
      clientName: client.clientName,
      region: client.region,
      market: client.market,
      department: form.department,
      plant: form.plant,
      roles: form.roles,
      assignedApplications: form.applications,
      assignedModules: form.modules,
      status: form.status,
    }, `Edited user: ${form.reason.trim()}`);
    onClose();
  }

  return createPortal(
    <Drawer title="Edit User" description="Change client, role, status, and application/module access." onClose={onClose}>
      <Field label="User Unique ID"><input className="form-input mt-1 w-full" value={user.userId} disabled /></Field>
      <UserFormFields form={form} setForm={setForm} clients={state.clients} client={client} changeClient={changeClient} mode="edit" emailExists={emailExists} loginExists={loginExists} />
      <MultiSelectAccessGrid title="Assigned Roles" description="Add or remove role access for this user." items={platformRoles.filter((role) => role !== 'Super Admin' || user.roles.includes('Super Admin'))} selectedItems={form.roles} onChange={(roles) => setForm({ ...form, roles })} searchPlaceholder="Search roles..." columns={2} showSelectAll showClear showSelectedCount />
      <AccessSections applications={form.applications} modules={form.modules} appItems={client.enabledApplications} moduleItems={client.enabledModules} setApplications={(applications) => setForm({ ...form, applications })} setModules={(modules) => setForm({ ...form, modules })} />
      <Field label="Change Reason"><input className="form-input mt-1 w-full" placeholder="Required audit reason" value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} /></Field>
      <DrawerActions error={error} cancel={onClose} submit={submit} submitLabel="Save User" />
    </Drawer>,
    document.body,
  );
}

type UserFormState = {
  firstName: string;
  lastName: string;
  email: string;
  loginName: string;
  clientId: string;
  department: string;
  plant: string;
  role?: string;
  status?: PlatformUser['status'];
};

function UserFormFields<T extends UserFormState>({ form, setForm, clients, client, changeClient, mode, emailExists = false, loginExists = false }: {
  form: T;
  setForm: Dispatch<SetStateAction<T>>;
  clients: PlatformClient[];
  client: PlatformClient;
  changeClient: (clientId: string) => void;
  mode: 'create' | 'edit';
  emailExists?: boolean;
  loginExists?: boolean;
}) {
  const plants = clientPlants(client);
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Field label="First Name"><input className="form-input mt-1 w-full" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></Field>
      <Field label="Last Name"><input className="form-input mt-1 w-full" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></Field>
      <Field label="Email"><input className="form-input mt-1 w-full" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />{emailExists ? <span className="mt-1 block text-xs text-rose-300">Email ID already exists.</span> : null}</Field>
      <Field label="Login Name"><input className="form-input mt-1 w-full" value={form.loginName} onChange={(event) => setForm({ ...form, loginName: event.target.value })} />{loginExists ? <span className="mt-1 block text-xs text-rose-300">Login name already exists.</span> : null}</Field>
      <Field label="Client"><select className="form-input mt-1 w-full" value={form.clientId} onChange={(event) => changeClient(event.target.value)}>{clients.map((item) => <option key={item.clientId} value={item.clientId}>{item.clientName}</option>)}</select></Field>
      <Field label="Region"><input className="form-input mt-1 w-full" value={client.region} disabled /></Field>
      <Field label="Market"><input className="form-input mt-1 w-full" value={client.market} disabled /></Field>
      <Field label="Department"><input className="form-input mt-1 w-full" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} /></Field>
      <Field label="Plant"><select className="form-input mt-1 w-full" value={form.plant} onChange={(event) => setForm({ ...form, plant: event.target.value })}>{plants.map((plant) => <option key={plant.plantId} value={plant.plantName}>{plant.plantName}</option>)}</select></Field>
      {mode === 'create' && <Field label="Role"><select className="form-input mt-1 w-full" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>{platformRoles.filter((item) => item !== 'Super Admin').map((item) => <option key={item}>{item}</option>)}</select></Field>}
      {mode === 'edit' && <Field label="Status"><select className="form-input mt-1 w-full" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as PlatformUser['status'] })}><option>Active</option><option>Disabled</option></select></Field>}
    </div>
  );
}

function ModulesWorkspace() {
  const { state } = usePlatform();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const rows = platformModules.map((module, index) => {
    const clients = state.clients.filter((client) => module === 'Admin' || client.enabledModules.includes(module)).length;
    return {
      module,
      clients,
      users: state.users.filter((user) => user.assignedModules.includes(module)).length,
      status: clients === state.clients.length ? 'Healthy' : clients === 0 ? 'Critical' : 'Attention Needed',
      category: index < 5 ? 'Operations' : index < 11 ? 'Governance' : 'Digital',
    };
  }).filter((row) => (!search || `${row.module} ${row.category}`.toLowerCase().includes(search.toLowerCase())) && (!status || row.status === status));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[1fr_240px]">
        <SearchField value={search} onChange={setSearch} placeholder="Search module name or category..." />
        <Select value={status} onChange={setStatus} label="All statuses" options={['Healthy', 'Attention Needed', 'Critical']} />
      </div>
      <Table headers={['Module', 'Category', 'Client Access', 'Users', 'Status', 'Action']} count={rows.length}>
        {rows.map((row) => (
          <tr key={row.module} className="border-b border-white/10 hover:bg-white/[0.04]">
            <Cell strong>{row.module}</Cell>
            <Cell>{row.category}</Cell>
            <Cell>{row.clients} of {state.clients.length}</Cell>
            <Cell>{row.users}</Cell>
            <Cell><StatusBadge status={row.status} /></Cell>
            <Cell><button className="form-button-subtle py-1 text-xs" onClick={() => setEditingModule(row.module)}>Edit</button></Cell>
          </tr>
        ))}
      </Table>
      {editingModule && <ModuleEditDrawer moduleName={editingModule} onClose={() => setEditingModule(null)} />}
    </div>
  );
}

function ModuleEditDrawer({ moduleName, onClose }: { moduleName: string; onClose: () => void }) {
  const { state, platformUser, replacePlatformState } = usePlatform();
  const [form, setForm] = useState({
    clients: state.clients.filter((client) => moduleName === 'Admin' || client.enabledModules.includes(moduleName)).map(clientLabel),
    userIds: state.users.filter((user) => user.assignedModules.includes(moduleName)).map((user) => user.userId),
    reason: '',
  });
  const [error, setError] = useState('');
  const adminModule = moduleName === 'Admin';

  function submit() {
    if (!form.reason.trim()) { setError('A change reason is required.'); return; }
    const selectedClientIds = new Set(form.clients.map(parseOptionId));
    const selectedUserIds = new Set(form.userIds);
    state.users.forEach((user) => {
      if (selectedUserIds.has(user.userId) && user.clientId) selectedClientIds.add(user.clientId);
    });

    const nextClients = state.clients.map((client) => {
      if (adminModule) return client;
      const shouldEnable = selectedClientIds.has(client.clientId);
      const enabledModules = shouldEnable ? unique([...client.enabledModules, moduleName]) : client.enabledModules.filter((item) => item !== moduleName);
      return { ...client, enabledModules, disabledModules: clientEditableModules.filter((module) => !enabledModules.includes(module)), lastUpdated: new Date().toISOString() };
    });
    const nextUsers = state.users.map((user) => {
      if (adminModule && user.roles.includes('Super Admin')) return user;
      const shouldAssign = selectedUserIds.has(user.userId);
      const assignedModules = shouldAssign ? unique([...user.assignedModules, moduleName]) : user.assignedModules.filter((item) => item !== moduleName);
      return { ...user, assignedModules };
    });

    replacePlatformState(withAudit({ ...state, clients: nextClients, users: nextUsers }, platformUser, {
      clientId: null,
      clientName: 'Platform',
      moduleName,
      action: 'Edited Module Assignments',
      description: `Updated client and user access for ${moduleName}. Reason: ${form.reason.trim()}.`,
      status: 'Completed',
    }));
    onClose();
  }

  return createPortal(
    <Drawer title={`Edit ${moduleName} Module`} description="Add or remove clients and users assigned to this module." onClose={onClose}>
      <MultiSelectAccessGrid title="Enabled Clients" description={adminModule ? 'Admin is a platform module and remains available to platform administration.' : 'Add or remove client access for this module.'} items={state.clients.map(clientLabel)} selectedItems={form.clients} onChange={(clients) => setForm({ ...form, clients })} searchPlaceholder="Search clients..." columns={2} showSelectAll showClear showSelectedCount />
      <UserAssignmentPanel
        title="Assigned Users"
        users={state.users.filter((user) => !user.roles.includes('Super Admin') || moduleName === 'Admin')}
        selectedUserIds={form.userIds}
        onChange={(userIds) => setForm({ ...form, userIds })}
        onExport={() => exportRows(`${moduleName}-module-users.xls`, moduleUserExportRows(state.users, moduleName))}
      />
      <Field label="Change Reason"><input className="form-input mt-1 w-full" placeholder="Required audit reason" value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} /></Field>
      <DrawerActions error={error} cancel={onClose} submit={submit} submitLabel="Save Module Access" />
    </Drawer>,
    document.body,
  );
}

function SubscriptionsWorkspace() {
  const { state } = usePlatform();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [editingClient, setEditingClient] = useState<PlatformClient | null>(null);
  const rows = state.clients.filter((client) =>
    (!search || `${client.clientName} ${client.clientId} ${client.market}`.toLowerCase().includes(search.toLowerCase()))
    && (!status || client.status === status));
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[1fr_240px]">
        <SearchField value={search} onChange={setSearch} placeholder="Search client, market, or ID..." />
        <Select value={status} onChange={setStatus} label="All statuses" options={['Active', 'Trial', 'Suspended']} />
      </div>
      <Table headers={['Client', 'Plan', 'Cycle', 'Start Date', 'End Date', 'User Limit', 'Storage Limit', 'Status', 'Action']} minWidth="min-w-[1100px]" count={rows.length}>
        {rows.map((client) => {
          const subscription = getSubscription(client, state.clients.indexOf(client));
          return (
            <tr key={client.clientId} className="border-b border-white/10 hover:bg-white/[0.04]">
              <Cell strong>{client.clientName}</Cell>
              <Cell>{subscription.plan}</Cell>
              <Cell>{subscription.cycle}</Cell>
              <Cell>{subscription.startDate}</Cell>
              <Cell>{subscription.endDate}</Cell>
              <Cell>{subscription.userLimit}</Cell>
              <Cell>{subscription.storageLimitGb} GB</Cell>
              <Cell><StatusBadge status={client.status} /></Cell>
              <Cell><button className="form-button-subtle py-1 text-xs" onClick={() => setEditingClient(client)}>Edit</button></Cell>
            </tr>
          );
        })}
      </Table>
      {editingClient && <SubscriptionEditDrawer client={editingClient} onClose={() => setEditingClient(null)} />}
    </div>
  );
}

function SubscriptionEditDrawer({ client, onClose }: { client: PlatformClient; onClose: () => void }) {
  const { state, platformUser, replacePlatformState } = usePlatform();
  const current = getSubscription(client, state.clients.indexOf(client));
  const [form, setForm] = useState({ ...current, status: client.status, reason: '' });
  const [error, setError] = useState('');

  function submit() {
    if (!form.startDate || !form.endDate) { setError('Start date and end date are required.'); return; }
    if (new Date(form.endDate) <= new Date(form.startDate)) { setError('End date must be after start date.'); return; }
    if (!form.reason.trim()) { setError('A change reason is required.'); return; }
    const nextClient: PlatformClient = {
      ...client,
      status: form.status,
      subscriptionPlan: form.plan,
      subscriptionCycle: form.cycle,
      subscriptionStartDate: form.startDate,
      subscriptionEndDate: form.endDate,
      userLimit: Number(form.userLimit),
      storageLimitGb: Number(form.storageLimitGb),
      lastUpdated: new Date().toISOString(),
    };
    replacePlatformState(withAudit({ ...state, clients: state.clients.map((item) => item.clientId === client.clientId ? nextClient : item) }, platformUser, {
      clientId: client.clientId,
      clientName: client.clientName,
      moduleName: 'Admin',
      action: 'Edited Subscription Cycle',
      description: `Plan ${form.plan}, ${form.cycle} cycle, ${form.startDate} to ${form.endDate}. Reason: ${form.reason.trim()}.`,
      status: 'Completed',
    }));
    onClose();
  }

  return createPortal(
    <Drawer title={`Edit Subscription - ${client.clientName}`} description="Align client subscription cycles, limits, renewal dates, and audit reason." onClose={onClose}>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Plan"><select className="form-input mt-1 w-full" value={form.plan} onChange={(event) => setForm({ ...form, plan: event.target.value })}><option>Enterprise Trial</option><option>Enterprise</option><option>Enterprise Plus</option><option>Suspended</option></select></Field>
        <Field label="Cycle"><select className="form-input mt-1 w-full" value={form.cycle} onChange={(event) => setForm({ ...form, cycle: event.target.value as SubscriptionCycle })}><option>Monthly</option><option>Quarterly</option><option>Annual</option></select></Field>
        <Field label="Start Date"><input className="form-input mt-1 w-full" type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} /></Field>
        <Field label="End Date"><input className="form-input mt-1 w-full" type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} /></Field>
        <Field label="User Limit"><input className="form-input mt-1 w-full" type="number" min="1" value={form.userLimit} onChange={(event) => setForm({ ...form, userLimit: Number(event.target.value) })} /></Field>
        <Field label="Storage Limit GB"><input className="form-input mt-1 w-full" type="number" min="1" value={form.storageLimitGb} onChange={(event) => setForm({ ...form, storageLimitGb: Number(event.target.value) })} /></Field>
        <Field label="Client Status"><select className="form-input mt-1 w-full" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ClientStatus })}><option>Active</option><option>Trial</option><option>Suspended</option></select></Field>
      </div>
      <Field label="Change Reason"><input className="form-input mt-1 w-full" placeholder="Required audit reason" value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} /></Field>
      <DrawerActions error={error} cancel={onClose} submit={submit} submitLabel="Save Subscription" />
    </Drawer>,
    document.body,
  );
}

function IntegrationsWorkspace() {
  const { state } = usePlatform();
  return (
    <Table headers={['Client', 'ERP / Source', 'Connection', 'Last Sync', 'Data Quality', 'Status']} count={state.clients.length}>
      {state.clients.map((client, index) => (
        <tr key={client.clientId} className="border-b border-white/10">
          <Cell strong>{client.clientName}</Cell><Cell>{index % 2 ? 'Microsoft Dynamics 365' : 'SAP S/4HANA'}</Cell><Cell>{index % 3 ? 'API + SFTP' : 'Private Link'}</Cell><Cell>{`22 Jun 2026 0${8 + index}:15`}</Cell><Cell>{`${96 - index}%`}</Cell><Cell><StatusBadge status={index === 4 ? 'Attention Needed' : 'Healthy'} /></Cell>
        </tr>
      ))}
    </Table>
  );
}

function AuditWorkspace() {
  const { state } = usePlatform();
  const [search, setSearch] = useState('');
  const [client, setClient] = useState('');
  const [module, setModule] = useState('');
  const [action, setAction] = useState('');
  const rows = state.auditLogs.filter((log) =>
    (!search || `${log.userId} ${log.clientName} ${log.action} ${log.moduleName} ${log.description ?? ''}`.toLowerCase().includes(search.toLowerCase()))
    && (!client || log.clientId === client)
    && (!module || log.moduleName === module)
    && (!action || log.action === action));
  const clientName = state.clients.find((item) => item.clientId === client)?.clientName ?? 'All clients';
  const summary = `${rows.length} audit events for ${clientName}${module ? ` / ${module}` : ''}`;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[1fr_240px_220px_260px]">
        <SearchField value={search} onChange={setSearch} placeholder="Search user, action, entity or module..." />
        <Select value={client} onChange={setClient} label="All clients" options={state.clients.map((item) => [item.clientId, item.clientName])} />
        <Select value={module} onChange={setModule} label="All modules" options={unique(state.auditLogs.map((log) => log.moduleName))} />
        <Select value={action} onChange={setAction} label="All actions" options={unique(state.auditLogs.map((log) => log.action))} />
      </div>
      <Notice>{summary}. Every row includes timestamp, actor, client, module, action, reason/description, and result.</Notice>
      <Table headers={['Timestamp', 'User', 'Client', 'Module', 'Action', 'Description', 'Status']} minWidth="min-w-[1050px]" count={rows.length}>
        {rows.map((log) => (
          <tr key={log.logId} className="border-b border-white/10">
            <Cell>{log.timestamp}</Cell><Cell accent>{log.userId}</Cell><Cell>{log.clientName}</Cell><Cell>{log.moduleName}</Cell><Cell strong>{log.action}</Cell><Cell>{log.description ?? 'Platform change recorded'}</Cell><Cell><StatusBadge status={log.status ?? 'Completed'} /></Cell>
          </tr>
        ))}
      </Table>
    </div>
  );
}

function ImpactWorkspace() {
  const { state } = usePlatform();
  const enabled = state.clients.reduce((sum, client) => sum + client.enabledModules.length, 0);
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Metric label="Enabled capabilities" value={enabled} />
      <Metric label="Active users" value={state.users.filter((user) => user.status === 'Active').length} />
      <Metric label="Governed actions" value={state.auditLogs.length} />
      <Metric label="Estimated annual value" value="$4.8M" />
    </div>
  );
}

function AccessSections({ applications, modules, setApplications, setModules, appItems = clientEditableApplications, moduleItems = clientEditableModules }: {
  applications: string[];
  modules: string[];
  setApplications: (items: string[]) => void;
  setModules: (items: string[]) => void;
  appItems?: string[];
  moduleItems?: string[];
}) {
  return (
    <div className="mt-4 space-y-4">
      <MultiSelectAccessGrid title="Assigned Applications" items={appItems} selectedItems={applications} onChange={setApplications} searchPlaceholder="Search applications..." columns={2} showSelectAll showClear showSelectedCount />
      <MultiSelectAccessGrid title="Assigned Modules" items={moduleItems} selectedItems={modules} onChange={setModules} searchPlaceholder="Search modules..." columns={2} showSelectAll showClear showSelectedCount />
    </div>
  );
}

function PlantEditor({ plants, onChange, onAdd }: { plants: NonNullable<PlatformClient['plants']>; onChange: (plants: NonNullable<PlatformClient['plants']>) => void; onAdd: () => void }) {
  return (
    <fieldset className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">Plant Management</h2>
          <p className="mt-1 text-sm text-slate-400">Plant IDs are generated and used for backend/log tracking.</p>
        </div>
        <button type="button" className="form-button-subtle py-2 text-xs" onClick={onAdd}>Add Plant</button>
      </div>
      <div className="mt-4 space-y-2">
        {plants.map((plant, index) => (
          <div key={plant.plantId} className="grid gap-2 md:grid-cols-[180px_1fr_150px]">
            <input className="form-input w-full" value={plant.plantId} disabled />
            <input className="form-input w-full" placeholder="Plant name" value={plant.plantName} onChange={(event) => onChange(plants.map((item, itemIndex) => itemIndex === index ? { ...item, plantName: event.target.value } : item))} />
            <select className="form-input w-full" value={plant.status} onChange={(event) => onChange(plants.map((item, itemIndex) => itemIndex === index ? { ...item, status: event.target.value as 'Active' | 'Inactive' } : item))}><option>Active</option><option>Inactive</option></select>
          </div>
        ))}
      </div>
    </fieldset>
  );
}

function UserAssignmentPanel({ title, users, selectedUserIds, onChange, onExport }: { title: string; users: PlatformUser[]; selectedUserIds: string[]; onChange: (userIds: string[]) => void; onExport: () => void }) {
  const [search, setSearch] = useState('');
  const [pending, setPending] = useState<string[]>([]);
  const selected = users.filter((user) => selectedUserIds.includes(user.userId));
  const available = users
    .filter((user) => !selectedUserIds.includes(user.userId))
    .filter((user) => !search.trim() || `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(search.trim().toLowerCase()));
  const visibleAvailable = available.slice(0, 4);
  function togglePending(userId: string) {
    setPending((current) => current.includes(userId) ? current.filter((item) => item !== userId) : [...current, userId]);
  }
  function addUsers() {
    onChange(unique([...selectedUserIds, ...pending]));
    setPending([]);
  }
  return (
    <fieldset className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <p className="mt-1 text-sm text-slate-400">Search by first name + space + last name or email. User IDs stay hidden for UI and remain backend identifiers.</p>
        </div>
        <button type="button" className="form-button-subtle inline-flex items-center gap-2 py-2 text-xs" onClick={onExport}><Download className="h-4 w-4" />Export Users</button>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
          <SearchField value={search} onChange={setSearch} placeholder="Search first name last name or email..." />
          <div className="mt-3 space-y-2">
            {visibleAvailable.map((user) => (
              <label key={user.userId} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-200">
                <span><span className="font-medium text-white">{user.fullName}</span><span className="ml-2 text-slate-500">{user.email}</span></span>
                <input type="checkbox" checked={pending.includes(user.userId)} onChange={() => togglePending(user.userId)} />
              </label>
            ))}
            {!visibleAvailable.length && <div className="rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-slate-400">No unassigned users match this search.</div>}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500"><span>{visibleAvailable.length} of {available.length} available shown</span><button type="button" className="form-button-primary py-2 text-xs disabled:opacity-40" disabled={!pending.length} onClick={addUsers}>Add Selected</button></div>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
          <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold text-white">Assigned Users</h3><span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">{selected.length} assigned</span></div>
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {selected.map((user) => (
              <div key={user.userId} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm">
                <span><span className="font-medium text-white">{user.fullName}</span><span className="ml-2 text-slate-500">{user.email}</span></span>
                <button type="button" className="form-button-subtle py-1 text-xs" onClick={() => onChange(selectedUserIds.filter((item) => item !== user.userId))}>Remove</button>
              </div>
            ))}
            {!selected.length && <div className="rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-slate-400">No assigned users yet.</div>}
          </div>
        </div>
      </div>
    </fieldset>
  );
}

function Drawer({ title, description, onClose, children }: { title: string; description: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <section className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-white/10 bg-[#091225] p-5 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div><h3 className="text-lg font-semibold text-white">{title}</h3><p className="text-sm text-slate-400">{description}</p></div>
          <button className="form-button-subtle" onClick={onClose}>Close</button>
        </div>
        <div className="space-y-4">{children}</div>
      </section>
    </div>
  );
}

function DrawerActions({ error, cancel, submit, submitLabel }: { error: string; cancel: () => void; submit: () => void; submitLabel: string }) {
  return (
    <>
      {error && <p className="text-sm text-rose-300">{error}</p>}
      <div className="flex justify-end gap-2">
        <button className="form-button-subtle" onClick={cancel}>Cancel</button>
        <button className="form-button-primary" onClick={submit}>{submitLabel}</button>
      </div>
    </>
  );
}

function Table({ headers, children, count, minWidth = 'min-w-[900px]' }: { headers: string[]; children: ReactNode; count: number; minWidth?: string }) {
  const [position, setPosition] = useState(1);
  const current = count ? Math.min(position, count) : 0;
  return (
    <div className="overflow-x-auto">
      <div className="max-h-[330px] overflow-y-auto" onScroll={(event) => setPosition(Math.floor(event.currentTarget.scrollTop / 49) + 1)}>
        <table className={`${minWidth} w-full text-sm`}>
          <thead className="sticky top-0 z-10 bg-[#0d1527]">
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-[0.08em] text-slate-500">{headers.map((header) => <th key={header} className="px-3 py-3">{header}</th>)}</tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
      <div className="sticky left-0 flex h-8 items-center border-t border-white/10 bg-[#0d1527] px-3 text-xs font-medium text-cyan-200">{current} of {count}</div>
    </div>
  );
}

function Cell({ children, accent, strong }: { children: ReactNode; accent?: boolean; strong?: boolean }) {
  return <td className={`px-3 py-3 ${accent ? 'text-cyan-200' : strong ? 'font-medium text-white' : 'text-slate-300'}`}>{children}</td>;
}

function SearchField({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input className="form-input w-full pl-10" type="search" placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function Select({ value, onChange, label, options, includeBlank = true }: { value: string; onChange: (value: string) => void; label: string; options: string[] | string[][]; includeBlank?: boolean }) {
  const normalized = options.map((item) => typeof item === 'string' ? [item, item] : item);
  return <select className="form-input w-full" value={value} onChange={(event) => onChange(event.target.value)}>{includeBlank && <option value="">{label}</option>}{normalized.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="text-sm text-slate-300">{label}{children}</label>;
}

function Notice({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-3 text-sm text-cyan-100">{children}</div>;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl border border-white/10 bg-slate-950/30 p-5"><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-3xl font-semibold text-white">{value}</p></div>;
}

type MarketRow = {
  region: string;
  market: string;
  currency: CurrencyCode;
  timezone: string;
  clientCount: number;
};

function marketRows(clients: PlatformClient[]): MarketRow[] {
  const configured = marketOptions.map((option) => ({
    region: option.region,
    market: option.market,
    currency: option.currency as CurrencyCode,
    timezone: option.timezone,
    clientCount: clients.filter((client) => client.region === option.region && client.market === option.market).length,
  }));
  const configuredKeys = new Set(configured.map((row) => `${row.region}|${row.market}`));
  const custom = unique(clients.map((client) => `${client.region}|${client.market}`))
    .filter((key) => !configuredKeys.has(key))
    .map((key) => {
      const [region, market] = key.split('|');
      const client = clients.find((item) => item.region === region && item.market === market)!;
      return { region, market, currency: client.currency, timezone: 'Custom', clientCount: clients.filter((item) => item.region === region && item.market === market).length };
    });
  return [...configured, ...custom].sort((a, b) => `${a.region} ${a.market}`.localeCompare(`${b.region} ${b.market}`));
}

function emptyMarketRow(): MarketRow {
  return { region: 'North America', market: '', currency: 'USD', timezone: 'America/New_York', clientCount: 0 };
}

function getSubscription(client: PlatformClient, index: number) {
  return {
    plan: client.subscriptionPlan ?? (client.status === 'Trial' ? 'Enterprise Trial' : client.status === 'Suspended' ? 'Suspended' : 'Enterprise'),
    cycle: client.subscriptionCycle ?? 'Annual',
    startDate: client.subscriptionStartDate ?? client.createdDate,
    endDate: client.subscriptionEndDate ?? (client.status === 'Trial' ? '2026-07-10' : '2027-01-01'),
    userLimit: client.userLimit ?? 100 + Math.max(0, index) * 50,
    storageLimitGb: client.storageLimitGb ?? 500 + Math.max(0, index) * 250,
  };
}

function nextClientId(state: PlatformState) {
  return nextSequentialId('CLT', state.clients.map((client) => client.clientId));
}

function nextUserId(state: PlatformState) {
  return nextSequentialId('USR', state.users.map((user) => user.userId));
}

function nextSequentialId(prefix: string, values: string[]) {
  const next = Math.max(0, ...values.map((value) => Number(value.split('-').at(-1)) || 0)) + 1;
  return `${prefix}-${String(next).padStart(6, '0')}`;
}

function makePlantId(clientId: string, index: number) {
  return `${clientId}-PLT-${String(index).padStart(3, '0')}`;
}

function clientPlants(client: PlatformClient) {
  if (Array.isArray(client.plants) && client.plants.length) return client.plants;
  return [
    { plantId: makePlantId(client.clientId, 1), plantName: 'Plant A', status: 'Active' as const },
    { plantId: makePlantId(client.clientId, 2), plantName: 'Plant B', status: 'Active' as const },
  ];
}

function normalizeUserPlant(currentPlant: string | undefined, plants: NonNullable<PlatformClient['plants']>) {
  return plants.find((plant) => plant.plantName === currentPlant)?.plantName ?? plants[0]?.plantName ?? '';
}

function clientUserExportRows(users: PlatformUser[], client: PlatformClient) {
  return users.map((user) => ({
    Client: client.clientName,
    'Client ID': client.clientId,
    User: user.fullName,
    Email: user.email,
    Role: user.roles.join(', '),
    Plant: user.plant ?? '',
    Status: user.status,
    Applications: user.assignedApplications.join(', '),
    Modules: user.assignedModules.join(', '),
  }));
}

function moduleUserExportRows(users: PlatformUser[], moduleName: string) {
  return users
    .filter((user) => user.assignedModules.includes(moduleName))
    .map((user) => ({
      Module: moduleName,
      User: user.fullName,
      Email: user.email,
      Client: user.clientName,
      Status: user.status,
      Active: user.status === 'Active' ? 'Active' : 'Inactive',
    }));
}

function exportRows(filename: string, rows: Array<Record<string, string | number>>) {
  const headers = Object.keys(rows[0] ?? { Message: 'No records' });
  const escape = (value: unknown) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  const bodyRows = rows.length ? rows : [{ Message: 'No records' }];
  const html = `<html><head><meta charset="utf-8" /></head><body><table><thead><tr>${headers.map((header) => `<th>${escape(header)}</th>`).join('')}</tr></thead><tbody>${bodyRows.map((row) => `<tr>${headers.map((header) => `<td>${escape(row[header])}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`;
  const url = URL.createObjectURL(new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function userLabel(user: PlatformUser) {
  return `${user.userId} | ${user.fullName} | ${user.email}`;
}

function clientLabel(client: PlatformClient) {
  return `${client.clientId} | ${client.clientName}`;
}

function parseOptionId(label: string) {
  return label.split('|')[0].trim();
}

function intersectOrDefault(current: string[], allowed: string[]) {
  const next = current.filter((item) => allowed.includes(item));
  return next.length ? next : [...allowed];
}

function withAudit(state: PlatformState, platformUser: PlatformUser, input: Omit<PlatformAuditLog, 'logId' | 'timestamp' | 'userId'>) {
  return {
    ...state,
    auditLogs: [{
      ...input,
      userId: platformUser.userId,
      logId: `LOG-${Date.now()}-${state.auditLogs.length + 1}`,
      timestamp: new Date().toISOString(),
    }, ...state.auditLogs],
  };
}

function unique(items: string[]) {
  return [...new Set(items)];
}
