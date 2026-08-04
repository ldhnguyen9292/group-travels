import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createId } from '../lib/id';
import {
  EMPTY_DATA,
  clearLegacyData,
  loadAppData,
  saveAppData,
  subscribeAppData,
  type AppData,
} from '../lib/storage';
import type {
  ContributionDraft,
  ExpenseDraft,
  ID,
  Trip,
  TripDraft,
} from '../types/trip';
import { TripStoreContext, type TripStore } from './context';

export default function TripStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadAppData);
  const [persistFailed, setPersistFailed] = useState(false);
  const legacyCleared = useRef(false);

  // Every change is written straight to this device. There is no server.
  useEffect(() => {
    const saved = saveAppData(data);
    setPersistFailed(!saved);
    if (saved && !legacyCleared.current) {
      legacyCleared.current = true;
      clearLegacyData();
    }
  }, [data]);

  // Another tab of the app editing the same data.
  useEffect(() => subscribeAppData(setData), []);

  const createTrip = useCallback((draft: TripDraft): Trip => {
    const now = new Date().toISOString();
    const trip: Trip = { ...draft, id: createId(), createdAt: now, updatedAt: now };
    setData((current) => ({ ...current, trips: [trip, ...current.trips] }));
    return trip;
  }, []);

  const updateTrip = useCallback((tripId: ID, draft: TripDraft) => {
    setData((current) => ({
      ...current,
      trips: current.trips.map((trip) =>
        trip.id === tripId ? { ...trip, ...draft, updatedAt: new Date().toISOString() } : trip,
      ),
    }));
  }, []);

  const deleteTrip = useCallback((tripId: ID) => {
    setData((current) => ({
      ...current,
      trips: current.trips.filter((trip) => trip.id !== tripId),
      // Never leave records behind pointing at a trip that is gone.
      expenses: current.expenses.filter((expense) => expense.tripId !== tripId),
      contributions: current.contributions.filter(
        (contribution) => contribution.tripId !== tripId,
      ),
    }));
  }, []);

  const addExpense = useCallback((tripId: ID, draft: ExpenseDraft, alsoContribute = false) => {
    const now = new Date().toISOString();
    setData((current) => {
      const expense = { ...draft, id: createId(), tripId, createdAt: now, updatedAt: now };
      const contributions = [...current.contributions];
      if (alsoContribute) {
        // The payer used their own money, so it counts as money they put in.
        contributions.unshift({
          id: createId(),
          tripId,
          participantId: draft.paidById,
          amount: draft.amount,
          date: draft.date,
          createdAt: now,
          updatedAt: now,
        });
      }
      return { ...current, expenses: [expense, ...current.expenses], contributions };
    });
  }, []);

  const updateExpense = useCallback((expenseId: ID, draft: ExpenseDraft) => {
    setData((current) => ({
      ...current,
      expenses: current.expenses.map((expense) =>
        expense.id === expenseId
          ? { ...expense, ...draft, updatedAt: new Date().toISOString() }
          : expense,
      ),
    }));
  }, []);

  const deleteExpense = useCallback((expenseId: ID) => {
    setData((current) => ({
      ...current,
      expenses: current.expenses.filter((expense) => expense.id !== expenseId),
    }));
  }, []);

  const addContribution = useCallback((tripId: ID, draft: ContributionDraft) => {
    const now = new Date().toISOString();
    setData((current) => ({
      ...current,
      contributions: [
        { ...draft, id: createId(), tripId, createdAt: now, updatedAt: now },
        ...current.contributions,
      ],
    }));
  }, []);

  const updateContribution = useCallback((contributionId: ID, draft: ContributionDraft) => {
    setData((current) => ({
      ...current,
      contributions: current.contributions.map((contribution) =>
        contribution.id === contributionId
          ? { ...contribution, ...draft, updatedAt: new Date().toISOString() }
          : contribution,
      ),
    }));
  }, []);

  const deleteContribution = useCallback((contributionId: ID) => {
    setData((current) => ({
      ...current,
      contributions: current.contributions.filter(
        (contribution) => contribution.id !== contributionId,
      ),
    }));
  }, []);

  const replaceAll = useCallback((next: AppData) => setData(next), []);

  const clearAll = useCallback(() => setData(EMPTY_DATA), []);

  const store = useMemo<TripStore>(
    () => ({
      trips: data.trips,
      expenses: data.expenses,
      contributions: data.contributions,
      persistFailed,
      createTrip,
      updateTrip,
      deleteTrip,
      addExpense,
      updateExpense,
      deleteExpense,
      addContribution,
      updateContribution,
      deleteContribution,
      replaceAll,
      clearAll,
    }),
    [
      data,
      persistFailed,
      createTrip,
      updateTrip,
      deleteTrip,
      addExpense,
      updateExpense,
      deleteExpense,
      addContribution,
      updateContribution,
      deleteContribution,
      replaceAll,
      clearAll,
    ],
  );

  return <TripStoreContext.Provider value={store}>{children}</TripStoreContext.Provider>;
}
