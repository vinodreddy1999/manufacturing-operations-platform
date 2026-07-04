type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <div className="enterprise-card mb-token-6 px-token-5 py-token-5 sm:px-token-6">
      <p className="enterprise-eyebrow text-cyan-200">{eyebrow}</p>
      <h1 className="mt-2 text-h1 text-white">{title}</h1>
      <p className="mt-2 max-w-4xl text-body-sm text-slate-300">{description}</p>
    </div>
  );
}
