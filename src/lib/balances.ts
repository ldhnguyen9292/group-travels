import type {
  Contribution,
  Expense,
  ID,
  ParticipantBalance,
  Trip,
  TripTotals,
} from '../types/trip';
import { roundMoney } from './money';

export function computeTotals(
  trip: Trip,
  expenses: Expense[],
  contributions: Contribution[],
): TripTotals {
  const totalContributions = roundMoney(
    contributions.reduce((sum, item) => sum + item.amount, 0),
    trip.currency,
  );
  const totalExpenses = roundMoney(
    expenses.reduce((sum, item) => sum + item.amount, 0),
    trip.currency,
  );
  // Money the payers fronted themselves entered the fund too, just via an
  // expense rather than a contribution record. Counting it here is what keeps
  // `remaining` equal to the sum of everyone's net.
  const totalFronted = roundMoney(
    expenses.reduce((sum, item) => sum + (item.paidFrom === 'own' ? item.amount : 0), 0),
    trip.currency,
  );
  return {
    contributions: roundMoney(totalContributions + totalFronted, trip.currency),
    expenses: totalExpenses,
    remaining: roundMoney(totalContributions + totalFronted - totalExpenses, trip.currency),
  };
}

/**
 * The same totals as `computeTotals`, for a whole list of trips at once, so a
 * card on the trip list reads exactly like the trip's own page. Grouping the
 * records first keeps this one pass over each list rather than one per trip.
 */
export function computeTotalsByTrip(
  trips: Trip[],
  expenses: Expense[],
  contributions: Contribution[],
): Map<ID, TripTotals> {
  const expensesByTrip = new Map<ID, Expense[]>();
  for (const expense of expenses) {
    const list = expensesByTrip.get(expense.tripId);
    if (list) list.push(expense);
    else expensesByTrip.set(expense.tripId, [expense]);
  }

  const contributionsByTrip = new Map<ID, Contribution[]>();
  for (const contribution of contributions) {
    const list = contributionsByTrip.get(contribution.tripId);
    if (list) list.push(contribution);
    else contributionsByTrip.set(contribution.tripId, [contribution]);
  }

  const totals = new Map<ID, TripTotals>();
  for (const trip of trips) {
    totals.set(
      trip.id,
      computeTotals(trip, expensesByTrip.get(trip.id) ?? [], contributionsByTrip.get(trip.id) ?? []),
    );
  }
  return totals;
}

/**
 * Per-participant standing in the shared fund.
 *
 *   net = what they put in − their share of what the group spent
 *
 * A positive net means the fund owes them money back, a negative net means they
 * still have to pay in.
 */
export function computeBalances(
  trip: Trip,
  expenses: Expense[],
  contributions: Contribution[],
): ParticipantBalance[] {
  const contributed = new Map<ID, number>();
  for (const item of contributions) {
    contributed.set(item.participantId, (contributed.get(item.participantId) ?? 0) + item.amount);
  }

  const share = new Map<ID, number>();
  const paidOutOfPocket = new Map<ID, number>();
  for (const expense of expenses) {
    if (expense.paidFrom === 'own') {
      // Their own cash went in, so it counts the same as a contribution.
      contributed.set(
        expense.paidById,
        (contributed.get(expense.paidById) ?? 0) + expense.amount,
      );
    }
    paidOutOfPocket.set(
      expense.paidById,
      (paidOutOfPocket.get(expense.paidById) ?? 0) + expense.amount,
    );
    for (const split of expense.splits) {
      share.set(split.participantId, (share.get(split.participantId) ?? 0) + split.amount);
    }
  }

  return trip.participants.map((participant) => {
    const totalContributed = roundMoney(contributed.get(participant.id) ?? 0, trip.currency);
    const totalShare = roundMoney(share.get(participant.id) ?? 0, trip.currency);
    return {
      participant,
      contributed: totalContributed,
      share: totalShare,
      paidOutOfPocket: roundMoney(paidOutOfPocket.get(participant.id) ?? 0, trip.currency),
      net: roundMoney(totalContributed - totalShare, trip.currency),
    };
  });
}

export function findBalance(
  balances: ParticipantBalance[],
  participantId: ID,
): ParticipantBalance | null {
  return balances.find((balance) => balance.participant.id === participantId) ?? null;
}

/** Expense shares belonging to one participant, for their detail page. */
export function participantShares(
  expenses: Expense[],
  participantId: ID,
): { expense: Expense; amount: number }[] {
  const result: { expense: Expense; amount: number }[] = [];
  for (const expense of expenses) {
    const split = expense.splits.find((item) => item.participantId === participantId);
    if (split) result.push({ expense, amount: split.amount });
  }
  return result;
}
