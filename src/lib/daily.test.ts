import { describe, expect, it } from 'vitest';
import { DICTIONARIES, LOCALES } from '../i18n/dictionary';
import type { Expense, Trip } from '../types/trip';
import { buildDailyOverview, buildDailyTotals, buildDaySummary } from './daily';

const trip: Trip = {
  id: 't1',
  name: 'Da Lat',
  currency: 'VND',
  participants: [
    { id: 'a', name: 'An' },
    { id: 'b', name: 'Binh' },
    { id: 'c', name: 'Chi' },
  ],
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
};

function expense(partial: Partial<Expense> & Pick<Expense, 'id' | 'date' | 'amount'>): Expense {
  return {
    tripId: 't1',
    description: partial.id,
    paidById: 'a',
    paidFrom: 'own',
    splitType: 'custom',
    splits: [],
    createdAt: `${partial.date}T08:00:00.000Z`,
    updatedAt: `${partial.date}T08:00:00.000Z`,
    ...partial,
  };
}

const expenses: Expense[] = [
  expense({
    id: 'Pho',
    date: '2026-11-17',
    amount: 300_000,
    createdAt: '2026-11-17T01:00:00.000Z',
    splits: [
      { participantId: 'a', amount: 100_000 },
      { participantId: 'b', amount: 100_000 },
      { participantId: 'c', amount: 100_000 },
    ],
  }),
  expense({
    id: 'Cable car',
    date: '2026-11-17',
    amount: 200_000,
    paidById: 'b',
    paidFrom: 'fund',
    createdAt: '2026-11-17T05:00:00.000Z',
    splits: [
      { participantId: 'b', amount: 50_000 },
      { participantId: 'c', amount: 150_000 },
    ],
  }),
  expense({
    id: 'Hotel',
    date: '2026-11-15',
    amount: 900_000,
    paidById: 'c',
    splits: [
      { participantId: 'a', amount: 300_000 },
      { participantId: 'b', amount: 300_000 },
      { participantId: 'c', amount: 300_000 },
    ],
  }),
];

const en = { t: DICTIONARIES.en, locale: LOCALES.en };
const vn = { t: DICTIONARIES.vn, locale: LOCALES.vn };

describe('buildDailyTotals', () => {
  const days = buildDailyTotals(trip, expenses);

  it('has one entry per day with spending, newest first, no empty days', () => {
    expect(days.map((day) => day.date)).toEqual(['2026-11-17', '2026-11-15']);
  });

  it('adds up the day', () => {
    expect(days[0].total).toBe(500_000);
    expect(days[1].total).toBe(900_000);
  });

  it('lists the day in the order it happened, whatever order it was handed', () => {
    const reversed = buildDailyTotals(trip, [...expenses].reverse());
    expect(reversed[0].expenses.map((item) => item.id)).toEqual(['Pho', 'Cable car']);
  });

  it('gives each person their share, not what they paid, in trip order', () => {
    expect(days[0].shares).toEqual([
      { participantId: 'a', amount: 100_000 },
      { participantId: 'b', amount: 150_000 },
      { participantId: 'c', amount: 250_000 },
    ]);
  });

  it('leaves out people who carry nothing that day', () => {
    const only = buildDailyTotals(trip, [expenses[1]]);
    expect(only[0].shares.map((share) => share.participantId)).toEqual(['b', 'c']);
  });

  it('is empty for a trip with no expenses', () => {
    expect(buildDailyTotals(trip, [])).toEqual([]);
  });
});

describe('buildDaySummary', () => {
  const [today] = buildDailyTotals(trip, expenses);
  const text = buildDaySummary(trip, today, en);

  it('names the trip and the day', () => {
    expect(text.split('\n')[0]).toContain('Da Lat');
    expect(text.split('\n')[0]).toContain('2026');
  });

  it('states the total and how many expenses', () => {
    expect(text).toContain('Total: ₫500,000 (2 expenses)');
  });

  it('lists each person and each expense with who paid or the fund', () => {
    expect(text).toContain('• Chi: ₫250,000');
    expect(text).toContain('• Pho – ₫300,000 (An paid)');
    expect(text).toContain('• Cable car – ₫200,000 (Fund)');
  });

  it('never pads columns', () => {
    expect(text).not.toMatch(/ {2,}/);
  });

  it('translates completely', () => {
    const vietnamese = buildDaySummary(trip, today, vn);
    expect(vietnamese).toContain('Tổng');
    expect(vietnamese).toContain('Mỗi người');
    expect(vietnamese).toContain('(An trả)');
    expect(vietnamese).toContain('(Quỹ)');
    expect(vietnamese).toContain('2 khoản');
    expect(vietnamese).not.toMatch(/Total|Each person|paid|Fund/);
  });
});

describe('buildDailyOverview', () => {
  const days = buildDailyTotals(trip, expenses);
  const text = buildDailyOverview(trip, days, en);

  it('reads forwards in time, one line per day', () => {
    const dayLines = text.split('\n').filter((line) => /^• \d\d\/\d\d:/.test(line));
    expect(dayLines).toEqual(['• 11/15: ₫900,000', '• 11/17: ₫500,000']);
  });

  it('closes with the trip total and every person’s share of it', () => {
    expect(text).toContain('Total: ₫1,400,000');
    expect(text).toContain('• An: ₫400,000');
    expect(text).toContain('• Binh: ₫450,000');
    expect(text).toContain('• Chi: ₫550,000');
  });

  it('does not list individual expenses', () => {
    expect(text).not.toContain('Pho');
  });
});
