import { CheckCircle2, CircleAlert, CircleDashed, XCircle } from 'lucide-react';

type StatusBadgeProps = {
  status: string;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toLowerCase();
  const state = normalized.includes('healthy') || normalized.includes('ok') || normalized.includes('visible') || normalized.includes('active')
    ? 'good'
    : normalized.includes('warning') || normalized.includes('pending')
      ? 'warn'
      : normalized.includes('failed') || normalized.includes('error') || normalized.includes('hidden')
        ? 'bad'
        : 'neutral';

  const classes = {
    good: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warn: 'border-amber-200 bg-amber-50 text-amber-700',
    bad: 'border-red-200 bg-red-50 text-red-700',
    neutral: 'border-slate-200 bg-slate-50 text-slate-700',
  }[state];

  const Icon = {
    good: CheckCircle2,
    warn: CircleAlert,
    bad: XCircle,
    neutral: CircleDashed,
  }[state];

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${classes}`}>
      <Icon className="h-3.5 w-3.5" />
      {status}
    </span>
  );
}
