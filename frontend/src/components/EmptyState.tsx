export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="enterprise-card border-dashed border-border p-token-6 text-center">
      <p className="text-body-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-body-sm text-muted-foreground">{description}</p>
    </div>
  );
}
