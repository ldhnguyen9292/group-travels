import { describe, expect, it } from 'vitest';
import {
  CURRENCIES,
  MAX_AMOUNT,
  clampAmount,
  currencyDecimals,
  parseAmount,
  readAmount,
  readOptionalAmount,
  roundMoney,
  splitEvenly,
  toMinorUnits,
} from './money';

describe('splitEvenly', () => {
  it('gives every part back exactly, with no rounding loss (VND)', () => {
    const parts = splitEvenly(100_000, 3, 'VND');
    expect(parts).toEqual([33_334, 33_333, 33_333]);
    expect(parts.reduce((sum, part) => sum + part, 0)).toBe(100_000);
  });

  it('splits to the cent for two-decimal currencies', () => {
    const parts = splitEvenly(10, 3, 'USD');
    expect(parts).toEqual([3.34, 3.33, 3.33]);
    expect(parts.reduce((sum, part) => sum + part, 0)).toBeCloseTo(10, 10);
  });

  it('handles an even split and an empty group', () => {
    expect(splitEvenly(120, 4, 'USD')).toEqual([30, 30, 30, 30]);
    expect(splitEvenly(120, 0, 'USD')).toEqual([]);
  });
});

describe('roundMoney', () => {
  it('drops decimals for zero-decimal currencies', () => {
    expect(roundMoney(33.6, 'VND')).toBe(34);
    expect(roundMoney(0.1 + 0.2, 'USD')).toBe(0.3);
    expect(roundMoney(Number.NaN, 'USD')).toBe(0);
  });
});

describe('toMinorUnits', () => {
  it('produces integers that compare exactly', () => {
    expect(toMinorUnits(3.33, 'USD') + toMinorUnits(3.33, 'USD') + toMinorUnits(3.34, 'USD')).toBe(
      toMinorUnits(10, 'USD'),
    );
  });
});

describe('parseAmount', () => {
  it('rejects everything that is not a positive number', () => {
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('  ')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('0')).toBeNull();
    expect(parseAmount('-5')).toBeNull();
    expect(parseAmount('12.5')).toBe(12.5);
  });
});

describe('large amounts', () => {
  it('MAX_AMOUNT keeps minor units well inside exact-integer range', () => {
    for (const currency of CURRENCIES) {
      const minor = MAX_AMOUNT * 10 ** currencyDecimals(currency);
      expect(minor).toBeLessThan(Number.MAX_SAFE_INTEGER);
      expect(Number.isSafeInteger(minor)).toBe(true);
    }
  });

  it('splits stay exact right up to the maximum, in every currency', () => {
    for (const currency of CURRENCIES) {
      for (const people of [3, 7, 11]) {
        const parts = splitEvenly(MAX_AMOUNT, people, currency);
        const sum = parts.reduce((acc, part) => acc + toMinorUnits(part, currency), 0);
        expect(sum).toBe(toMinorUnits(MAX_AMOUNT, currency));
      }
    }
  });

  it('accepts realistic Vietnamese amounts', () => {
    expect(readAmount('1500000000')).toEqual({ ok: true, value: 1_500_000_000 });
    expect(splitEvenly(5_000_000, 3, 'VND')).toEqual([1_666_667, 1_666_667, 1_666_666]);
  });

  it('rejects amounts that would break the arithmetic, and says why', () => {
    // A number input happily accepts scientific notation like this.
    expect(readAmount('1e21')).toEqual({ ok: false, reason: 'too-large' });
    expect(readAmount('999999999999999999999')).toEqual({ ok: false, reason: 'too-large' });
    expect(readAmount(String(MAX_AMOUNT + 1))).toEqual({ ok: false, reason: 'too-large' });
    expect(readAmount(String(MAX_AMOUNT))).toEqual({ ok: true, value: MAX_AMOUNT });
    expect(readAmount('Infinity')).toEqual({ ok: false, reason: 'invalid' });
    expect(readAmount('')).toEqual({ ok: false, reason: 'invalid' });
  });

  it('treats blank custom-split fields as zero but still rejects unsafe ones', () => {
    expect(readOptionalAmount('')).toBe(0);
    expect(readOptionalAmount(undefined)).toBe(0);
    expect(readOptionalAmount('0')).toBe(0);
    expect(readOptionalAmount('250000')).toBe(250_000);
    expect(readOptionalAmount('-1')).toBeNull();
    expect(readOptionalAmount('1e21')).toBeNull();
  });

  it('clamps values arriving from storage or an imported backup', () => {
    expect(clampAmount(1e21)).toBe(MAX_AMOUNT);
    expect(clampAmount(-5)).toBe(0);
    // Garbage becomes 0 rather than a trillion: it means "unknown", not "huge".
    expect(clampAmount(Number.NaN)).toBe(0);
    expect(clampAmount(Number.POSITIVE_INFINITY)).toBe(0);
    expect(clampAmount(250_000)).toBe(250_000);
  });
});
