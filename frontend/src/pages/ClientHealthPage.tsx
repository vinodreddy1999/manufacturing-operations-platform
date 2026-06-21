import { useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { Panel } from '../components/Panel';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { usePlatform } from '../platform/PlatformContext';

export function ClientHealthPage() {
  const { clientId = '' } = useParams(); const { state } = usePlatform(); const client = state.clients.find((item) => item.clientId === clientId);
  if (!client) return <PageHeader eyebrow="Client Health" title="Client not found" description="The requested client ID is unavailable." />;
  const users = state.users.filter((user) => user.clientId === client.clientId); const logs = state.auditLogs.filter((log) => log.clientId === client.clientId);
  return <div className="space-y-6"><PageHeader eyebrow={`${client.clientId} · ${client.region}`} title={`${client.clientName} Health`} description={`${client.market} · ${client.currency} · Client-specific module, user, audit, and subscription health.`} /><div className="grid gap-4 md:grid-cols-4"><StatCard label="Status" value={client.status} helper="Subscription state" /><StatCard label="Active Users" value={users.filter((user) => user.status === 'Active').length} helper={`${users.length} total users`} /><StatCard label="Enabled Modules" value={client.enabledModules.length} helper={`${client.disabledModules.length} disabled`} /><StatCard label="Audit Activity" value={logs.length} helper="Client-scoped events" /></div><div className="grid gap-4 xl:grid-cols-2"><Panel title="Module access" description="Client module allocation"><div className="grid gap-2 sm:grid-cols-2">{[...client.enabledModules.map((module) => [module, 'Enabled']), ...client.disabledModules.map((module) => [module, 'Disabled'])].map(([module, status]) => <div key={module} className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/30 p-3"><span className="text-sm text-white">{module}</span><StatusBadge status={status} /></div>)}</div></Panel><Panel title="Recent client logs" description="Latest client-scoped actions"><div className="space-y-2">{logs.slice(0, 10).map((log) => <div key={log.logId} className="rounded-xl border border-white/10 bg-slate-950/30 p-3"><p className="text-sm font-medium text-white">{log.action}</p><p className="mt-1 text-xs text-slate-400">{log.moduleName} · {log.userId} · {log.timestamp}</p></div>)}</div></Panel></div></div>;
}
