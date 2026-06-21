import type { ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';

export function SavingsCard({ label, value, helper, icon, onClick }: { label: string; value: string; helper: string; icon?: ReactNode; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="group flex min-h-32 w-full flex-col justify-between rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-left shadow-[0_16px_42px_rgba(2,6,23,0.24)] backdrop-blur-xl transition hover:border-cyan-300/35 hover:bg-slate-800/70">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
        <div className="flex items-center gap-2 text-cyan-200">{icon}{onClick ? <ArrowUpRight className="h-4 w-4" /> : null}</div>
      </div>
      <div>
        <p className="text-2xl font-semibold tracking-tight text-white">{value}</p>
        <p className="mt-1 text-sm text-slate-400">{helper}</p>
      </div>
    </button>
  );
}
