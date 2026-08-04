import { describe, expect, it } from 'vitest';
import { DICTIONARIES, LOCALES } from '../i18n/dictionary';
import type { Contribution, Expense, Trip } from '../types/trip';
import { computeBalances, computeTotals, findBalance, participantShares } from './balances';
import { buildParticipantSummary, buildTripSummary } from './summary';

const trip: Trip = {
  id: 't1',
  name: 'Da Nang',
  currency: 'VND',
  startDate: '2025-10-24',
  endDate: '2025-10-26',
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
    tripId: 't1',
    participantId: 'a',
    amount: 600_000,
    date: '2025-10-02',
    createdAt: '2025-10-02T00:00:00.000Z',
    updatedAt: '2025-10-02T00:00:00.000Z',
  },
];

const expenses: Expense[] = [
  {
    id: 'e1',
    tripId: 't1',
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
];

const en = { t: DICTIONARIES.en, locale: LOCALES.en };
const vn = { t: DICTIONARIES.vn, locale: LOCALES.vn };

const totals = computeTotals(trip, expenses, contributions);
const balances = computeBalances(trip, expenses, contributions);

describe('buildTripSummary', () => {
  const text = buildTripSummary(trip, totals, balances, en);

  it('leads with the trip and its dates', () => {
    expect(text.split('\n')[0]).toContain('Da Nang');
    expect(text.split('\n')[0]).toContain('2025');
  });

  it('states the fund, the spending and what is left', () => {
    expect(text).toContain('Paid into the fund');
    expect(text).toContain('Spent');
    expect(text).toContain('Left in the fund');
  });

  it('lists whoever owes the most first, ties alphabetically, nobody missing', () => {
    const listed = text
      .split('\n')
      .filter((line) => line.startsWith('• '))
      .map((line) => line.slice(2).split(' — ')[0]);
    const expected = [...balances]
      .sort((a, b) => a.net - b.net || a.participant.name.localeCompare(b.participant.name))
      .map((balance) => balance.participant.name);

    expect(listed).toEqual(expected);
    // Binh and Chi are both down 100,000, so the tie breaks on name.
    expect(listed).toEqual(['Binh', 'Chi', 'An']);
  });

  it('never pads columns, because chat apps use a proportional font', () => {
    expect(text).not.toMatch(/ {2,}/);
  });

  it('translates completely — no English leaks into the Vietnamese version', () => {
    const vietnamese = buildTripSummary(trip, totals, balances, vn);
    expect(vietnamese).toContain('Quỹ còn lại');
    expect(vietnamese).toContain('Còn nợ');
    expect(vietnamese).not.toContain('Left in the fund');
    expect(vietnamese).not.toContain('Owes');
  });

  it('omits the dates line separator when the trip has no dates', () => {
    const undated = buildTripSummary({ ...trip, startDate: undefined, endDate: undefined }, totals, balances, en);
    expect(undated.split('\n')[0]).toBe('Da Nang');
  });

  it('drops the balances block for a trip with no members', () => {
    const empty = { ...trip, participants: [] };
    const text2 = buildTripSummary(empty, computeTotals(empty, [], []), [], en);
    expect(text2).not.toContain('•');
  });
});

describe('buildParticipantSummary', () => {
  it('never uses the same label for a total and a section heading', () => {
    for (const context of [en, vn]) {
      expect(context.t.participants.share).not.toBe(context.t.participants.sharesTitle);
      expect(context.t.participants.paidIn).not.toBe(context.t.participants.contributionsTitle);
    }
  });

  it('reads as a personal statement: paid in, share, balance, then the detail', () => {
    const balance = findBalance(balances, 'c');
    expect(balance).not.toBeNull();
    const text = buildParticipantSummary(trip, balance!, [], participantShares(expenses, 'c'), en);
    expect(text.split('\n')[0]).toBe('Da Nang — Chi');
    expect(text).toContain('Owes');
    expect(text).toContain('Dinner');
  });

  it('shows a member who paid in but owes nothing as getting money back', () => {
    const balance = findBalance(balances, 'a');
    const text = buildParticipantSummary(
      trip,
      balance!,
      contributions,
      participantShares(expenses, 'a'),
      en,
    );
    expect(text).toContain('Gets back');
    expect(text).toContain('+');
  });

  it('leaves out empty sections', () => {
    const balance = findBalance(computeBalances(trip, [], []), 'b');
    const text = buildParticipantSummary(trip, balance!, [], [], en);
    expect(text).not.toContain('Payments into the fund');
    expect(text).not.toContain('Breakdown of their share');
    expect(text).toContain('Settled');
  });
});
