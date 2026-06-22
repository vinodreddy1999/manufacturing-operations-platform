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
  const activeClients = state.clients.filter((client) => client.status === 'Active').length;
  const moduleHealthClient = state.clients.find((client) => client.clientId === moduleHealthClientId);
  const moduleHealthClients = moduleHealthClient ? [moduleHealthClient] : state.clients;
  const moduleRows = platformModules.map((moduleName, index) => {
    const enabledClients = moduleHealthClients.filter((client) => client.enabledModules.includes(moduleName) || moduleName === 'Admin').length;
    const disabledClients = moduleHealthClients.length - enabledClients;
    return {
      moduleName,
      owner: moduleName === 'Admin' ? 'Platform Operations' : `${moduleName} Owner`,
      clientCount: moduleHealthClients.length,
      enabledClients,
      disabledClients,
      status: disabledClients > 0 ? moduleHealthClient ? 'Disabled by Platform Admin' : 'Attention Needed' : index === 8 ? 'Attention Needed' : 'Healthy',
      lastUpdated: moduleHealthClient?.lastUpdated ? `${moduleHealthClient.lastUpdated} 09:00` : '21 Jun 2026 09:00',
    };
  });
  const moduleHealthDescription = moduleHealthClient
    ? `Module availability and health for ${moduleHealthClient.clientName}.`
    : 'Platform-level availability and client enablement across all clients.';
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
      <Panel title="Module Health" description={moduleHealthDescription} action={<label className="flex items-center gap-2 text-sm text-slate-400"><span className="hidden sm:inline">Client</span><select className="form-input min-w-56 py-2" value={moduleHealthClientId} onChange={(event) => setModuleHealthClientId(event.target.value)}><option value="all">All Clients</option>{state.clients.map((client) => <option key={client.clientId} value={client.clientId}>{client.clientName}</option>)}</select></label>}>
        <div className="overflow-x-auto"><table className="min-w-[980px] w-full text-sm"><thead><tr className="border-b border-white/10 text-left text-xs uppercase tracking-[0.1em] text-slate-500">{['Module Name','Owner','Client Count','Enabled','Disabled','Status','Last Updated',''].map((item) => <th key={item} className="px-3 py-3">{item}</th>)}</tr></thead><tbody>{moduleRows.map((row) => <tr key={row.moduleName} className="border-b border-white/10 hover:bg-white/[0.04]"><td className="px-3 py-3 font-medium text-white">{row.moduleName}</td><td className="px-3 py-3 text-slate-300">{row.owner}</td><td className="px-3 py-3">{row.clientCount}</td><td className="px-3 py-3 text-emerald-200">{row.enabledClients}</td><td className="px-3 py-3 text-rose-200">{row.disabledClients}</td><td className="px-3 py-3"><StatusBadge status={row.status} /></td><td className="px-3 py-3 text-slate-400">{row.lastUpdated}</td><td className="px-3 py-3"><button className="form-button-subtle py-1 text-xs" onClick={() => navigate(`/platform/modules/${slug(row.moduleName)}${moduleHealthClient ? `?clientId=${moduleHealthClient.clientId}` : ''}`)}>View</button></td></tr>)}</tbody></table></div>
      </Panel>
      <Panel title="Client Health" description="Commercial context, module allocation, users, and current client health.">
        <div className="overflow-x-auto"><table className="min-w-[1050px] w-full text-sm"><thead><tr className="border-b border-white/10 text-left text-xs uppercase tracking-[0.1em] text-slate-500">{['Client ID','Client Name','Region','Market','Currency','Enabled','Disabled','Active Users','Health',''].map((item) => <th key={item} className="px-3 py-3">{item}</th>)}</tr></thead><tbody>{state.clients.map((client) => <tr key={client.clientId} className="border-b border-white/10 hover:bg-white/[0.04]"><td className="px-3 py-3 text-cyan-200">{client.clientId}</td><td className="px-3 py-3 font-medium text-white">{client.clientName}</td><td className="px-3 py-3">{client.region}</td><td className="px-3 py-3">{client.market}</td><td className="px-3 py-3">{client.currency}</td><td className="px-3 py-3 text-emerald-200">{client.enabledModules.length}</td><td className="px-3 py-3 text-rose-200">{client.disabledModules.length}</td><td className="px-3 py-3">{state.users.filter((user) => user.clientId === client.clientId && user.status === 'Active').length}</td><td className="px-3 py-3"><StatusBadge status={client.status === 'Active' ? client.disabledModules.length > 1 ? 'Attention Needed' : 'Healthy' : client.status} /></td><td className="px-3 py-3"><button className="form-button-subtle py-1 text-xs" onClick={() => navigate(`/admin/clients/${client.clientId}/health`)}>Health</button></td></tr>)}</tbody></table></div>
      </Panel>
    </div>
  );
}
