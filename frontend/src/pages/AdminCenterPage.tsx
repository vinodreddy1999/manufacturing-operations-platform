import { Children, useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { BarChart3, Building2, Check, FileCheck2, KeyRound, LayoutDashboard, Lightbulb, LockKeyhole, Search, Settings, ShieldCheck, SlidersHorizontal } from 'lucide-react';

import { accessResources, adminPermissions, dashboardDefinitions, dataScopes, recommendations, roleDefinitions } from '../admin/data';
import { ModuleImpactSummary } from '../impact/components/ModuleImpactSummary';
import { formatCurrency } from '../lib/format';
import { platformApplications, platformModules } from '../platform/data';
import { usePlatform } from '../platform/PlatformContext';
import type { PlatformClient } from '../platform/types';
import type { RuntimeUser } from '../types';
import { MultiSelectAccessGrid } from '../components/MultiSelectAccessGrid';
import { PageHeader } from '../components/PageHeader';
import { Panel } from '../components/Panel';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { ScrollableTableFrame } from '../components/ScrollableTableFrame';

export type AdminSection = 'company' | 'roles' | 'access' | 'modules' | 'dashboards' | 'data-scope' | 'audit' | 'business-impact' | 'recommendations' | 'settings';

const adminNavigation: Array<{ section: AdminSection; label: string; icon: typeof Building2 }> = [
  { section: 'company', label: 'Company Profile', icon: Building2 },
  { section: 'roles', label: 'Role Management', icon: ShieldCheck },
  { section: 'access', label: 'Access Management', icon: KeyRound },
  { section: 'modules', label: 'Module Management', icon: SlidersHorizontal },
  { section: 'dashboards', label: 'Dashboard Management', icon: LayoutDashboard },
  { section: 'data-scope', label: 'Data Scope Management', icon: LockKeyhole },
  { section: 'audit', label: 'Audit & Compliance', icon: FileCheck2 },
  { section: 'business-impact', label: 'Business Impact', icon: BarChart3 },
  { section: 'recommendations', label: 'Recommendations Center', icon: Lightbulb },
  { section: 'settings', label: 'Settings', icon: Settings },
];

export function AdminCenterPage({ section, user }: { section: AdminSection; user: RuntimeUser }) {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Administration Center" title={adminNavigation.find((item) => item.section === section)?.label ?? 'Administration'} description="Governance, access, accountability, and business value for the active client context." />
      <div className="grid gap-5 xl:grid-cols-[245px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-white/10 bg-slate-950/35 p-2 xl:sticky xl:top-24">
          <div className="mb-2 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="rounded-lg bg-cyan-400/10 p-2 text-cyan-100"><ShieldCheck className="h-4 w-4" /></div>
            <div><p className="text-sm font-semibold text-white">Admin Workspace</p><p className="text-xs text-slate-500">Permission-aware</p></div>
          </div>
          <nav className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1">
            {adminNavigation.map((item) => <NavLink key={item.section} to={`/admin/${item.section}`} className={({ isActive }) => adminLinkClass(isActive)}><item.icon className="h-4 w-4" />{item.label}</NavLink>)}
          </nav>
        </aside>
        <section className="min-w-0"><AdminSectionContent section={section} user={user} /></section>
      </div>
    </div>
  );
}

function adminLinkClass(active: boolean) {
  return `flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition ${active ? 'border border-cyan-300/20 bg-cyan-400/10 text-white' : 'text-slate-400 hover:bg-white/[0.05] hover:text-white'}`;
}

function AdminSectionContent({ section, user }: { section: AdminSection; user: RuntimeUser }) {
  if (section === 'company') return <CompanyProfile user={user} />;
  if (section === 'roles') return <RoleManagement user={user} />;
  if (section === 'access') return <AccessManagement />;
  if (section === 'modules') return <ModuleManagement user={user} />;
  if (section === 'dashboards') return <DashboardManagement />;
  if (section === 'data-scope') return <DataScopeManagement />;
  if (section === 'audit') return <AuditCompliance />;
  if (section === 'business-impact') return <BusinessImpact />;
  if (section === 'recommendations') return <RecommendationsCenter />;
  return <AdminSettings />;
}

