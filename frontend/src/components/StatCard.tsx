import type { ReactNode } from 'react';

type StatCardProps = {
  label: string;
  value: string | number;
  helper?: string;
  icon?: ReactNode;
};

export function StatCard({ label, value, helper, icon }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-card-foreground">{value}</p>
        </div>
        {icon ? <div className="rounded-md bg-blue-50 p-2 text-primary">{icon}</div> : null}
      </div>
      {helper ? <p className="mt-3 text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  );
}
