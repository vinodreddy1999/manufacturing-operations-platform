import { ArrowLeft, Download, FileJson, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Panel } from '../../components/Panel';
import { formatMetricValue } from '../calculations';
import type { ImpactMetric } from '../types';
import { BeforeAfterCard } from './BeforeAfterCard';
import { SavingsCard } from './SavingsCard';
import { TrendChart } from './TrendChart';

function downloadFile(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ImpactDrilldown({ metric }: { metric: ImpactMetric }) {
  const navigate = useNavigate();
  const exportJson = () => downloadFile(`${metric.moduleKey}-${metric.id}.json`, JSON.stringify(metric, null, 2), 'application/json');
  const exportCsv = () => downloadFile(`${metric.moduleKey}-${metric.id}-history.csv`, `period,value\n${metric.history.map((point) => `${point.period},${point.value}`).join('\n')}`, 'text/csv');
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><button className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" />Back</button><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">{metric.moduleName} impact drilldown</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">{metric.metricName}</h1><p className="mt-2 text-sm text-slate-400">{metric.previousPeriod} compared with {metric.currentPeriod} · Updated {metric.lastUpdated}</p></div>
        <div className="flex gap-2"><button className="form-button-subtle inline-flex items-center gap-2" onClick={exportCsv}><Download className="h-4 w-4" />CSV</button><button className="form-button-primary inline-flex items-center gap-2" onClick={exportJson}><FileJson className="h-4 w-4" />JSON</button></div>
      </div>
      <div className="grid gap-4 md:grid-cols-3"><BeforeAfterCard metric={metric} onClick={() => undefined} /><SavingsCard label="Financial impact" value={formatMetricValue(metric.financialImpact, 'INR')} helper={metric.operationalImpact} /><SavingsCard label="Responsible owner" value={metric.responsibleOwner} helper={metric.responsibleDepartment} icon={<UserRound className="h-5 w-5" />} /></div>
      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Panel title="Metric history" description={`Source: ${metric.dataSource}`}><TrendChart data={metric.history} unit={metric.unit} /></Panel>
        <Panel title="Metric context" description="Calculation and accountability metadata"><dl className="space-y-3 text-sm">{[['Previous period', metric.previousPeriod], ['Current period', metric.currentPeriod], ['Difference', formatMetricValue(metric.difference, metric.unit)], ['Percentage change', `${metric.percentageChange}%`], ['Improvement rule', `${metric.improvementWhen} is better`], ['Status', metric.status], ['Last updated', metric.lastUpdated]].map(([label, value]) => <div key={label} className="flex justify-between gap-4 border-b border-white/10 pb-3"><dt className="text-slate-400">{label}</dt><dd className="text-right font-medium text-white">{value}</dd></div>)}</dl></Panel>
      </div>
      <Panel title="Related records" description="Operational records contributing to this impact result"><div className="overflow-x-auto"><table className="min-w-full text-sm"><thead><tr className="border-b border-white/10 text-left text-xs uppercase tracking-[0.1em] text-slate-500"><th className="px-3 py-3">Record</th><th className="px-3 py-3">Description</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Impact</th></tr></thead><tbody>{metric.relatedRecords.map((record) => <tr key={record.id} className="border-b border-white/10"><td className="px-3 py-3 font-medium text-cyan-200">{record.id}</td><td className="px-3 py-3 text-slate-200">{record.name}</td><td className="px-3 py-3 text-slate-300">{record.status}</td><td className="px-3 py-3 text-white">{record.value}</td></tr>)}</tbody></table></div></Panel>
      <Panel title="Review notes" description="Context retained with the impact calculation"><div className="grid gap-3 md:grid-cols-3">{metric.notes.map((note, index) => <div key={note} className="rounded-xl border border-white/10 bg-slate-950/30 p-4"><p className="text-xs uppercase tracking-[0.12em] text-slate-500">Note {index + 1}</p><p className="mt-2 text-sm leading-6 text-slate-200">{note}</p></div>)}</div></Panel>
    </div>
  );
}
