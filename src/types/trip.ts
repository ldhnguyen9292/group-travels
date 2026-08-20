export type ID = string;

export type CurrencyCode =
  | 'VND'
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'JPY'
  | 'KRW'
  | 'CNY'
  | 'TWD'
  | 'HKD'
  | 'SGD'
  | 'THB'
  | 'MYR'
  | 'IDR'
  | 'PHP'
  | 'INR'
  | 'AUD'
  | 'NZD'
  | 'CAD'
  | 'CHF'
  | 'AED';

export type SplitType = 'equal' | 'custom';

/**
 * Where the money for an expense came from.
 *
 * `own`: the payer fronted it out of their own pocket, so it counts as money
 * they put into the shared fund. `fund`: it was paid out of money already
 * contributed, so the payer is not owed anything extra for it.
 */
export type PaidFrom = 'own' | 'fund';

export interface Participant {
  id: ID;
  name: string;
}

export interface Trip {
  id: ID;
  name: string;
  currency: CurrencyCode;
  /** ISO date (yyyy-mm-dd), optional. */
  startDate?: string;
  /** ISO date (yyyy-mm-dd), optional. */
  endDate?: string;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}

/** One person's share of an expense. References a participant by id only. */
export interface ExpenseSplit {
  participantId: ID;
  amount: number;
}

/** Money spent for the group, split between the attendees. */
export interface Expense {
  id: ID;
  tripId: ID;
  description: string;
  amount: number;
  /** Who physically paid. */
  paidById: ID;
  /** Whose money it was: the payer's own, or the shared fund's. */
  paidFrom: PaidFrom;
  splits: ExpenseSplit[];
  splitType: SplitType;
  /** ISO date (yyyy-mm-dd). */
  date: string;
  createdAt: string;
  updatedAt: string;
}

/** Money a participant put into the shared fund. */
export interface Contribution {
  id: ID;
  tripId: ID;
  participantId: ID;
  amount: number;
  /** ISO date (yyyy-mm-dd). */
  date: string;
  createdAt: string;
  updatedAt: string;
}

export type TripDraft = Pick<Trip, 'name' | 'currency' | 'startDate' | 'endDate' | 'participants'>;

export type ExpenseDraft = Omit<Expense, 'id' | 'tripId' | 'createdAt' | 'updatedAt'>;

export type ContributionDraft = Omit<Contribution, 'id' | 'tripId' | 'createdAt' | 'updatedAt'>;

export interface TripTotals {
  contributions: number;
  expenses: number;
  /** contributions - expenses: what is left in the shared fund. */
  remaining: number;
}

export interface ParticipantBalance {
  participant: Participant;
  /** Paid into the shared fund. */
  contributed: number;
  /** Share of the group's expenses. */
  share: number;
  /** Expenses this participant physically paid for (bookkeeping only). */
  paidOutOfPocket: number;
  /** contributed - share. Positive: gets money back. Negative: still owes. */
  net: number;
}
