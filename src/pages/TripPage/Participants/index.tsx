import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import BalanceList from '../../../components/BalanceList';
import ShareDialog from '../../../components/ShareDialog';
import TripForm from '../../../components/TripForm';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import {
  IconAlert,
  IconArrowLeft,
  IconPencil,
  IconReceipt,
  IconShare,
  IconUsers,
  IconWallet,
} from '../../../components/ui/Icons';
import Modal from '../../../components/ui/Modal';
import StatTile from '../../../components/ui/StatTile';
import { btn } from '../../../components/ui/classes';
import { useI18n } from '../../../i18n/context';
import { computeBalances, computeTotals } from '../../../lib/balances';
import { formatMoney } from '../../../lib/money';
import { buildTripSummary } from '../../../lib/summary';
import {
  useLockedParticipantIds,
  useTrip,
  useTripRecords,
  useTripStore,
} from '../../../store/context';
import type { TripDraft } from '../../../types/trip';

export default function ParticipantsPage() {
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useI18n();
  const trip = useTrip(id);
  const { expenses, contributions } = useTripRecords(id);
  const lockedIds = useLockedParticipantIds(id);
  const { updateTrip } = useTripStore();
  const [formOpen, setFormOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const balances = useMemo(
    () => (trip ? computeBalances(trip, expenses, contributions) : []),
    [trip, expenses, contributions],
  );
  const totals = useMemo(
    () => (trip ? computeTotals(trip, expenses, contributions) : null),
    [trip, expenses, contributions],
  );

  if (!trip || !totals) {
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

  const handleSubmit = (draft: TripDraft) => {
    updateTrip(trip.id, draft);
    setFormOpen(false);
  };

  return (
    <div className="space-y-5">
      <Link
        to={`/trip/${trip.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-brand"
      >
        <IconArrowLeft className="h-4 w-4" />
        {trip.name}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">{t.participants.title}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t.participants.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setShareOpen(true)}>
            <IconShare className="h-4 w-4" />
            {t.share.shareResults}
          </Button>
          <Button variant="secondary" onClick={() => setFormOpen(true)}>
            <IconPencil className="h-4 w-4" />
            {t.trip.editTrip}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatTile
          label={t.trip.members}
          value={String(trip.participants.length)}
          icon={<IconUsers className="h-4 w-4" />}
          tone="brand"
        />
        <StatTile
          label={t.trip.fundIn}
          value={formatMoney(totals.contributions, trip.currency, locale)}
          icon={<IconWallet className="h-4 w-4" />}
        />
        <StatTile
          label={t.trip.spent}
          value={formatMoney(totals.expenses, trip.currency, locale)}
          icon={<IconReceipt className="h-4 w-4" />}
        />
      </div>

      <section className="card p-5">
        {trip.participants.length === 0 ? (
          <EmptyState title={t.trip.balancesEmpty} compact />
        ) : (
          <BalanceList trip={trip} balances={balances} />
        )}
      </section>

      <ShareDialog
        open={shareOpen}
        subject={trip.name}
        text={buildTripSummary(trip, totals, balances, expenses, { t, locale })}
        onClose={() => setShareOpen(false)}
      />

      <Modal open={formOpen} title={t.tripForm.editTitle} onClose={() => setFormOpen(false)}>
        <TripForm
          trip={trip}
          lockedParticipantIds={lockedIds}
          onSubmit={handleSubmit}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>
    </div>
  );
}
