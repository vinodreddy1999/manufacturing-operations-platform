export function LoadingState({ label = 'Loading backend data' }: { label?: string }) {
  return (
    <div className="enterprise-card border-dashed border-border bg-card/80 p-token-6 text-body-sm text-muted-foreground">
      <div className="flex items-center gap-3">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span>{label}</span>
      </div>
    </div>
  );
}
