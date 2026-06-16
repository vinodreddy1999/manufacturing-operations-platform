import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { BarChart3, Boxes, Factory, ShieldCheck, Users } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { Panel } from '../components/Panel';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { canEditExecutiveMetrics } from '../lib/rbac';
import { formatCurrency, formatNumber } from '../lib/format';
import { backend } from '../services/api';
import type { RuntimeUser } from '../types';

type DetailKey = 'active-users' | 'inventory-value' | 'data-quality' | 'ai-readiness' | 'plants';

const readinessDescriptions: Record<string, string> = {
  'Inventory AI Readiness': 'AWS S3 Global View',
  'Production AI Readiness': 'MES / Factory Systems',
  'Machine Data AI Readiness': 'OPC-UA / Edge Devices',
};

function getReadinessDescription(area: string) {
  return readinessDescriptions[area] ?? 'Editable executive-facing AI adoption signal';
}

function sectionClasses(active: boolean) {
  return active
    ? 'ring-2 ring-cyan-300/60 shadow-[0_0_0_1px_rgba(103,232,249,0.25),0_30px_80px_rgba(34,211,238,0.18)]'
    : '';
}

export function DashboardPage({ user }: { user: RuntimeUser }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { focus } = useParams<{ focus?: DetailKey }>();
  const canEdit = canEditExecutiveMetrics(user);
  const [health, admin, inventory, quality, readiness, footprint, analytics] = useQueries({
    queries: [
      { queryKey: ['health'], queryFn: backend.health },
      { queryKey: ['admin-dashboard'], queryFn: backend.adminDashboard },
      { queryKey: ['inventory-dashboard'], queryFn: backend.inventoryDashboard },
      { queryKey: ['data-quality'], queryFn: backend.dataQuality },
      { queryKey: ['ai-readiness'], queryFn: backend.aiReadiness },
      { queryKey: ['operational-footprint'], queryFn: backend.operationalFootprint },
      { queryKey: ['runtime-analytics'], queryFn: backend.analytics },
    ],
  });

  const readinessRows = useMemo(() => readiness.data?.readiness ?? [], [readiness.data]);
  const [readinessDraft, setReadinessDraft] = useState(readinessRows);
  const [footprintDraft, setFootprintDraft] = useState({
    plants: footprint.data?.plants ?? 0,
    warehouses: footprint.data?.warehouses ?? 0,
    integrations: footprint.data?.integrations ?? 0,
    open_approvals: footprint.data?.open_approvals ?? 0,
  });

  useEffect(() => {
    setReadinessDraft(readinessRows);
  }, [readinessRows]);

  useEffect(() => {
    setFootprintDraft({
      plants: footprint.data?.plants ?? 0,
      warehouses: footprint.data?.warehouses ?? 0,
      integrations: footprint.data?.integrations ?? 0,
      open_approvals: footprint.data?.open_approvals ?? 0,
    });
  }, [footprint.data]);

  const saveReadiness = useMutation({
    mutationFn: backend.updateAiReadiness,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-readiness'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });

  const saveFootprint = useMutation({
    mutationFn: backend.updateOperationalFootprint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operational-footprint'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });

  const inventoryRiskSummary = useMemo(() => {
    const lowStock = inventory.data?.low_stock_risks ?? [];
    return lowStock.slice(0, 4).map((risk, index) => ({
      id: `${risk.item_id ?? index}`,
      item: String(risk.item_name ?? risk.item_id ?? `Item ${index + 1}`),
      level: String(risk.risk_level ?? 'Review'),
      quantity: Number(risk.available_quantity ?? 0),
    }));
  }, [inventory.data]);

  if ([health, admin, inventory, quality, readiness, footprint, analytics].some((query) => query.isLoading)) {
    return <LoadingState label="Loading futuristic command dashboard from live backend APIs" />;
  }

  const firstError = [health, admin, inventory, quality, readiness, footprint, analytics].find((query) => query.isError)?.error;
  if (firstError) {
    return <ErrorState error={firstError} title="Dashboard API integration failed" />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Command Surface"
        title="Manufacturing Operations Command Deck"
        description="A premium glass workspace powered entirely by the live FastAPI backend. KPI tiles route into deeper operational blocks, and admin roles can tune executive metrics without leaving the dashboard."
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <StatusBadge status={health.data?.status ?? 'unknown'} />
        <span className="text-sm text-slate-300">{health.data?.service}</span>
        <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-300">
          {user.role.replace('_', ' ')}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Active Users"
          value={formatNumber(admin.data?.active_users)}
          helper={`${formatNumber(admin.data?.user_count)} total users`}
          icon={<Users className="h-5 w-5" />}
          accent="blue"
          onClick={canEdit ? () => navigate('/dashboard/active-users') : undefined}
        />
        <StatCard
          label="Inventory Value"
          value={formatCurrency(inventory.data?.total_inventory_value)}
          helper="From live inventory dashboards"
          icon={<Boxes className="h-5 w-5" />}
          accent="emerald"
          onClick={canEdit ? () => navigate('/dashboard/inventory-value') : undefined}
        />
        <StatCard
          label="Data Quality"
          value={`${quality.data?.overall_score ?? 0}%`}
          helper="Manufacturing data hub score"
          icon={<ShieldCheck className="h-5 w-5" />}
          accent="amber"
          onClick={canEdit ? () => navigate('/dashboard/data-quality') : undefined}
        />
        <StatCard
          label="AI Readiness"
          value={`${readiness.data?.overall_ai_readiness ?? 0}%`}
          helper="Editable domain intelligence profile"
          icon={<BarChart3 className="h-5 w-5" />}
          accent="violet"
          onClick={canEdit ? () => navigate('/dashboard/ai-readiness') : undefined}
        />
        <StatCard
          label="Plants"
          value={formatNumber(footprint.data?.plants ?? admin.data?.plants ?? 0)}
          helper={`${formatNumber(footprint.data?.warehouses ?? admin.data?.warehouses ?? 0)} warehouses`}
          icon={<Factory className="h-5 w-5" />}
          accent="blue"
          onClick={canEdit ? () => navigate('/dashboard/plants') : undefined}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel
          title="AI Readiness by Domain"
          description="Live readiness scores from the data hub. Admin and Super Admin users can tune the values directly when the business wants to reflect target-state readiness."
          action={canEdit ? (
            <button
              type="button"
              className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100 transition hover:bg-cyan-400/20 disabled:opacity-60"
              disabled={saveReadiness.isPending}
              onClick={() => saveReadiness.mutate({ readiness: readinessDraft })}
            >
              {saveReadiness.isPending ? 'Saving...' : 'Save Domains'}
            </button>
          ) : null}
        >
          <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <div className={`rounded-[24px] border border-white/10 bg-slate-950/20 p-3 ${sectionClasses(focus === 'ai-readiness')}`}>
              <div
                className="h-80 lg:h-[26rem]"
                style={{ minHeight: `${Math.max(readinessDraft.length * 68, 320)}px` }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={readinessDraft}
                    layout="vertical"
                    margin={{ top: 12, right: 20, bottom: 12, left: 12 }}
                    barCategoryGap={18}
                  >
                    <CartesianGrid stroke="rgba(255,255,255,0.09)" strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#cbd5e1' }} />
                    <YAxis type="category" dataKey="area" hide width={0} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16 }} />
                    <Bar dataKey="score" fill="#22d3ee" radius={[0, 10, 10, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-3 px-2 pb-2">
                {readinessDraft.map((row) => (
                  <div key={`chart-label-${row.area}`} className="flex flex-wrap items-start justify-between gap-2 rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">{row.area}</p>
                      <p className="text-xs text-slate-400">{getReadinessDescription(row.area)}</p>
                    </div>
                    <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                      {row.score}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {readinessDraft.map((row, index) => (
                <div key={row.area} className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{row.area}</p>
                      <p className="text-xs text-slate-400">{getReadinessDescription(row.area)}</p>
                    </div>
                    <StatusBadge status={row.ready ? 'Ready' : 'In Progress'} />
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_120px_110px]">
                    <input
                      className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                      value={row.area}
                      onChange={(event) =>
                        setReadinessDraft((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, area: event.target.value } : item))
                      }
                      disabled={!canEdit}
                    />
                    <input
                      className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none"
                      type="number"
                      min={0}
                      max={100}
                      value={row.score}
                      onChange={(event) =>
                        setReadinessDraft((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, score: Number(event.target.value) } : item))
                      }
                      disabled={!canEdit}
                    />
                    <button
                      type="button"
                      className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/16 disabled:opacity-60"
                      onClick={() =>
                        setReadinessDraft((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ready: !item.ready } : item))
                      }
                      disabled={!canEdit}
                    >
                      {row.ready ? 'Ready' : 'Review'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel
          title="Operational Footprint"
          description="Plants, warehouses, integrations, and approvals can be tuned by Admin and Super Admin users to match current business planning cycles."
          action={canEdit ? (
            <button
              type="button"
              className="rounded-full border border-violet-300/30 bg-violet-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-100 transition hover:bg-violet-400/20 disabled:opacity-60"
              disabled={saveFootprint.isPending}
              onClick={() => saveFootprint.mutate(footprintDraft)}
            >
              {saveFootprint.isPending ? 'Saving...' : 'Save Footprint'}
            </button>
          ) : null}
        >
          <div className={`grid gap-3 sm:grid-cols-2 ${sectionClasses(focus === 'plants')}`}>
            {[
              { key: 'plants', label: 'Plants' },
              { key: 'warehouses', label: 'Warehouses' },
              { key: 'integrations', label: 'Integrations' },
              { key: 'open_approvals', label: 'Open Approvals' },
            ].map((item) => (
              <label key={item.key} className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{item.label}</span>
                <input
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-2xl font-semibold text-white outline-none"
                  type="number"
                  min={0}
                  value={footprintDraft[item.key as keyof typeof footprintDraft]}
                  onChange={(event) =>
                    setFootprintDraft((current) => ({
                      ...current,
                      [item.key]: Number(event.target.value),
                    }))
                  }
                  disabled={!canEdit}
                />
              </label>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <Panel title="Active User Visibility" description="Role-aware access patterns and current live user activity." action={focus === 'active-users' ? <StatusBadge status="Focused" /> : null}>
          <div className={`grid gap-3 md:grid-cols-3 ${sectionClasses(focus === 'active-users')}`}>
            <StatCard label="Active Users" value={analytics.data?.active_users ?? 0} helper="Currently enabled users" accent="blue" />
            <StatCard label="Disabled Users" value={analytics.data?.disabled_users ?? 0} helper="Accounts held back by RBAC or admin action" accent="amber" />
            <StatCard label="Company Buckets" value={Object.keys(analytics.data?.company_record_counts ?? {}).length} helper="Data islands tracked by tenant/company" accent="violet" />
          </div>
        </Panel>

        <Panel title="Inventory Value and Risk Pulse" description="Inventory quantity and low stock conditions surfaced from the live inventory dashboard." action={focus === 'inventory-value' ? <StatusBadge status="Focused" /> : null}>
          <div className={`grid gap-3 md:grid-cols-2 ${sectionClasses(focus === 'inventory-value')}`}>
            <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Available vs Reserved</p>
              <p className="mt-3 text-3xl font-semibold text-white">{formatNumber(inventory.data?.available_stock ?? 0)}</p>
              <p className="mt-1 text-sm text-slate-300">Available stock</p>
              <p className="mt-4 text-xl font-semibold text-cyan-100">{formatNumber(inventory.data?.reserved_stock ?? 0)}</p>
              <p className="text-sm text-slate-400">Reserved stock</p>
            </div>
            <div className="space-y-3">
              {inventoryRiskSummary.map((risk) => (
                <div key={risk.id} className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{risk.item}</p>
                      <p className="text-xs text-slate-400">Available quantity {risk.quantity}</p>
                    </div>
                    <StatusBadge status={risk.level} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Panel title="Data Quality Signals" description="Quality scoring dimensions derived from your company catalog." action={focus === 'data-quality' ? <StatusBadge status="Focused" /> : null}>
          <div className={`space-y-3 ${sectionClasses(focus === 'data-quality')}`}>
            {(quality.data?.scores ?? []).map((row) => (
              <div key={row.data_type} className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{row.data_type}</p>
                  <StatusBadge status={`${row.accuracy}% accuracy`} />
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-4">
                  <MetricPill label="Accuracy" value={row.accuracy} />
                  <MetricPill label="Complete" value={row.completeness} />
                  <MetricPill label="Consistency" value={row.consistency} />
                  <MetricPill label="Timeliness" value={row.timeliness} />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Footprint Snapshot" description="A quick view of operational coverage and module density across the runtime dataset.">
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricTile label="Inventory Quantity" value={analytics.data?.inventory_total_quantity ?? 0} helper="Aggregated from module records" />
            <MetricTile label="Low Stock Items" value={analytics.data?.inventory_low_stock_count ?? 0} helper="Risk items from live inventory" />
            <MetricTile label="Module Families" value={Object.keys(analytics.data?.module_record_counts ?? {}).length} helper="Backend record buckets" />
            <MetricTile label="Company Density" value={Object.keys(analytics.data?.company_record_counts ?? {}).length} helper="Active company datasets" />
          </div>
        </Panel>
      </div>
    </>
  );
}

function MetricPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/6 px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}%</p>
    </div>
  );
}

function MetricTile({ label, value, helper }: { label: string; value: number; helper: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{formatNumber(value)}</p>
      <p className="mt-2 text-sm text-slate-300">{helper}</p>
    </div>
  );
}
