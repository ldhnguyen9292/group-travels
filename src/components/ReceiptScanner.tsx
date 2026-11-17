import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useGeminiKey } from '../hooks/useGeminiKey';
import { useOnline } from '../hooks/useOnline';
import { useI18n } from '../i18n/context';
import type { Dictionary } from '../i18n/dictionary';
import { normaliseDate, todayISO } from '../lib/date';
import { createId } from '../lib/id';
import { prepareReceiptImage } from '../lib/image';
import { computeItemSplits } from '../lib/itemSplit';
import {
  MAX_AMOUNT,
  currencyStep,
  formatMoney,
  readOptionalAmount,
  roundMoney,
  toMinorUnits,
} from '../lib/money';
import { nameOf, participantNames } from '../lib/participants';
import { ReceiptScanError, scanReceipt, type ReceiptScan, type ScanErrorCode } from '../lib/receiptAi';
import type { Expense, ExpenseDraft, ExpenseFee, ExpenseItem, ID, PaidFrom, Trip } from '../types/trip';
import Button from './ui/Button';
import Field from './ui/Field';
import { IconAlert, IconCheck, IconPlus, IconReceipt, IconRefresh, IconTrash, IconUpload } from './ui/Icons';
import { btn, cx, input } from './ui/classes';

export interface ReceiptScannerProps {
  trip: Trip;
  /** An itemised expense to edit. Without one, the screen starts at the camera. */
  expense?: Expense | null;
  onSubmit: (draft: ExpenseDraft) => void;
  onCancel: () => void;
  /** Editing only: drop the items and carry on in the ordinary expense form. */
  onUnitemise?: () => void;
}

type Stage =
  | { kind: 'pick' }
  | { kind: 'reading' }
  | { kind: 'error'; code: ScanErrorCode | 'image' }
  | { kind: 'review' };

/** Prices are typed, so they are kept as text until the moment they are added up. */
interface DraftItem {
  id: ID;
  name: string;
  price: string;
  participantIds: ID[];
}

interface DraftFee {
  id: ID;
  label: string;
  amount: string;
}

function emptyItem(): DraftItem {
  return { id: createId(), name: '', price: '', participantIds: [] };
}

/** A fee may be negative (a discount), unlike every other amount in the app. */
function readFee(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && Math.abs(parsed) <= MAX_AMOUNT ? parsed : null;
}

function errorMessage(code: ScanErrorCode | 'image', t: Dictionary): string {
  const messages: Partial<Record<ScanErrorCode | 'image', string>> = {
    'invalid-key': t.receipt.errorInvalidKey,
    quota: t.receipt.errorQuota,
    busy: t.receipt.errorBusy,
    network: t.receipt.errorNetwork,
    'not-receipt': t.receipt.errorNotReceipt,
    image: t.receipt.errorImage,
  };
  return messages[code] ?? t.receipt.errorUnknown;
}

