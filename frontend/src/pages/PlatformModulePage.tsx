import { useParams, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { Panel } from '../components/Panel';
import { StatusBadge } from '../components/StatusBadge';
import { platformModules } from '../platform/data';
import { usePlatform } from '../platform/PlatformContext';

export function PlatformModulePage() {
  const { moduleName = '' } = useParams();
  const [searchParams] = useSearchParams();
  const module = platformModules.find((item) => item.toLowerCase().replace(/[^a-z0-9]+/g, '-') === moduleName);
  const { state } = usePlatform();
  const clientId = searchParams.get('clientId');
  const clients = clientId ? state.clients.filter((client) => client.clientId === clientId) : state.clients;
  const selectedClient = clients[0];
  if (!module) return <PageHeader eyebrow="Platform Module" title="Module not found" description="The requested module is not registered." />;
  return <div className="space-y-6"><PageHeader eyebrow="Platform Module Health" title={module} description={selectedClient ? `${selectedClient.clientName} enablement and module health.` : 'Client enablement, ownership, and platform health for this module.'} /><Panel title="Client allocation" description={selectedClient ? `Filtered to ${selectedClient.clientName}.` : 'Enabled and disabled state by client.'}><div className="space-y-3">{clients.map((client) => { const enabled = module === 'Admin' || client.enabledModules.includes(module); return <div key={client.clientId} className="flex flex-col gap-2 rounded-xl border border-white/10 bg-slate-950/30 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium text-white">{client.clientName}</p><p className="text-sm text-slate-400">{client.clientId} · {client.region} · {client.market}</p></div><StatusBadge status={enabled ? 'Enabled' : 'Disabled by Platform Admin'} /></div>; })}</div></Panel></div>;
}
