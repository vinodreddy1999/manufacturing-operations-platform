import type { ReactNode } from 'react';

type PanelProps = {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
};

export function Panel({ title, description, children, action }: PanelProps) {
  return (
    <section className="flex h-full flex-col rounded-2xl border border-white/10 bg-slate-900/55 p-4 shadow-[0_12px_36px_rgba(2,6,23,0.22)] backdrop-blur-xl sm:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-white">{title}</h2>
          {description ? <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">{description}</p> : null}
        </div>
        <div>{action}</div>
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
    </section>
  );
}
