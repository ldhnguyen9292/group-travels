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

/** Second expense: paid by someone else, uneven, and not everybody is in it. */
const taxi: Expense = {
  id: 'e2',
  tripId: 't1',
  description: 'Taxi',
  amount: 200_000,
  paidById: 'b',
  splitType: 'custom',
  splits: [
    { participantId: 'b', amount: 150_000 },
    { participantId: 'c', amount: 50_000 },
  ],
  date: '2025-10-04',
  createdAt: '2025-10-04T00:00:00.000Z',
  updatedAt: '2025-10-04T00:00:00.000Z',
};

/** Two people out of three, splitting evenly. */
const coffee: Expense = {
  ...taxi,
  id: 'e3',
  description: 'Coffee',
  amount: 60_000,
  paidById: 'c',
  splitType: 'equal',
  splits: [
    { participantId: 'a', amount: 30_000 },
    { participantId: 'c', amount: 30_000 },
  ],
  date: '2025-10-05',
  createdAt: '2025-10-05T00:00:00.000Z',
  updatedAt: '2025-10-05T00:00:00.000Z',
};

const en = { t: DICTIONARIES.en, locale: LOCALES.en };
const vn = { t: DICTIONARIES.vn, locale: LOCALES.vn };

const totals = computeTotals(trip, expenses, contributions);
const balances = computeBalances(trip, expenses, contributions);

/** The bullets under one heading, e.g. everything below "Expenses (3):". */
function blockAfter(text: string, heading: string): string[] {
  const lines = text.split('\n');
  const start = lines.findIndex((line) => line.startsWith(heading));
  if (start < 0) return [];
  const block: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (!line.startsWith('• ')) break;
    block.push(line);
  }
  return block;
}

describe('buildTripSummary', () => {
  const text = buildTripSummary(trip, totals, balances, expenses, en);

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
    const listed = blockAfter(text, 'Who is up').map((line) => line.slice(2).split(' — ')[0]);
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
    const vietnamese = buildTripSummary(trip, totals, balances, expenses, vn);
    expect(vietnamese).toContain('Quỹ còn lại');
    expect(vietnamese).toContain('Còn nợ');
    expect(vietnamese).toContain('An trả');
    expect(vietnamese).not.toContain('Left in the fund');
    expect(vietnamese).not.toContain('Owes');
    expect(vietnamese).not.toContain('paid');
  });

  it('omits the dates line separator when the trip has no dates', () => {
    const undated = buildTripSummary(
      { ...trip, startDate: undefined, endDate: undefined },
      totals,
      balances,
      expenses,
      en,
    );
    expect(undated.split('\n')[0]).toBe('Da Nang');
  });

  it('drops the balances block for a trip with no members', () => {
    const empty = { ...trip, participants: [] };
    const text2 = buildTripSummary(empty, computeTotals(empty, [], []), [], [], en);
    expect(text2).not.toContain('•');
  });
});

describe('buildTripSummary — the expenses', () => {
  const all = [...expenses, taxi, coffee];
  const text = buildTripSummary(
    trip,
    computeTotals(trip, all, contributions),
    computeBalances(trip, all, contributions),
    all,
    en,
  );
  const block = blockAfter(text, 'Expenses');

  it('says how many there are, and lists every one of them once', () => {
    expect(text).toContain('Expenses (3):');
    expect(block).toHaveLength(3);
  });

  it('reads forwards in time, whatever order it was handed', () => {
    const reversed = buildTripSummary(
      trip,
      computeTotals(trip, all, contributions),
      computeBalances(trip, all, contributions),
      [...all].reverse(),
      en,
    );
    expect(blockAfter(reversed, 'Expenses')).toEqual(block);
    expect(block.map((line) => line.split(' — ')[0])).toEqual([
      '• 10/03 Dinner',
      '• 10/04 Taxi',
      '• 10/05 Coffee',
    ]);
  });

  it('is the bill and nothing else: day, what for, how much, who fronted it', () => {
    expect(block[0]).toBe('• 10/03 Dinner — ₫300,000 · An paid');
    expect(block[1]).toBe('• 10/04 Taxi — ₫200,000 · Binh paid');
  });

  it('leaves the per-expense split to each member’s own statement', () => {
    // Chi is in two of these three expenses, but her share is not spelled out here.
    expect(text).not.toContain('₫50,000');
    expect(text).not.toContain('each');
  });

  it('drops the day rather than the line when an expense has no usable date', () => {
    const undated = buildTripSummary(trip, totals, balances, [{ ...taxi, date: '' }], en);
    expect(undated).toContain('• Taxi — ₫200,000 · Binh paid');
  });

  it('falls back to the unknown-member label when the payer is no longer a member', () => {
    const orphan = buildTripSummary(trip, totals, balances, [{ ...taxi, paidById: 'gone' }], en);
    expect(orphan).toContain('Unknown member paid');
  });

  it('leaves the expenses block out entirely when nothing was spent', () => {
    expect(buildTripSummary(trip, totals, balances, [], en)).not.toContain('Expenses');
  });

  it('ends on the note about the balances, so neither list is interrupted', () => {
    expect(text.trim().endsWith('(Paid in minus their share of the spending)')).toBe(true);
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

  it('puts their own share first, then the bill it came out of and who paid it', () => {
    const balance = findBalance(balances, 'c');
    const text = buildParticipantSummary(trip, balance!, [], participantShares(expenses, 'c'), en);
    expect(text).toContain('• 10/03 Dinner — ₫100,000 · of ₫300,000 · An paid');
  });

  it('leaves out empty sections', () => {
    const balance = findBalance(computeBalances(trip, [], []), 'b');
    const text = buildParticipantSummary(trip, balance!, [], [], en);
    expect(text).not.toContain('Payments into the fund');
    expect(text).not.toContain('Breakdown of their share');
    expect(text).toContain('Settled');
  });
});
