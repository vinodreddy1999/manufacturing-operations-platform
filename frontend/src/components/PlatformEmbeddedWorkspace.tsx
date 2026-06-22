import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';

import { platformApplications, platformModules, platformRoles } from '../platform/data';
import { usePlatform } from '../platform/PlatformContext';
import type { ClientStatus, CurrencyCode, PlatformClient } from '../platform/types';
import { MultiSelectAccessGrid } from './MultiSelectAccessGrid';
import { Panel } from './Panel';
import { StatusBadge } from './StatusBadge';

export type PlatformWorkspace = 'clients' | 'users' | 'modules' | 'subscriptions' | 'integrations' | 'audit' | 'impact';

const workspaceTabs: Array<[PlatformWorkspace, string]> = [
  ['clients', 'Clients'], ['users', 'Users'], ['modules', 'Modules'], ['subscriptions', 'Subscriptions'],
  ['integrations', 'Integrations'], ['audit', 'Audit'], ['impact', 'Business Impact'],
];

const marketOptions = [
  { region: 'North America', market: 'United States', currency: 'USD', timezone: 'America/New_York' },
  { region: 'Asia', market: 'India', currency: 'INR', timezone: 'Asia/Kolkata' },
  { region: 'Europe', market: 'European Union', currency: 'EUR', timezone: 'Europe/Berlin' },
  { region: 'Europe', market: 'United Kingdom', currency: 'GBP', timezone: 'Europe/London' },
  { region: 'Middle East', market: 'United Arab Emirates', currency: 'AED', timezone: 'Asia/Dubai' },
] as const;

export function PlatformEmbeddedWorkspace({ active, onChange }: { active: PlatformWorkspace; onChange: (workspace: PlatformWorkspace) => void }) {
  const { state } = usePlatform();
  const counts: Record<PlatformWorkspace, number> = { clients: state.clients.length, users: state.users.length, modules: platformModules.length, subscriptions: state.clients.length, integrations: state.clients.length, audit: state.auditLogs.length, impact: 4 };
  return (
    <Panel title="Platform Management Services" description="Manage platform data without leaving this central workspace.">
      <div className="mb-5 flex gap-2 overflow-x-auto border-b border-white/10 pb-3">
        {workspaceTabs.map(([id, label]) => <button key={id} className={`${active === id ? 'form-button-primary' : 'form-button-subtle'} inline-flex min-w-max items-center gap-2`} onClick={() => onChange(id)}>{label}<span className="rounded-full border border-white/10 bg-slate-950/40 px-2 py-0.5 text-xs">{counts[id]}</span></button>)}
      </div>
      {active === 'clients' && <ClientsWorkspace />}
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
  const [reason, setReason] = useState('');
  const [notice, setNotice] = useState('');
  const clients = state.clients.filter((client) => (!search || `${client.clientName} ${client.clientId}`.toLowerCase().includes(search.toLowerCase())) && (!region || client.region === region) && (!status || client.status === status));
  function toggleClient(client: PlatformClient) {
    if (!reason.trim()) { setNotice('Enter an action reason before enabling or disabling a client.'); return; }
    const nextStatus: ClientStatus = client.status === 'Suspended' ? 'Active' : 'Suspended';
    updateClient(client.clientId, { ...client, status: nextStatus }, `${nextStatus === 'Active' ? 'Enabled' : 'Disabled'} client: ${reason.trim()}`);
    setNotice(`${client.clientName} is now ${nextStatus}. Audit reason recorded by ${platformUser.fullName}.`);
    setReason('');
  }
  return <div className="space-y-4">
    <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_190px_180px_auto]"><SearchField value={search} onChange={setSearch} placeholder="Search client name or ID..." /><Select value={region} onChange={setRegion} label="All regions" options={unique(state.clients.map((client) => client.region))} /><Select value={status} onChange={setStatus} label="All statuses" options={['Active','Trial','Suspended']} /><button className="form-button-primary inline-flex items-center justify-center gap-2" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" />Add Client</button></div>
    <label className="block text-sm text-slate-400">Reason for enable/disable<input className="form-input mt-1 w-full" placeholder="Required before changing client status" value={reason} onChange={(event) => setReason(event.target.value)} /></label>
    {notice && <Notice>{notice}</Notice>}
    <Table headers={['Client ID','Client Name','Industry','Region','Market','Currency','Status','Active Modules','Users','Created','Actions']} minWidth="min-w-[1280px]" count={clients.length}>
      {clients.map((client) => <tr key={client.clientId} className="border-b border-white/10 hover:bg-white/[0.04]"><Cell accent>{client.clientId}</Cell><Cell strong>{client.clientName}</Cell><Cell>{client.industry ?? 'Manufacturing'}</Cell><Cell>{client.region}</Cell><Cell>{client.market}</Cell><Cell>{client.currency}</Cell><Cell><StatusBadge status={client.status} /></Cell><Cell>{client.enabledModules.length}</Cell><Cell>{state.users.filter((user) => user.clientId === client.clientId).length}</Cell><Cell>{client.createdDate}</Cell><Cell><div className="flex gap-2"><button className="form-button-subtle py-1 text-xs" onClick={() => toggleClient(client)}>{client.status === 'Suspended' ? 'Enable' : 'Disable'}</button><button className="form-button-subtle py-1 text-xs" onClick={() => setNotice(`${client.clientName}: ${client.enabledApplications.length} applications, ${client.enabledModules.length} modules, ${state.users.filter((user) => user.clientId === client.clientId).length} users.`)}>View</button></div></Cell></tr>)}
    </Table>
    {createOpen && <ClientCreateDrawer onClose={() => setCreateOpen(false)} />}
  </div>;
}

