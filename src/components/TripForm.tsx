import { useId, useMemo, useState, type FormEvent } from 'react';
import { useI18n } from '../i18n/context';
import { isBefore } from '../lib/date';
import { createId } from '../lib/id';
import { CURRENCIES, currencyLabel, defaultCurrencyForLang } from '../lib/money';
import type { CurrencyCode, ID, Participant, Trip, TripDraft } from '../types/trip';
import Button from './ui/Button';
import ErrorSummary from './ui/ErrorSummary';
import Field from './ui/Field';
import { IconPlus, IconTrash } from './ui/Icons';
import { input } from './ui/classes';
import { collectErrors } from './ui/formErrors';

export interface TripFormProps {
  trip?: Trip | null;
  /** Members with money logged: removing them would corrupt the totals. */
  lockedParticipantIds?: Set<ID>;
  onSubmit: (draft: TripDraft) => void;
  onCancel: () => void;
}

interface Errors {
  name?: string;
  dates?: string;
  participants?: string;
}

function sameName(a: string, b: string): boolean {
  return a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();
}

export default function TripForm({
  trip,
  lockedParticipantIds,
  onSubmit,
  onCancel,
}: TripFormProps) {
  const { t, lang, locale } = useI18n();
  const fieldId = useId();

  const [name, setName] = useState(trip?.name ?? '');
  const [currency, setCurrency] = useState<CurrencyCode>(
    trip?.currency ?? defaultCurrencyForLang(lang),
  );
  const [startDate, setStartDate] = useState(trip?.startDate ?? '');
  const [endDate, setEndDate] = useState(trip?.endDate ?? '');
  const [participants, setParticipants] = useState<Participant[]>(trip?.participants ?? []);
  const [draftNames, setDraftNames] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [submitCount, setSubmitCount] = useState(0);

  const membersId = `${fieldId}-members`;
  const membersErrorId = `${membersId}-error`;
  const membersHintId = `${membersId}-hint`;

  const errorList = collectErrors([
    [`${fieldId}-name`, errors.name],
    [`${fieldId}-end`, errors.dates],
    [membersId, errors.participants],
  ]);

  /** The language's own currency leads the list; names follow the reader's locale. */
  const currencyOptions = useMemo(() => {
    const home = defaultCurrencyForLang(lang);
    const ordered = [home, ...CURRENCIES.filter((code) => code !== home)];
    return ordered.map((code) => ({ code, label: currencyLabel(code, locale) }));
  }, [lang, locale]);

  function addFromInput() {
    const names = draftNames
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    if (names.length === 0) return;

    const added: Participant[] = [];
    let duplicate = false;
    for (const candidate of names) {
      const exists =
        participants.some((person) => sameName(person.name, candidate)) ||
        added.some((person) => sameName(person.name, candidate));
      if (exists) {
        duplicate = true;
        continue;
      }
      added.push({ id: createId(), name: candidate });
    }

    if (added.length > 0) setParticipants((current) => [...current, ...added]);
    setDraftNames('');
    setErrors((current) => ({
      ...current,
      participants: duplicate && added.length === 0 ? t.tripForm.duplicate : undefined,
    }));
  }

  function renameParticipant(id: ID, value: string) {
    setParticipants((current) =>
      current.map((person) => (person.id === id ? { ...person, name: value } : person)),
    );
  }

  function removeParticipant(id: ID) {
    setParticipants((current) => current.filter((person) => person.id !== id));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const cleaned = participants.map((person) => ({ ...person, name: person.name.trim() }));
    const next: Errors = {};

    if (!name.trim()) next.name = t.tripForm.errorName;
    if (cleaned.length === 0 || cleaned.some((person) => !person.name)) {
      next.participants = t.tripForm.errorMembers;
    } else if (
      cleaned.some((person, index) =>
        cleaned.some((other, otherIndex) => otherIndex !== index && sameName(person.name, other.name)),
      )
    ) {
      next.participants = t.tripForm.duplicate;
    }
    if (startDate && endDate && isBefore(endDate, startDate)) next.dates = t.tripForm.errorDateOrder;

    setErrors(next);
    if (Object.values(next).some(Boolean)) {
      setSubmitCount((count) => count + 1);
      return;
    }

    onSubmit({
      name: name.trim(),
      currency,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      participants: cleaned,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <ErrorSummary errors={errorList} submitCount={submitCount} />

      <Field id={`${fieldId}-name`} label={t.tripForm.name} error={errors.name}>
        <input
          id={`${fieldId}-name`}
          className={input(Boolean(errors.name))}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t.tripForm.namePlaceholder}
          maxLength={80}
          autoComplete="off"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          id={`${fieldId}-currency`}
          label={t.tripForm.currency}
          hint={trip && currency !== trip.currency ? t.tripForm.currencyChangeHint : undefined}
        >
          <select
            id={`${fieldId}-currency`}
            className={input()}
            value={currency}
            onChange={(event) => setCurrency(event.target.value as CurrencyCode)}
          >
            {currencyOptions.map(({ code, label }) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field id={`${fieldId}-start`} label={t.tripForm.startDate}>
          <input
            id={`${fieldId}-start`}
            type="date"
            className={input()}
            value={startDate}
            max={endDate || undefined}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </Field>
        <Field id={`${fieldId}-end`} label={t.tripForm.endDate} error={errors.dates}>
          <input
            id={`${fieldId}-end`}
            type="date"
            className={input(Boolean(errors.dates))}
            value={endDate}
            min={startDate || undefined}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </Field>
      </div>

      <div>
        <label className="label" htmlFor={membersId}>
          {t.tripForm.members}
        </label>
        <div className="flex gap-2">
          <input
            id={membersId}
            className={input(Boolean(errors.participants))}
            aria-invalid={errors.participants ? true : undefined}
            aria-describedby={errors.participants ? membersErrorId : membersHintId}
            value={draftNames}
            placeholder={t.tripForm.membersPlaceholder}
            autoComplete="off"
            onChange={(event) => setDraftNames(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addFromInput();
              }
            }}
          />
          <Button variant="soft" onClick={addFromInput} disabled={!draftNames.trim()}>
            <IconPlus className="h-4 w-4" />
            {t.common.add}
          </Button>
        </div>
        {errors.participants ? (
          <p className="field-error" id={membersErrorId} role="alert">
            {errors.participants}
          </p>
        ) : (
          <p className="field-hint" id={membersHintId}>
            {t.tripForm.membersHint}
          </p>
        )}

        {participants.length > 0 && (
          <ul className="mt-3 space-y-2">
            {participants.map((person, index) => {
              const locked = lockedParticipantIds?.has(person.id) ?? false;
              return (
                <li key={person.id} className="flex items-center gap-2">
                  <input
                    className={input(!person.name.trim())}
                    value={person.name}
                    aria-invalid={!person.name.trim() || undefined}
                    aria-label={`${t.tripForm.members} ${index + 1}`}
                    maxLength={60}
                    onChange={(event) => renameParticipant(person.id, event.target.value)}
                  />
                  <Button
                    variant="danger-ghost"
                    size="icon"
                    onClick={() => removeParticipant(person.id)}
                    disabled={locked}
                    title={locked ? t.tripForm.locked : t.common.remove}
                    aria-label={`${t.common.remove} ${person.name}`}
                  >
                    <IconTrash className="h-4 w-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button variant="secondary" onClick={onCancel}>
          {t.common.cancel}
        </Button>
        <Button type="submit">{trip ? t.tripForm.save : t.tripForm.create}</Button>
      </div>
    </form>
  );
}
