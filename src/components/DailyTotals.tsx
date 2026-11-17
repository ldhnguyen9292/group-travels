import { useMemo, useState } from 'react';
import { useI18n } from '../i18n/context';
import { countLabel, formatLongDay, itemCountLabel, type DayTotals } from '../lib/daily';
import { formatMoney } from '../lib/money';
import { nameOf, participantNames } from '../lib/participants';
import type { Trip } from '../types/trip';
import Button from './ui/Button';
import { IconChevronDown, IconShare } from './ui/Icons';
import { cx } from './ui/classes';

export interface DailyTotalsProps {
  trip: Trip;
  days: DayTotals[];
  onShareDay: (day: DayTotals) => void;
}

export default function DailyTotals({ trip, days, onShareDay }: DailyTotalsProps) {
  const { t, locale } = useI18n();
  const names = useMemo(() => participantNames(trip), [trip]);
  const money = (value: number) => formatMoney(value, trip.currency, locale);
  // The latest day is the one people ask about ("how much did we spend today?").
  const [openDates, setOpenDates] = useState<Set<string>>(
    () => new Set(days[0] ? [days[0].date] : []),
  );

  function toggle(date: string) {
    setOpenDates((current) => {
      const next = new Set(current);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  }

  return (
    <ul className="space-y-2.5">
      {days.map((day) => {
        const open = openDates.has(day.date);
        const panelId = `day-${day.date}`;
        return (
          <li key={day.date} className="rounded-xl border border-border">
            <div className="flex items-center gap-2 px-3.5 py-3">
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                onClick={() => toggle(day.date)}
                aria-expanded={open}
                aria-controls={panelId}
                title={open ? t.daily.hideDay : t.daily.showDay}
              >
                <IconChevronDown
                  className={cx(
                    'h-4 w-4 shrink-0 text-ink-muted transition-transform',
                    open && 'rotate-180',
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium capitalize">
                    {formatLongDay(day.date, locale, false)}
                  </span>
                  <span className="block text-xs text-ink-muted">
                    {countLabel(day.expenses.length, t)}
                  </span>
                </span>
                <span className="money shrink-0 font-semibold">{money(day.total)}</span>
              </button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onShareDay(day)}
                aria-label={t.daily.shareDay}
                title={t.daily.shareDay}
              >
                <IconShare className="h-4 w-4" />
              </Button>
            </div>

            {open && (
              <div id={panelId} className="space-y-3 border-t border-border px-3.5 py-3">
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-ink-muted">
                    {t.daily.perPerson}
                  </p>
                  <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                    {day.shares.map((share) => (
                      <li
                        key={share.participantId}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="min-w-0 truncate">
                          {nameOf(names, share.participantId, t.common.unknown)}
                        </span>
                        <span className="money">{money(share.amount)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="mb-1.5 text-xs font-semibold text-ink-muted">{t.daily.details}</p>
                  <ul className="space-y-1 rounded-xl bg-sunken px-3.5 py-2.5">
                    {day.expenses.map((expense) => (
                      <li
                        key={expense.id}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="min-w-0 truncate">
                          {expense.description}
                          {expense.items?.length ? (
                            <span className="badge badge-neutral ml-1.5">
                              {itemCountLabel(expense.items.length, t)}
                            </span>
                          ) : null}
                          <span className="text-ink-muted">
                            {' · '}
                            {expense.paidFrom === 'fund'
                              ? t.daily.fund
                              : `${nameOf(names, expense.paidById, t.common.unknown)} ${t.expense.paid}`}
                          </span>
                        </span>
                        <span className="money shrink-0">{money(expense.amount)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
