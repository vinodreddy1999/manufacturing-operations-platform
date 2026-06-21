import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';

export type AccessGridItem = {
  label: string;
  group?: string;
};

type MultiSelectAccessGridProps = {
  title: string;
  description?: string;
  items: Array<string | AccessGridItem>;
  selectedItems: string[];
  onChange: (selectedItems: string[]) => void;
  searchPlaceholder?: string;
  columns?: 1 | 2 | 3 | 4;
  showSelectAll?: boolean;
  showClear?: boolean;
  showSelectedCount?: boolean;
};

const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

export function MultiSelectAccessGrid({
  title,
  description,
  items,
  selectedItems,
  onChange,
  searchPlaceholder = 'Search...',
  columns = 3,
  showSelectAll = true,
  showClear = true,
  showSelectedCount = true,
}: MultiSelectAccessGridProps) {
  const [search, setSearch] = useState('');
  const normalizedItems = useMemo(
    () => items.map((item) => typeof item === 'string' ? { label: item, group: 'Access' } : { ...item, group: item.group ?? 'Access' }),
    [items],
  );
  const filteredItems = useMemo(
    () => normalizedItems.filter((item) => item.label.toLowerCase().includes(search.trim().toLowerCase())),
    [normalizedItems, search],
  );
  const groups = useMemo(
    () => [...new Set(filteredItems.map((item) => item.group))],
    [filteredItems],
  );

  function toggle(label: string) {
    onChange(selectedItems.includes(label) ? selectedItems.filter((item) => item !== label) : [...selectedItems, label]);
  }

  function selectAll() {
    onChange(normalizedItems.map((item) => item.label));
  }

  function clearAll() {
    onChange([]);
  }

  return (
    <fieldset className="rounded-2xl border border-white/10 bg-slate-950/20 p-4 sm:p-5">
      <legend className="sr-only">{title}</legend>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">{title}</h2>
          {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {showSelectAll ? <button type="button" className="form-button-subtle py-2 text-xs" onClick={selectAll}>Select All</button> : null}
          {showClear ? <button type="button" className="form-button-subtle py-2 text-xs" onClick={clearAll}>Clear All</button> : null}
          {showSelectedCount ? <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-100">{selectedItems.length} selected</span> : null}
        </div>
      </div>

      <label className="relative mt-4 block">
        <span className="sr-only">{searchPlaceholder}</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          className="form-input w-full pl-10"
          type="search"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>

      {filteredItems.length ? (
        <div className="mt-5 space-y-5">
          {groups.map((group) => (
            <section key={group} aria-label={group}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{group}</h3>
              <div className={`grid gap-2 ${columnClasses[columns]}`}>
                {filteredItems.filter((item) => item.group === group).map((item) => {
                  const selected = selectedItems.includes(item.label);
                  return (
                    <label
                      key={item.label}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition ${selected ? 'border-cyan-300/35 bg-cyan-400/10 text-white shadow-[0_0_18px_rgba(34,211,238,0.08)]' : 'border-white/10 bg-slate-950/35 text-slate-300 hover:border-white/20 hover:bg-white/[0.06]'}`}
                    >
                      <input type="checkbox" checked={selected} onChange={() => toggle(item.label)} />
                      <span>{item.label}</span>
                    </label>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-400">No matching access items.</div>
      )}
    </fieldset>
  );
}
