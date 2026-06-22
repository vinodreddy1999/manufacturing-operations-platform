import { Activity, Building2, ChevronDown, CircleDollarSign, ServerCog, UsersRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { PageHeader } from '../components/PageHeader';
import { Panel } from '../components/Panel';
import { PlatformEmbeddedWorkspace, type PlatformWorkspace } from '../components/PlatformEmbeddedWorkspace';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { platformModules } from '../platform/data';
import { usePlatform } from '../platform/PlatformContext';

function ColumnFilter({ label, active, children, width = 'w-64' }: { label: string; active?: boolean; children: ReactNode; width?: string }) {
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md py-1 hover:text-cyan-200">
        <span>{label}</span>
        {active && <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />}
        <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
      </summary>
      <div className={`mt-2 ${width} max-w-full rounded-lg border border-white/10 bg-[#111b30] p-3 normal-case tracking-normal shadow-2xl`}>
        {children}
      </div>
    </details>
  );
}

export function PlatformDashboardPage() {
  const navigate = useNavigate();
  const { state } = usePlatform();
  const [moduleHealthClientId, setModuleHealthClientId] = useState('all');
  const [moduleSearch, setModuleSearch] = useState('');
  const [moduleAvailability, setModuleAvailability] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [moduleHealthStatus, setModuleHealthStatus] = useState<'all' | 'healthy' | 'attention' | 'disabled'>('all');
  const [moduleUpdatedSearch, setModuleUpdatedSearch] = useState('');
  const [scrolledModulePosition, setScrolledModulePosition] = useState(1);
  const [hoveredModulePosition, setHoveredModulePosition] = useState<number | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<PlatformWorkspace | null>(null);
  const activeClients = state.clients.filter((client) => client.status === 'Active').length;
  const trialClients = state.clients.filter((client) => client.status === 'Trial').length;
  const inactiveClients = state.clients.filter((client) => client.status === 'Suspended').length;
  const activeUsers = state.users.filter((user) => user.status === 'Active').length;
  const disabledUsers = state.users.filter((user) => user.status === 'Disabled').length;
  const moduleHealthClient = state.clients.find((client) => client.clientId === moduleHealthClientId);
  const moduleHealthClients = moduleHealthClient ? [moduleHealthClient] : state.clients;
  const moduleRows = platformModules.map((moduleName, index) => {
    const enabledClients = moduleHealthClients.filter((client) => client.enabledModules.includes(moduleName) || moduleName === 'Admin').length;
    const disabledClients = moduleHealthClients.length - enabledClients;
    return {
      moduleName,
      enabledClients,
      disabledClients,
      status: disabledClients > 0 ? moduleHealthClient ? 'Disabled by Platform Admin' : 'Attention Needed' : index === 8 ? 'Attention Needed' : 'Healthy',
      lastUpdated: moduleHealthClient?.lastUpdated ? `${moduleHealthClient.lastUpdated} 09:00` : '21 Jun 2026 09:00',
    };
  });
  const moduleHealthDescription = moduleHealthClient
    ? `Module availability and health for ${moduleHealthClient.clientName}.`
    : 'Platform-level availability and client enablement across all clients.';
  const visibleModuleRows = moduleRows.filter((row) => {
    const matchesSearch = row.moduleName.toLowerCase().includes(moduleSearch.trim().toLowerCase());
    const matchesAvailability = moduleAvailability === 'all'
      || (moduleAvailability === 'enabled' && row.disabledClients === 0)
      || (moduleAvailability === 'disabled' && row.disabledClients > 0);
    const matchesHealth = moduleHealthStatus === 'all'
      || (moduleHealthStatus === 'healthy' && row.status === 'Healthy')
      || (moduleHealthStatus === 'attention' && row.status === 'Attention Needed')
      || (moduleHealthStatus === 'disabled' && row.status === 'Disabled by Platform Admin');
    const matchesUpdated = row.lastUpdated.toLowerCase().includes(moduleUpdatedSearch.trim().toLowerCase());
    return matchesSearch && matchesAvailability && matchesHealth && matchesUpdated;
  });
  const currentModulePosition = visibleModuleRows.length === 0
    ? 0
    : Math.min(hoveredModulePosition ?? scrolledModulePosition, visibleModuleRows.length);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Platform Context" title="Super Admin Platform Dashboard" description="Platform-wide client, user, subscription, module, system, and audit health. Operational client widgets are intentionally hidden in this context." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Clients" value={state.clients.length} helper="Open embedded client workspace" icon={<Building2 className="h-5 w-5" />} onClick={() => setActiveWorkspace('clients')} />
        <StatCard label="Active Clients" value={activeClients} helper="Enabled subscriptions" accent="emerald" icon={<Building2 className="h-5 w-5" />} onClick={() => setActiveWorkspace('clients')} />
        <StatCard label="Inactive Clients" value={inactiveClients} helper="Suspended clients" accent="amber" icon={<Building2 className="h-5 w-5" />} onClick={() => setActiveWorkspace('clients')} />
        <StatCard label="Trial Clients" value={trialClients} helper="Trial subscriptions" accent="violet" icon={<CircleDollarSign className="h-5 w-5" />} onClick={() => setActiveWorkspace('subscriptions')} />
        <StatCard label="Total Users" value={state.users.length} helper="Open embedded user workspace" icon={<UsersRound className="h-5 w-5" />} onClick={() => setActiveWorkspace('users')} />
        <StatCard label="Active Users" value={activeUsers} helper="Currently enabled" accent="emerald" icon={<UsersRound className="h-5 w-5" />} onClick={() => setActiveWorkspace('users')} />
        <StatCard label="Locked Users" value={0} helper="No locked accounts" accent="amber" icon={<UsersRound className="h-5 w-5" />} onClick={() => setActiveWorkspace('users')} />
        <StatCard label="Disabled Users" value={disabledUsers} helper="Access disabled" accent="violet" icon={<UsersRound className="h-5 w-5" />} onClick={() => setActiveWorkspace('users')} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Module Health" value={`${moduleRows.filter((row) => row.status === 'Healthy').length}/${moduleRows.length}`} helper={moduleHealthClient ? `${moduleHealthClient.clientName} modules healthy` : 'Platform modules healthy'} icon={<Activity className="h-5 w-5" />} onClick={() => setActiveWorkspace('modules')} />
        <StatCard label="Subscription Health" value={`${activeClients}/${state.clients.length}`} helper="Plans and renewals" accent="emerald" icon={<CircleDollarSign className="h-5 w-5" />} onClick={() => setActiveWorkspace('subscriptions')} />
        <StatCard label="Integration Health" value={`${state.clients.length - 1}/${state.clients.length}`} helper="Connected data sources" accent="violet" icon={<ServerCog className="h-5 w-5" />} onClick={() => setActiveWorkspace('integrations')} />
        <StatCard label="Audit Activity" value={state.auditLogs.length} helper="Recent governed actions" accent="amber" icon={<Activity className="h-5 w-5" />} onClick={() => setActiveWorkspace('audit')} />
        <StatCard label="Business Impact" value="$4.8M" helper="Estimated annual value" accent="emerald" icon={<CircleDollarSign className="h-5 w-5" />} onClick={() => setActiveWorkspace('impact')} />
        <StatCard label="System Health" value="Healthy" helper="API, database and workers" accent="violet" icon={<ServerCog className="h-5 w-5" />} onClick={() => setActiveWorkspace('integrations')} />
      </div>
      {activeWorkspace && <PlatformEmbeddedWorkspace active={activeWorkspace} onChange={setActiveWorkspace} onClose={() => setActiveWorkspace(null)} />}
      <Panel title="Module Health" description={moduleHealthDescription}>
        <div className="overflow-x-auto">
          <div className="max-h-[321px] min-w-[980px] overflow-y-auto [scrollbar-color:rgba(34,211,238,0.45)_rgba(255,255,255,0.04)]" onScroll={(event) => setScrolledModulePosition(Math.min(Math.floor(event.currentTarget.scrollTop / 54) + 1, Math.max(visibleModuleRows.length, 1)))}>
            <table className="w-full table-fixed text-sm">
              <thead className="sticky top-0 z-20 bg-[#0d1527]"><tr className="h-12 border-b border-white/10 text-left text-xs uppercase tracking-[0.1em] text-slate-500">
                <th className="px-3 py-3"><ColumnFilter label="Module Name" active={Boolean(moduleSearch)}><input autoFocus className="form-input w-full py-2 text-sm" type="search" placeholder="Search module name..." value={moduleSearch} onChange={(event) => { setModuleSearch(event.target.value); setScrolledModulePosition(1); }} /></ColumnFilter></th>
                <th className="px-3 py-3"><ColumnFilter label="Availability" active={moduleAvailability !== 'all'} width="w-52"><select className="form-input w-full py-2 text-sm" value={moduleAvailability} onChange={(event) => { setModuleAvailability(event.target.value as 'all' | 'enabled' | 'disabled'); setScrolledModulePosition(1); }}><option value="all">All availability</option><option value="enabled">Enabled</option><option value="disabled">Disabled</option></select></ColumnFilter></th>
                <th className="px-3 py-3"><ColumnFilter label="Health Status" active={moduleHealthStatus !== 'all'} width="w-56"><select className="form-input w-full py-2 text-sm" value={moduleHealthStatus} onChange={(event) => { setModuleHealthStatus(event.target.value as 'all' | 'healthy' | 'attention' | 'disabled'); setScrolledModulePosition(1); }}><option value="all">All health statuses</option><option value="healthy">Healthy</option><option value="attention">Attention Needed</option><option value="disabled">Disabled</option></select></ColumnFilter></th>
                <th className="px-3 py-3"><ColumnFilter label="Client" active={moduleHealthClientId !== 'all'}><select className="form-input w-full py-2 text-sm" value={moduleHealthClientId} onChange={(event) => { setModuleHealthClientId(event.target.value); setScrolledModulePosition(1); }}><option value="all">All Clients</option>{state.clients.map((client) => <option key={client.clientId} value={client.clientId}>{client.clientName}</option>)}</select></ColumnFilter></th>
                <th className="px-3 py-3"><ColumnFilter label="Last Updated" active={Boolean(moduleUpdatedSearch)}><input className="form-input w-full py-2 text-sm" type="search" placeholder="Search date or time..." value={moduleUpdatedSearch} onChange={(event) => { setModuleUpdatedSearch(event.target.value); setScrolledModulePosition(1); }} /></ColumnFilter></th>
                <th className="w-24 px-3 py-3" />
              </tr></thead>
              <tbody>{visibleModuleRows.map((row, index) => <tr key={row.moduleName} className="h-[54px] border-b border-white/10 hover:bg-white/[0.04]" onMouseEnter={() => setHoveredModulePosition(index + 1)} onMouseLeave={() => setHoveredModulePosition(null)}><td className="px-3 py-3 font-medium text-white">{row.moduleName}</td><td className="px-3 py-3">{row.disabledClients === 0 ? <span className="text-emerald-200">Enabled</span> : moduleHealthClient ? <span className="text-rose-200">Disabled</span> : <span className="text-amber-200">{row.enabledClients} enabled / {row.disabledClients} disabled</span>}</td><td className="px-3 py-3"><StatusBadge status={row.status} /></td><td className="px-3 py-3 text-slate-300">{moduleHealthClient?.clientName ?? 'All Clients'}</td><td className="px-3 py-3 text-slate-400">{row.lastUpdated}</td><td className="px-3 py-3 text-right"><button className="form-button-subtle py-1 text-xs" onClick={() => setActiveWorkspace('modules')}>View</button></td></tr>)}</tbody>
            </table>
            {visibleModuleRows.length === 0 && <div className="flex h-[270px] items-center justify-center text-sm text-slate-400">No modules match your search and filter.</div>}
          </div>
          <div className="sticky left-0 flex h-8 items-center border-t border-white/10 bg-[#0d1527] px-3 text-xs font-medium text-cyan-200" aria-live="polite">{currentModulePosition} of {visibleModuleRows.length}</div>
        </div>
      </Panel>
      <Panel title="Client Health" description="Commercial context, module allocation, users, and current client health.">
        <div className="overflow-x-auto"><table className="min-w-[1050px] w-full text-sm"><thead><tr className="border-b border-white/10 text-left text-xs uppercase tracking-[0.1em] text-slate-500">{['Client ID','Client Name','Region','Market','Currency','Enabled','Disabled','Active Users','Health',''].map((item) => <th key={item} className="px-3 py-3">{item}</th>)}</tr></thead><tbody>{state.clients.map((client) => <tr key={client.clientId} className="border-b border-white/10 hover:bg-white/[0.04]"><td className="px-3 py-3 text-cyan-200">{client.clientId}</td><td className="px-3 py-3 font-medium text-white">{client.clientName}</td><td className="px-3 py-3">{client.region}</td><td className="px-3 py-3">{client.market}</td><td className="px-3 py-3">{client.currency}</td><td className="px-3 py-3 text-emerald-200">{client.enabledModules.length}</td><td className="px-3 py-3 text-rose-200">{client.disabledModules.length}</td><td className="px-3 py-3">{state.users.filter((user) => user.clientId === client.clientId && user.status === 'Active').length}</td><td className="px-3 py-3"><StatusBadge status={client.status === 'Active' ? client.disabledModules.length > 1 ? 'Attention Needed' : 'Healthy' : client.status} /></td><td className="px-3 py-3"><button className="form-button-subtle py-1 text-xs" onClick={() => navigate(`/admin/clients/${client.clientId}/health`)}>Health</button></td></tr>)}</tbody></table></div>
      </Panel>
    </div>
  );
}
