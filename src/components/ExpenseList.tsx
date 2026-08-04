import { useMemo, useState } from 'react';
import { usePagination } from '../hooks/usePagination';
import { useI18n } from '../i18n/context';
import { formatDate } from '../lib/date';
import { formatMoney } from '../lib/money';
import { nameOf, participantNames } from '../lib/participants';
import type { Expense, ID, Trip } from '../types/trip';
import Button from './ui/Button';
import { IconChevronDown, IconPencil, IconTrash } from './ui/Icons';
import Pagination from './ui/Pagination';
import { cx } from './ui/classes';

const PAGE_SIZE = 6;

export interface ExpenseListProps {
  trip: Trip;
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: ID) => void;
}

export default function ExpenseList({ trip, expenses, onEdit, onDelete }: ExpenseListProps) {
  const { t, locale } = useI18n();
  const names = useMemo(() => participantNames(trip), [trip]);
  const [expandedId, setExpandedId] = useState<ID | null>(null);
  const { page, totalPages, items, setPage } = usePagination(expenses, PAGE_SIZE);

  return (
    <>
      <ul className="divide-y divide-border">
        {items.map((expense) => {
          const expanded = expandedId === expense.id;
          return (
            <li key={expense.id} className="py-3">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{expense.description}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
                    <span>{formatDate(expense.date, locale)}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {t.expense.paidBy}: {nameOf(names, expense.paidById, t.common.unknown)}
                    </span>
                    <span className="badge badge-neutral">
                      {expense.splitType === 'equal' ? t.expense.equal : t.expense.custom}
                    </span>
                  </p>
                </div>
                <span className="money shrink-0 font-semibold">
                  {formatMoney(expense.amount, trip.currency, locale)}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setExpandedId(expanded ? null : expense.id)}
                    aria-expanded={expanded}
                    aria-label={expanded ? t.expense.hideSplits : t.expense.showSplits}
                    title={expanded ? t.expense.hideSplits : t.expense.showSplits}
                  >
                    <IconChevronDown
                      className={cx('h-4 w-4 transition-transform', expanded && 'rotate-180')}
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onEdit(expense)}
                    aria-label={t.common.edit}
                    title={t.common.edit}
                  >
                    <IconPencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="danger-ghost"
                    size="icon-sm"
                    onClick={() => onDelete(expense.id)}
                    aria-label={t.common.delete}
                    title={t.common.delete}
                  >
                    <IconTrash className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {expanded && (
                <ul className="mt-2.5 space-y-1 rounded-xl bg-sunken px-3.5 py-2.5">
                  {expense.splits.map((split) => (
                    <li
                      key={split.participantId}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="min-w-0 truncate text-ink-muted">
                        {nameOf(names, split.participantId, t.common.unknown)}
                      </span>
                      <span className="money">
                        {formatMoney(split.amount, trip.currency, locale)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </>
  );
}
