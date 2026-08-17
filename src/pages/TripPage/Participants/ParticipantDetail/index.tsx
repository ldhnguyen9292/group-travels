import { useMemo, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import ShareDialog from '../../../../components/ShareDialog';
import Button from '../../../../components/ui/Button';
import EmptyState from '../../../../components/ui/EmptyState';
import Avatar from '../../../../components/ui/Avatar';
import {
  IconAlert,
  IconArrowLeft,
  IconCoins,
  IconReceipt,
  IconScale,
  IconShare,
  IconWallet,
} from '../../../../components/ui/Icons';
import StatTile from '../../../../components/ui/StatTile';
import { btn } from '../../../../components/ui/classes';
import { useI18n } from '../../../../i18n/context';
import { computeBalances, findBalance, participantShares } from '../../../../lib/balances';
import { formatDate } from '../../../../lib/date';
import { formatMoney, formatMoneySigned } from '../../../../lib/money';
import { buildParticipantSummary } from '../../../../lib/summary';
import { useTrip, useTripRecords } from '../../../../store/context';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="mb-3 text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function MoneyRow({ label, sub, value }: { label: string; sub?: string; value: string }) {
  return (
    <li className="row flex items-center gap-3 rounded-lg px-1 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{label}</p>
        {sub && <p className="text-xs text-ink-muted">{sub}</p>}
      </div>
      <span className="money shrink-0 font-semibold">{value}</span>
    </li>
  );
}

export default function ParticipantDetail() {
  const { id, participantId } = useParams<{ id: string; participantId: string }>();
  const { t, locale } = useI18n();
  const trip = useTrip(id);
  const { expenses, contributions } = useTripRecords(id);
  const [shareOpen, setShareOpen] = useState(false);

  const participant = useMemo(
    () => trip?.participants.find((person) => person.id === participantId) ?? null,
    [trip, participantId],
  );
  const balance = useMemo(() => {
    if (!trip || !participant) return null;
    return findBalance(computeBalances(trip, expenses, contributions), participant.id);
  }, [trip, participant, expenses, contributions]);

  const ownContributions = useMemo(
    () => contributions.filter((item) => item.participantId === participantId),
    [contributions, participantId],
  );
  const shares = useMemo(
    () => (participantId ? participantShares(expenses, participantId) : []),
    [expenses, participantId],
  );
  const paidExpenses = useMemo(
    () => expenses.filter((expense) => expense.paidById === participantId),
    [expenses, participantId],
  );

  if (!trip) {
    return (
      <EmptyState
        icon={<IconAlert className="h-5 w-5" />}
        title={t.trip.notFound}
        description={t.trip.notFoundHint}
        action={
          <Link to="/" className={btn('primary')}>
            <IconArrowLeft className="h-4 w-4" />
            {t.trip.backToTrips}
          </Link>
        }
      />
    );
  }

  if (!participant || !balance) {
    return (
      <EmptyState
        icon={<IconAlert className="h-5 w-5" />}
        title={t.participants.memberNotFound}
        action={
          <Link to={`/trip/${trip.id}/participants`} className={btn('primary')}>
            <IconArrowLeft className="h-4 w-4" />
            {t.participants.backToMembers}
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <Link
        to={`/trip/${trip.id}/participants`}
        className="back-link"
      >
        <IconArrowLeft className="h-4 w-4" />
        {t.participants.backToMembers}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={participant.name} className="h-12 w-12 text-base" />
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold sm:text-3xl">{participant.name}</h1>
            <p className="mt-1 text-sm text-ink-muted">{trip.name}</p>
          </div>
        </div>
        <Button variant="secondary" onClick={() => setShareOpen(true)}>
          <IconShare className="h-4 w-4" />
          {t.share.shareMember}
        </Button>
      </div>

      <ShareDialog
        open={shareOpen}
        subject={`${trip.name} — ${participant.name}`}
        text={buildParticipantSummary(trip, balance, ownContributions, shares, { t, locale })}
        onClose={() => setShareOpen(false)}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label={t.participants.paidIn}
          value={formatMoney(balance.contributed, trip.currency, locale)}
          icon={<IconWallet className="h-4 w-4" />}
        />
        <StatTile
          label={t.participants.share}
          value={formatMoney(balance.share, trip.currency, locale)}
          icon={<IconReceipt className="h-4 w-4" />}
        />
        <StatTile
          label={t.participants.net}
          value={formatMoneySigned(balance.net, trip.currency, locale)}
          icon={<IconScale className="h-4 w-4" />}
          tone={balance.net > 0 ? 'good' : balance.net < 0 ? 'bad' : 'neutral'}
          hint={
            balance.net > 0 ? t.trip.getsBack : balance.net < 0 ? t.trip.owes : t.trip.settled
          }
        />
        <StatTile
          label={t.participants.paidOutOfPocket}
          value={formatMoney(balance.paidOutOfPocket, trip.currency, locale)}
          icon={<IconCoins className="h-4 w-4" />}
          hint={t.participants.paidOutOfPocketHint}
        />
      </div>

      <Section title={t.participants.contributionsTitle}>
        {ownContributions.length === 0 ? (
          <EmptyState title={t.participants.contributionsEmpty} compact />
        ) : (
          <ul className="divide-y divide-border">
            {ownContributions.map((contribution) => (
              <MoneyRow
                key={contribution.id}
                label={formatDate(contribution.date, locale)}
                value={formatMoney(contribution.amount, trip.currency, locale)}
              />
            ))}
          </ul>
        )}
      </Section>

      <Section title={t.participants.sharesTitle}>
        {shares.length === 0 ? (
          <EmptyState title={t.participants.sharesEmpty} compact />
        ) : (
          <ul className="divide-y divide-border">
            {shares.map(({ expense, amount }) => (
              <MoneyRow
                key={expense.id}
                label={expense.description}
                sub={formatDate(expense.date, locale)}
                value={formatMoney(amount, trip.currency, locale)}
              />
            ))}
          </ul>
        )}
      </Section>

      <Section title={t.participants.paidTitle}>
        {paidExpenses.length === 0 ? (
          <EmptyState title={t.participants.paidEmpty} compact />
        ) : (
          <ul className="divide-y divide-border">
            {paidExpenses.map((expense) => (
              <MoneyRow
                key={expense.id}
                label={expense.description}
                sub={formatDate(expense.date, locale)}
                value={formatMoney(expense.amount, trip.currency, locale)}
              />
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
