import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, Bell, Boxes, CheckCircle2, Link2, PackageCheck, ShoppingCart } from 'lucide-react';

import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { Panel } from '../components/Panel';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { dashboardMetrics, notifications, operationalStatus } from '../data/phase1';
import type { RuntimeUser } from '../types';

export function DashboardPage({ user }: { user: RuntimeUser }) {
  return (
    <>
      <PageHeader
        eyebrow="Executive Dashboard"
        title="Operations overview"
        description="Phase 1 operational dashboard focused on management visibility, approvals, notifications, integrations, and module status."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge status="Operational" />
        <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-slate-300">
          {user.role.replace('_', ' ')}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {dashboardMetrics.map((metric) => (
          <StatCard key={metric.label} label={metric.label} value={metric.value} helper={metric.helper} accent={metric.accent} />
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <Panel title="Operational Status" description="High-level operational health across core business functions.">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={operationalStatus}>
                <XAxis dataKey="area" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="value" fill="#22d3ee" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Open Notifications" description="Operational items that require review or action.">
          <div className="space-y-3">
            {notifications.map((item) => (
              <div key={item.title} className="rounded-xl border border-white/10 bg-slate-950/25 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{item.owner}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Production Status" value="82%" helper="Orders on track" icon={<PackageCheck className="h-5 w-5" />} accent="blue" />
        <StatCard label="Quality Status" value="91%" helper="Inspection performance" icon={<CheckCircle2 className="h-5 w-5" />} accent="emerald" />
        <StatCard label="Procurement Status" value="73%" helper="Purchase coverage" icon={<ShoppingCart className="h-5 w-5" />} accent="amber" />
        <StatCard label="Inventory Status" value="88%" helper="Stock readiness" icon={<Boxes className="h-5 w-5" />} accent="violet" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Panel title="Configurable Widgets" description="Dashboard blocks that can be enabled, disabled, or assigned by administrator roles.">
          <DataTable
            rows={[
              { widget: 'Executive Dashboard', owner: 'Company Admin', status: 'Enabled' },
              { widget: 'Inventory Dashboard', owner: 'Inventory Manager', status: 'Enabled' },
              { widget: 'Production Dashboard', owner: 'Production Manager', status: 'Enabled' },
              { widget: 'Maintenance Dashboard', owner: 'Maintenance Manager', status: 'Enabled' },
              { widget: 'Finance Dashboard', owner: 'Finance Manager', status: 'Review' },
            ]}
            emptyTitle="No widgets configured"
            columns={[
              { key: 'widget', label: 'Widget' },
              { key: 'owner', label: 'Owner' },
              { key: 'status', label: 'Status', render: (value) => <StatusBadge status={String(value)} /> },
            ]}
          />
        </Panel>

        <Panel title="Integration Snapshot" description="ERP, database, upload, REST API, and SFTP connection overview.">
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard label="ERP Systems" value="4" helper="Connected" icon={<Link2 className="h-5 w-5" />} />
            <StatCard label="File Uploads" value="9" helper="CSV and Excel" icon={<Activity className="h-5 w-5" />} accent="emerald" />
            <StatCard label="Open Alerts" value="6" helper="Sync review queue" icon={<Bell className="h-5 w-5" />} accent="amber" />
            <StatCard label="REST APIs" value="5" helper="Active endpoints" icon={<Link2 className="h-5 w-5" />} accent="violet" />
          </div>
        </Panel>
      </div>
    </>
  );
}
