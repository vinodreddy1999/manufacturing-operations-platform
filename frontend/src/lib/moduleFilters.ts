export type ModuleFilterValues = Record<string, string>;

export function applyModuleFilters<T extends Record<string, unknown>>(
  rows: T[],
  filters: ModuleFilterValues,
  fieldMap: Record<string, string | ((row: T) => string)>,
): T[] {
  return rows.filter((row) =>
    Object.entries(filters).every(([filterKey, filterValue]) => {
      if (!filterValue) return true;
      const mapped = fieldMap[filterKey];
      if (!mapped) return true;
      const rowValue = typeof mapped === 'function' ? mapped(row) : String(row[mapped] ?? '');
      return rowValue.toLowerCase().includes(filterValue.toLowerCase());
    }),
  );
}

export function textMatchesFilters(
  searchableText: string,
  filters: ModuleFilterValues,
): boolean {
  const normalized = searchableText.toLowerCase();
  return Object.values(filters).every((value) => !value || normalized.includes(value.toLowerCase()));
}