function CompanyProfile({ user }: { user: RuntimeUser }) {
  const navigate = useNavigate();
  const { selectedClient: client, state } = usePlatform();
  if (!client) return <SelectClientNotice />;
  const users = state.users.filter((item) => item.clientId === client.clientId);
  const fields = [
    ['Client Name', client.clientName], ['Client ID', client.clientId], ['Region', client.region], ['Market', client.market], ['Currency', client.currency],
    ['Industry', client.industry ?? industryFor(client)], ['Status', client.status], ['Plants', Array.isArray(client.plants) ? client.plants.length : 2], ['Warehouses', client.warehouses ?? 3],
    ['Total Users', users.length], ['Enabled Applications', client.enabledApplications.length], ['Enabled Modules', client.enabledModules.length],
    ['Created Date', client.createdDate], ['Last Updated', client.lastUpdated ?? '2026-06-21'],
  ];
  return <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Company Users" value={users.length} helper={`${users.filter((item) => item.status === 'Active').length} active`} /><StatCard label="Applications" value={client.enabledApplications.length} helper="High-level products" /><StatCard label="Modules" value={client.enabledModules.length} helper={`${client.disabledModules.length} platform disabled`} /><StatCard label="Health Score" value="91%" helper="Healthy governance" /></div><Panel title="Company Profile" description={user.role === 'super_admin' ? 'Super Admin can update the client from Platform Management Services.' : 'Company profile is read-only for Company Admin.'} action={user.role === 'super_admin' ? <button className="form-button-primary" onClick={() => navigate('/platform?workspace=clients')}>Open Client Workspace</button> : undefined}><dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{fields.map(([label, value]) => <div key={label} className="rounded-xl border border-white/10 bg-slate-950/30 p-4"><dt className="text-xs uppercase tracking-[0.1em] text-slate-500">{label}</dt><dd className="mt-2 font-medium text-white">{value}</dd></div>)}</dl></Panel><Panel title="Company Access Summary" description="Products and capabilities available in the current client context."><div className="grid gap-4 lg:grid-cols-2"><TagList title="Enabled Applications" items={client.enabledApplications} /><TagList title="Enabled Modules" items={client.enabledModules} /></div></Panel><div className="flex flex-wrap gap-3"><button className="form-button-subtle">View Subscription</button><button className="form-button-subtle" onClick={() => navigate('/admin/modules')}>View Module Usage</button><button className="form-button-subtle" onClick={() => navigate('/platform?workspace=clients')}>View Health Score</button></div></div>;
}

