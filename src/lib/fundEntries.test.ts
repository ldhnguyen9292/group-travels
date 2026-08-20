import { describe, expect, it } from 'vitest';
import type { Contribution, Expense } from '../types/trip';
import { buildFundEntries } from './fundEntries';

const contribution: Contribution = {
  id: 'c1',
  tripId: 'trip-1',
  participantId: 'a',
  amount: 600_000,
  date: '2025-10-02',
  createdAt: '2025-10-02T00:00:00.000Z',
  updatedAt: '2025-10-02T00:00:00.000Z',
};

const expense = (over: Partial<Expense>): Expense => ({
  id: 'e1',
  tripId: 'trip-1',
  description: 'Dinner',
  amount: 300_000,
  paidById: 'b',
  paidFrom: 'own',
  splitType: 'equal',
  splits: [{ participantId: 'b', amount: 300_000 }],
  date: '2025-10-05',
  createdAt: '2025-10-05T00:00:00.000Z',
  updatedAt: '2025-10-05T00:00:00.000Z',
  ...over,
});

describe('buildFundEntries', () => {
  it('lists money the payer fronted alongside the contributions', () => {
    const entries = buildFundEntries([expense({})], [contribution]);
    expect(entries).toHaveLength(2);
    expect(entries.map((entry) => entry.amount)).toEqual([300_000, 600_000]);
  });

  it('leaves out expenses the fund itself paid for', () => {
    const entries = buildFundEntries([expense({ paidFrom: 'fund' })], [contribution]);
    expect(entries.map((entry) => entry.contribution?.id)).toEqual(['c1']);
  });

  it('marks a fronted row with its expense, and a real entry with its record', () => {
    const [fronted, entered] = buildFundEntries([expense({})], [contribution]);
    expect(fronted).toMatchObject({ participantId: 'b', note: 'Dinner', contribution: null });
    expect(entered.contribution).toBe(contribution);
    expect(entered.note).toBeUndefined();
  });

  it('orders newest first, breaking ties on when the record was written', () => {
    const entries = buildFundEntries(
      [
        expense({ id: 'e1', date: '2025-10-02', createdAt: '2025-10-02T09:00:00.000Z' }),
        expense({ id: 'e2', date: '2025-10-09' }),
      ],
      [contribution],
    );
    // 09 Oct, then both 02 Oct entries with the later-written one first.
    expect(entries.map((entry) => entry.key)).toEqual([
      'expense:e2',
      'expense:e1',
      'contribution:c1',
    ]);
  });
});
