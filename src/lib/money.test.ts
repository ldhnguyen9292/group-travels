import { describe, expect, it } from 'vitest';
import { parseAmount, roundMoney, splitEvenly, toMinorUnits } from './money';

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
