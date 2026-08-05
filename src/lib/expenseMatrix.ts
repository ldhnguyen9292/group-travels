import type { Dictionary } from '../i18n/dictionary';
import type { Expense, Trip } from '../types/trip';
import { computeBalances, computeTotals } from './balances';
import { formatShortDate } from './date';
import { formatMoney } from './money';
import { nameOf, participantNames } from './participants';

export interface MatrixCell {
  /** Already formatted for display; empty when this member is not in the expense. */
  text: string;
  missing: boolean;
}

export interface MatrixRow {
  key: string;
  label: string;
  /** "24/10 · An trả" */
  meta: string;
  cells: MatrixCell[];
  total: string;
}

/**
 * Every expense against every member, formatted once and rendered twice: as a
 * table on screen and as a PNG to share. Building it here is what keeps the
 * image and the screen from drifting apart.
 */
export interface ExpenseMatrix {
  title: string;
  subtitle: string;
  /** Header of the description column. */
  firstHeader: string;
  columns: string[];
  totalHeader: string;
  rows: MatrixRow[];
  totalsLabel: string;
  totalsCells: string[];
  grandTotal: string;
  note: string;
}

export interface MatrixContext {
  t: Dictionary;
  locale: string;
}

export function buildExpenseMatrix(
  trip: Trip,
  expenses: Expense[],
  subtitle: string,
  { t, locale }: MatrixContext,
): ExpenseMatrix {
  const money = (value: number) => formatMoney(value, trip.currency, locale);
  const names = participantNames(trip);
  // No contributions: this grid is about spending, so a column is a member's share.
  const balances = computeBalances(trip, expenses, []);

  return {
    title: trip.name,
    subtitle,
    firstHeader: t.expense.title,
    columns: balances.map((balance) => balance.participant.name),
    totalHeader: t.expense.total,
    rows: expenses.map((expense) => {
      const shares = new Map(expense.splits.map((split) => [split.participantId, split.amount]));
      const day = formatShortDate(expense.date, locale);
      const payer = `${nameOf(names, expense.paidById, t.common.unknown)} ${t.expense.paid}`;
      return {
        key: expense.id,
        label: expense.description,
        meta: day ? `${day} · ${payer}` : payer,
        cells: balances.map(({ participant }) => {
          const share = shares.get(participant.id);
          return share === undefined
            ? { text: '', missing: true }
            : { text: money(share), missing: false };
        }),
        total: money(expense.amount),
      };
    }),
    totalsLabel: t.expense.total,
    totalsCells: balances.map((balance) => money(balance.share)),
    grandTotal: money(computeTotals(trip, expenses, []).expenses),
    note: t.expense.tableNote,
  };
}
