import { useState, type MouseEvent, type ReactNode } from 'react';

export function ScrollableTableFrame({ children, count, rowHeight = 54 }: { children: ReactNode; count: number; rowHeight?: number }) {
  const [scrollPosition, setScrollPosition] = useState(1);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const current = count ? Math.min(hoverPosition ?? scrollPosition, count) : 0;

  function trackRow(event: MouseEvent<HTMLDivElement>) {
    const row = (event.target as HTMLElement).closest('tbody tr');
    if (!row?.parentElement) return;
    setHoverPosition(Array.from(row.parentElement.children).indexOf(row) + 1);
  }

  return (
    <div className="overflow-x-auto">
      <div
        className="max-h-[321px] overflow-auto [scrollbar-color:rgba(34,211,238,0.45)_rgba(255,255,255,0.04)] [&_tbody_tr]:h-[54px] [&_td]:whitespace-nowrap [&_th]:whitespace-nowrap [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10 [&_thead]:bg-[#0d1527]"
        onScroll={(event) => setScrollPosition(Math.floor(event.currentTarget.scrollTop / rowHeight) + 1)}
        onMouseOver={trackRow}
        onMouseLeave={() => setHoverPosition(null)}
      >
        {children}
      </div>
      <div className="sticky left-0 flex h-8 items-center border-t border-white/10 bg-[#0d1527] px-3 text-xs font-medium text-cyan-200" aria-live="polite">{current} of {count}</div>
    </div>
  );
}
