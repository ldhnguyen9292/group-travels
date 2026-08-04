import { describe, expect, it } from 'vitest';
import type { Contribution, Expense, Trip } from '../types/trip';
import { computeBalances, computeTotals, findBalance, participantShares } from './balances';

const trip: Trip = {
  id: 'trip-1',
  name: 'Da Nang',
  currency: 'VND',
  participants: [
    { id: 'a', name: 'An' },
    { id: 'b', name: 'Binh' },
    { id: 'c', name: 'Chi' },
  ],
  createdAt: '2025-10-01T00:00:00.000Z',
  updatedAt: '2025-10-01T00:00:00.000Z',
};

const contributions: Contribution[] = [
  {
    id: 'c1',
    tripId: 'trip-1',
    participantId: 'a',
    amount: 600_000,
    date: '2025-10-02',
    createdAt: '2025-10-02T00:00:00.000Z',
    updatedAt: '2025-10-02T00:00:00.000Z',
  },
  {
    id: 'c2',
    tripId: 'trip-1',
    participantId: 'b',
    amount: 300_000,
    date: '2025-10-02',
    createdAt: '2025-10-02T00:00:00.000Z',
    updatedAt: '2025-10-02T00:00:00.000Z',
  },
];

const expenses: Expense[] = [
  {
    id: 'e1',
    tripId: 'trip-1',
    description: 'Dinner',
    amount: 300_000,
    paidById: 'a',
    splitType: 'equal',
    splits: [
      { participantId: 'a', amount: 100_000 },
      { participantId: 'b', amount: 100_000 },
      { participantId: 'c', amount: 100_000 },
    ],
    date: '2025-10-03',
    createdAt: '2025-10-03T00:00:00.000Z',
    updatedAt: '2025-10-03T00:00:00.000Z',
  },
  {
    id: 'e2',
    tripId: 'trip-1',
    description: 'Taxi',
    amount: 200_000,
    paidById: 'b',
    splitType: 'custom',
    splits: [
      { participantId: 'a', amount: 150_000 },
      { participantId: 'b', amount: 50_000 },
    ],
    date: '2025-10-04',
    createdAt: '2025-10-04T00:00:00.000Z',
    updatedAt: '2025-10-04T00:00:00.000Z',
  },
];

describe('computeTotals', () => {
  it('adds up the fund and what is left', () => {
    expect(computeTotals(trip, expenses, contributions)).toEqual({
      contributions: 900_000,
      expenses: 500_000,
      remaining: 400_000,
    });
  });
});

describe('computeBalances', () => {
  const balances = computeBalances(trip, expenses, contributions);

  it('gives every member a row, in trip order', () => {
    expect(balances.map((balance) => balance.participant.id)).toEqual(['a', 'b', 'c']);
  });

  it('nets what each member put in against their share', () => {
    expect(findBalance(balances, 'a')).toMatchObject({
      contributed: 600_000,
      share: 250_000,
      paidOutOfPocket: 300_000,
      net: 350_000,
    });
    expect(findBalance(balances, 'b')).toMatchObject({
      contributed: 300_000,
      share: 150_000,
      paidOutOfPocket: 200_000,
      net: 150_000,
    });
    // Chi never paid in but ate dinner, so she is down.
    expect(findBalance(balances, 'c')).toMatchObject({
      contributed: 0,
      share: 100_000,
      paidOutOfPocket: 0,
      net: -100_000,
    });
  });

  it('keeps the books balanced: the nets add up to what is left in the fund', () => {
    const sum = balances.reduce((total, balance) => total + balance.net, 0);
    expect(sum).toBe(computeTotals(trip, expenses, contributions).remaining);
  });

  it('reports zero for a member with no records', () => {
    const lonely = computeBalances(trip, [], []);
    expect(lonely.every((balance) => balance.net === 0)).toBe(true);
  });
});

describe('participantShares', () => {
  it('returns only the expenses the member is part of', () => {
    expect(participantShares(expenses, 'c')).toEqual([{ expense: expenses[0], amount: 100_000 }]);
    expect(participantShares(expenses, 'a')).toHaveLength(2);
    expect(participantShares(expenses, 'nobody')).toEqual([]);
  });
});
