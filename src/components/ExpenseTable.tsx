import { useMemo } from 'react';
import { useI18n } from '../i18n/context';
import { computeBalances, computeTotals } from '../lib/balances';
import { formatShortDate } from '../lib/date';
import { formatMoney } from '../lib/money';
import { nameOf, participantNames } from '../lib/participants';
import type { Expense, Trip } from '../types/trip';
import { cx } from './ui/classes';

export interface ExpenseTableProps {
  trip: Trip;
  expenses: Expense[];
}

/**
 * Description column: stays put while the member columns scroll under it, with
 * an edge so that reads as pinned rather than as a number chopped in half.
 *
 * The edge is an inset shadow, not a border: under `border-collapse: collapse`
 * borders are painted by the table, so a `border-r` here stays behind while the
 * cell it belongs to scrolls away.
 */
const PINNED = 'sticky left-0 z-10 bg-surface shadow-[inset_-1px_0_0_var(--color-border)]';

/**
 * Every expense against every member, for checking rather than editing.
 *
 * The column totals come from `computeBalances`, the same function behind "who
 * is up, who is down" — so a member's column adds up to the share they are
 * being asked to cover, by construction rather than by coincidence.
 *
 * Deliberately unpaginated: a total under a page-worth of rows would be a lie
 * about the trip, and checking is the only reason to open this view.
 */
export default function ExpenseTable({ trip, expenses }: ExpenseTableProps) {
  const { t, locale } = useI18n();
  const names = useMemo(() => participantNames(trip), [trip]);
  // No contributions: this table is about spending, so a column is a member's share.
  const columns = useMemo(() => computeBalances(trip, expenses, []), [trip, expenses]);
  const grandTotal = useMemo(() => computeTotals(trip, expenses, []).expenses, [trip, expenses]);

  const money = (value: number) => formatMoney(value, trip.currency, locale);
  const cell = 'px-3 py-2.5 text-right whitespace-nowrap';

  return (
    // No padding on the scroll box: a sticky column pins to the scrollport edge,
    // so padding here would let the pinned cell ride over it when scrolled.
    <div className="overflow-x-auto">
      <table className="w-full min-w-max border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-ink-muted">
            <th scope="col" className={cx(PINNED, 'px-3 py-2.5 text-left font-medium')}>
              {t.expense.title}
            </th>
            {columns.map(({ participant }) => (
              <th key={participant.id} scope="col" className={cx(cell, 'font-medium')}>
                {participant.name}
              </th>
            ))}
            <th scope="col" className={cx(cell, 'font-medium')}>
              {t.expense.total}
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {expenses.map((expense) => {
            const shares = new Map(expense.splits.map((split) => [split.participantId, split.amount]));
            return (
              <tr key={expense.id}>
                <th scope="row" className={cx(PINNED, 'px-3 py-2.5 text-left font-medium')}>
                  <span className="block max-w-[14rem] truncate">{expense.description}</span>
                  <span className="block text-xs font-normal text-ink-muted">
                    {formatShortDate(expense.date, locale)} ·{' '}
                    {nameOf(names, expense.paidById, t.common.unknown)} {t.expense.paid}
                  </span>
                </th>
                {columns.map(({ participant }) => {
                  const share = shares.get(participant.id);
                  return (
                    <td key={participant.id} className={cx(cell, 'money')}>
                      {share === undefined ? (
                        <>
                          <span aria-hidden="true" className="text-ink-muted">
                            —
                          </span>
                          <span className="sr-only">{t.expense.notIncluded}</span>
                        </>
                      ) : (
                        money(share)
                      )}
                    </td>
                  );
                })}
                <td className={cx(cell, 'money font-semibold')}>{money(expense.amount)}</td>
              </tr>
            );
          })}
        </tbody>

        <tfoot>
          <tr className="border-t-2 border-border-strong">
            <th scope="row" className={cx(PINNED, 'px-3 py-2.5 text-left font-semibold')}>
              {t.expense.total}
            </th>
            {columns.map(({ participant, share }) => (
              <td key={participant.id} className={cx(cell, 'money font-semibold')}>
                {money(share)}
              </td>
            ))}
            <td className={cx(cell, 'money font-semibold')}>{money(grandTotal)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