function ClientCreateDrawer({ onClose }: { onClose: () => void }) {
  const { state, createClient, platformUser, recordAudit } = usePlatform();
  const [form, setForm] = useState({ clientName: '', industry: 'Manufacturing', region: 'North America', market: 'United States', currency: 'USD' as CurrencyCode, timezone: 'America/New_York', language: 'English', status: 'Trial' as ClientStatus, applications: platformApplications.filter((item) => item !== 'Platform Management'), modules: platformModules.filter((item) => item !== 'Admin'), reason: '' });
  const [error, setError] = useState('');
  const markets = marketOptions.filter((item) => item.region === form.region);
  function submit() {
    const name = form.clientName.trim();
    if (!name) { setError('Client Name is required.'); return; }
    if (state.clients.some((client) => client.clientName.toLowerCase() === name.toLowerCase())) { setError('Client Name must be unique.'); return; }
    if (!form.reason.trim()) { setError('A business reason is required.'); return; }
    if (!form.applications.length || !form.modules.length) { setError('Assign at least one application and one module.'); return; }
    const client = createClient({ clientName: name, industry: form.industry, region: form.region, market: form.market, currency: form.currency, status: form.status, enabledApplications: form.applications, enabledModules: form.modules });
    recordAudit({ clientId: client.clientId, clientName: client.clientName, userId: platformUser.userId, moduleName: 'Admin', action: 'Client access assigned', description: `Reason: ${form.reason.trim()}. Timezone: ${form.timezone}. Language: ${form.language}.`, status: 'Completed' });
    onClose();
  }
  function changeRegion(region: string) { const market = marketOptions.find((item) => item.region === region)!; setForm({ ...form, region, market: market.market, currency: market.currency, timezone: market.timezone }); }
  function changeMarket(marketName: string) { const market = marketOptions.find((item) => item.market === marketName)!; setForm({ ...form, market: market.market, currency: market.currency, timezone: market.timezone }); }
  return createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"><section className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/10 bg-[#091225] p-5 shadow-2xl"><div className="mb-5 flex items-start justify-between"><div><h3 className="text-lg font-semibold text-white">Create Client</h3><p className="text-sm text-slate-400">Profile, regional defaults, access, and audit reason.</p></div><button className="form-button-subtle" onClick={onClose}>Close</button></div>
    <div className="grid gap-3 md:grid-cols-2"><Field label="Client Name"><input className="form-input mt-1 w-full" value={form.clientName} onChange={(event) => setForm({ ...form, clientName: event.target.value })} /></Field><Field label="Industry"><input className="form-input mt-1 w-full" value={form.industry} onChange={(event) => setForm({ ...form, industry: event.target.value })} /></Field><Field label="Region"><select className="form-input mt-1 w-full" value={form.region} onChange={(event) => changeRegion(event.target.value)}>{unique(marketOptions.map((item) => item.region)).map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Market"><select className="form-input mt-1 w-full" value={form.market} onChange={(event) => changeMarket(event.target.value)}>{markets.map((item) => <option key={item.market}>{item.market}</option>)}</select></Field><Field label="Currency"><select className="form-input mt-1 w-full" value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value as CurrencyCode })}>{['USD','INR','EUR','GBP','AED'].map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Timezone"><input className="form-input mt-1 w-full" value={form.timezone} onChange={(event) => setForm({ ...form, timezone: event.target.value })} /></Field><Field label="Language"><input className="form-input mt-1 w-full" value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value })} /></Field><Field label="Status"><select className="form-input mt-1 w-full" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ClientStatus })}><option>Active</option><option>Trial</option><option>Suspended</option></select></Field></div>
    <div className="mt-4 space-y-4"><MultiSelectAccessGrid title="Assigned Applications" items={platformApplications.filter((item) => item !== 'Platform Management')} selectedItems={form.applications} onChange={(applications) => setForm({ ...form, applications })} searchPlaceholder="Search applications..." columns={2} /><MultiSelectAccessGrid title="Assigned Modules" items={platformModules.filter((item) => item !== 'Admin')} selectedItems={form.modules} onChange={(modules) => setForm({ ...form, modules })} searchPlaceholder="Search modules..." columns={2} /><Field label="Assignment Reason"><select className="form-input mt-1 w-full" value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })}><option value="">Select required reason</option><option>Business Requirement</option><option>Client Request</option><option>Pilot</option><option>Subscription Upgrade</option><option>Other</option></select></Field>{error && <p className="text-sm text-rose-300">{error}</p>}<div className="flex justify-end gap-2"><button className="form-button-subtle" onClick={onClose}>Cancel</button><button className="form-button-primary" onClick={submit}>Create Client</button></div></div>
  </section></div>, document.body);
}

