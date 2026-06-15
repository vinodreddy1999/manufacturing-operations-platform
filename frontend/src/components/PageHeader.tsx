type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <div className="relative mb-8 overflow-hidden rounded-[36px] border border-white/15 bg-white/8 px-6 py-7 shadow-[0_30px_80px_rgba(15,23,42,0.18)] backdrop-blur-2xl sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.16),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.02))]" />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-[15px]">{description}</p>
      </div>
    </div>
  );
}
