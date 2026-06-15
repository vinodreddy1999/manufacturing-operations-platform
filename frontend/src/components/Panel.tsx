import type { ReactNode } from 'react';

type PanelProps = {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
};

export function Panel({ title, description, children, action }: PanelProps) {
  return (
    <section className="relative overflow-hidden rounded-[30px] border border-white/15 bg-white/8 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.18)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.15),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.14),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-px rounded-[29px] border border-white/10" />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="relative z-10">
          <h2 className="text-base font-semibold tracking-tight text-white sm:text-lg">{title}</h2>
          {description ? <p className="mt-1 text-sm leading-6 text-slate-300">{description}</p> : null}
        </div>
        <div className="relative z-10">{action}</div>
      </div>
      <div className="relative z-10">{children}</div>
    </section>
  );
}
