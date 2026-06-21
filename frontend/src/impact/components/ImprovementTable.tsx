import { ArrowUpRight } from 'lucide-react';
import { formatMetricValue } from '../calculations';
import type { ImpactMetric } from '../types';

export function ImprovementTable({ metrics, onOpen }: { metrics: ImpactMetric[]; onOpen: (metric: ImpactMetric) => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/25">
      <div className="overflow-x-auto">
        <table className="min-w-[1100px] divide-y divide-white/10 text-sm">
          <thead className="bg-slate-950/45"><tr>{['Metric', 'Previous', 'Current', 'Change', 'Financial impact', 'Operational impact', 'Owner', 'Status', ''].map((label) => <th key={label} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">{label}</th>)}</tr></thead>
          <tbody className="divide-y divide-white/10">
            {metrics.map((metric) => (
              <tr key={metric.id} className="hover:bg-white/[0.04]">
                <td className="px-4 py-3 font-medium text-white"><p>{metric.metricName}</p><p className="mt-1 text-xs font-normal text-slate-500">{metric.dataSource}</p></td>
                <td className="px-4 py-3 text-slate-300">{formatMetricValue(metric.previousValue, metric.unit)}</td>
                <td className="px-4 py-3 text-white">{formatMetricValue(metric.currentValue, metric.unit)}</td>
                <td className="px-4 py-3 text-slate-300">{metric.percentageChange > 0 ? '+' : ''}{metric.percentageChange}%</td>
                <td className="px-4 py-3 text-emerald-200">{formatMetricValue(metric.financialImpact, 'INR')}</td>
                <td className="max-w-64 px-4 py-3 text-slate-300">{metric.operationalImpact}</td>
                <td className="px-4 py-3 text-slate-300">{metric.responsibleDepartment}</td>
                <td className="px-4 py-3"><span className={`rounded-full border px-2.5 py-1 text-xs ${metric.status === 'Improved' ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100' : metric.status === 'Declined' ? 'border-rose-300/20 bg-rose-400/10 text-rose-100' : 'border-white/10 bg-white/5 text-slate-300'}`}>{metric.status}</span></td>
                <td className="px-4 py-3"><button className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-2 text-cyan-100 hover:bg-cyan-400/20" onClick={() => onOpen(metric)} aria-label={`Open ${metric.metricName}`}><ArrowUpRight className="h-4 w-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
