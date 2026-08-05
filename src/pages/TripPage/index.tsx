import { useMemo, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import BalanceList from '../../components/BalanceList';
import ContributionForm from '../../components/ContributionForm';
import ContributionList from '../../components/ContributionList';
import ExpenseForm from '../../components/ExpenseForm';
import ExpenseList from '../../components/ExpenseList';
import ExpenseTable from '../../components/ExpenseTable';
import ShareDialog from '../../components/ShareDialog';
import TripForm from '../../components/TripForm';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import {
  IconAlert,
  IconArrowLeft,
  IconCalendar,
  IconList,
  IconPencil,
  IconPlus,
  IconReceipt,
  IconScale,
  IconShare,
  IconTable,
  IconUsers,
  IconWallet,
} from '../../components/ui/Icons';
import Modal from '../../components/ui/Modal';
import StatTile from '../../components/ui/StatTile';
import { btn } from '../../components/ui/classes';
import { useI18n } from '../../i18n/context';
import { computeBalances, computeTotals } from '../../lib/balances';
import { formatDateRange } from '../../lib/date';
import { formatMoney } from '../../lib/money';
import { buildTripSummary } from '../../lib/summary';
import { useLockedParticipantIds, useTrip, useTripRecords, useTripStore } from '../../store/context';
import type {
  Contribution,
  ContributionDraft,
  Expense,
  ExpenseDraft,
  ID,
  TripDraft,
} from '../../types/trip';

type ActiveModal = 'trip' | 'contribution' | 'expense' | 'share' | null;

/** The list edits, the table checks. Whichever is open is a per-visit choice. */
type ExpenseView = 'list' | 'table';

type PendingDelete = { kind: 'contribution' | 'expense'; id: ID } | null;

function Section({
  icon,
  title,
  action,
  children,
}: {
  icon: ReactNode;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="card p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2.5 text-base font-semibold">
          <span className="puck h-7 w-7">{icon}</span>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function TripPage() {
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useI18n();
  const trip = useTrip(id);
  const { expenses, contributions } = useTripRecords(id);
  const lockedIds = useLockedParticipantIds(id);
  const {
    updateTrip,
    addContribution,
    updateContribution,
    deleteContribution,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useTripStore();

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [editingContribution, setEditingContribution] = useState<Contribution | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const [expenseView, setExpenseView] = useState<ExpenseView>('list');

  const totals = useMemo(
    () => (trip ? computeTotals(trip, expenses, contributions) : null),
    [trip, expenses, contributions],
  );
  const balances = useMemo(
    () => (trip ? computeBalances(trip, expenses, contributions) : []),
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

  function closeModal() {
    setActiveModal(null);
    setEditingContribution(null);
    setEditingExpense(null);
  }

  const handleTripSubmit = (draft: TripDraft) => {
    updateTrip(trip.id, draft);
    closeModal();
  };

  const handleContributionSubmit = (draft: ContributionDraft) => {
    if (editingContribution) updateContribution(editingContribution.id, draft);
    else addContribution(trip.id, draft);
    closeModal();
  };

  const handleExpenseSubmit = (draft: ExpenseDraft, alsoContribute: boolean) => {
    if (editingExpense) updateExpense(editingExpense.id, draft);
    else addExpense(trip.id, draft, alsoContribute);
    closeModal();
  };

  function confirmDelete() {
    if (pendingDelete?.kind === 'contribution') deleteContribution(pendingDelete.id);
    if (pendingDelete?.kind === 'expense') deleteExpense(pendingDelete.id);
    setPendingDelete(null);
  }

  const dates = formatDateRange(trip.startDate, trip.endDate, locale);
  const hasMembers = trip.participants.length > 0;

  return (
    <div className="space-y-5">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-brand">
        <IconArrowLeft className="h-4 w-4" />
        {t.trip.backToTrips}
      </Link>

      <div className="hero flex flex-wrap items-start justify-between gap-3 px-5 py-5 sm:px-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold break-words sm:text-3xl">{trip.name}</h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <IconCalendar className="h-3.5 w-3.5 shrink-0" />
              {dates || t.home.noDates}
            </span>
            <span className="badge badge-brand">{trip.currency}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setActiveModal('share')}>
            <IconShare className="h-4 w-4" />
            {t.share.shareResults}
          </Button>
          <Link to={`/trip/${trip.id}/participants`} className={btn('secondary')}>
            <IconUsers className="h-4 w-4" />
            {t.trip.allMembers}
          </Link>
          <Button variant="secondary" onClick={() => setActiveModal('trip')}>
            <IconPencil className="h-4 w-4" />
            {t.trip.editTrip}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
        <StatTile
          label={t.trip.remaining}
          value={formatMoney(totals.remaining, trip.currency, locale)}
          icon={<IconScale className="h-4 w-4" />}
          tone={totals.remaining < 0 ? 'bad' : 'good'}
        />
      </div>

      {totals.remaining < 0 && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-xl border border-warn bg-warn-soft px-4 py-3 text-sm text-warn"
        >
          <IconAlert className="h-4 w-4 shrink-0" />
          {t.trip.overspent}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => setActiveModal('contribution')}
          disabled={!hasMembers}
          title={hasMembers ? undefined : t.trip.balancesEmpty}
        >
          <IconPlus className="h-4 w-4" />
          {t.trip.addContribution}
        </Button>
        <Button
          variant="soft"
          onClick={() => setActiveModal('expense')}
          disabled={!hasMembers}
          title={hasMembers ? undefined : t.trip.balancesEmpty}
        >
          <IconPlus className="h-4 w-4" />
          {t.trip.addExpense}
        </Button>
      </div>

      <Section icon={<IconScale className="h-4 w-4" />} title={t.trip.balancesTitle}>
        {hasMembers ? (
          <>
            <p className="mb-1 text-xs text-ink-muted">{t.trip.balancesHint}</p>
            <BalanceList trip={trip} balances={balances} />
          </>
        ) : (
          <EmptyState title={t.trip.balancesEmpty} compact />
        )}
      </Section>

      <Section icon={<IconWallet className="h-4 w-4" />} title={t.contribution.title}>
        {contributions.length === 0 ? (
          <EmptyState title={t.contribution.empty} compact />
        ) : (
          <ContributionList
            trip={trip}
            contributions={contributions}
            onEdit={(contribution) => {
              setEditingContribution(contribution);
              setActiveModal('contribution');
            }}
            onDelete={(contributionId) =>
              setPendingDelete({ kind: 'contribution', id: contributionId })
            }
          />
        )}
      </Section>

      <Section
        icon={<IconReceipt className="h-4 w-4" />}
        title={t.expense.title}
        action={
          expenses.length > 0 && (
            <div className="flex gap-1" role="group" aria-label={t.expense.view}>
              <Button
                variant={expenseView === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                aria-pressed={expenseView === 'list'}
                onClick={() => setExpenseView('list')}
              >
                <IconList className="h-4 w-4" />
                {t.expense.viewList}
              </Button>
              <Button
                variant={expenseView === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                aria-pressed={expenseView === 'table'}
                onClick={() => setExpenseView('table')}
              >
                <IconTable className="h-4 w-4" />
                {t.expense.viewTable}
              </Button>
            </div>
          )
        }
      >
        {expenses.length === 0 ? (
          <EmptyState title={t.expense.empty} compact />
        ) : expenseView === 'table' ? (
          <>
            <p className="mb-2 text-xs text-ink-muted">{t.expense.tableHint}</p>
            <ExpenseTable trip={trip} expenses={expenses} />
          </>
        ) : (
          <ExpenseList
            trip={trip}
            expenses={expenses}
            onEdit={(expense) => {
              setEditingExpense(expense);
              setActiveModal('expense');
            }}
            onDelete={(expenseId) => setPendingDelete({ kind: 'expense', id: expenseId })}
          />
        )}
      </Section>

      <Modal open={activeModal === 'trip'} title={t.tripForm.editTitle} onClose={closeModal}>
        <TripForm
          trip={trip}
          lockedParticipantIds={lockedIds}
          onSubmit={handleTripSubmit}
          onCancel={closeModal}
        />
      </Modal>

      <Modal
        open={activeModal === 'contribution'}
        title={editingContribution ? t.contribution.editTitle : t.contribution.addTitle}
        onClose={closeModal}
      >
        <ContributionForm
          key={editingContribution?.id ?? 'new'}
          trip={trip}
          contribution={editingContribution}
          onSubmit={handleContributionSubmit}
          onCancel={closeModal}
        />
      </Modal>

      <Modal
        open={activeModal === 'expense'}
        title={editingExpense ? t.expense.editTitle : t.expense.addTitle}
        onClose={closeModal}
        widthClass="max-w-2xl"
      >
        <ExpenseForm
          key={editingExpense?.id ?? 'new'}
          trip={trip}
          expense={editingExpense}
          onSubmit={handleExpenseSubmit}
          onCancel={closeModal}
        />
      </Modal>

      <ShareDialog
        open={activeModal === 'share'}
        subject={trip.name}
        text={buildTripSummary(trip, totals, balances, expenses, { t, locale })}
        onClose={closeModal}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={
          pendingDelete?.kind === 'expense' ? t.expense.deleteTitle : t.contribution.deleteTitle
        }
        body={pendingDelete?.kind === 'expense' ? t.expense.deleteBody : t.contribution.deleteBody}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