function RoleManagement({ user }: { user: RuntimeUser }) {
  const { state, selectedClient } = usePlatform();
  const [createOpen, setCreateOpen] = useState(false);
  const [customRoles, setCustomRoles] = useState<Array<{ id: string; name: string; scope: string; description: string; applications: string[]; modules: string[]; permissions: string[] }>>([]);
  const [form, setForm] = useState({ name: '', scope: user.role === 'super_admin' ? 'Company' : 'Company', description: '', applications: [] as string[], modules: [] as string[], permissions: ['View'] as string[] });
  const scopedUsers = state.users.filter((item) => !selectedClient || item.clientId === selectedClient.clientId);
  const baseRows = roleDefinitions.filter((role) => user.role === 'super_admin' || role[1] !== 'Super Admin').map((role) => ({ id: role[0], name: role[1], scope: role[2], description: role[3], users: scopedUsers.filter((item) => item.roles.includes(role[1])).length, applications: role[1] === 'Super Admin' ? platformApplications.length : selectedClient?.enabledApplications.length ?? 0, modules: role[1] === 'Super Admin' ? platformModules.length : selectedClient?.enabledModules.length ?? 0, status: 'Active' }));
  const rows = [...baseRows, ...customRoles.map((role) => ({ ...role, users: 0, applications: role.applications.length, modules: role.modules.length, status: 'Active' }))];
  function createRole() { if (!form.name.trim() || !form.modules.length) return; const id = `ROLE-${String(rows.length + 1).padStart(3, '0')}`; setCustomRoles((current) => [...current, { id, name: form.name.trim(), scope: user.role === 'super_admin' ? form.scope : 'Company', description: form.description, applications: form.applications, modules: form.modules, permissions: form.permissions }]); setCreateOpen(false); }
  return <div className="space-y-5"><Panel title="Roles" description="Business roles, scope, assigned users, and allowed access." action={<button className="form-button-primary" onClick={() => setCreateOpen((value) => !value)}>Create Role</button>}><AdminTable headers={['Role ID','Role Name','Scope','Description','Assigned Users','Applications','Modules','Status']}>{rows.map((row) => <tr key={row.id} className="border-b border-white/10"><Cell accent>{row.id}</Cell><Cell strong>{row.name}</Cell><Cell>{row.scope}</Cell><Cell>{row.description}</Cell><Cell>{row.users}</Cell><Cell>{row.applications}</Cell><Cell>{row.modules}</Cell><Cell><StatusBadge status={row.status} /></Cell></tr>)}</AdminTable></Panel>{createOpen ? <Panel title="Create Role" description="Company Admin roles are always restricted to the active company."><div className="grid gap-3 md:grid-cols-2"><Field label="Role Name"><input className="form-input mt-1 w-full" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field><Field label="Scope"><select className="form-input mt-1 w-full" value={form.scope} disabled={user.role !== 'super_admin'} onChange={(event) => setForm({ ...form, scope: event.target.value })}>{['Platform','Company','Plant','Warehouse','Department'].filter((scope) => user.role === 'super_admin' || scope === 'Company').map((scope) => <option key={scope}>{scope}</option>)}</select></Field><Field label="Description" className="md:col-span-2"><textarea className="form-input mt-1 min-h-24 w-full" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field></div><div className="mt-5 space-y-4"><MultiSelectAccessGrid title="Allowed Applications" items={selectedClient?.enabledApplications ?? platformApplications} selectedItems={form.applications} onChange={(applications) => setForm({ ...form, applications })} searchPlaceholder="Search applications..." columns={3} /><MultiSelectAccessGrid title="Allowed Modules" items={selectedClient?.enabledModules ?? platformModules} selectedItems={form.modules} onChange={(modules) => setForm({ ...form, modules })} searchPlaceholder="Search modules..." columns={3} /><ChoiceRow title="Permissions" items={adminPermissions} selected={form.permissions} onChange={(permissions) => setForm({ ...form, permissions })} /></div><div className="mt-5 flex justify-end gap-2"><button className="form-button-subtle" onClick={() => setCreateOpen(false)}>Cancel</button><button className="form-button-primary" onClick={createRole}>Save Role</button></div></Panel> : null}</div>;
}

function AccessManagement() {
  const [tab, setTab] = useState('Role Access');
  const [grants, setGrants] = useState<Record<string, boolean>>({});
  const tabs = ['User Access', 'Role Access', 'Module Access', 'Dashboard Access'];
  return <Panel title="Who Can Access What" description="Review and configure business permissions for the active client."><div className="mb-4 flex gap-2 overflow-x-auto">{tabs.map((item) => <button key={item} className={item === tab ? 'form-button-primary min-w-max' : 'form-button-subtle min-w-max'} onClick={() => setTab(item)}>{item}</button>)}</div><div className="mb-4 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300">Editing: <strong className="text-white">{tab}</strong>. Platform and disabled module restrictions remain enforced.</div><AdminTable headers={['Resource', ...adminPermissions]}>{accessResources.map((resource, rowIndex) => <tr key={resource} className="border-b border-white/10"><Cell strong>{resource}</Cell>{adminPermissions.map((permission, permissionIndex) => { const key = `${tab}-${resource}-${permission}`; const enabled = grants[key] ?? (permissionIndex === 0 || (rowIndex < 2 && permissionIndex < 4)); return <td key={permission} className="px-3 py-3 text-center"><button className={`mx-auto flex h-7 w-7 items-center justify-center rounded-lg border ${enabled ? 'border-cyan-300/30 bg-cyan-400/10 text-cyan-100' : 'border-white/10 text-slate-600'}`} onClick={() => setGrants((current) => ({ ...current, [key]: !enabled }))} aria-label={`${permission} ${resource}`}>{enabled ? <Check className="h-3.5 w-3.5" /> : null}</button></td>; })}</tr>)}</AdminTable></Panel>;
}

