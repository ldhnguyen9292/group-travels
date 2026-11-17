import { describe, expect, it } from 'vitest';
import type { ExpenseItem } from '../types/trip';
import { computeItemSplits } from './itemSplit';
import { toMinorUnits } from './money';

const order = ['a', 'b', 'c'];

function item(id: string, price: number, participantIds: string[]): ExpenseItem {
  return { id, name: id, price, participantIds };
}

const sumOf = (splits: { amount: number }[], currency: 'VND' | 'USD' = 'VND') =>
  splits.reduce((sum, split) => sum + toMinorUnits(split.amount, currency), 0);

describe('computeItemSplits', () => {
  it('gives each person the items they had', () => {
    const result = computeItemSplits(
      [item('pho', 60_000, ['a']), item('bun', 50_000, ['b'])],
      [],
      order,
      'VND',
    );
    expect(result.amount).toBe(110_000);
    expect(result.splits).toEqual([
      { participantId: 'a', amount: 60_000 },
      { participantId: 'b', amount: 50_000 },
    ]);
  });

  it('shares an item evenly between the people on it, leftover đồng to the first', () => {
    const result = computeItemSplits([item('hotpot', 100_000, ['c', 'a', 'b'])], [], order, 'VND');
    expect(result.splits).toEqual([
      { participantId: 'a', amount: 33_334 },
      { participantId: 'b', amount: 33_333 },
      { participantId: 'c', amount: 33_333 },
    ]);
    expect(sumOf(result.splits)).toBe(100_000);
  });

  it('shares fees evenly between everyone with an item, not by how much they ate', () => {
    const result = computeItemSplits(
      [item('steak', 300_000, ['a']), item('tea', 20_000, ['b'])],
      [{ label: 'Service', amount: 30_000 }],
      order,
      'VND',
    );
    expect(result.feesTotal).toBe(30_000);
    expect(result.amount).toBe(350_000);
    expect(result.splits).toEqual([
      { participantId: 'a', amount: 315_000 },
      { participantId: 'b', amount: 35_000 },
    ]);
  });

  it('takes a discount off as a negative fee, still adding up exactly', () => {
    const result = computeItemSplits(
      [item('pizza', 200_000, ['a', 'b', 'c'])],
      [
        { label: 'VAT', amount: 16_000 },
        { label: 'Discount', amount: -50_000 },
      ],
      order,
      'VND',
    );
    expect(result.amount).toBe(166_000);
    expect(sumOf(result.splits)).toBe(166_000);
  });

  it('keeps cents exact for two-decimal currencies', () => {
    const result = computeItemSplits(
      [item('drinks', 10, ['a', 'b', 'c'])],
      [{ label: 'Tip', amount: 1.01 }],
      order,
      'USD',
    );
    expect(result.amount).toBe(11.01);
    expect(sumOf(result.splits, 'USD')).toBe(1101);
  });

  it('ignores a person listed twice on one item', () => {
    const result = computeItemSplits([item('beer', 40_000, ['a', 'a', 'b'])], [], order, 'VND');
    expect(result.splits).toEqual([
      { participantId: 'a', amount: 20_000 },
      { participantId: 'b', amount: 20_000 },
    ]);
  });

  it('is empty for an empty bill', () => {
    expect(computeItemSplits([], [], order, 'VND')).toEqual({
      amount: 0,
      itemsTotal: 0,
      feesTotal: 0,
      splits: [],
    });
  });
});
