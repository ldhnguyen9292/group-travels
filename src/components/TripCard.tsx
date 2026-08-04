import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/context';
import { formatDateRange } from '../lib/date';
import { formatMoney, roundMoney } from '../lib/money';
import type { Trip } from '../types/trip';
import Button from './ui/Button';
import { IconPencil, IconTrash, IconUsers } from './ui/Icons';
import { cx } from './ui/classes';

const VISIBLE_MEMBERS = 4;

export interface TripCardProps {
  trip: Trip;
  contributionsTotal: number;
  expensesTotal: number;
  onEdit: (trip: Trip) => void;
  onDelete: (trip: Trip) => void;
}

export default function TripCard({
  trip,
  contributionsTotal,
  expensesTotal,
  onEdit,
  onDelete,
}: TripCardProps) {
  const { t, locale } = useI18n();
  const dates = formatDateRange(trip.startDate, trip.endDate, locale);
  const remaining = roundMoney(contributionsTotal - expensesTotal, trip.currency);
  const shown = trip.participants.slice(0, VISIBLE_MEMBERS);
  const hidden = trip.participants.length - shown.length;

  return (
    <article className="card flex flex-col p-5 transition-shadow hover:shadow-pop">
      <div className="flex items-start gap-2">
        <h3 className="min-w-0 flex-1 text-lg leading-snug font-semibold">
          <Link to={`/trip/${trip.id}`} className="hover:text-brand">
            {trip.name}
          </Link>
        </h3>
        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onEdit(trip)}
            aria-label={`${t.common.edit} — ${trip.name}`}
            title={t.common.edit}
          >
            <IconPencil className="h-4 w-4" />
          </Button>
          <Button
            variant="danger-ghost"
            size="icon-sm"
            onClick={() => onDelete(trip)}
            aria-label={`${t.common.delete} — ${trip.name}`}
            title={t.common.delete}
          >
            <IconTrash className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <p className="mt-1 text-sm text-ink-muted">{dates || t.home.noDates}</p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="chip">
          <IconUsers className="h-3.5 w-3.5" />
          {trip.participants.length}
        </span>
        {shown.map((person) => (
          <span key={person.id} className="chip max-w-[9rem] truncate">
            {person.name}
          </span>
        ))}
        {hidden > 0 && <span className="chip text-ink-muted">+{hidden}</span>}
      </div>

      {/* Rows rather than columns: an amount of any length stays inside the card. */}
      <dl className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="shrink-0 text-ink-muted">{t.trip.fundIn}</dt>
          <dd className="money text-right font-semibold">
            {formatMoney(contributionsTotal, trip.currency, locale)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="shrink-0 text-ink-muted">{t.trip.spent}</dt>
          <dd className="money text-right font-semibold">
            {formatMoney(expensesTotal, trip.currency, locale)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 border-t border-border pt-1.5">
          <dt className="shrink-0 text-ink-muted">{t.trip.remaining}</dt>
          <dd
            className={cx(
              'money text-right font-semibold',
              remaining < 0 ? 'text-bad' : 'text-good',
            )}
          >
            {formatMoney(remaining, trip.currency, locale)}
          </dd>
        </div>
      </dl>

      <Link to={`/trip/${trip.id}`} className="btn btn-soft mt-4 w-full">
        {t.home.open}
      </Link>
    </article>
  );
}