function ModuleManagement({ user }: { user: RuntimeUser }) {
  const { selectedClient: client, state, updateClient, platformUser } = usePlatform();
  const [search, setSearch] = useState(''); const [filter, setFilter] = useState('All');
  if (!client) return <SelectClientNotice />;
  const activeClient = client;
  const lockedModules = ['Authentication & Access', 'Platform Management'];
  const businessModules = [...lockedModules, ...platformModules.filter((module) => module !== 'Admin')];
  const rows = businessModules.map((module) => { const enabled = lockedModules.includes(module) || activeClient.enabledModules.includes(module); const assigned = state.users.filter((item) => item.clientId === activeClient.clientId && item.assignedModules.includes(module)).length; const locked = lockedModules.includes(module) || (!enabled && user.role !== 'super_admin'); return { module, enabled, assigned, locked, owner: ownerFor(module) }; }).filter((row) => row.module.toLowerCase().includes(search.toLowerCase()) && (filter === 'All' || filter === 'Enabled' && row.enabled || filter === 'Disabled' && !row.enabled || filter === 'Locked' && row.locked || filter === 'Assigned To Me' && platformUser.assignedModules.includes(row.module)));
  function toggle(module: string, enabled: boolean) { const enabledModules = enabled ? activeClient.enabledModules.filter((item) => item !== module) : [...activeClient.enabledModules, module]; updateClient(activeClient.clientId, clientInput(activeClient, enabledModules), enabled ? 'Disabled company module' : 'Enabled company module'); }
  return <div className="space-y-5"><Panel title="Company Enabled Modules" description="Modules enabled for this company."><div className="mb-4 flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input className="form-input w-full pl-10" placeholder="Search modules..." value={search} onChange={(event) => setSearch(event.target.value)} /></label><select className="form-input sm:w-48" value={filter} onChange={(event) => setFilter(event.target.value)}>{['All','Enabled','Disabled','Locked','Assigned To Me'].map((item) => <option key={item}>{item}</option>)}</select></div><AdminTable headers={['Module','Status','Owner','Users Assigned','Last Updated','Action']}>{rows.map((row) => <tr key={row.module} className="border-b border-white/10"><Cell strong>{row.module}{row.locked ? <LockKeyhole className="ml-2 inline h-3.5 w-3.5 text-amber-300" /> : null}</Cell><Cell><StatusBadge status={row.enabled ? 'Enabled' : row.locked ? 'Disabled by Platform Admin' : 'Disabled'} /></Cell><Cell>{row.owner}</Cell><Cell>{row.assigned}</Cell><Cell>21 Jun 2026</Cell><Cell><button className="form-button-subtle py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40" disabled={row.locked} onClick={() => toggle(row.module, row.enabled)}>{row.enabled ? 'Disable' : 'Enable'}</button></Cell></tr>)}</AdminTable></Panel><CompanyNavigationPreview client={activeClient} /></div>;
}

function DashboardManagement() {
  const [enabled, setEnabled] = useState(() => new Set(dashboardDefinitions));
  return <Panel title="Dashboard Access Summary" description="Assign roles and users, then control dashboard availability."><AdminTable headers={['Dashboard','Assigned Roles','Assigned Users','Status','Actions']}>{dashboardDefinitions.map((dashboard, index) => { const active = enabled.has(dashboard); return <tr key={dashboard} className="border-b border-white/10"><Cell strong>{dashboard}</Cell><Cell>{index % 2 ? 'Manager, Viewer' : 'Company Admin, Manager'}</Cell><Cell>{3 + index % 7}</Cell><Cell><StatusBadge status={active ? 'Enabled' : 'Disabled'} /></Cell><Cell><div className="flex gap-2"><button className="form-button-subtle py-1 text-xs">Assign Role</button><button className="form-button-subtle py-1 text-xs">Assign User</button><button className="form-button-subtle py-1 text-xs" onClick={() => setEnabled((current) => { const next = new Set(current); if (active) next.delete(dashboard); else next.add(dashboard); return next; })}>{active ? 'Disable' : 'Enable'}</button></div></Cell></tr>; })}</AdminTable></Panel>;
}

