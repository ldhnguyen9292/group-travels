import { useMemo } from 'react';
import { useI18n } from '../i18n/context';
import { usePagination } from '../hooks/usePagination';
import { formatDate } from '../lib/date';
import { formatMoney } from '../lib/money';
import { nameOf, participantNames } from '../lib/participants';
import type { Contribution, ID, Trip } from '../types/trip';
import Button from './ui/Button';
import Pagination from './ui/Pagination';
import { IconPencil, IconTrash } from './ui/Icons';

const PAGE_SIZE = 6;

export interface ContributionListProps {
  trip: Trip;
  contributions: Contribution[];
  onEdit: (contribution: Contribution) => void;
  onDelete: (id: ID) => void;
}

export default function ContributionList({
  trip,
  contributions,
  onEdit,
  onDelete,
}: ContributionListProps) {
  const { t, locale } = useI18n();
  const names = useMemo(() => participantNames(trip), [trip]);
  const { page, totalPages, items, setPage } = usePagination(contributions, PAGE_SIZE);

  return (
    <>
      <ul className="divide-y divide-border">
        {items.map((contribution) => (
          <li key={contribution.id} className="row flex items-center gap-3 px-1 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {nameOf(names, contribution.participantId, t.common.unknown)}
              </p>
              <p className="text-xs text-ink-muted">{formatDate(contribution.date, locale)}</p>
            </div>
            <span className="money shrink-0 font-semibold text-good">
              {formatMoney(contribution.amount, trip.currency, locale)}
            </span>
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
          </li>
        ))}
      </ul>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </>
  );
}
