import type { ReactNode } from 'react';

type PanelProps = {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
};

export function Panel({ title, description, children, action }: PanelProps) {
  return (
    <section className="enterprise-card h-full p-token-4 sm:p-token-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-h5 text-white">{title}</h2>
          {description ? <p className="mt-1 max-w-3xl text-body-sm text-slate-400">{description}</p> : null}
        </div>
        <div>{action}</div>
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
    </section>
  );
}