function UsersWorkspace() {
  const { state, updateUser } = usePlatform();
  const [createOpen, setCreateOpen] = useState(false);
  const [mode, setMode] = useState('Any field'); const [search, setSearch] = useState(''); const [client, setClient] = useState(''); const [role, setRole] = useState(''); const [status, setStatus] = useState('');
  const rows = state.users.filter((user) => { const values: Record<string, string> = { 'Email': user.email, 'First Name': user.firstName, 'Last Name': user.lastName, 'Full Name': user.fullName, 'Login Name': user.loginName, 'User ID': user.userId }; const haystack = mode === 'Any field' ? Object.values(values).join(' ') : values[mode]; return (!search || haystack.toLowerCase().includes(search.toLowerCase())) && (!client || user.clientId === client) && (!role || user.roles.includes(role)) && (!status || user.status === status); });
  return <div className="space-y-4"><div className="grid gap-3 lg:grid-cols-[160px_minmax(220px,1fr)_210px_190px_170px_auto]"><Select value={mode} onChange={setMode} label="Search mode" options={['Any field','Email','First Name','Last Name','Full Name','Login Name','User ID']} includeBlank={false} /><SearchField value={search} onChange={setSearch} placeholder={`Search ${mode.toLowerCase()}...`} /><Select value={client} onChange={setClient} label="All clients" options={state.clients.map((item) => [item.clientId,item.clientName])} /><Select value={role} onChange={setRole} label="All roles" options={platformRoles} /><Select value={status} onChange={setStatus} label="All statuses" options={['Active','Disabled']} /><button className="form-button-primary inline-flex items-center justify-center gap-2" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" />Add User</button></div><Table headers={['User ID','Name','Email','Login','Role','Client','Market','Last Login','Status','Action']} minWidth="min-w-[1120px]" count={rows.length}>{rows.map((user) => <tr key={user.userId} className="border-b border-white/10 hover:bg-white/[0.04]"><Cell accent>{user.userId}</Cell><Cell strong>{user.fullName}</Cell><Cell>{user.email}</Cell><Cell>{user.loginName}</Cell><Cell>{user.roles.join(', ')}</Cell><Cell>{user.clientName}</Cell><Cell>{user.market}</Cell><Cell>{user.lastLogin}</Cell><Cell><StatusBadge status={user.status} /></Cell><Cell><button className="form-button-subtle py-1 text-xs" onClick={() => updateUser(user.userId, { status: user.status === 'Active' ? 'Disabled' : 'Active' }, user.status === 'Active' ? 'Disabled User' : 'Enabled User')}>{user.status === 'Active' ? 'Disable' : 'Enable'}</button></Cell></tr>)}</Table>{createOpen && <UserCreateModal onClose={() => setCreateOpen(false)} />}</div>;
}

