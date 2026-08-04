import { describe, expect, it } from 'vitest';
import { formatDateRange, isBefore, normaliseDate, parseDate, toISODate } from './date';

describe('parseDate', () => {
  it('reads plain dates in the local timezone, not UTC', () => {
    const date = parseDate('2025-10-24');
    expect(date).not.toBeNull();
    expect(toISODate(date!)).toBe('2025-10-24');
    expect(date!.getDate()).toBe(24);
  });

  it('accepts full timestamps left over from older records', () => {
    const date = parseDate('2025-10-24T09:30:00.000Z');
    expect(date).not.toBeNull();
  });

  it('returns null for junk', () => {
    expect(parseDate('')).toBeNull();
    expect(parseDate(undefined)).toBeNull();
    expect(parseDate('not-a-date')).toBeNull();
  });
});

describe('normaliseDate', () => {
  it('collapses any stored value to yyyy-mm-dd', () => {
    expect(normaliseDate('2025-10-24', 'fallback')).toBe('2025-10-24');
    expect(normaliseDate('nonsense', '2020-01-01')).toBe('2020-01-01');
    expect(normaliseDate(undefined, '2020-01-01')).toBe('2020-01-01');
  });
});

describe('formatDateRange', () => {
  it('collapses a single-day range and tolerates missing ends', () => {
    expect(formatDateRange('2025-10-24', '2025-10-24', 'en-US')).not.toContain('–');
    expect(formatDateRange('2025-10-24', undefined, 'en-US')).not.toContain('–');
    expect(formatDateRange(undefined, undefined, 'en-US')).toBe('');
    expect(formatDateRange('2025-10-24', '2025-10-26', 'en-US')).toContain('–');
  });
});

describe('isBefore', () => {
  it('compares iso dates', () => {
    expect(isBefore('2025-01-01', '2025-01-02')).toBe(true);
    expect(isBefore('2025-01-02', '2025-01-01')).toBe(false);
  });
});
