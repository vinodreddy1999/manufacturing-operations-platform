import { FormEvent, useMemo, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { Panel } from '../components/Panel';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { getModuleDefinition } from '../data/phase1';
import type { RuntimeUser } from '../types';

export function ModuleWorkspacePage({ moduleKey, user }: { moduleKey: string; user: RuntimeUser }) {
  const definition = getModuleDefinition(moduleKey);
  const Icon = definition.icon;
  const [rows, setRows] = useState(definition.sampleRows);
  const [draft, setDraft] = useState({
    code: '',
    name: '',
    status: 'Open',
    owner: user.role.replace('_', ' '),
    quantity: 0,
  });

  const chartRows = useMemo(
    () => rows.map((row) => ({ name: row.code, quantity: row.quantity })),
    [rows],
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRows((current) => [{ ...draft, quantity: Number(draft.quantity) }, ...current]);
    setDraft({ code: '', name: '', status: 'Open', owner: user.role.replace('_', ' '), quantity: 0 });
  }

  return (
    <>
      <PageHeader eyebrow="Module Workspace" title={definition.title} description={definition.description} />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Records" value={rows.length} helper="Visible in this workspace" icon={<Icon className="h-5 w-5" />} accent="blue" />
        <StatCard label="Open Items" value={rows.filter((row) => !['Closed', 'Approved', 'Published', 'Released'].includes(row.status)).length} helper="Need follow-up" accent="amber" />
        <StatCard label="Features" value={definition.features.length} helper="Phase 1 coverage" accent="emerald" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel title="Create Record" description="Simple Phase 1 operational form. This frontend uses local module data until backend-specific endpoints are connected.">
          <form className="grid gap-3 md:grid-cols-2" onSubmit={submit}>
            <input className="form-input" placeholder="Code" value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value })} required />
            <input className="form-input" placeholder="Name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required />
            <select className="form-input" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>
              <option value="Open">Open</option>
              <option value="Draft">Draft</option>
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Approved">Approved</option>
              <option value="Closed">Closed</option>
            </select>
            <input className="form-input" placeholder="Owner" value={draft.owner} onChange={(event) => setDraft({ ...draft, owner: event.target.value })} required />
            <input className="form-input" type="number" placeholder="Quantity / Score" value={draft.quantity} onChange={(event) => setDraft({ ...draft, quantity: Number(event.target.value) })} />
            <button className="form-button-primary md:col-span-2">Add Record</button>
          </form>
        </Panel>

        <Panel title="Feature Areas" description="Phase 1 screens users expect inside this module.">
          <div className="grid gap-2 sm:grid-cols-2">
            {definition.features.map((feature) => (
              <div key={feature} className="rounded-xl border border-white/10 bg-slate-950/25 px-3 py-2 text-sm text-slate-200">
                {feature}
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel title={`${definition.title} Records`} description="User-friendly table with the key operational fields.">
          <DataTable
            rows={rows}
            emptyTitle="No records"
            columns={[
              { key: 'code', label: 'Code' },
              { key: 'name', label: 'Name' },
              { key: 'status', label: 'Status', render: (value) => <StatusBadge status={String(value)} /> },
              { key: 'owner', label: 'Owner' },
              { key: 'quantity', label: 'Qty / Score' },
            ]}
          />
        </Panel>

        <Panel title="Record Volume" description="Simple chart using the current module table.">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartRows}>
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="quantity" fill="#22d3ee" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </>
  );
}
