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
    blue: 'from-cyan-400/30 via-blue-500/15 to-white/10',
    violet: 'from-fuchsia-400/30 via-violet-500/15 to-white/10',
    emerald: 'from-emerald-400/30 via-teal-500/15 to-white/10',
    amber: 'from-amber-300/35 via-orange-400/15 to-white/10',
  }[accent];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-[28px] border border-white/15 bg-white/8 p-5 text-left shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl transition duration-300 ${onClick ? 'hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-white/12' : ''} w-full`}
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accentClasses}`} />
      <div className="pointer-events-none absolute inset-px rounded-[27px] border border-white/10" />
      <div className="flex items-start justify-between gap-3">
        <div className="relative z-10">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-300">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{value}</p>
        </div>
        <div className="relative z-10 flex items-center gap-2">
          {icon ? <div className="rounded-2xl border border-white/10 bg-white/10 p-2.5 text-cyan-100 shadow-[0_0_30px_rgba(34,211,238,0.18)]">{icon}</div> : null}
          {onClick ? <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-white" /> : null}
        </div>
      </div>
      {helper ? <p className="relative z-10 mt-4 text-sm text-slate-300">{helper}</p> : null}
    </button>
  );
}
