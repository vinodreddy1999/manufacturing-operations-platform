import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

type StatCardProps = {
  label: string;
  value: string | number;
  helper?: string;
  icon?: ReactNode;
  onClick?: () => void;
  accent?: 'blue' | 'violet' | 'emerald' | 'amber';
};

export function StatCard({ label, value, helper, icon, onClick, accent = 'blue' }: StatCardProps) {
  const accentClasses = {
    blue: 'text-cyan-200 bg-cyan-400/10 border-cyan-300/20',
    violet: 'text-violet-200 bg-violet-400/10 border-violet-300/20',
    emerald: 'text-emerald-200 bg-emerald-400/10 border-emerald-300/20',
    amber: 'text-amber-200 bg-amber-400/10 border-amber-300/20',
  }[accent];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex min-h-[118px] w-full flex-col justify-between rounded-2xl border border-white/10 bg-slate-900/55 p-4 text-left shadow-[0_10px_30px_rgba(2,6,23,0.18)] backdrop-blur-xl transition ${onClick ? 'hover:border-cyan-300/40 hover:bg-slate-800/70' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{value}</p>
        </div>
        <div className="flex items-center gap-2">
          {icon ? <div className={`rounded-xl border p-2 ${accentClasses}`}>{icon}</div> : null}
          {onClick ? <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-white" /> : null}
        </div>
      </div>
      {helper ? <p className="mt-3 text-sm text-slate-400">{helper}</p> : null}
    </button>
  );
}
