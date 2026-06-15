import type { ReactNode } from 'react';

type StatCardProps = {
  label: string;
  value: string | number;
  helper?: string;
  icon?: ReactNode;
};

export function StatCard({ label, value, helper, icon }: StatCardProps) {
  return (
    <div className="rounded-[26px] border border-white/70 bg-card/88 p-5 shadow-panel backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-card-foreground">{value}</p>
        </div>
        {icon ? <div className="rounded-2xl bg-primary/10 p-2.5 text-primary">{icon}</div> : null}
      </div>
      {helper ? <p className="mt-4 text-sm text-muted-foreground">{helper}</p> : null}
    </div>
  );
}
