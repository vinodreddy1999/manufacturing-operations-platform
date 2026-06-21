import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';
import { formatMetricValue } from '../calculations';
import type { ImpactMetric } from '../types';
import { usePlatform } from '../../platform/PlatformContext';

const statusClass = { Improved: 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100', Declined: 'border-rose-300/20 bg-rose-400/10 text-rose-100', 'No Change': 'border-slate-300/20 bg-slate-400/10 text-slate-200' };

export function BeforeAfterCard({ metric, onClick }: { metric: ImpactMetric; onClick: () => void }) {
  const { currency } = usePlatform();
  const positive = metric.status === 'Improved';
  return (
    <button type="button" onClick={onClick} className="group w-full rounded-2xl border border-white/10 bg-slate-900/55 p-4 text-left transition hover:border-cyan-300/35 hover:bg-slate-800/65">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-white">{metric.metricName}</p>
        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClass[metric.status]}`}>{metric.status}</span>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <div className="min-w-0 flex-1"><p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">{metric.previousPeriod}</p><p className="mt-1 truncate text-lg font-semibold text-slate-300">{formatMetricValue(metric.previousValue, metric.unit, currency)}</p></div>
        <ArrowRight className="h-4 w-4 shrink-0 text-slate-500" />
        <div className="min-w-0 flex-1 text-right"><p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">{metric.currentPeriod}</p><p className="mt-1 truncate text-lg font-semibold text-white">{formatMetricValue(metric.currentValue, metric.unit, currency)}</p></div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
        <span className={`inline-flex items-center gap-1 ${positive ? 'text-emerald-200' : metric.status === 'Declined' ? 'text-rose-200' : 'text-slate-400'}`}>{positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}{metric.percentageChange > 0 ? '+' : ''}{metric.percentageChange}%</span>
        <span className="text-cyan-200 transition group-hover:text-cyan-100">Open drilldown</span>
      </div>
    </button>
  );
}
