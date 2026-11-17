import type { Dictionary } from '../i18n/dictionary';
import type { Expense, ID, Trip } from '../types/trip';
import { formatShortDate, parseDate } from './date';
import { formatMoney, roundMoney } from './money';
import { nameOf, participantNames } from './participants';

export interface PersonShare {
  participantId: ID;
  amount: number;
}

/** Everything the group spent on one calendar day. */
export interface DayTotals {
  /** yyyy-mm-dd, the expense's own date. */
  date: string;
  total: number;
  /** Oldest entry first, so a day reads in the order it happened. */
  expenses: Expense[];
  /**
   * What each person *carries* that day — their split, not what they handed
   * over. Who fronted the cash, or whether it came out of the fund, does not
   * change what somebody consumed. Trip order; nobody with a zero share.
   */
  shares: PersonShare[];
}

function byEntered(a: Expense, b: Expense): number {
  if (a.createdAt === b.createdAt) return 0;
  return a.createdAt < b.createdAt ? -1 : 1;
}

/** Sum split amounts per person, in the trip's member order, strangers last. */
export function sumShares(trip: Trip, expenses: Expense[]): PersonShare[] {
  const sums = new Map<ID, number>();
  for (const expense of expenses) {
    for (const split of expense.splits) {
      sums.set(split.participantId, (sums.get(split.participantId) ?? 0) + split.amount);
    }
  }
  const order = trip.participants.map((person) => person.id);
  const strangers = [...sums.keys()].filter((id) => !order.includes(id));
  return [...order, ...strangers]
    .map((participantId) => ({
      participantId,
      amount: roundMoney(sums.get(participantId) ?? 0, trip.currency),
    }))
    .filter((share) => share.amount !== 0);
}

/**
 * One entry per day that has spending, newest day first like the rest of the
 * trip page. Days with nothing logged are left out rather than shown as zero.
 */
export function buildDailyTotals(trip: Trip, expenses: Expense[]): DayTotals[] {
  const byDay = new Map<string, Expense[]>();
  for (const expense of expenses) {
    const list = byDay.get(expense.date);
    if (list) list.push(expense);
    else byDay.set(expense.date, [expense]);
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .map(([date, list]) => {
      const sorted = [...list].sort(byEntered);
      return {
        date,
        total: roundMoney(
          sorted.reduce((sum, expense) => sum + expense.amount, 0),
          trip.currency,
        ),
        expenses: sorted,
        shares: sumShares(trip, sorted),
      };
    });
}

export interface DailyContext {
  t: Dictionary;
  locale: string;
}

/**
 * "Tuesday, 11/17/2026" / "Thứ Ba, 17/11/2026": a single day deserves its
 * weekday. On screen the trip already sets the year, and a narrow phone needs
 * the room, so the year can be left off there.
 */
export function formatLongDay(value: string, locale: string, withYear = true): string {
  const date = parseDate(value);
  if (!date) return value;
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    ...(withYear ? { year: 'numeric' } : {}),
  });
}

export function countLabel(count: number, t: Dictionary): string {
  return (count === 1 ? t.daily.countOne : t.daily.countOther).replace('{n}', String(count));
}

/** "🧾 3 items", the badge on an expense split by item. */
export function itemCountLabel(count: number, t: Dictionary): string {
  return `🧾 ${(count === 1 ? t.receipt.badgeOne : t.receipt.badgeOther).replace('{n}', String(count))}`;
}

/** "(An paid)" for money somebody fronted, "(Fund)" when the kitty paid. */
function sourceLabel(expense: Expense, names: Map<ID, string>, t: Dictionary): string {
  if (expense.paidFrom === 'fund') return t.daily.fund;
  return `${nameOf(names, expense.paidById, t.common.unknown)} ${t.expense.paid}`;
}

function shareLines(trip: Trip, shares: PersonShare[], { t, locale }: DailyContext): string[] {
  const names = participantNames(trip);
  return shares.map(
    (share) =>
      `• ${nameOf(names, share.participantId, t.common.unknown)}: ${formatMoney(share.amount, trip.currency, locale)}`,
  );
}

/**
 * One day, for the group chat at the end of it: the total, what each person
 * carries, then every expense. Same plain-text rules as the trip summary — one
 * fact per line, no padding, because chat apps use a proportional font.
 */
export function buildDaySummary(trip: Trip, day: DayTotals, context: DailyContext): string {
  const { t, locale } = context;
  const money = (value: number) => formatMoney(value, trip.currency, locale);
  const names = participantNames(trip);

  const lines = [
    `📅 ${trip.name} – ${formatLongDay(day.date, locale)}`,
    `${t.daily.total}: ${money(day.total)} (${countLabel(day.expenses.length, t)})`,
  ];

  if (day.shares.length > 0) {
    lines.push('', `👤 ${t.daily.perPerson}:`, ...shareLines(trip, day.shares, context));
  }

  lines.push('', `🧾 ${t.daily.details}:`);
  for (const expense of day.expenses) {
    lines.push(
      `• ${expense.description} – ${money(expense.amount)} (${sourceLabel(expense, names, t)})`,
    );
  }

  return lines.join('\n');
}

/**
 * The whole trip, one line per day. It reads forwards in time even though the
 * screen lists newest first, and leaves the expenses out: the per-day share is
 * where those live, and a whole trip of them is too long for a phone.
 */
export function buildDailyOverview(trip: Trip, days: DayTotals[], context: DailyContext): string {
  const { t, locale } = context;
  const money = (value: number) => formatMoney(value, trip.currency, locale);
  const forwards = [...days].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const total = roundMoney(
    forwards.reduce((sum, day) => sum + day.total, 0),
    trip.currency,
  );

  const lines = [`📅 ${trip.name} – ${t.daily.title}`];
  for (const day of forwards) {
    lines.push(`• ${formatShortDate(day.date, locale)}: ${money(day.total)}`);
  }
  lines.push(`${t.daily.total}: ${money(total)}`);

  const shares = sumShares(
    trip,
    forwards.flatMap((day) => day.expenses),
  );
  if (shares.length > 0) {
    lines.push('', `👤 ${t.daily.perPerson}:`, ...shareLines(trip, shares, context));
  }

  return lines.join('\n');
}
