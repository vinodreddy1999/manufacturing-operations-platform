import { useState, type ReactNode } from 'react';

import { EmptyState } from './EmptyState';
import { useVirtualRows } from '../lib/performance';

type DataTableProps<T extends Record<string, unknown>> = {
  rows: T[];
  columns: Array<{
    key: keyof T;
    label: string;
    render?: (value: T[keyof T], row: T) => ReactNode;
  }>;
  emptyTitle: string;
};

export function DataTable<T extends Record<string, unknown>>({ rows, columns, emptyTitle }: DataTableProps<T>) {
  const [scrollPosition, setScrollPosition] = useState(1);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const shouldVirtualize = rows.length > 80;
  const virtual = useVirtualRows(rows);
  if (!rows.length) {
    return <EmptyState title={emptyTitle} description="The backend returned an empty collection for this view." />;
  }

  const visibleRows = shouldVirtualize ? virtual.visibleRows : rows;
  const startIndex = shouldVirtualize ? virtual.startIndex : 0;

  return (
    <div className="enterprise-table-frame">
      <div
        className="max-h-[321px] overflow-auto [scrollbar-color:rgba(34,211,238,0.45)_rgba(255,255,255,0.04)]"
        onScroll={(event) => {
          setScrollPosition(Math.floor(event.currentTarget.scrollTop / 54) + 1);
          if (shouldVirtualize) virtual.onScroll(event);
        }}
      >
        <table className="min-w-full divide-y divide-border text-body-sm">
          <thead className="enterprise-sticky-header">
            <tr>
              {columns.map((column) => (
                <th key={String(column.key)} className="whitespace-nowrap px-4 py-3 text-left text-body-sm uppercase text-slate-400">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10" style={shouldVirtualize ? { display: 'block', height: virtual.totalHeight, position: 'relative' } : undefined}>
            {visibleRows.map((row, rowIndex) => (
              <tr
                key={startIndex + rowIndex}
                className="h-[54px] transition hover:bg-white/[0.04]"
                onMouseEnter={() => setHoverPosition(startIndex + rowIndex + 1)}
                onMouseLeave={() => setHoverPosition(null)}
                style={shouldVirtualize ? { display: 'table', tableLayout: 'fixed', transform: `translateY(${virtual.translateY}px)`, width: '100%' } : undefined}
              >
                {columns.map((column) => (
                  <td key={String(column.key)} className="whitespace-nowrap px-4 py-3 text-body-sm text-slate-200">
                    {column.render ? column.render(row[column.key], row) : String(row[column.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex h-8 items-center border-t border-white/10 bg-[#0d1527] px-3 text-caption font-medium text-cyan-200" aria-live="polite">{Math.min(hoverPosition ?? scrollPosition, rows.length)} of {rows.length}</div>
    </div>
  );
}
