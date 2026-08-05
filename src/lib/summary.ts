import type { Dictionary } from '../i18n/dictionary';
import type {
  Contribution,
  Expense,
  ID,
  ParticipantBalance,
  Trip,
  TripTotals,
} from '../types/trip';
import { formatDate, formatDateRange } from './date';
import { formatMoney, formatMoneySigned, toMinorUnits } from './money';
import { nameOf, participantNames } from './participants';

export interface SummaryContext {
  t: Dictionary;
  locale: string;
}

/**
 * Plain text, meant to be pasted into a group chat.
 *
 * Deliberately no space-padded columns: Zalo, Messenger and most chat apps use a
 * proportional font, so padding does not line up and only adds noise. One fact
 * per line survives everywhere — including the expenses, which stay one line
 * each instead of nesting their split underneath.
 */
function netLabel(net: number, t: Dictionary): string {
  if (net > 0) return t.trip.getsBack;
  if (net < 0) return t.trip.owes;
  return t.trip.settled;
}

function byMostOwed(a: ParticipantBalance, b: ParticipantBalance): number {
  return a.net - b.net || a.participant.name.localeCompare(b.participant.name);
}

/** A statement reads forwards in time, even though the screen lists newest first. */
function byOldest<T extends { date: string; createdAt: string }>(a: T, b: T): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  if (a.createdAt === b.createdAt) return 0;
  return a.createdAt < b.createdAt ? -1 : 1;
}

/** `· ` between the facts of one line, skipping whatever is missing. */
function joinFacts(parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' · ');
}

/**
 * Who carried this expense and for how much.
 *
 * An even split is stated once ("100,000 ₫ each") instead of repeating the same
 * number per person, and shrinks to "everyone" when nobody was left out — that
 * is the usual case, and spelling out the whole group on every line is the
 * fastest way to make a bill unreadable. Anything else is listed name by name,
 * which also covers the odd leftover unit an even split hands to one person.
 */
function describeSplit(expense: Expense, trip: Trip, names: Map<ID, string>, { t, locale }: SummaryContext): string {
  const { splits } = expense;
  if (splits.length === 0) return '';

  const money = (value: number) => formatMoney(value, trip.currency, locale);
  const who = (id: ID) => nameOf(names, id, t.common.unknown);
  const first = toMinorUnits(splits[0].amount, trip.currency);
  const even =
    splits.length > 1 &&
    splits.every((split) => toMinorUnits(split.amount, trip.currency) === first);

  if (!even) {
    return splits.map((split) => `${who(split.participantId)} ${money(split.amount)}`).join(', ');
  }

  const ids = new Set(splits.map((split) => split.participantId));
  const wholeGroup = ids.size === trip.participants.length && [...ids].every((id) => names.has(id));
  const people = wholeGroup ? t.expense.everyone : splits.map((split) => who(split.participantId)).join(', ');
  return `${people} (${money(splits[0].amount)} ${t.expense.perPerson})`;
}

/** One expense, one line: what it was, how much, when, who paid, how it was split. */
function expenseLine(expense: Expense, trip: Trip, names: Map<ID, string>, context: SummaryContext): string {
  const { t, locale } = context;
  const split = describeSplit(expense, trip, names, context);
  return `• ${expense.description} — ${joinFacts([
    formatMoney(expense.amount, trip.currency, locale),
    formatDate(expense.date, locale),
    `${t.expense.paidBy}: ${nameOf(names, expense.paidById, t.common.unknown)}`,
    split && `${t.expense.splits}: ${split}`,
  ])}`;
}

export function buildTripSummary(
  trip: Trip,
  totals: TripTotals,
  balances: ParticipantBalance[],
  expenses: Expense[],
  context: SummaryContext,
): string {
  const { t, locale } = context;
  const money = (value: number) => formatMoney(value, trip.currency, locale);
  const dates = formatDateRange(trip.startDate, trip.endDate, locale);
  const lines: string[] = [dates ? `${trip.name} · ${dates}` : trip.name, ''];

  lines.push(`${t.trip.fundIn}: ${money(totals.contributions)}`);
  lines.push(`${t.trip.spent}: ${money(totals.expenses)}`);
  lines.push(`${t.trip.remaining}: ${money(totals.remaining)}`);

  if (balances.length > 0) {
    lines.push('', `${t.trip.balancesTitle}:`);
    for (const balance of [...balances].sort(byMostOwed)) {
      lines.push(
        balance.net === 0
          ? `• ${balance.participant.name} — ${t.trip.settled}`
          : `• ${balance.participant.name} — ${netLabel(balance.net, t)}: ${money(Math.abs(balance.net))}`,
      );
    }
    lines.push(`(${t.trip.balancesHint.replace(/\.$/, '')})`);
  }

  if (expenses.length > 0) {
    const names = participantNames(trip);
    lines.push('', `${t.expense.title} (${expenses.length}):`);
    for (const expense of [...expenses].sort(byOldest)) {
      lines.push(expenseLine(expense, trip, names, context));
    }
  }

  return lines.join('\n');
}

export function buildParticipantSummary(
  trip: Trip,
  balance: ParticipantBalance,
  contributions: Contribution[],
  shares: { expense: Expense; amount: number }[],
  { t, locale }: SummaryContext,
): string {
  const money = (value: number) => formatMoney(value, trip.currency, locale);
  const lines: string[] = [`${trip.name} — ${balance.participant.name}`, ''];

  lines.push(`${t.participants.paidIn}: ${money(balance.contributed)}`);
  lines.push(`${t.participants.share}: ${money(balance.share)}`);
  lines.push(
    `${t.participants.net}: ${formatMoneySigned(balance.net, trip.currency, locale)} (${netLabel(balance.net, t)})`,
  );

  if (contributions.length > 0) {
    lines.push('', `${t.participants.contributionsTitle}:`);
    for (const contribution of [...contributions].sort(byOldest)) {
      lines.push(`• ${formatDate(contribution.date, locale)} — ${money(contribution.amount)}`);
    }
  }

  if (shares.length > 0) {
    const names = participantNames(trip);
    lines.push('', `${t.participants.sharesTitle}:`);
    for (const { expense, amount } of [...shares].sort((a, b) => byOldest(a.expense, b.expense))) {
      // Their own share first, then the whole bill it came out of.
      lines.push(
        `• ${expense.description} — ${joinFacts([
          money(amount),
          formatDate(expense.date, locale),
          `${t.participants.ofTotal} ${money(expense.amount)}`,
          `${t.expense.paidBy}: ${nameOf(names, expense.paidById, t.common.unknown)}`,
        ])}`,
      );
    }
  }

  return lines.join('\n');
}