function Notice({ tone, children }: { tone: 'warn' | 'bad'; children: ReactNode }) {
  return (
    <p
      role="status"
      className={cx(
        'flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-sm',
        tone === 'warn' ? 'border-warn bg-warn-soft text-warn' : 'border-bad bg-bad-soft text-bad',
      )}
    >
      <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export default function ReceiptScanner({
  trip,
  expense,
  onSubmit,
  onCancel,
  onUnitemise,
}: ReceiptScannerProps) {
  const { t, locale } = useI18n();
  const fieldId = useId();
  const key = useGeminiKey();
  const online = useOnline();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const memberIds = useMemo(() => trip.participants.map((person) => person.id), [trip.participants]);
  const names = useMemo(() => participantNames(trip), [trip]);
  const money = (value: number) => formatMoney(value, trip.currency, locale);

  const [stage, setStage] = useState<Stage>(expense ? { kind: 'review' } : { kind: 'pick' });
  const [lastFile, setLastFile] = useState<File | null>(null);

  const [description, setDescription] = useState(expense?.description ?? '');
  const [date, setDate] = useState(normaliseDate(expense?.date, todayISO()));
  const [paidById, setPaidById] = useState(expense?.paidById ?? '');
  const [paidFrom, setPaidFrom] = useState<PaidFrom>(expense?.paidFrom ?? 'own');
  const [items, setItems] = useState<DraftItem[]>(() =>
    (expense?.items ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      price: String(item.price),
      // Anyone since removed from the trip cannot be shown, so cannot stay assigned.
      participantIds: item.participantIds.filter((id) => memberIds.includes(id)),
    })),
  );
  const [fees, setFees] = useState<DraftFee[]>(() =>
    (expense?.fees ?? []).map((fee) => ({ id: createId(), label: fee.label, amount: String(fee.amount) })),
  );
  /** From the scan only: what the receipt says it adds up to, and in which currency. */
  const [printedTotal, setPrintedTotal] = useState<number | undefined>(undefined);
  const [receiptCurrency, setReceiptCurrency] = useState<string | undefined>(undefined);

  // Leaving mid-scan should not leave a request running, nor update a closed screen.
  useEffect(() => () => abortRef.current?.abort(), []);

  function applyScan(scan: ReceiptScan) {
    if (scan.merchant) setDescription(scan.merchant);
    if (scan.date) setDate(scan.date);
    setItems(scan.items.map((item) => ({ ...emptyItem(), name: item.name, price: String(item.price) })));
    setFees(scan.fees.map((fee) => ({ id: createId(), label: fee.label, amount: String(fee.amount) })));
    setPrintedTotal(scan.total);
    setReceiptCurrency(scan.currency);
  }

  async function runScan(file: File) {
    setLastFile(file);
    setStage({ kind: 'reading' });
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    let image: { base64: string; mimeType: string };
    try {
      image = await prepareReceiptImage(file);
    } catch {
      if (!controller.signal.aborted) setStage({ kind: 'error', code: 'image' });
      return;
    }

    try {
      const scan = await scanReceipt({
        key,
        imageBase64: image.base64,
        mimeType: image.mimeType,
        currency: trip.currency,
        fallbackItemName: t.receipt.wholeBill,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      applyScan(scan);
      setStage({ kind: 'review' });
    } catch (error) {
      if (controller.signal.aborted) return;
      const code = error instanceof ReceiptScanError ? error.code : 'unknown';
      setStage(code === 'aborted' ? { kind: 'pick' } : { kind: 'error', code });
    }
  }

  function stopScan() {
    abortRef.current?.abort();
    setStage({ kind: 'pick' });
  }

  function enterByHand() {
    if (items.length === 0) setItems([emptyItem()]);
    setStage({ kind: 'review' });
  }

  // --- The bill as it stands -------------------------------------------------

  const parsedItems = items.map((item) => ({ ...item, value: readOptionalAmount(item.price) }));
  const parsedFees = fees.map((fee) => ({ ...fee, value: readFee(fee.amount) }));
  const badItem = parsedItems.some((item) => !item.name.trim() || item.value === null || item.value <= 0);
  const badFee = parsedFees.some((fee) => fee.value === null);
  const unassigned = items.filter((item) => item.participantIds.length === 0).length;

  const finalItems: ExpenseItem[] = parsedItems.map((item) => ({
    id: item.id,
    name: item.name.trim(),
    price: roundMoney(item.value ?? 0, trip.currency),
    participantIds: memberIds.filter((id) => item.participantIds.includes(id)),
  }));
  const finalFees: ExpenseFee[] = parsedFees
    .filter((fee) => fee.value !== null && fee.value !== 0)
    .map((fee) => ({
      label: fee.label.trim() || t.receipt.fees,
      amount: roundMoney(fee.value ?? 0, trip.currency),
    }));
  const result = computeItemSplits(finalItems, finalFees, memberIds, trip.currency);
  const negativeShare = result.splits.some((split) => split.amount < 0);
  const mismatch =
    printedTotal !== undefined
      ? roundMoney(result.amount - printedTotal, trip.currency)
      : 0;

  const blockers = [
    !description.trim() && t.expense.errorDescription,
    !memberIds.includes(paidById) && t.expense.errorPaidBy,
    items.length === 0 && t.receipt.errorNoItems,
    badItem && t.receipt.errorItemPrice,
    unassigned > 0 &&
      (unassigned === 1 ? t.receipt.unassignedOne : t.receipt.unassignedOther).replace(
        '{n}',
        String(unassigned),
      ),
    !badItem && !badFee && unassigned === 0 && result.amount <= 0 && t.receipt.errorTotal,
    result.amount > MAX_AMOUNT &&
      `${t.common.amountTooLarge} ${formatMoney(MAX_AMOUNT, trip.currency, locale)}`,
    negativeShare && t.receipt.errorNegativeShare,
  ].filter((reason): reason is string => Boolean(reason));

  function save() {
    if (blockers.length > 0 || badFee) return;
    onSubmit({
      description: description.trim(),
      amount: result.amount,
      paidById,
      paidFrom,
      splits: result.splits,
      splitType: 'custom',
      date,
      items: finalItems,
      fees: finalFees.length > 0 ? finalFees : undefined,
    });
  }

  const updateItem = (id: ID, patch: Partial<DraftItem>) =>
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  const updateFee = (id: ID, patch: Partial<DraftFee>) =>
    setFees((current) => current.map((fee) => (fee.id === id ? { ...fee, ...patch } : fee)));

  function togglePerson(itemId: ID, personId: ID) {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== itemId) return item;
        const has = item.participantIds.includes(personId);
        return {
          ...item,
          participantIds: has
            ? item.participantIds.filter((id) => id !== personId)
            : [...item.participantIds, personId],
        };
      }),
    );
  }

  // --- Before there is a bill: camera, progress, failure ----------------------

  if (stage.kind !== 'review') {
    const canScan = Boolean(key) && online;
    return (
      <div className="space-y-4">
        <input
          ref={fileRef}
          type="file"
          // No `capture`: that would force the camera, and a photo already in
          // the gallery is just as common. Phones offer both from this.
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) void runScan(file);
          }}
        />

        {stage.kind === 'reading' ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center" role="status">
            <IconRefresh className="h-6 w-6 animate-spin text-brand" />
            <p className="text-sm text-ink-muted">{t.receipt.reading}</p>
            <Button variant="ghost" size="sm" onClick={stopScan}>
              {t.receipt.cancelReading}
            </Button>
          </div>
        ) : (
          <>
            {stage.kind === 'error' && <Notice tone="bad">{errorMessage(stage.code, t)}</Notice>}
            {!online && <Notice tone="warn">{t.receipt.offline}</Notice>}
            {online && !key && (
              <div className="space-y-2">
                <Notice tone="warn">{t.receipt.needKey}</Notice>
                <Link to="/about" className={btn('secondary', 'sm')}>
                  {t.receipt.openAbout}
                </Link>
              </div>
            )}
            {stage.kind === 'error' && stage.code === 'invalid-key' && key && (
              <Link to="/about" className={btn('secondary', 'sm')}>
                {t.receipt.openAbout}
              </Link>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              {stage.kind === 'error' && lastFile && canScan && (
                <Button onClick={() => void runScan(lastFile)}>
                  <IconRefresh className="h-4 w-4" />
                  {t.receipt.retry}
                </Button>
              )}
              <Button
                variant={stage.kind === 'error' && lastFile ? 'secondary' : 'primary'}
                onClick={() => fileRef.current?.click()}
                disabled={!canScan}
              >
                <IconUpload className="h-4 w-4" />
                {t.receipt.pickPhoto}
              </Button>
              <Button variant="secondary" onClick={enterByHand}>
                <IconPlus className="h-4 w-4" />
                {t.receipt.manual}
              </Button>
            </div>
            {canScan && <p className="text-xs text-ink-muted">{t.receipt.pickHint}</p>}
          </>
        )}

        <div className="flex justify-end border-t border-border pt-4">
          <Button variant="secondary" onClick={onCancel}>
            {t.common.cancel}
          </Button>
        </div>
      </div>
    );
  }

  // --- The bill: check what was read, then say who had what -------------------

  return (
    <div className="space-y-4">
      {receiptCurrency && receiptCurrency !== trip.currency && (
        <Notice tone="warn">
          {t.receipt.currencyMismatch
            .replace('{code}', receiptCurrency)
            .replaceAll('{trip}', trip.currency)}
        </Notice>
      )}

      <Field id={`${fieldId}-desc`} label={t.expense.description}>
        <input
          id={`${fieldId}-desc`}
          className={input()}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder={t.expense.descriptionPlaceholder}
          maxLength={120}
          autoComplete="off"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`${fieldId}-date`} label={t.expense.date}>
          <input
            id={`${fieldId}-date`}
            type="date"
            className={input()}
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </Field>
        <Field id={`${fieldId}-paid`} label={t.expense.paidBy}>
          <select
            id={`${fieldId}-paid`}
            className={input()}
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
      </div>

      <div role="group" aria-labelledby={`${fieldId}-paid-from-label`}>
        <span className="label" id={`${fieldId}-paid-from-label`}>
          {t.expense.paidFrom}
        </span>
        <div className="grid grid-cols-2 gap-2">
          {(['own', 'fund'] as PaidFrom[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setPaidFrom(option)}
              aria-pressed={paidFrom === option}
              className={cx(
                'rounded-control border px-3 py-2 text-sm font-medium transition-colors',
                paidFrom === option
                  ? 'border-brand-border bg-brand-soft text-brand'
                  : 'border-border bg-sunken text-ink-muted hover:text-ink',
              )}
            >
              {option === 'own' ? t.expense.paidFromOwn : t.expense.paidFromFund}
            </button>
          ))}
        </div>
      </div>

      <section aria-labelledby={`${fieldId}-items`} className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id={`${fieldId}-items`} className="label mb-0">
            {t.receipt.items}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setItems((current) => current.map((item) => ({ ...item, participantIds: memberIds })))
            }
            disabled={items.length === 0 || memberIds.length === 0}
          >
            {t.receipt.splitAll}
          </Button>
        </div>

        <ul className="space-y-2.5">
          {items.map((item, index) => (
            <li key={item.id} className="rounded-xl border border-border bg-sunken p-3">
              <div className="flex items-center gap-2">
                <input
                  className={input(false, 'min-w-0 flex-1 bg-surface')}
                  value={item.name}
                  onChange={(event) => updateItem(item.id, { name: event.target.value })}
                  placeholder={t.receipt.itemName}
                  aria-label={`${t.receipt.itemName} ${index + 1}`}
                  maxLength={120}
                />
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max={MAX_AMOUNT}
                  step={currencyStep(trip.currency)}
                  className={input(false, 'w-28 bg-surface sm:w-36')}
                  value={item.price}
                  onChange={(event) => updateItem(item.id, { price: event.target.value })}
                  placeholder="0"
                  aria-label={`${t.receipt.price} — ${item.name || index + 1}`}
                />
                <Button
                  variant="danger-ghost"
                  size="icon-sm"
                  onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
                  aria-label={t.receipt.removeItem}
                  title={t.receipt.removeItem}
                >
                  <IconTrash className="h-4 w-4" />
                </Button>
              </div>
              <div
                className="mt-2 flex flex-wrap gap-1.5"
                role="group"
                aria-label={`${t.receipt.whoHad} — ${item.name || index + 1}`}
              >
                {trip.participants.map((person) => {
                  const on = item.participantIds.includes(person.id);
                  return (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => togglePerson(item.id, person.id)}
                      aria-pressed={on}
                      className={cx(
                        'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                        on
                          ? 'border-brand-border bg-brand-soft text-brand'
                          : 'border-border bg-surface text-ink-muted hover:text-ink',
                      )}
                    >
                      {on && <IconCheck className="mr-1 inline h-3 w-3" />}
                      {person.name}
                    </button>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
        <Button variant="ghost" size="sm" onClick={() => setItems((current) => [...current, emptyItem()])}>
          <IconPlus className="h-4 w-4" />
          {t.receipt.addItem}
        </Button>
      </section>

      <section aria-labelledby={`${fieldId}-fees`} className="space-y-2">
        <h3 id={`${fieldId}-fees`} className="label mb-0">
          {t.receipt.fees}
        </h3>
        <p className="field-hint mt-0">{t.receipt.feesHint}</p>
        {fees.map((fee) => (
          <div key={fee.id} className="flex items-center gap-2">
            <input
              className={input(false, 'min-w-0 flex-1')}
              value={fee.label}
              onChange={(event) => updateFee(fee.id, { label: event.target.value })}
              placeholder={t.receipt.feePlaceholder}
              aria-label={t.receipt.feeLabel}
              maxLength={60}
            />
            <input
              type="number"
              inputMode="decimal"
              step={currencyStep(trip.currency)}
              className={input(readFee(fee.amount) === null, 'w-28 sm:w-36')}
              value={fee.amount}
              onChange={(event) => updateFee(fee.id, { amount: event.target.value })}
              placeholder="0"
              aria-label={`${t.expense.amount} — ${fee.label || t.receipt.feeLabel}`}
            />
            <Button
              variant="danger-ghost"
              size="icon-sm"
              onClick={() => setFees((current) => current.filter((entry) => entry.id !== fee.id))}
              aria-label={t.receipt.removeFee}
              title={t.receipt.removeFee}
            >
              <IconTrash className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setFees((current) => [...current, { id: createId(), label: '', amount: '' }])}
        >
          <IconPlus className="h-4 w-4" />
          {t.receipt.addFee}
        </Button>
      </section>

      <div className="space-y-1.5 rounded-xl border border-border p-3.5 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-ink-muted">{t.receipt.itemsTotal}</span>
          <span className="money">{money(result.itemsTotal)}</span>
        </div>
        {result.feesTotal !== 0 && (
          <div className="flex justify-between gap-3">
            <span className="text-ink-muted">{t.receipt.feesTotal}</span>
            <span className="money">{money(result.feesTotal)}</span>
          </div>
        )}
        <div className="flex justify-between gap-3 font-semibold">
          <span>{t.receipt.total}</span>
          <span className="money">{money(result.amount)}</span>
        </div>
        {printedTotal !== undefined && (
          <div className="flex justify-between gap-3 text-xs text-ink-muted">
            <span>{t.receipt.printedTotal}</span>
            <span className="money">{money(printedTotal)}</span>
          </div>
        )}

        {result.splits.length > 0 && (
          <div className="mt-2 border-t border-border pt-2">
            <p className="mb-1 text-xs font-semibold text-ink-muted">{t.receipt.perPerson}</p>
            <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
              {result.splits.map((split) => (
                <li key={split.participantId} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate">
                    {nameOf(names, split.participantId, t.common.unknown)}
                  </span>
                  <span className="money">{money(split.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {mismatch !== 0 && toMinorUnits(mismatch, trip.currency) !== 0 && (
        <Notice tone="warn">
          {t.receipt.mismatch.replace('{amount}', money(Math.abs(mismatch)))}
        </Notice>
      )}

      {blockers.length > 0 && (
        <ul className="space-y-0.5 text-xs text-ink-muted" aria-live="polite">
          {blockers.map((reason) => (
            <li key={reason}>• {reason}</li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
        <div>
          {onUnitemise && (
            <Button variant="ghost" onClick={onUnitemise}>
              {t.receipt.unitemise}
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onCancel}>
            {t.common.cancel}
          </Button>
          <Button onClick={save} disabled={blockers.length > 0 || badFee}>
            <IconReceipt className="h-4 w-4" />
            {expense ? t.common.save : t.common.add}
          </Button>
        </div>
      </div>
    </div>
  );
}
