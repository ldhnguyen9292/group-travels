import type { Contribution, Expense, ID } from '../types/trip';

/** One line of money that went into the shared fund, whatever put it there. */
export interface FundEntry {
  key: string;
  participantId: ID;
  amount: number;
  date: string;
  createdAt: string;
  /** The record behind the row, or null when an expense the payer fronted is. */
  contribution: Contribution | null;
  /** What the money was for, on rows that came from an expense. */
  note?: string;
}

/** Newest first, and for one day the most recently written record leads. */
function byNewest(a: FundEntry, b: FundEntry): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  if (a.createdAt === b.createdAt) return 0;
  return a.createdAt < b.createdAt ? 1 : -1;
}

/**
 * The fund is fed two ways: somebody pays into it, or somebody fronts an
 * expense out of their own pocket. Both credit the same person by the same
 * amount, so both belong on the same list — but a fronted row is a view of an
 * expense, not a record of its own, which is why it carries no contribution to
 * edit or delete.
 */
export function buildFundEntries(
  expenses: Expense[],
  contributions: Contribution[],
): FundEntry[] {
  const entries: FundEntry[] = contributions.map((contribution) => ({
    key: `contribution:${contribution.id}`,
    participantId: contribution.participantId,
    amount: contribution.amount,
    date: contribution.date,
    createdAt: contribution.createdAt,
    contribution,
  }));

  for (const expense of expenses) {
    if (expense.paidFrom !== 'own') continue;
    entries.push({
      key: `expense:${expense.id}`,
      participantId: expense.paidById,
      amount: expense.amount,
      date: expense.date,
      createdAt: expense.createdAt,
      contribution: null,
      note: expense.description,
    });
  }

  return entries.sort(byNewest);
}