function UserCreateModal({ onClose }: { onClose: () => void }) {
  const { state, createUser, platformUser, recordAudit } = usePlatform();
  const initialClient = state.clients[0];
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', loginName: '', clientId: initialClient.clientId, department: 'Operations', plant: 'Plant A', role: 'Viewer', applications: [...initialClient.enabledApplications], modules: [...initialClient.enabledModules], reason: '' });
  const [error, setError] = useState('');
  const client = state.clients.find((item) => item.clientId === form.clientId) ?? initialClient;
  function changeClient(clientId: string) { const next = state.clients.find((item) => item.clientId === clientId)!; setForm({ ...form, clientId, applications: [...next.enabledApplications], modules: [...next.enabledModules] }); }
  function submit() {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.loginName.trim()) { setError('First name, last name, email, and login name are required.'); return; }
    if (state.users.some((user) => user.email.toLowerCase() === form.email.trim().toLowerCase())) { setError('Email must be unique.'); return; }
    if (state.users.some((user) => user.loginName.toLowerCase() === form.loginName.trim().toLowerCase())) { setError('Login Name must be unique.'); return; }
    if (!form.applications.length || !form.modules.length) { setError('Assign at least one application and one module.'); return; }
    if (!form.reason) { setError('An access assignment reason is required.'); return; }
    const user = createUser({ firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim(), loginName: form.loginName.trim(), clientId: client.clientId, region: client.region, market: client.market, department: form.department, plant: form.plant, warehouse: 'Warehouse A', roles: [form.role], assignedApplications: form.applications, assignedModules: form.modules, status: 'Active' });
    recordAudit({ clientId: client.clientId, clientName: client.clientName, userId: platformUser.userId, moduleName: 'Admin', action: 'User access assigned', description: `Created ${user.fullName}. Reason: ${form.reason}.`, status: 'Completed' });
    onClose();
  }
  return createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"><section className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/10 bg-[#091225] p-5 shadow-2xl"><div className="mb-5 flex items-start justify-between"><div><h3 className="text-lg font-semibold text-white">Create User</h3><p className="text-sm text-slate-400">Identity, organization, role, application, and module access.</p></div><button className="form-button-subtle" onClick={onClose}>Close</button></div>
    <div className="grid gap-3 md:grid-cols-2"><Field label="First Name"><input className="form-input mt-1 w-full" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></Field><Field label="Last Name"><input className="form-input mt-1 w-full" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></Field><Field label="Email"><input className="form-input mt-1 w-full" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field><Field label="Login Name"><input className="form-input mt-1 w-full" value={form.loginName} onChange={(event) => setForm({ ...form, loginName: event.target.value })} /></Field><Field label="Client"><select className="form-input mt-1 w-full" value={form.clientId} onChange={(event) => changeClient(event.target.value)}>{state.clients.map((item) => <option key={item.clientId} value={item.clientId}>{item.clientName}</option>)}</select></Field><Field label="Region / Market"><input className="form-input mt-1 w-full" value={`${client.region} / ${client.market}`} disabled /></Field><Field label="Department"><input className="form-input mt-1 w-full" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} /></Field><Field label="Plant"><input className="form-input mt-1 w-full" value={form.plant} onChange={(event) => setForm({ ...form, plant: event.target.value })} /></Field><Field label="Role"><select className="form-input mt-1 w-full" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>{platformRoles.filter((item) => item !== 'Super Admin').map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Assignment Reason"><select className="form-input mt-1 w-full" value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })}><option value="">Select required reason</option><option>Business Requirement</option><option>Client Request</option><option>New Employee</option><option>Role Change</option><option>Other</option></select></Field></div>
    <div className="mt-4 space-y-4"><MultiSelectAccessGrid title="Assigned Applications" items={client.enabledApplications} selectedItems={form.applications} onChange={(applications) => setForm({ ...form, applications })} searchPlaceholder="Search applications..." columns={2} /><MultiSelectAccessGrid title="Assigned Modules" items={client.enabledModules} selectedItems={form.modules} onChange={(modules) => setForm({ ...form, modules })} searchPlaceholder="Search modules..." columns={2} />{error && <p className="text-sm text-rose-300">{error}</p>}<div className="flex justify-end gap-2"><button className="form-button-subtle" onClick={onClose}>Cancel</button><button className="form-button-primary" onClick={submit}>Create User</button></div></div>
  </section></div>, document.body);
}

