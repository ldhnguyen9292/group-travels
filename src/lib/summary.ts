import type { Dictionary } from '../i18n/dictionary';
import type {
  Contribution,
  Expense,
  ParticipantBalance,
  Trip,
  TripTotals,
} from '../types/trip';
import { formatDate, formatDateRange } from './date';
import { formatMoney, formatMoneySigned } from './money';

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
 */
function netLabel(net: number, t: Dictionary): string {
  if (net > 0) return t.trip.getsBack;
  if (net < 0) return t.trip.owes;
  return t.trip.settled;
}

function byMostOwed(a: ParticipantBalance, b: ParticipantBalance): number {
  return a.net - b.net || a.participant.name.localeCompare(b.participant.name);
}

export function buildTripSummary(
  trip: Trip,
  totals: TripTotals,
  balances: ParticipantBalance[],
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
    lines.push('', `(${t.trip.balancesHint.replace(/\.$/, '')})`);
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
    for (const contribution of contributions) {
      lines.push(`• ${formatDate(contribution.date, locale)}: ${money(contribution.amount)}`);
    }
  }

  if (shares.length > 0) {
    lines.push('', `${t.participants.sharesTitle}:`);
    for (const { expense, amount } of shares) {
      lines.push(`• ${expense.description} (${formatDate(expense.date, locale)}): ${money(amount)}`);
    }
  }

  return lines.join('\n');
}
