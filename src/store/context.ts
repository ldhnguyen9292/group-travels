import { createContext, useContext, useMemo } from 'react';
import type { AppData } from '../lib/storage';
import type {
  Contribution,
  ContributionDraft,
  Expense,
  ExpenseDraft,
  ID,
  Trip,
  TripDraft,
} from '../types/trip';

export interface TripStore {
  trips: Trip[];
  expenses: Expense[];
  contributions: Contribution[];
  /** True when the browser refused to persist the last change (quota, private mode). */
  persistFailed: boolean;
  createTrip: (draft: TripDraft) => Trip;
  updateTrip: (tripId: ID, draft: TripDraft) => void;
  deleteTrip: (tripId: ID) => void;
  /** `alsoContribute` records the payer's money as a contribution in the same update. */
  addExpense: (tripId: ID, draft: ExpenseDraft, alsoContribute?: boolean) => void;
  updateExpense: (expenseId: ID, draft: ExpenseDraft) => void;
  deleteExpense: (expenseId: ID) => void;
  addContribution: (tripId: ID, draft: ContributionDraft) => void;
  updateContribution: (contributionId: ID, draft: ContributionDraft) => void;
  deleteContribution: (contributionId: ID) => void;
  replaceAll: (data: AppData) => void;
  clearAll: () => void;
}

export const TripStoreContext = createContext<TripStore | null>(null);

export function useTripStore(): TripStore {
  const store = useContext(TripStoreContext);
  if (!store) throw new Error('useTripStore must be used inside <AppProviders>');
  return store;
}

export function useTrip(tripId: string | undefined): Trip | null {
  const { trips } = useTripStore();
  return useMemo(
    () => (tripId ? trips.find((trip) => trip.id === tripId) ?? null : null),
    [trips, tripId],
  );
}

/** Newest first: by day, then by the moment it was entered. */
function byNewest<T extends { date: string; createdAt: string }>(a: T, b: T): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return a.createdAt < b.createdAt ? 1 : -1;
}

export interface TripRecords {
  expenses: Expense[];
  contributions: Contribution[];
}

export function useTripRecords(tripId: string | undefined): TripRecords {
  const { expenses, contributions } = useTripStore();
  return useMemo(() => {
    if (!tripId) return { expenses: [], contributions: [] };
    return {
      expenses: expenses.filter((expense) => expense.tripId === tripId).sort(byNewest),
      contributions: contributions
        .filter((contribution) => contribution.tripId === tripId)
        .sort(byNewest),
    };
  }, [expenses, contributions, tripId]);
}

/** Members who already have money logged, and therefore cannot be removed. */
export function useLockedParticipantIds(tripId: string | undefined): Set<ID> {
  const { expenses, contributions } = useTripRecords(tripId);
  return useMemo(() => {
    const locked = new Set<ID>();
    for (const contribution of contributions) locked.add(contribution.participantId);
    for (const expense of expenses) {
      locked.add(expense.paidById);
      for (const split of expense.splits) locked.add(split.participantId);
    }
    return locked;
  }, [expenses, contributions]);
}
