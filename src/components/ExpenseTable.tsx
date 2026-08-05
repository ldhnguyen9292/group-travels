import { useI18n } from '../i18n/context';
import type { ExpenseMatrix } from '../lib/expenseMatrix';
import { cx } from './ui/classes';

export interface ExpenseTableProps {
  matrix: ExpenseMatrix;
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

const CELL = 'px-3 py-2.5 text-right whitespace-nowrap';

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
export default function ExpenseTable({ matrix }: ExpenseTableProps) {
  const { t } = useI18n();

  return (
    /*
     * `relative` is load-bearing: the `sr-only` labels in the empty cells are
     * absolutely positioned, and without a positioned scroll box they resolve
     * against the viewport, escape the clip, and drag the whole page sideways
     * on a phone. No padding here either — a sticky column pins to the
     * scrollport edge, so padding would let the pinned cell ride over it.
     */
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-max border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-ink-muted">
            <th scope="col" className={cx(PINNED, 'px-3 py-2.5 text-left font-medium')}>
              {matrix.firstHeader}
            </th>
            {[...matrix.columns, matrix.totalHeader].map((name) => (
              <th key={name} scope="col" className={cx(CELL, 'font-medium')}>
                {name}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {matrix.rows.map((row) => (
            <tr key={row.key}>
              <th scope="row" className={cx(PINNED, 'px-3 py-2.5 text-left font-medium')}>
                <span className="block max-w-[14rem] truncate">{row.label}</span>
                <span className="block text-xs font-normal text-ink-muted">{row.meta}</span>
              </th>
              {row.cells.map((cell, index) => (
                <td key={matrix.columns[index]} className={cx(CELL, 'money')}>
                  {cell.missing ? (
                    <>
                      <span aria-hidden="true" className="text-ink-muted">
                        —
                      </span>
                      <span className="sr-only">{t.expense.notIncluded}</span>
                    </>
                  ) : (
                    cell.text
                  )}
                </td>
              ))}
              <td className={cx(CELL, 'money font-semibold')}>{row.total}</td>
            </tr>
          ))}
        </tbody>

        <tfoot>
          <tr className="border-t-2 border-border-strong">
            <th scope="row" className={cx(PINNED, 'px-3 py-2.5 text-left font-semibold')}>
              {matrix.totalsLabel}
            </th>
            {[...matrix.totalsCells, matrix.grandTotal].map((value, index) => (
              <td key={matrix.columns[index] ?? 'total'} className={cx(CELL, 'money font-semibold')}>
                {value}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