function ModulesWorkspace() { const { state } = usePlatform(); const [search, setSearch] = useState(''); const [status, setStatus] = useState(''); const rows = platformModules.map((module, index) => { const clients = state.clients.filter((client) => module === 'Admin' || client.enabledModules.includes(module)).length; return { module, owner: module === 'Admin' ? 'Platform Operations' : `${module} Owner`, clients, users: state.users.filter((user) => user.assignedModules.includes(module)).length, status: clients === state.clients.length ? 'Healthy' : clients === 0 ? 'Critical' : 'Attention Needed', category: index < 5 ? 'Operations' : index < 11 ? 'Governance' : 'Digital' }; }).filter((row) => (!search || `${row.module} ${row.owner}`.toLowerCase().includes(search.toLowerCase())) && (!status || row.status === status)); return <div className="space-y-4"><div className="grid gap-3 md:grid-cols-[1fr_240px]"><SearchField value={search} onChange={setSearch} placeholder="Search module name or owner..." /><Select value={status} onChange={setStatus} label="All statuses" options={['Healthy','Attention Needed','Critical']} /></div><Table headers={['Module','Owner','Category','Clients Enabled','Users','Status']} count={rows.length}><>{rows.map((row) => <tr key={row.module} className="border-b border-white/10"><Cell strong>{row.module}</Cell><Cell>{row.owner}</Cell><Cell>{row.category}</Cell><Cell>{row.clients} of {state.clients.length}</Cell><Cell>{row.users}</Cell><Cell><StatusBadge status={row.status} /></Cell></tr>)}</></Table></div>; }

