import { useMemo } from 'react';
import { useI18n } from '../i18n/context';
import { usePagination } from '../hooks/usePagination';
import { formatDate } from '../lib/date';
import type { FundEntry } from '../lib/fundEntries';
import { formatMoney } from '../lib/money';
import { nameOf, participantNames } from '../lib/participants';
import type { Contribution, ID, Trip } from '../types/trip';
import Button from './ui/Button';
import Pagination from './ui/Pagination';
import { IconPencil, IconTrash } from './ui/Icons';

const PAGE_SIZE = 6;

export interface ContributionListProps {
  trip: Trip;
  entries: FundEntry[];
  onEdit: (contribution: Contribution) => void;
  onDelete: (id: ID) => void;
}

export default function ContributionList({
  trip,
  entries,
  onEdit,
  onDelete,
}: ContributionListProps) {
  const { t, locale } = useI18n();
  const names = useMemo(() => participantNames(trip), [trip]);
  const { page, totalPages, items, setPage } = usePagination(entries, PAGE_SIZE);
  const hasFronted = entries.some((entry) => !entry.contribution);

  return (
    <>
      <ul className="divide-y divide-border">
        {items.map((entry) => {
          const { contribution } = entry;
          return (
            <li key={entry.key} className="row flex items-center gap-3 px-1 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {nameOf(names, entry.participantId, t.common.unknown)}
                  {/*
                   * A fronted row is a view of an expense, so it says which one
                   * rather than offering buttons that would edit the wrong thing.
                   */}
                  {entry.note && (
                    <span className="ml-1.5 text-xs font-normal text-ink-muted">
                      {t.contribution.fromExpense} · {entry.note}
                    </span>
                  )}
                </p>
                <p className="text-xs text-ink-muted">{formatDate(entry.date, locale)}</p>
              </div>
              <span className="money shrink-0 font-semibold text-good">
                {formatMoney(entry.amount, trip.currency, locale)}
              </span>
              {contribution ? (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onEdit(contribution)}
                    aria-label={t.common.edit}
                    title={t.common.edit}
                  >
                    <IconPencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="danger-ghost"
                    size="icon-sm"
                    onClick={() => onDelete(contribution.id)}
                    aria-label={t.common.delete}
                    title={t.common.delete}
                  >
                    <IconTrash className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                // Keeps the amounts in one column whether a row has buttons or not.
                <div aria-hidden className="w-[4.5rem] shrink-0" />
              )}
            </li>
          );
        })}
      </ul>
      {hasFronted && <p className="field-hint px-1">{t.contribution.fromExpenseHint}</p>}
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </>
  );
}
