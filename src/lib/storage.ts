import type {
  Contribution,
  Expense,
  ExpenseSplit,
  ID,
  Participant,
  SplitType,
  Trip,
} from '../types/trip';
import { normaliseDate, todayISO } from './date';
import { createId } from './id';
import { DEFAULT_CURRENCY, clampAmount, isCurrency } from './money';

export const STORAGE_KEY = 'group-travel:v2';

export const DATA_VERSION = 2;

export interface AppData {
  version: number;
  trips: Trip[];
  expenses: Expense[];
  contributions: Contribution[];
}

export const EMPTY_DATA: AppData = { version: DATA_VERSION, trips: [], expenses: [], contributions: [] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

/** Amounts from storage or an imported file are clamped into a range that adds up exactly. */
function asAmount(value: unknown): number {
  return clampAmount(typeof value === 'number' ? value : Number(value));
}

function asOptionalDate(value: unknown): string | undefined {
  const raw = asString(value).trim();
  if (!raw) return undefined;
  return normaliseDate(raw, '') || undefined;
}

function asTimestamp(value: unknown): string {
  const raw = asString(value);
  return raw && !Number.isNaN(new Date(raw).getTime()) ? raw : new Date().toISOString();
}

function normaliseParticipant(value: unknown): Participant | null {
  if (!isRecord(value)) return null;
  const name = asString(value.name).trim();
  if (!name) return null;
  return { id: asString(value.id) || createId(), name };
}

function normaliseTrip(value: unknown): Trip | null {
  if (!isRecord(value)) return null;
  const name = asString(value.name).trim();
  const id = asString(value.id);
  if (!id || !name) return null;

  const participants: Participant[] = [];
  const seen = new Set<ID>();
  if (Array.isArray(value.participants)) {
    for (const entry of value.participants) {
      const participant = normaliseParticipant(entry);
      if (participant && !seen.has(participant.id)) {
        seen.add(participant.id);
        participants.push(participant);
      }
    }
  }

  const createdAt = asTimestamp(value.createdAt);
  return {
    id,
    name,
    currency: isCurrency(value.currency) ? value.currency : DEFAULT_CURRENCY,
    startDate: asOptionalDate(value.startDate),
    endDate: asOptionalDate(value.endDate),
    participants,
    createdAt,
    updatedAt: asString(value.updatedAt) ? asTimestamp(value.updatedAt) : createdAt,
  };
}

/** Accepts both the current shape and the legacy `{ participant: { id, name } }` shape. */
function normaliseSplit(value: unknown): ExpenseSplit | null {
  if (!isRecord(value)) return null;
  const legacy = isRecord(value.participant) ? asString(value.participant.id) : '';
  const participantId = asString(value.participantId) || legacy;
  if (!participantId) return null;
  return { participantId, amount: asAmount(value.amount) };
}

function normaliseExpense(value: unknown, fallbackTripId?: ID): Expense | null {
  if (!isRecord(value)) return null;
  const tripId = asString(value.tripId) || asString(fallbackTripId);
  if (!tripId) return null;

  const legacyPaidBy = isRecord(value.paidBy) ? asString(value.paidBy.id) : '';
  const paidById = asString(value.paidById) || legacyPaidBy;
  if (!paidById) return null;

  const splits = Array.isArray(value.splits)
    ? value.splits.map(normaliseSplit).filter((split): split is ExpenseSplit => split !== null)
    : [];

  const splitType: SplitType = value.splitType === 'custom' ? 'custom' : 'equal';
  const createdAt = asTimestamp(value.createdAt);
  return {
    id: asString(value.id) || createId(),
    tripId,
    description: asString(value.description).trim() || '—',
    amount: asAmount(value.amount),
    paidById,
    splits,
    splitType,
    date: normaliseDate(asString(value.date), todayISO()),
    createdAt,
    updatedAt: asString(value.updatedAt) ? asTimestamp(value.updatedAt) : createdAt,
  };
}

function normaliseContribution(value: unknown, fallbackTripId?: ID): Contribution | null {
  if (!isRecord(value)) return null;
  const tripId = asString(value.tripId) || asString(fallbackTripId);
  if (!tripId) return null;

  const legacy = isRecord(value.participant) ? asString(value.participant.id) : '';
  const participantId = asString(value.participantId) || legacy;
  if (!participantId) return null;

  const createdAt = asTimestamp(value.createdAt);
  return {
    id: asString(value.id) || createId(),
    tripId,
    participantId,
    amount: asAmount(value.amount),
    date: normaliseDate(asString(value.date), todayISO()),
    createdAt,
    updatedAt: asString(value.updatedAt) ? asTimestamp(value.updatedAt) : createdAt,
  };
}

/**
 * Turn anything (parsed file, other tab's write) into data this app can render.
 * Invalid entries are dropped rather than allowed to crash a page; records that
 * point at a trip which no longer exists are dropped too.
 */
export function normaliseAppData(value: unknown): AppData | null {
  if (!isRecord(value)) return null;
  if (!Array.isArray(value.trips)) return null;

  const trips = value.trips.map(normaliseTrip).filter((trip): trip is Trip => trip !== null);
  const tripIds = new Set(trips.map((trip) => trip.id));

  const expenses = (Array.isArray(value.expenses) ? value.expenses : [])
    .map((entry) => normaliseExpense(entry))
    .filter((expense): expense is Expense => expense !== null && tripIds.has(expense.tripId));

  const contributions = (Array.isArray(value.contributions) ? value.contributions : [])
    .map((entry) => normaliseContribution(entry))
    .filter(
      (contribution): contribution is Contribution =>
        contribution !== null && tripIds.has(contribution.tripId),
    );

  return { version: DATA_VERSION, trips, expenses, contributions };
}

const LEGACY_EXPENSES = /^expenses(.+)$/;
const LEGACY_CONTRIBUTIONS = /^contributions(.+)$/;

export function legacyKeys(): string[] {
  const keys: string[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key && (LEGACY_EXPENSES.test(key) || LEGACY_CONTRIBUTIONS.test(key))) keys.push(key);
  }
  return keys;
}

