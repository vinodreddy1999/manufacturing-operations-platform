import type { ReactNode } from 'react';

import { useVisibleOnce } from '../lib/performance';

export function LazyViewport({
  children,
  fallback,
  minHeight = 180,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  minHeight?: number;
}) {
  const { ref, visible } = useVisibleOnce<HTMLDivElement>();
  return (
    <div ref={ref} style={{ minHeight }}>
      {visible ? children : fallback ?? <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">Loading this section when visible...</div>}
    </div>
  );
}