function DataScopeManagement() {
  return <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{['Client','Region','Plant','Warehouse'].map((scope, index) => <StatCard key={scope} label={`${scope} Scopes`} value={index + 2} helper="Active visibility rules" />)}</div><Panel title="Data Visibility Rules" description="Restrict information by client, region, market, plant, warehouse, department, or production line."><AdminTable headers={['Role','Scope Level','Visibility','Status','Action']}>{dataScopes.map((row) => <tr key={row[0]} className="border-b border-white/10">{row.map((value, index) => <Cell key={value} strong={index === 0}>{index === 3 ? <StatusBadge status={value} /> : value}</Cell>)}<Cell><button className="form-button-subtle py-1 text-xs">Edit Scope</button></Cell></tr>)}</AdminTable></Panel></div>;
}

function AuditCompliance() {
  const { state, selectedClient } = usePlatform();
  const [search, setSearch] = useState(''); const [module, setModule] = useState(''); const [action, setAction] = useState('');
  const logs = state.auditLogs.filter((log) => (!selectedClient || log.clientId === selectedClient.clientId) && (!search || `${log.userId} ${log.description ?? ''}`.toLowerCase().includes(search.toLowerCase())) && (!module || log.moduleName === module) && (!action || log.action === action));
  return <Panel title="Business Audit History" description="Readable governance history without internal record identifiers."><div className="mb-4 grid gap-3 md:grid-cols-3"><input className="form-input" placeholder="Search user or description..." value={search} onChange={(event) => setSearch(event.target.value)} /><select className="form-input" value={module} onChange={(event) => setModule(event.target.value)}><option value="">All modules</option>{[...new Set(state.auditLogs.map((log) => log.moduleName))].map((item) => <option key={item}>{item}</option>)}</select><select className="form-input" value={action} onChange={(event) => setAction(event.target.value)}><option value="">All actions</option>{[...new Set(state.auditLogs.map((log) => log.action))].map((item) => <option key={item}>{item}</option>)}</select></div><AdminTable headers={['Date','User','Action','Module','Description','Client','Status']}>{logs.map((log) => <tr key={log.logId} className="border-b border-white/10"><Cell>{log.timestamp}</Cell><Cell strong>{state.users.find((user) => user.userId === log.userId)?.fullName ?? 'Administrator'}</Cell><Cell>{log.action}</Cell><Cell>{log.moduleName}</Cell><Cell>{log.description ?? `${log.action} was completed.`}</Cell><Cell>{log.clientName}</Cell><Cell><StatusBadge status={log.status ?? 'Completed'} /></Cell></tr>)}</AdminTable></Panel>;
}

function BusinessImpact() {
  const { currency } = usePlatform();
  return <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Financial Impact" value={formatCurrency(1248000, currency)} helper="Validated savings" /><StatCard label="Cost Avoided" value={formatCurrency(486000, currency)} helper="Prevented exposure" /><StatCard label="Time Saved" value="1,284 hrs" helper="Across completed improvements" /><StatCard label="Business Health" value="91%" helper="7% above prior period" /><StatCard label="Efficiency Gain" value="12.4%" helper="Current versus previous" /><StatCard label="Completed Improvements" value="28" helper="Owner validated" /><StatCard label="Open Opportunities" value="9" helper="Potential future value" /><StatCard label="Adoption Rate" value="84%" helper="Active users and workflows" /></div><ModuleImpactSummary moduleKey="admin" /></div>;
}