function readJSON(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Earlier versions kept trips on a shared remote endpoint and only the expenses
 * and contributions on the device, under `expenses<tripId>` / `contributions<tripId>`.
 * Those trips cannot come back, so a local trip is rebuilt from the names found
 * in the records — otherwise the amounts would be stranded forever.
 */
function migrateLegacyData(): AppData {
  const expenses: Expense[] = [];
  const contributions: Contribution[] = [];
  const participantsByTrip = new Map<ID, Map<ID, string>>();

  const remember = (tripId: ID, participant: Participant) => {
    const existing = participantsByTrip.get(tripId) ?? new Map<ID, string>();
    if (!existing.has(participant.id)) existing.set(participant.id, participant.name);
    participantsByTrip.set(tripId, existing);
  };

  for (const key of legacyKeys()) {
    const expenseMatch = LEGACY_EXPENSES.exec(key);
    const contributionMatch = LEGACY_CONTRIBUTIONS.exec(key);
    const tripId = expenseMatch?.[1] ?? contributionMatch?.[1];
    if (!tripId) continue;

    const parsed = readJSON(key);
    if (!Array.isArray(parsed)) continue;

    for (const entry of parsed) {
      if (!isRecord(entry)) continue;

      if (expenseMatch) {
        const expense = normaliseExpense(entry, tripId);
        if (!expense) continue;
        const payer = normaliseParticipant(entry.paidBy);
        if (payer) remember(tripId, payer);
        if (Array.isArray(entry.splits)) {
          for (const split of entry.splits) {
            const person = isRecord(split) ? normaliseParticipant(split.participant) : null;
            if (person) remember(tripId, person);
          }
        }
        expenses.push(expense);
      } else {
        const contribution = normaliseContribution(entry, tripId);
        if (!contribution) continue;
        const person = normaliseParticipant(entry.participant);
        if (person) remember(tripId, person);
        contributions.push(contribution);
      }
    }
  }

  const now = new Date().toISOString();
  const trips: Trip[] = [...participantsByTrip.entries()].map(([tripId, people], index) => ({
    id: tripId,
    name: `Trip ${index + 1}`,
    currency: DEFAULT_CURRENCY,
    participants: [...people.entries()].map(([id, name]) => ({ id, name })),
    createdAt: now,
    updatedAt: now,
  }));

  const tripIds = new Set(trips.map((trip) => trip.id));
  return {
    version: DATA_VERSION,
    trips,
    expenses: expenses.filter((expense) => tripIds.has(expense.tripId)),
    contributions: contributions.filter((contribution) => tripIds.has(contribution.tripId)),
  };
}

export function loadAppData(): AppData {
  if (typeof localStorage === 'undefined') return EMPTY_DATA;
  const stored = normaliseAppData(readJSON(STORAGE_KEY));
  if (stored) return stored;
  try {
    return migrateLegacyData();
  } catch {
    return EMPTY_DATA;
  }
}

export function saveAppData(data: AppData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function clearLegacyData(): void {
  try {
    for (const key of legacyKeys()) localStorage.removeItem(key);
    localStorage.removeItem('userDevice');
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
}

/** Keep other tabs of the same app in sync. */
export function subscribeAppData(onChange: (data: AppData) => void): () => void {
  const handler = (event: StorageEvent) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return;
    const next = normaliseAppData(readJSON(STORAGE_KEY));
    if (next) onChange(next);
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

export function parseImportedData(text: string): AppData | null {
  try {
    return normaliseAppData(JSON.parse(text));
  } catch {
    return null;
  }
}
