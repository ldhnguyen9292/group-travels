const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Today as yyyy-mm-dd in the user's own timezone. */
export function todayISO(): string {
  return toISODate(new Date());
}

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a stored date. `new Date('2025-10-24')` is parsed as UTC midnight, which
 * renders as the previous day west of Greenwich, so plain dates are built locally.
 */
export function parseDate(value: string | undefined): Date | null {
  if (!value) return null;
  if (ISO_DATE.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Normalise any stored date value to yyyy-mm-dd so `<input type="date">` accepts it. */
export function normaliseDate(value: string | undefined, fallback: string): string {
  const parsed = parseDate(value);
  return parsed ? toISODate(parsed) : fallback;
}

export function formatDate(value: string | undefined, locale: string): string {
  const date = parseDate(value);
  if (!date) return '';
  return date.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateRange(
  start: string | undefined,
  end: string | undefined,
  locale: string,
): string {
  const from = formatDate(start, locale);
  const to = formatDate(end, locale);
  if (from && to) return from === to ? from : `${from} – ${to}`;
  return from || to;
}

/** Compare yyyy-mm-dd strings; lexicographic order matches chronological order. */
export function isBefore(a: string, b: string): boolean {
  return a < b;
}
