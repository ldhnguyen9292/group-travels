import { useId, useMemo, useState, type FormEvent } from 'react';
import { useI18n } from '../i18n/context';
import { normaliseDate, todayISO } from '../lib/date';
import {
  currencyStep,
  formatMoney,
  parseAmount,
  roundMoney,
  splitEvenly,
  toMinorUnits,
} from '../lib/money';
import type { Expense, ExpenseDraft, ExpenseSplit, ID, SplitType, Trip } from '../types/trip';
import Button from './ui/Button';
import Field from './ui/Field';
import { IconCheck } from './ui/Icons';
import { cx, input } from './ui/classes';

export interface ExpenseFormProps {
  trip: Trip;
  expense?: Expense | null;
  onSubmit: (draft: ExpenseDraft, alsoContribute: boolean) => void;
  onCancel: () => void;
}

interface Errors {
  description?: string;
  amount?: string;
  paidById?: string;
  attendees?: string;
  splits?: string;
}

export default function ExpenseForm({ trip, expense, onSubmit, onCancel }: ExpenseFormProps) {
  const { t, locale } = useI18n();
  const fieldId = useId();
  const memberIds = useMemo(() => trip.participants.map((person) => person.id), [trip.participants]);

  const [description, setDescription] = useState(expense?.description ?? '');
  const [amount, setAmount] = useState(expense ? String(expense.amount) : '');
  const [date, setDate] = useState(normaliseDate(expense?.date, todayISO()));
  const [paidById, setPaidById] = useState(expense?.paidById ?? '');
  const [splitType, setSplitType] = useState<SplitType>(expense?.splitType ?? 'equal');
  const [attendeeIds, setAttendeeIds] = useState<ID[]>(() => {
    if (!expense) return memberIds;
    // Keep the trip's ordering, and drop anyone no longer on the trip.
    const chosen = new Set(expense.splits.map((split) => split.participantId));
    return memberIds.filter((id) => chosen.has(id));
  });
  const [customAmounts, setCustomAmounts] = useState<Record<ID, string>>(() => {
    if (!expense || expense.splitType !== 'custom') return {};
    return Object.fromEntries(
      expense.splits.map((split) => [split.participantId, String(split.amount)]),
    );
  });
  const [alsoContribute, setAlsoContribute] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const total = parseAmount(amount) ?? 0;
  const equalParts = splitEvenly(total, attendeeIds.length, trip.currency);
  const allocated = roundMoney(
    attendeeIds.reduce((sum, id) => sum + (Number(customAmounts[id]) || 0), 0),
    trip.currency,
  );
  const difference = roundMoney(total - allocated, trip.currency);

  function toggleAttendee(id: ID, checked: boolean) {
    setAttendeeIds((current) =>
      checked ? memberIds.filter((memberId) => current.includes(memberId) || memberId === id)
        : current.filter((memberId) => memberId !== id),
    );
  }

  function switchSplitType(next: SplitType) {
    setSplitType(next);
    if (next === 'custom') {
      // Start from the equal split so there is something sensible to tweak.
      const parts = splitEvenly(total, attendeeIds.length, trip.currency);
      setCustomAmounts((current) => {
        const seeded: Record<ID, string> = { ...current };
        attendeeIds.forEach((id, index) => {
          if (!seeded[id]) seeded[id] = String(parts[index] ?? 0);
        });
        return seeded;
      });
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsedAmount = parseAmount(amount);
    const next: Errors = {};

    if (!description.trim()) next.description = t.expense.errorDescription;
    if (parsedAmount === null) next.amount = t.expense.errorAmount;
    if (!memberIds.includes(paidById)) next.paidById = t.expense.errorPaidBy;
    if (attendeeIds.length === 0) next.attendees = t.expense.errorAttendees;

    let splits: ExpenseSplit[] = [];
    if (parsedAmount !== null && attendeeIds.length > 0) {
      if (splitType === 'equal') {
        const parts = splitEvenly(parsedAmount, attendeeIds.length, trip.currency);
        splits = attendeeIds.map((id, index) => ({ participantId: id, amount: parts[index] }));
      } else {
        splits = attendeeIds.map((id) => ({
          participantId: id,
          amount: roundMoney(Number(customAmounts[id]) || 0, trip.currency),
        }));
        const sum = splits.reduce((acc, split) => acc + toMinorUnits(split.amount, trip.currency), 0);
        if (sum !== toMinorUnits(parsedAmount, trip.currency)) {
          next.splits = t.expense.errorSplitSum;
        }
      }
    }

    setErrors(next);
    if (parsedAmount === null || Object.values(next).some(Boolean)) return;

    onSubmit(
      {
        description: description.trim(),
        amount: roundMoney(parsedAmount, trip.currency),
        paidById,
        splits,
        splitType,
        date,
      },
      !expense && alsoContribute,
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Field id={`${fieldId}-desc`} label={t.expense.description} error={errors.description}>
        <input
          id={`${fieldId}-desc`}
          className={input(Boolean(errors.description))}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder={t.expense.descriptionPlaceholder}
          maxLength={120}
          autoComplete="off"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id={`${fieldId}-amount`}
          label={`${t.expense.amount} (${trip.currency})`}
          error={errors.amount}
        >
          <input
            id={`${fieldId}-amount`}
            type="number"
            inputMode="decimal"
            min="0"
            step={currencyStep(trip.currency)}
            className={input(Boolean(errors.amount))}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0"
          />
        </Field>
        <Field id={`${fieldId}-date`} label={t.expense.date}>
          <input
            id={`${fieldId}-date`}
            type="date"
            className={input()}
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </Field>
      </div>

      <Field id={`${fieldId}-paid`} label={t.expense.paidBy} error={errors.paidById}>
        <select
          id={`${fieldId}-paid`}
          className={input(Boolean(errors.paidById))}
          value={paidById}
          onChange={(event) => setPaidById(event.target.value)}
        >
          <option value="">{t.expense.selectMember}</option>
          {trip.participants.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </select>
      </Field>

      {!expense && (
        <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border bg-sunken px-3.5 py-3">
          <input
            type="checkbox"
            className="checkbox mt-0.5"
            checked={alsoContribute}
            onChange={(event) => setAlsoContribute(event.target.checked)}
          />
          <span className="text-sm">
            <span className="font-medium text-ink">{t.expense.markAsContribution}</span>
            <span className="mt-0.5 block text-xs text-ink-muted">
              {t.expense.markAsContributionHint}
            </span>
          </span>
        </label>
      )}

      <div>
        <span className="label">{t.expense.splitType}</span>
        <div className="grid grid-cols-2 gap-2">
          {(['equal', 'custom'] as SplitType[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => switchSplitType(option)}
              aria-pressed={splitType === option}
              className={cx(
                'rounded-control border px-3 py-2 text-sm font-medium transition-colors',
                splitType === option
                  ? 'border-brand-border bg-brand-soft text-brand'
                  : 'border-border bg-sunken text-ink-muted hover:text-ink',
              )}
            >
              {option === 'equal' ? t.expense.equal : t.expense.custom}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="label mb-0">{t.expense.attendees}</span>
          <div className="flex gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAttendeeIds(memberIds)}
              disabled={attendeeIds.length === memberIds.length}
            >
              {t.common.selectAll}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAttendeeIds([])}
              disabled={attendeeIds.length === 0}
            >
              {t.common.clearSelection}
            </Button>
          </div>
        </div>

        <div className="grid gap-1.5 sm:grid-cols-2">
          {trip.participants.map((person) => (
            <label
              key={person.id}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-sunken"
            >
              <input
                type="checkbox"
                className="checkbox"
                checked={attendeeIds.includes(person.id)}
                onChange={(event) => toggleAttendee(person.id, event.target.checked)}
              />
              <span className="min-w-0 flex-1 truncate text-sm">{person.name}</span>
            </label>
          ))}
        </div>
        {errors.attendees && (
          <p className="field-error" role="alert">
            {errors.attendees}
          </p>
        )}

        {splitType === 'equal' && attendeeIds.length > 0 && total > 0 && (
          <p className="field-hint">
            {formatMoney(equalParts[0], trip.currency, locale)} {t.expense.perPerson}
            {equalParts[0] !== equalParts[equalParts.length - 1] &&
              ` (${formatMoney(equalParts[equalParts.length - 1], trip.currency, locale)} ${t.expense.perPerson})`}
          </p>
        )}
      </div>

      {splitType === 'custom' && attendeeIds.length > 0 && (
        <div className="rounded-xl border border-border bg-sunken p-3.5">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm font-semibold text-ink">{t.expense.custom}</span>
            <span
              className={cx(
                'text-xs font-medium',
                difference === 0 ? 'text-good' : 'text-warn',
              )}
            >
              {difference === 0 ? (
                <span className="inline-flex items-center gap-1">
                  <IconCheck className="h-3.5 w-3.5" />
                  {t.expense.allocated}
                </span>
              ) : difference > 0 ? (
                `${t.expense.leftToAllocate}: ${formatMoney(difference, trip.currency, locale)}`
              ) : (
                `${t.expense.overAllocated}: ${formatMoney(-difference, trip.currency, locale)}`
              )}
            </span>
          </div>
          <div className="space-y-2">
            {attendeeIds.map((id) => {
              const person = trip.participants.find((candidate) => candidate.id === id);
              if (!person) return null;
              return (
                <div key={id} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm">{person.name}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step={currencyStep(trip.currency)}
                    className={input(false, 'w-32 bg-surface')}
                    value={customAmounts[id] ?? ''}
                    aria-label={`${t.expense.amount} — ${person.name}`}
                    onChange={(event) =>
                      setCustomAmounts((current) => ({ ...current, [id]: event.target.value }))
                    }
                  />
                </div>
              );
            })}
          </div>
          {errors.splits ? (
            <p className="field-error" role="alert">
              {errors.splits}
            </p>
          ) : (
            <p className="field-hint">{t.expense.customHint}</p>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button variant="secondary" onClick={onCancel}>
          {t.common.cancel}
        </Button>
        <Button type="submit">{expense ? t.common.save : t.common.add}</Button>
      </div>
    </form>
  );
}
