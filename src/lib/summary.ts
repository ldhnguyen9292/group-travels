import type { Dictionary } from '../i18n/dictionary';
import type {
  Contribution,
  Expense,
  ID,
  ParticipantBalance,
  Trip,
  TripTotals,
} from '../types/trip';
import { formatDateRange, formatShortDate } from './date';
import { formatMoney, formatMoneySigned } from './money';
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
 * per line survives everywhere.
 *
 * The trip summary lists the bill — what was spent and who fronted it — and
 * stops there. Who owes what is already answered by the balances above it, and
 * spelling out every expense's split as well makes the message too long to read
 * on a phone. That breakdown belongs in a member's own statement, where it is
 * about one person.
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

/** "24/10 Dinner — 300,000 ₫", the opening of every line in a money list. */
function entry(date: string, label: string, amount: string, locale: string): string {
  const day = formatShortDate(date, locale);
  return `• ${day ? `${day} ${label}` : label} — ${amount}`;
}

function paidBy(payerId: ID, names: Map<ID, string>, t: Dictionary): string {
  return `${nameOf(names, payerId, t.common.unknown)} ${t.expense.paid}`;
}

export function buildTripSummary(
  trip: Trip,
  totals: TripTotals,
  balances: ParticipantBalance[],
  expenses: Expense[],
  { t, locale }: SummaryContext,
): string {
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
  }

  if (expenses.length > 0) {
    const names = participantNames(trip);
    lines.push('', `${t.expense.title} (${expenses.length}):`);
    for (const expense of [...expenses].sort(byOldest)) {
      lines.push(
        joinFacts([
          entry(expense.date, expense.description, money(expense.amount), locale),
          paidBy(expense.paidById, names, t),
        ]),
      );
    }
  }

  // Closes the message, so neither list is interrupted by a footnote.
  if (balances.length > 0) lines.push('', `(${t.trip.balancesHint.replace(/\.$/, '')})`);

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
  const names = participantNames(trip);
  const lines: string[] = [`${trip.name} — ${balance.participant.name}`, ''];

  lines.push(`${t.participants.paidIn}: ${money(balance.contributed)}`);
  lines.push(`${t.participants.share}: ${money(balance.share)}`);
  lines.push(
    `${t.participants.net}: ${formatMoneySigned(balance.net, trip.currency, locale)} (${netLabel(balance.net, t)})`,
  );

  if (contributions.length > 0) {
    lines.push('', `${t.participants.contributionsTitle}:`);
    for (const contribution of [...contributions].sort(byOldest)) {
      const day = formatShortDate(contribution.date, locale);
      lines.push(`• ${day ? `${day} — ` : ''}${money(contribution.amount)}`);
    }
  }

  if (shares.length > 0) {
    lines.push('', `${t.participants.sharesTitle}:`);
    for (const { expense, amount } of [...shares].sort((a, b) => byOldest(a.expense, b.expense))) {
      // Their own share first, then the whole bill it was taken out of.
      lines.push(
        joinFacts([
          entry(expense.date, expense.description, money(amount), locale),
          `${t.participants.ofTotal} ${money(expense.amount)}`,
          paidBy(expense.paidById, names, t),
        ]),
      );
    }
  }

  return lines.join('\n');
}
