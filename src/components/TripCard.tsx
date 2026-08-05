import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/context';
import { formatDateRange } from '../lib/date';
import { formatMoney, roundMoney } from '../lib/money';
import type { Trip } from '../types/trip';
import Avatar from './ui/Avatar';
import Button from './ui/Button';
import { IconCalendar, IconPencil, IconTrash } from './ui/Icons';
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

  // Only meaningful once there is a fund to spend against.
  const usedRatio = contributionsTotal > 0 ? expensesTotal / contributionsTotal : null;
  const usedPercent = usedRatio === null ? 0 : Math.round(usedRatio * 100);

  return (
    /**
     * `min-w-0`: as a grid item the card would otherwise be floored at its
     * min-content width, and the nowrap member names below make that wider
     * than a phone screen — the whole page then scrolls sideways.
     */
    <article className="card card-interactive flex min-w-0 flex-col p-5">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg leading-snug font-semibold break-words">
            <Link to={`/trip/${trip.id}`} className="hover:text-brand">
              {trip.name}
            </Link>
          </h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <IconCalendar className="h-3.5 w-3.5 shrink-0" />
              {dates || t.home.noDates}
            </span>
            <span className="badge badge-brand">{trip.currency}</span>
          </p>
        </div>
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

      <div className="mt-4 flex items-center gap-2">
        {trip.participants.length === 0 ? (
          <span className="text-sm text-ink-muted">{t.home.members}: 0</span>
        ) : (
          <>
            <div className="avatar-stack flex">
              {shown.map((person) => (
                <Avatar key={person.id} name={person.name} />
              ))}
              {hidden > 0 && <span className="avatar avatar-more">+{hidden}</span>}
            </div>
            <span className="min-w-0 truncate text-sm text-ink-muted">
              {shown.map((person) => person.name).join(', ')}
            </span>
          </>
        )}
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

      {usedRatio !== null && (
        <div className="mt-3">
          <div className="meter" role="presentation">
            <span
              className={cx('meter-fill', usedRatio > 1 && 'meter-fill-over')}
              style={{ width: `${Math.min(usedPercent, 100)}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-ink-muted">
            {usedPercent}% · {t.trip.spent}
          </p>
        </div>
      )}

      <Link to={`/trip/${trip.id}`} className="btn btn-soft mt-4 w-full">
        {t.home.open}
      </Link>
    </article>
  );
}
