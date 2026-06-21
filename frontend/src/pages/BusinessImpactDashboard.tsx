import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Banknote, Clock3, Gauge, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { PageHeader } from '../components/PageHeader';
import { Panel } from '../components/Panel';
import { calculateImpactTotals, calculateModuleSavings, formatMetricValue, round } from '../impact/calculations';
import { moduleImpacts } from '../impact/data';
import { ImprovementTable } from '../impact/components/ImprovementTable';
import { SavingsCard } from '../impact/components/SavingsCard';
import { usePlatform } from '../platform/PlatformContext';

export function BusinessImpactDashboard() {
  const navigate = useNavigate();
  const { currency } = usePlatform();
  const totals = calculateImpactTotals(moduleImpacts);
  const moduleRows = moduleImpacts.map((module) => ({
    module: module.name,
    key: module.key,
    savings: calculateModuleSavings(module),
    improved: module.metrics.filter((metric) => metric.status === 'Improved').length,
    declined: module.metrics.filter((metric) => metric.status === 'Declined').length,
    averageImprovement: round(module.metrics.filter((metric) => metric.status === 'Improved').reduce((total, metric) => total + Math.abs(metric.percentageChange), 0) / Math.max(1, module.metrics.filter((metric) => metric.status === 'Improved').length)),
  }));
  const allMetrics = moduleImpacts.flatMap((module) => module.metrics);
  const completed = allMetrics.filter((metric) => metric.status === 'Improved').sort((a, b) => b.financialImpact - a.financialImpact).slice(0, 8);
  const pending = allMetrics.filter((metric) => metric.status === 'Declined').sort((a, b) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange)).slice(0, 8);
  const openMetric = (metric = completed[0] ?? allMetrics[0]) => navigate(`/impact/${metric.moduleKey}/${metric.id}`);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Reports & Analytics" title="Business Impact Dashboard" description="Enterprise improvement, savings, cost avoidance, and operational outcomes by module. Values are calculation-ready simulated data pending backend API integration." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SavingsCard label="Total money saved" value={formatMetricValue(totals.moneySaved, 'INR', currency)} helper={`${totals.improved} improved metrics`} icon={<Banknote className="h-5 w-5" />} onClick={() => openMetric(completed[0])} />
        <SavingsCard label="Total cost avoided" value={formatMetricValue(totals.costAvoided, 'INR', currency)} helper="Risk and loss prevention" icon={<ShieldCheck className="h-5 w-5" />} onClick={() => openMetric(completed[1])} />
        <SavingsCard label="Total time saved" value={`${totals.timeSavedHours.toLocaleString('en-IN')} hours`} helper="Cycle, lead, and response time" icon={<Clock3 className="h-5 w-5" />} onClick={() => openMetric(allMetrics.find((metric) => /time|downtime|lead/i.test(metric.metricName)))} />
        <SavingsCard label="Efficiency improvement" value={`${totals.efficiencyImprovement}%`} helper={`${totals.declined} metrics need action`} icon={<Gauge className="h-5 w-5" />} onClick={() => openMetric(pending[0] ?? completed[0])} />
      </div>

      <Panel title="Savings and improvement by module" description="Financial impact with completed improvements and current declines.">
        <div className="h-[420px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={moduleRows} margin={{ left: 10, right: 10, top: 15, bottom: 80 }}><CartesianGrid stroke="rgba(148,163,184,.1)" vertical={false} /><XAxis dataKey="module" stroke="#64748b" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} /><YAxis yAxisId="left" stroke="#64748b" tick={{ fontSize: 10 }} /><YAxis yAxisId="right" orientation="right" stroke="#64748b" tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12 }} /><Legend /><Bar yAxisId="left" dataKey="savings" name={`Savings (${currency})`} fill="#22d3ee" radius={[6, 6, 0, 0]} /><Bar yAxisId="right" dataKey="improved" name="Improved" fill="#34d399" radius={[6, 6, 0, 0]} /><Bar yAxisId="right" dataKey="declined" name="Declined" fill="#fb7185" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
      </Panel>

      <Panel title="Module impact register" description="Open any module to review its complete metric portfolio.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{moduleRows.map((module) => <button key={module.key} className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-left transition hover:border-cyan-300/35 hover:bg-slate-800/60" onClick={() => navigate(`/impact/${module.key}/${moduleImpacts.find((item) => item.key === module.key)?.metrics[0].id}`)}><div className="flex items-center justify-between"><p className="font-semibold text-white">{module.module}</p><span className="text-xs text-cyan-200">{module.averageImprovement}%</span></div><p className="mt-3 text-xl font-semibold text-emerald-200">{formatMetricValue(module.savings, 'INR', currency)}</p><div className="mt-3 flex gap-3 text-xs"><span className="text-emerald-300">{module.improved} improved</span><span className="text-rose-300">{module.declined} declined</span></div></button>)}</div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Top completed improvements" description="Highest realized financial impact"><ImprovementTable metrics={completed} onOpen={(metric) => navigate(`/impact/${metric.moduleKey}/${metric.id}`)} /></Panel>
        <Panel title="Top pending opportunities" description="Largest declines requiring accountable action"><ImprovementTable metrics={pending} onOpen={(metric) => navigate(`/impact/${metric.moduleKey}/${metric.id}`)} /></Panel>
      </div>
    </div>
  );
}