function RecommendationsCenter() {
  const { currency } = usePlatform();
  const delivered = recommendations.filter((item) => item[8] === 'Completed').reduce((total, item) => total + Number(item[5]), 0);
  const potential = recommendations.reduce((total, item) => total + Number(item[5]), 0);
  return <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Delivered Value" value={formatCurrency(delivered, currency)} helper="Completed recommendations" /><StatCard label="Projected Future Value" value={formatCurrency(potential - delivered, currency)} helper="Open value potential" /><StatCard label="Open Opportunities" value={recommendations.filter((item) => item[8] !== 'Completed').length} helper="Across operational modules" /><StatCard label="Total Value Potential" value={formatCurrency(potential, currency)} helper="Delivered plus projected" /></div><Panel title="Recommendations Center" description="Current state to accountable action and expected business benefit."><AdminTable headers={['Recommendation','Module','Current State','Recommended State','Expected Benefit','Expected Savings','Owner','Priority','Status']}>{recommendations.map((row) => <tr key={row[0]} className="border-b border-white/10">{row.map((value, index) => <Cell key={`${row[0]}-${index}`} strong={index === 0} accent={index === 5}>{index === 5 ? formatCurrency(Number(value), currency) : index === 7 || index === 8 ? <StatusBadge status={String(value)} /> : value}</Cell>)}</tr>)}</AdminTable></Panel><div className="grid gap-5 xl:grid-cols-2"><Panel title="Opportunity Pipeline" description="Expected completion and accountable ownership."><div className="space-y-3">{recommendations.slice(0,4).map((item, index) => <div key={item[0]} className="rounded-xl border border-white/10 bg-slate-950/30 p-4"><div className="flex justify-between gap-3"><p className="font-medium text-white">{item[0]}</p><StatusBadge status={String(item[7])} /></div><p className="mt-2 text-sm text-slate-400">{item[1]} · {item[6]} · Expected {25 + index} Jul 2026</p></div>)}</div></Panel><Panel title="Owner Accountability" description="Delivered and potential savings by responsible owner."><AdminTable headers={['Owner','Assigned','Completed','Open','Delivered','Potential']}>{recommendations.map((item) => <tr key={item[6]} className="border-b border-white/10"><Cell strong>{item[6]}</Cell><Cell>1</Cell><Cell>{item[8] === 'Completed' ? 1 : 0}</Cell><Cell>{item[8] === 'Completed' ? 0 : 1}</Cell><Cell>{formatCurrency(item[8] === 'Completed' ? Number(item[5]) : 0, currency)}</Cell><Cell>{formatCurrency(Number(item[5]), currency)}</Cell></tr>)}</AdminTable></Panel></div><Panel title="Executive Value Flow" description="How operational improvement becomes measurable value."><div className="flex flex-wrap items-center gap-2 text-sm">{['Current State','Improvement','Recommendation','Expected Benefit','Expected Savings','Owner','Completion','Actual Savings'].map((item, index) => <div key={item} className="contents"><span className="rounded-xl border border-cyan-300/15 bg-cyan-400/[0.06] px-3 py-2 text-cyan-50">{item}</span>{index < 7 ? <span className="text-slate-600">→</span> : null}</div>)}</div></Panel></div>;
}

