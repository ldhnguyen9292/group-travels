import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/context';
import { formatMoney, formatMoneySigned } from '../lib/money';
import type { ParticipantBalance, Trip } from '../types/trip';
import Avatar from './ui/Avatar';
import { IconChevronRight } from './ui/Icons';
import { cx } from './ui/classes';

export interface BalanceListProps {
  trip: Trip;
  balances: ParticipantBalance[];
}

export default function BalanceList({ trip, balances }: BalanceListProps) {
  const { t, locale } = useI18n();

  // Whoever still owes the most comes first: that is the actionable end.
  const sorted = useMemo(
    () => [...balances].sort((a, b) => a.net - b.net || a.participant.name.localeCompare(b.participant.name)),
    [balances],
  );

  return (
    <ul className="divide-y divide-border">
      {sorted.map((balance) => {
        const label =
          balance.net > 0 ? t.trip.getsBack : balance.net < 0 ? t.trip.owes : t.trip.settled;
        return (
          <li key={balance.participant.id}>
            <Link
              to={`/trip/${trip.id}/participants/${balance.participant.id}`}
              className="row flex items-center gap-3 rounded-lg px-2 py-3"
            >
              <Avatar name={balance.participant.name} className="h-9 w-9 text-xs" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{balance.participant.name}</p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  {t.participants.paidIn}: {formatMoney(balance.contributed, trip.currency, locale)}
                  {' · '}
                  {t.participants.share}: {formatMoney(balance.share, trip.currency, locale)}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={cx(
                    'money font-semibold',
                    balance.net > 0 ? 'text-good' : balance.net < 0 ? 'text-bad' : 'text-ink-muted',
                  )}
                >
                  {formatMoneySigned(balance.net, trip.currency, locale)}
                </p>
                <p className="text-xs text-ink-muted">{label}</p>
              </div>
              <IconChevronRight className="h-4 w-4 shrink-0 text-ink-muted" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
