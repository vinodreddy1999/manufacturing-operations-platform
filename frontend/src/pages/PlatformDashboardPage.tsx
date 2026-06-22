import { Activity, Building2, CircleDollarSign, ServerCog, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { PageHeader } from '../components/PageHeader';
import { Panel } from '../components/Panel';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { platformModules } from '../platform/data';
import { usePlatform } from '../platform/PlatformContext';

const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export function PlatformDashboardPage() {
  const navigate = useNavigate();
  const { state } = usePlatform();
  const [moduleHealthClientId, setModuleHealthClientId] = useState('all');
  const [moduleSearch, setModuleSearch] = useState('');
  const [moduleAvailability, setModuleAvailability] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [scrolledModulePosition, setScrolledModulePosition] = useState(1);
  const [hoveredModulePosition, setHoveredModulePosition] = useState<number | null>(null);
  const activeClients = state.clients.filter((client) => client.status === 'Active').length;
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
    return matchesSearch && matchesAvailability;
  });
  const currentModulePosition = visibleModuleRows.length === 0
    ? 0
    : Math.min(hoveredModulePosition ?? scrolledModulePosition, visibleModuleRows.length);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Platform Context" title="Super Admin Platform Dashboard" description="Platform-wide client, user, subscription, module, system, and audit health. Operational client widgets are intentionally hidden in this context." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Clients" value={state.clients.length} helper={`${activeClients} active`} icon={<Building2 className="h-5 w-5" />} onClick={() => navigate('/admin/clients')} />
        <StatCard label="Suspended / Trial" value={state.clients.filter((client) => client.status !== 'Active').length} helper="Subscription attention" accent="amber" icon={<CircleDollarSign className="h-5 w-5" />} onClick={() => navigate('/admin/clients')} />
        <StatCard label="Total Users" value={state.users.length} helper={`${state.users.filter((user) => user.status === 'Active').length} active`} accent="emerald" icon={<UsersRound className="h-5 w-5" />} onClick={() => navigate('/admin/users')} />
        <StatCard label="System Health" value="Healthy" helper="API, database and workers" accent="violet" icon={<ServerCog className="h-5 w-5" />} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Module Health" value={`${moduleRows.filter((row) => row.status === 'Healthy').length}/${moduleRows.length}`} helper={moduleHealthClient ? `${moduleHealthClient.clientName} modules healthy` : 'Platform modules healthy'} icon={<Activity className="h-5 w-5" />} onClick={() => navigate(`/platform/modules/${slug(moduleRows[0].moduleName)}${moduleHealthClient ? `?clientId=${moduleHealthClient.clientId}` : ''}`)} />
        <StatCard label="Subscription Health" value={`${activeClients}/${state.clients.length}`} helper="Active client subscriptions" accent="emerald" />
        <StatCard label="Audit Activity" value={state.auditLogs.length} helper="Recent platform and client actions" accent="amber" />
      </div>
      <Panel title="Module Health" description={moduleHealthDescription}>
        <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(220px,1fr)_220px_280px]">
          <label className="text-sm text-slate-400"><span className="mb-1 block">Search module</span><input className="form-input w-full py-2" type="search" placeholder="Search by module name..." value={moduleSearch} onChange={(event) => { setModuleSearch(event.target.value); setScrolledModulePosition(1); }} /></label>
          <label className="text-sm text-slate-400"><span className="mb-1 block">Availability</span><select className="form-input w-full py-2" value={moduleAvailability} onChange={(event) => { setModuleAvailability(event.target.value as 'all' | 'enabled' | 'disabled'); setScrolledModulePosition(1); }}><option value="all">All statuses</option><option value="enabled">Enabled</option><option value="disabled">Disabled</option></select></label>
          <label className="text-sm text-slate-400"><span className="mb-1 block">Client</span><select className="form-input w-full py-2" value={moduleHealthClientId} onChange={(event) => { setModuleHealthClientId(event.target.value); setScrolledModulePosition(1); }}><option value="all">All Clients</option>{state.clients.map((client) => <option key={client.clientId} value={client.clientId}>{client.clientName}</option>)}</select></label>
        </div>
        <div className="overflow-x-auto">
          <div className="max-h-[321px] min-w-[760px] overflow-y-auto [scrollbar-color:rgba(34,211,238,0.45)_rgba(255,255,255,0.04)]" onScroll={(event) => setScrolledModulePosition(Math.min(Math.floor(event.currentTarget.scrollTop / 54) + 1, Math.max(visibleModuleRows.length, 1)))}>
            <table className="w-full table-fixed text-sm">
              <thead className="sticky top-0 z-10 bg-[#0d1527]"><tr className="h-12 border-b border-white/10 text-left text-xs uppercase tracking-[0.1em] text-slate-500">{['Module Name','Availability','Health Status','Last Updated',''].map((item) => <th key={item} className="px-3 py-3">{item}</th>)}</tr></thead>
              <tbody>{visibleModuleRows.map((row, index) => <tr key={row.moduleName} className="h-[54px] border-b border-white/10 hover:bg-white/[0.04]" onMouseEnter={() => setHoveredModulePosition(index + 1)} onMouseLeave={() => setHoveredModulePosition(null)}><td className="px-3 py-3 font-medium text-white">{row.moduleName}</td><td className="px-3 py-3">{row.disabledClients === 0 ? <span className="text-emerald-200">Enabled</span> : moduleHealthClient ? <span className="text-rose-200">Disabled</span> : <span className="text-amber-200">{row.enabledClients} enabled / {row.disabledClients} disabled</span>}</td><td className="px-3 py-3"><StatusBadge status={row.status} /></td><td className="px-3 py-3 text-slate-400">{row.lastUpdated}</td><td className="px-3 py-3 text-right"><button className="form-button-subtle py-1 text-xs" onClick={() => navigate(`/platform/modules/${slug(row.moduleName)}${moduleHealthClient ? `?clientId=${moduleHealthClient.clientId}` : ''}`)}>View</button></td></tr>)}</tbody>
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
