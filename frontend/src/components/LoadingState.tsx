export function LoadingState({ label = 'Loading backend data' }: { label?: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-border bg-card/80 p-6 text-sm text-muted-foreground shadow-panel">
      <div className="flex items-center gap-3">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span>{label}</span>
      </div>
    </div>
  );
}
