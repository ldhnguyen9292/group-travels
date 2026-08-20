import { describe, expect, it } from 'vitest';
import { DICTIONARIES, LOCALES } from '../i18n/dictionary';
import type { Expense, Trip } from '../types/trip';
import { computeBalances } from './balances';
import { buildExpenseMatrix } from './expenseMatrix';
import { imageFilename } from './tableImage';

const trip: Trip = {
  id: 't1',
  name: 'Da Nang',
  currency: 'VND',
  participants: [
    { id: 'a', name: 'An' },
    { id: 'b', name: 'Binh' },
    { id: 'c', name: 'Chi' },
  ],
  createdAt: '',
  updatedAt: '',
};

const expenses: Expense[] = [
  {
    id: 'e1',
    tripId: 't1',
    description: 'Dinner',
    amount: 300_000,
    paidById: 'a',
    paidFrom: 'fund',
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
    tripId: 't1',
    description: 'Taxi',
    amount: 200_000,
    paidById: 'b',
    paidFrom: 'fund',
    splitType: 'custom',
    splits: [
      { participantId: 'b', amount: 150_000 },
      { participantId: 'c', amount: 50_000 },
    ],
    date: '2025-10-04',
    createdAt: '2025-10-04T00:00:00.000Z',
    updatedAt: '2025-10-04T00:00:00.000Z',
  },
];

const en = { t: DICTIONARIES.en, locale: LOCALES.en };
const matrix = buildExpenseMatrix(trip, expenses, 'Oct 24 – 26', en);

describe('buildExpenseMatrix', () => {
  it('gives every member a column, in the trip’s own order', () => {
    expect(matrix.columns).toEqual(['An', 'Binh', 'Chi']);
  });

  it('marks the members an expense left out, rather than showing them a zero', () => {
    const taxi = matrix.rows[1];
    expect(taxi.cells[0].missing).toBe(true);
    expect(taxi.cells[0].text).toBe('');
    expect(taxi.cells[1]).toEqual({ text: '₫150,000', missing: false });
  });

  it('totals each column to exactly the share the balances ask that member for', () => {
    const shares = computeBalances(trip, expenses, []).map((balance) => balance.share);
    expect(shares).toEqual([100_000, 250_000, 150_000]);
    expect(matrix.totalsCells).toEqual(['₫100,000', '₫250,000', '₫150,000']);
  });

  it('totals the whole grid to what the trip spent', () => {
    expect(matrix.grandTotal).toBe('₫500,000');
    expect(matrix.rows.map((row) => row.total)).toEqual(['₫300,000', '₫200,000']);
  });

  it('names the day and the payer under each expense', () => {
    expect(matrix.rows[0].label).toBe('Dinner');
    expect(matrix.rows[0].meta).toBe('10/03 · An paid');
  });

  it('keeps the order it was handed, so the screen and the picture match the list', () => {
    const reversed = buildExpenseMatrix(trip, [...expenses].reverse(), '', en);
    expect(reversed.rows.map((row) => row.key)).toEqual(['e2', 'e1']);
  });

  it('survives a trip with no expenses', () => {
    const empty = buildExpenseMatrix(trip, [], '', en);
    expect(empty.rows).toEqual([]);
    expect(empty.totalsCells).toEqual(['₫0', '₫0', '₫0']);
  });
});

describe('imageFilename', () => {
  it('strips Vietnamese marks and punctuation so any phone will save it', () => {
    expect(imageFilename('Đà Nẵng 3 ngày')).toBe('da-nang-3-ngay.png');
    expect(imageFilename('  ')).toBe('expenses.png');
  });
});
