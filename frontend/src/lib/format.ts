export function formatNumber(value: number | undefined, options?: Intl.NumberFormatOptions): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0';
  }
  return new Intl.NumberFormat('en-IN', options).format(value);
}

export function formatCurrency(value: number | undefined): string {
  return formatNumber(value, {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });
}

export function toTitle(value: string): string {
  return value
    .replace(/[_-]/g, ' ')
    .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}
