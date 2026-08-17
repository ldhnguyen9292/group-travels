import { useId, useState, type FormEvent } from 'react';
import { useI18n } from '../i18n/context';
import { normaliseDate, todayISO } from '../lib/date';
import { MAX_AMOUNT, currencyStep, formatMoney, readAmount, roundMoney } from '../lib/money';
import type { Contribution, ContributionDraft, Trip } from '../types/trip';
import Button from './ui/Button';
import ErrorSummary from './ui/ErrorSummary';
import Field from './ui/Field';
import { input } from './ui/classes';
import { collectErrors } from './ui/formErrors';

export interface ContributionFormProps {
  trip: Trip;
  contribution?: Contribution | null;
  onSubmit: (draft: ContributionDraft) => void;
  onCancel: () => void;
}

interface Errors {
  participantId?: string;
  amount?: string;
  date?: string;
}

export default function ContributionForm({
  trip,
  contribution,
  onSubmit,
  onCancel,
}: ContributionFormProps) {
  const { t, locale } = useI18n();
  const fieldId = useId();

  const [participantId, setParticipantId] = useState(contribution?.participantId ?? '');
  const [amount, setAmount] = useState(contribution ? String(contribution.amount) : '');
  const [date, setDate] = useState(normaliseDate(contribution?.date, todayISO()));
  const [errors, setErrors] = useState<Errors>({});
  const [submitCount, setSubmitCount] = useState(0);

  const errorList = collectErrors([
    [`${fieldId}-member`, errors.participantId],
    [`${fieldId}-amount`, errors.amount],
    [`${fieldId}-date`, errors.date],
  ]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = readAmount(amount);
    const next: Errors = {};

    if (!trip.participants.some((person) => person.id === participantId)) {
      next.participantId = t.contribution.errorMember;
    }
    if (!parsed.ok) {
      next.amount =
        parsed.reason === 'too-large'
          ? `${t.common.amountTooLarge} ${formatMoney(MAX_AMOUNT, trip.currency, locale)}`
          : t.contribution.errorAmount;
    }
    if (!date) next.date = t.contribution.errorDate;

    setErrors(next);
    if (!parsed.ok || Object.values(next).some(Boolean)) {
      setSubmitCount((count) => count + 1);
      return;
    }

    onSubmit({ participantId, amount: roundMoney(parsed.value, trip.currency), date });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <ErrorSummary errors={errorList} submitCount={submitCount} />

      <Field
        id={`${fieldId}-member`}
        label={t.contribution.member}
        error={errors.participantId}
      >
        <select
          id={`${fieldId}-member`}
          className={input(Boolean(errors.participantId))}
          value={participantId}
          onChange={(event) => setParticipantId(event.target.value)}
        >
          <option value="">{t.contribution.selectMember}</option>
          {trip.participants.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id={`${fieldId}-amount`}
          label={`${t.contribution.amount} (${trip.currency})`}
          error={errors.amount}
        >
          <input
            id={`${fieldId}-amount`}
            type="number"
            inputMode="decimal"
            min="0"
            max={MAX_AMOUNT}
            step={currencyStep(trip.currency)}
            className={input(Boolean(errors.amount))}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0"
          />
        </Field>
        <Field id={`${fieldId}-date`} label={t.contribution.date} error={errors.date}>
          <input
            id={`${fieldId}-date`}
            type="date"
            className={input(Boolean(errors.date))}
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </Field>
      </div>

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button variant="secondary" onClick={onCancel}>
          {t.common.cancel}
        </Button>
        <Button type="submit">{contribution ? t.common.save : t.common.add}</Button>
      </div>
    </form>
  );
}