function AdminSettings() {
  const sections = ['General','Currency','Notifications','Integrations','Security','Branding'];
  return <div className="grid gap-5 lg:grid-cols-2">{sections.map((section, index) => <Panel key={section} title={section} description={`Manage company ${section.toLowerCase()} preferences.`}><div className="space-y-3"><Field label={`${section} policy`}><select className="form-input mt-1 w-full"><option>Company default</option><option>Custom configuration</option></select></Field><label className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/30 p-3 text-sm text-slate-200"><span>Enable {section.toLowerCase()} controls</span><input type="checkbox" defaultChecked={index !== 5} /></label><button className="form-button-subtle">Save {section}</button></div></Panel>)}</div>;
}

function CompanyNavigationPreview({ client }: { client: PlatformClient }) {
  const groups = [
    ['Core', ['Dashboard','Admin']],
    ['Operations', ['Planning','Inventory','Warehouse','Production','Maintenance','Quality','Procurement','Sales & Distribution']],
    ['Finance', ['Costing & Profitability']],
    ['Governance', ['Compliance','Reports & Analytics','Document Management']],
    ['Data', ['Manufacturing Data Hub','Integration Hub']],
    ['Intelligence', ['AI Intelligence']],
  ];
  return <Panel title="Company Navigation Preview" description="Actual navigation available to users, further reduced by role and individual assignment."><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{groups.map(([group, items]) => { const visible = (items as string[]).filter((item) => ['Dashboard','Admin'].includes(item) || client.enabledModules.includes(item)); return <div key={group as string} className="rounded-xl border border-white/10 bg-slate-950/30 p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{group}</p><div className="mt-3 space-y-2">{visible.map((item) => <div key={item} className="flex items-center gap-2 text-sm text-slate-200"><Check className="h-3.5 w-3.5 text-emerald-300" />{item === 'Sales & Distribution' ? 'Sales' : item}</div>)}{!visible.length ? <p className="text-sm text-slate-600">Not enabled</p> : null}</div></div>; })}</div></Panel>;
}

function SelectClientNotice() { return <Panel title="Select a client" description="Choose a company from the top-left context selector to view and manage company-scoped administration data."><div className="rounded-xl border border-cyan-300/15 bg-cyan-400/[0.06] p-4 text-sm text-cyan-50">Platform View protects cross-client isolation. Enter a client context before opening this section.</div></Panel>; }
function TagList({ title, items }: { title: string; items: string[] }) { return <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4"><p className="text-sm font-semibold text-white">{title}</p><div className="mt-3 flex flex-wrap gap-2">{items.map((item) => <span key={item} className="rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1.5 text-xs text-slate-300">{item}</span>)}</div></div>; }
function ChoiceRow({ title, items, selected, onChange }: { title: string; items: string[]; selected: string[]; onChange: (items: string[]) => void }) { return <fieldset><legend className="mb-2 text-sm font-semibold text-white">{title}</legend><div className="flex flex-wrap gap-2">{items.map((item) => <label key={item} className={`cursor-pointer rounded-xl border px-3 py-2 text-sm ${selected.includes(item) ? 'border-cyan-300/30 bg-cyan-400/10 text-white' : 'border-white/10 text-slate-400'}`}><input className="sr-only" type="checkbox" checked={selected.includes(item)} onChange={() => onChange(selected.includes(item) ? selected.filter((value) => value !== item) : [...selected, item])} />{item}</label>)}</div></fieldset>; }
function Field({ label, className = '', children }: { label: string; className?: string; children: ReactNode }) { return <label className={`text-sm text-slate-300 ${className}`}>{label}{children}</label>; }
function AdminTable({ headers, children }: { headers: string[]; children: ReactNode }) { return <ScrollableTableFrame count={Children.count(children)}><table className="min-w-full text-sm"><thead><tr className="border-b border-white/10 text-left text-xs uppercase tracking-[0.08em] text-slate-500">{headers.map((header) => <th key={header} className="whitespace-nowrap px-3 py-3">{header}</th>)}</tr></thead><tbody>{children}</tbody></table></ScrollableTableFrame>; }
function Cell({ children, strong = false, accent = false }: { children: ReactNode; strong?: boolean; accent?: boolean }) { return <td className={`whitespace-nowrap px-3 py-3 ${strong ? 'font-medium text-white' : accent ? 'text-cyan-200' : 'text-slate-300'}`}>{children}</td>; }
function industryFor(client: PlatformClient) { if (/food/i.test(client.clientName)) return 'Food & Beverage'; if (/pack|plastic/i.test(client.clientName)) return 'Packaging & Materials'; if (/component|tech/i.test(client.clientName)) return 'Industrial Components'; return 'Discrete Manufacturing'; }
function ownerFor(module: string) { if (/cost|sales/i.test(module)) return 'Finance & Commercial'; if (/data|integration|AI/i.test(module)) return 'Data & Intelligence'; if (/quality|compliance/i.test(module)) return 'Quality & Governance'; return `${module} Manager`; }
function clientInput(client: PlatformClient, enabledModules: string[]) { return { clientName: client.clientName, region: client.region, market: client.market, currency: client.currency, enabledApplications: client.enabledApplications, enabledModules, status: client.status, industry: client.industry, plants: client.plants, warehouses: client.warehouses, lastUpdated: new Date().toISOString().slice(0, 10) }; }
