type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <div className="mb-6 rounded-2xl border border-white/10 bg-slate-900/50 px-5 py-5 shadow-[0_12px_36px_rgba(2,6,23,0.18)] backdrop-blur-xl sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">{eyebrow}</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h1>
      <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">{description}</p>
    </div>
  );
}
