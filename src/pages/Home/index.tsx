import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TripCard from '../../components/TripCard';
import TripForm from '../../components/TripForm';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import { IconPlus, IconSearch, IconWallet } from '../../components/ui/Icons';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import { input } from '../../components/ui/classes';
import { usePagination } from '../../hooks/usePagination';
import { useI18n } from '../../i18n/context';
import { computeTotalsByTrip } from '../../lib/balances';
import { useLockedParticipantIds, useTripStore } from '../../store/context';
import type { Trip, TripDraft, TripTotals } from '../../types/trip';

const PAGE_SIZE = 9;
const EMPTY_TOTALS: TripTotals = { contributions: 0, expenses: 0, remaining: 0 };

export default function Home() {
  const { t } = useI18n();
  const { trips, expenses, contributions, createTrip, updateTrip, deleteTrip } = useTripStore();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Trip | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Trip | null>(null);
  const lockedIds = useLockedParticipantIds(editing?.id);

  // Shared with the trip page, so a card never disagrees with the page it opens.
  const totalsByTrip = useMemo(
    () => computeTotalsByTrip(trips, expenses, contributions),
    [trips, expenses, contributions],
  );

  const filtered = useMemo(() => {
    const sorted = [...trips].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return sorted;
    return sorted.filter(
      (trip) =>
        trip.name.toLocaleLowerCase().includes(needle) ||
        trip.participants.some((person) => person.name.toLocaleLowerCase().includes(needle)),
    );
  }, [trips, query]);

  const { page, totalPages, items, setPage } = usePagination(filtered, PAGE_SIZE);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(trip: Trip) {
    setEditing(trip);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  function handleSubmit(draft: TripDraft) {
    if (editing) {
      updateTrip(editing.id, draft);
      closeForm();
      return;
    }
    const trip = createTrip(draft);
    closeForm();
    navigate(`/trip/${trip.id}`);
  }

  function confirmDelete() {
    if (pendingDelete) deleteTrip(pendingDelete.id);
    setPendingDelete(null);
  }

  return (
    <div>
      <section className="hero mb-6 px-5 py-6 sm:px-7 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold sm:text-3xl">{t.home.title}</h1>
            <p className="mt-1.5 text-sm text-ink-muted">{t.home.subtitle}</p>
          </div>
          <Button onClick={openCreate}>
            <IconPlus className="h-4 w-4" />
            {t.home.newTrip}
          </Button>
        </div>

        {trips.length > 0 && (
          <div className="relative mt-5 max-w-sm">
            <IconSearch className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              type="search"
              className={input(false, 'bg-surface pl-9')}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.home.searchPlaceholder}
              aria-label={t.common.search}
            />
          </div>
        )}
      </section>

      {trips.length === 0 ? (
        <EmptyState
          icon={<IconWallet className="h-5 w-5" />}
          title={t.home.empty}
          description={t.home.emptyHint}
          action={
            <Button onClick={openCreate}>
              <IconPlus className="h-4 w-4" />
              {t.home.createFirst}
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState title={t.home.noResults} compact />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                totals={totalsByTrip.get(trip.id) ?? EMPTY_TOTALS}
                onEdit={openEdit}
                onDelete={setPendingDelete}
              />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      <Modal
        open={formOpen}
        title={editing ? t.tripForm.editTitle : t.tripForm.createTitle}
        onClose={closeForm}
      >
        <TripForm
          key={editing?.id ?? 'new'}
          trip={editing}
          lockedParticipantIds={editing ? lockedIds : undefined}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t.home.deleteTitle}
        body={t.home.deleteBody}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
