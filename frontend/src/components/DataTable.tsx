import type { ReactNode } from 'react';

import { EmptyState } from './EmptyState';

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
  if (!rows.length) {
    return <EmptyState title={emptyTitle} description="The backend returned an empty collection for this view." />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/25 backdrop-blur">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-slate-950/45">
            <tr>
              {columns.map((column) => (
                <th key={String(column.key)} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="transition hover:bg-white/[0.04]">
                {columns.map((column) => (
                  <td key={String(column.key)} className="px-4 py-3 text-slate-200">
                    {column.render ? column.render(row[column.key], row) : String(row[column.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
