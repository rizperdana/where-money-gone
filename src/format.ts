// ponytail: parser returns `total` in major units (47.00), not minor. v1 plan said
// "minor units when symbol found" but the parser ships raw parseFloat. Keep the
// formatter consistent with what the DB actually holds.
export function formatTotal(total: number | null, currency: string | null): string {
  if (total === null) return '—';
  if (currency) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
      }).format(total);
    } catch {
      return `${currency} ${total.toFixed(2)}`;
    }
  }
  return total.toFixed(2);
}
