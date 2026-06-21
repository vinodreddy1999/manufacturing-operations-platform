import type { ReactNode } from 'react';
import { FlaskConical } from 'lucide-react';

export function ImpactTracker({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="mt-8 space-y-5 border-t border-white/10 pt-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">Improvement & Savings Impact</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{description}</p>
        </div>
        <span className="inline-flex items-center gap-2 self-start rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-100">
          <FlaskConical className="h-3.5 w-3.5" /> Simulated calculation model
        </span>
      </div>
      {children}
    </section>
  );
}
