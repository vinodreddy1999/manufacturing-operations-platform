import { Banknote, Clock3, Gauge, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { calculateModuleSavings, formatMetricValue, round } from '../calculations';
import { getModuleImpact } from '../data';
import { BeforeAfterCard } from './BeforeAfterCard';
import { ImpactTracker } from './ImpactTracker';
import { ImprovementTable } from './ImprovementTable';
import { SavingsCard } from './SavingsCard';
import { TrendChart } from './TrendChart';
import { usePlatform } from '../../platform/PlatformContext';

export function ModuleImpactSummary({ moduleKey, compact = false }: { moduleKey: string; compact?: boolean }) {
  const navigate = useNavigate();
  const { currency } = usePlatform();
  const module = getModuleImpact(moduleKey);
  if (!module) return null;
  const improved = module.metrics.filter((metric) => metric.status === 'Improved');
  const declined = module.metrics.filter((metric) => metric.status === 'Declined');
  const moneySaved = calculateModuleSavings(module);
  const averageChange = round(improved.reduce((total, metric) => total + Math.abs(metric.percentageChange), 0) / Math.max(1, improved.length));
  const openMetric = (metricId: string) => navigate(`/impact/${module.key}/${metricId}`);
  const leadMetric = improved[0] ?? module.metrics[0];

  return (
    <ImpactTracker title={`${module.name} impact`} description={`Before-versus-after performance, financial savings, operational outcomes, and accountable ownership for ${module.department}.`}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SavingsCard label="Financial impact" value={formatMetricValue(moneySaved, 'INR', currency)} helper="Completed and validated improvements" icon={<Banknote className="h-5 w-5" />} onClick={() => openMetric(leadMetric.id)} />
        <SavingsCard label="Average improvement" value={`${averageChange}%`} helper={`${improved.length} metrics improved`} icon={<Gauge className="h-5 w-5" />} onClick={() => openMetric(leadMetric.id)} />
        <SavingsCard label="Opportunities" value={String(declined.length)} helper="Metrics requiring owner action" icon={<Target className="h-5 w-5" />} onClick={() => declined[0] && openMetric(declined[0].id)} />
        <SavingsCard label="Reporting window" value="Q1 to Q2" helper="Last refreshed 20 Jun 2026" icon={<Clock3 className="h-5 w-5" />} onClick={() => openMetric(leadMetric.id)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {module.metrics.slice(0, compact ? 3 : 6).map((metric) => <BeforeAfterCard key={metric.id} metric={metric} onClick={() => openMetric(metric.id)} />)}
      </div>

      {!compact ? (
        <>
          <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-2xl border border-white/10 bg-slate-900/55 p-5"><h3 className="text-base font-semibold text-white">{leadMetric.metricName} trend</h3><p className="mt-1 text-sm text-slate-400">Six-period movement for the leading improvement metric.</p><TrendChart data={leadMetric.history} unit={leadMetric.unit} /></div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/55 p-5"><h3 className="text-base font-semibold text-white">Business outputs</h3><div className="mt-4 grid gap-3 sm:grid-cols-2">{module.outputs.map((output, index) => <div key={output} className="rounded-xl border border-white/10 bg-slate-950/30 p-4"><p className="text-xs uppercase tracking-[0.12em] text-slate-500">Outcome {index + 1}</p><p className="mt-2 text-sm font-semibold text-slate-100">{output}</p></div>)}</div></div>
          </div>
          <ImprovementTable metrics={module.metrics} onOpen={(metric) => openMetric(metric.id)} />
        </>
      ) : null}
    </ImpactTracker>
  );
}