function SubscriptionsWorkspace() { const { state } = usePlatform(); return <Table headers={['Client','Plan','Start Date','End Date','User Limit','Storage Limit','Status']} count={state.clients.length}><>{state.clients.map((client, index) => <tr key={client.clientId} className="border-b border-white/10"><Cell strong>{client.clientName}</Cell><Cell>{client.status === 'Trial' ? 'Enterprise Trial' : 'Enterprise'}</Cell><Cell>{client.createdDate}</Cell><Cell>{client.status === 'Trial' ? '2026-07-10' : '2027-01-01'}</Cell><Cell>{100 + index * 50}</Cell><Cell>{`${500 + index * 250} GB`}</Cell><Cell><StatusBadge status={client.status} /></Cell></tr>)}</></Table>; }
function IntegrationsWorkspace() { const { state } = usePlatform(); return <Table headers={['Client','ERP / Source','Connection','Last Sync','Data Quality','Status']} count={state.clients.length}><>{state.clients.map((client, index) => <tr key={client.clientId} className="border-b border-white/10"><Cell strong>{client.clientName}</Cell><Cell>{index % 2 ? 'Microsoft Dynamics 365' : 'SAP S/4HANA'}</Cell><Cell>{index % 3 ? 'API + SFTP' : 'Private Link'}</Cell><Cell>{`22 Jun 2026 0${8 + index}:15`}</Cell><Cell>{`${96 - index}%`}</Cell><Cell><StatusBadge status={index === 4 ? 'Attention Needed' : 'Healthy'} /></Cell></tr>)}</></Table>; }
function AuditWorkspace() { const { state } = usePlatform(); const [search, setSearch] = useState(''); const [client, setClient] = useState(''); const rows = state.auditLogs.filter((log) => (!search || `${log.userId} ${log.action} ${log.moduleName} ${log.description ?? ''}`.toLowerCase().includes(search.toLowerCase())) && (!client || log.clientId === client)); return <div className="space-y-4"><div className="grid gap-3 md:grid-cols-[1fr_260px]"><SearchField value={search} onChange={setSearch} placeholder="Search user, action, entity or module..." /><Select value={client} onChange={setClient} label="All clients" options={state.clients.map((item) => [item.clientId,item.clientName])} /></div><Table headers={['Timestamp','User','Client','Module','Action','Description','Status']} minWidth="min-w-[1050px]" count={rows.length}><>{rows.map((log) => <tr key={log.logId} className="border-b border-white/10"><Cell>{log.timestamp}</Cell><Cell accent>{log.userId}</Cell><Cell>{log.clientName}</Cell><Cell>{log.moduleName}</Cell><Cell strong>{log.action}</Cell><Cell>{log.description ?? 'Platform change recorded'}</Cell><Cell><StatusBadge status={log.status ?? 'Completed'} /></Cell></tr>)}</></Table></div>; }
function ImpactWorkspace() { const { state } = usePlatform(); const enabled = state.clients.reduce((sum, client) => sum + client.enabledModules.length, 0); return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Metric label="Enabled capabilities" value={enabled} /><Metric label="Active users" value={state.users.filter((user) => user.status === 'Active').length} /><Metric label="Governed actions" value={state.auditLogs.length} /><Metric label="Estimated annual value" value="$4.8M" /></div>; }

function Table({ headers, children, count, minWidth = 'min-w-[900px]' }: { headers: string[]; children: React.ReactNode; count: number; minWidth?: string }) { const [position, setPosition] = useState(1); const current = count ? Math.min(position, count) : 0; return <div className="overflow-x-auto"><div className="max-h-[330px] overflow-y-auto" onScroll={(event) => setPosition(Math.floor(event.currentTarget.scrollTop / 49) + 1)}><table className={`${minWidth} w-full text-sm`}><thead className="sticky top-0 z-10 bg-[#0d1527]"><tr className="border-b border-white/10 text-left text-xs uppercase tracking-[0.08em] text-slate-500">{headers.map((header) => <th key={header} className="px-3 py-3">{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div><div className="sticky left-0 flex h-8 items-center border-t border-white/10 bg-[#0d1527] px-3 text-xs font-medium text-cyan-200">{current} of {count}</div></div>; }
function Cell({ children, accent, strong }: { children: React.ReactNode; accent?: boolean; strong?: boolean }) { return <td className={`px-3 py-3 ${accent ? 'text-cyan-200' : strong ? 'font-medium text-white' : 'text-slate-300'}`}>{children}</td>; }
function SearchField({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) { return <label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input className="form-input w-full pl-10" type="search" placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} /></label>; }
function Select({ value, onChange, label, options, includeBlank = true }: { value: string; onChange: (value: string) => void; label: string; options: string[] | string[][]; includeBlank?: boolean }) { const normalized = options.map((item) => typeof item === 'string' ? [item,item] : item); return <select className="form-input w-full" value={value} onChange={(event) => onChange(event.target.value)}>{includeBlank && <option value="">{label}</option>}{normalized.map(([id,text]) => <option key={id} value={id}>{text}</option>)}</select>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="text-sm text-slate-300">{label}{children}</label>; }
function Notice({ children }: { children: React.ReactNode }) { return <div className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-3 text-sm text-cyan-100">{children}</div>; }
function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl border border-white/10 bg-slate-950/30 p-5"><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-3xl font-semibold text-white">{value}</p></div>; }
function unique(items: string[]) { return [...new Set(items)]; }
