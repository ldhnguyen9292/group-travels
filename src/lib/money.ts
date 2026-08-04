import type { CurrencyCode } from '../types/trip';

export const CURRENCIES: CurrencyCode[] = ['VND', 'USD', 'EUR', 'JPY', 'THB'];

export const DEFAULT_CURRENCY: CurrencyCode = 'VND';

const DECIMALS: Record<CurrencyCode, number> = { VND: 0, JPY: 0, USD: 2, EUR: 2, THB: 2 };

export function isCurrency(value: unknown): value is CurrencyCode {
  return typeof value === 'string' && (CURRENCIES as string[]).includes(value);
}

export function currencyDecimals(currency: CurrencyCode): number {
  return DECIMALS[currency] ?? 2;
}

/** Smallest representable step for a currency (1 for VND, 0.01 for USD). */
export function currencyStep(currency: CurrencyCode): number {
  return 1 / 10 ** currencyDecimals(currency);
}

/** Round to the currency's precision, avoiding float drift like 0.1 + 0.2. */
export function roundMoney(amount: number, currency: CurrencyCode): number {
  if (!Number.isFinite(amount)) return 0;
  const factor = 10 ** currencyDecimals(currency);
  return Math.round((amount + Number.EPSILON * Math.sign(amount)) * factor) / factor;
}

/** Amount expressed in minor units (cents / đồng) as an integer, safe for comparisons. */
export function toMinorUnits(amount: number, currency: CurrencyCode): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 10 ** currencyDecimals(currency));
}

export function formatMoney(amount: number, currency: CurrencyCode, locale: string): string {
  const value = roundMoney(amount, currency);
  const decimals = currencyDecimals(currency);
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  } catch {
    return `${value.toLocaleString(locale)} ${currency}`;
  }
}

/** Always shows a sign, for balances: "+120,000 ₫" / "-40,000 ₫". */
export function formatMoneySigned(amount: number, currency: CurrencyCode, locale: string): string {
  const value = roundMoney(amount, currency);
  const formatted = formatMoney(Math.abs(value), currency, locale);
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
}

/**
 * Split a total between `count` people so that the parts always add back up to
 * the total: the leftover minor units are handed out one by one.
 */
export function splitEvenly(total: number, count: number, currency: CurrencyCode): number[] {
  if (count <= 0) return [];
  const factor = 10 ** currencyDecimals(currency);
  const units = toMinorUnits(total, currency);
  const base = Math.floor(units / count);
  const leftover = units - base * count;
  return Array.from({ length: count }, (_, index) => (base + (index < leftover ? 1 : 0)) / factor);
}

/**
 * Largest amount the app accepts. Above this, minor units approach
 * Number.MAX_SAFE_INTEGER (9.007e15) and sums stop being exact: splitting 1e14
 * USD three ways adds back up to 99999999999999.98 instead of 1e14. One
 * trillion keeps minor units at 1e14 for every supported currency, with room to
 * spare, and is far beyond any real trip.
 */
export const MAX_AMOUNT = 1_000_000_000_000;

export type AmountResult = { ok: true; value: number } | { ok: false; reason: 'invalid' | 'too-large' };

/** Parse a user-typed total, saying *why* it was rejected. */
export function readAmount(input: string): AmountResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, reason: 'invalid' };
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0) return { ok: false, reason: 'invalid' };
  if (value > MAX_AMOUNT) return { ok: false, reason: 'too-large' };
  return { ok: true, value };
}

/** Parse a user-typed amount. Returns null when it is not a usable positive number. */
export function parseAmount(input: string): number | null {
  const result = readAmount(input);
  return result.ok ? result.value : null;
}

/**
 * Split fields may legitimately be blank or zero, unlike a total.
 * Returns null only for values this app cannot add up safely.
 */
export function readOptionalAmount(input: string | undefined): number | null {
  const trimmed = (input ?? '').trim();
  if (!trimmed) return 0;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0 || value > MAX_AMOUNT) return null;
  return value;
}

/** Clamp an amount coming from stored or imported data into a safe range. */
export function clampAmount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(value, 0), MAX_AMOUNT);
}
