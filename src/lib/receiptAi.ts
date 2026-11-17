import type { CurrencyCode, ExpenseFee } from '../types/trip';
import { MAX_AMOUNT, roundMoney } from './money';

/**
 * Receipt reading with Google's Gemini API, called straight from the browser.
 *
 * There is no server, so the key is the user's own: pasted on the About page,
 * kept in this browser's localStorage under its own name — not inside the trip
 * data, so it never ends up in an exported backup — and sent only to Google.
 */

/** A rolling alias, so the app keeps working as Google retires model versions. */
export const GEMINI_MODEL = 'gemini-flash-latest';

const API_ROOT = 'https://generativelanguage.googleapis.com/v1beta';

export const GEMINI_KEY_STORAGE = 'group-travel:gemini-key';

/** Fired on this tab when the key changes, so open screens can follow. */
export const GEMINI_KEY_EVENT = 'group-travel:gemini-key-changed';

export function loadGeminiKey(): string {
  try {
    return localStorage.getItem(GEMINI_KEY_STORAGE)?.trim() ?? '';
  } catch {
    return '';
  }
}

export function saveGeminiKey(key: string): boolean {
  try {
    const trimmed = key.trim();
    if (trimmed) localStorage.setItem(GEMINI_KEY_STORAGE, trimmed);
    else localStorage.removeItem(GEMINI_KEY_STORAGE);
    window.dispatchEvent(new Event(GEMINI_KEY_EVENT));
    return true;
  } catch {
    return false;
  }
}

export type ScanErrorCode =
  | 'invalid-key'
  | 'quota'
  | 'busy'
  | 'network'
  | 'not-receipt'
  | 'aborted'
  | 'unknown';

export class ReceiptScanError extends Error {
  readonly code: ScanErrorCode;
  constructor(code: ScanErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
    this.name = 'ReceiptScanError';
  }
}

export interface ScannedItem {
  name: string;
  price: number;
}

export interface ReceiptScan {
  merchant: string;
  /** yyyy-mm-dd, when the receipt prints one. */
  date?: string;
  /** ISO 4217 code, when the receipt shows which currency it is in. */
  currency?: string;
  /** The amount payable as printed, to check the items against. */
  total?: number;
  items: ScannedItem[];
  fees: ExpenseFee[];
}

const PROMPT = `You read photos of receipts and bills for a group-travel expense app. Many are Vietnamese.
Return JSON matching the schema:
- isReceipt: false if the photo is not a receipt or is too blurry to read; then leave everything else empty.
- merchant: the shop or restaurant name, short. Empty if not printed.
- date: the purchase date as yyyy-mm-dd, or empty if not printed.
- currency: the ISO 4217 code if the receipt shows its currency (₫, đ, VND → VND), else empty.
- items: every purchased line, in printed order. name as printed. quantity defaults to 1. price is the LINE total (unit price × quantity) as printed.
- fees: VAT/tax, service charge, tip, delivery, and discounts or vouchers as NEGATIVE amounts. Only add VAT if it is charged on top of the item prices, not when it is shown for information only.
- Never list subtotal, total, cash paid or change as items or fees.
- total: the final amount payable as printed, or 0 if not printed.
All amounts are plain numbers with no thousands separators. On Vietnamese receipts "." and "," usually separate thousands: "45.000" means 45000.`;

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    isReceipt: { type: 'BOOLEAN' },
    merchant: { type: 'STRING' },
    date: { type: 'STRING' },
    currency: { type: 'STRING' },
    total: { type: 'NUMBER' },
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          quantity: { type: 'NUMBER' },
          price: { type: 'NUMBER' },
        },
        required: ['name', 'price'],
      },
    },
    fees: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          label: { type: 'STRING' },
          amount: { type: 'NUMBER' },
        },
        required: ['label', 'amount'],
      },
    },
  },
  required: ['isReceipt', 'merchant', 'items', 'fees', 'total'],
};

export function buildScanRequest(imageBase64: string, mimeType: string, tripCurrency: CurrencyCode) {
  return {
    contents: [
      {
        parts: [
          { inlineData: { mimeType, data: imageBase64 } },
          { text: `${PROMPT}\nIf no currency is printed, assume ${tripCurrency}.` },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function number(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && Math.abs(parsed) <= MAX_AMOUNT ? parsed : null;
}

/**
 * The model's JSON, made safe to put in front of the user. Anything it got
 * structurally wrong is dropped rather than trusted: the review screen is there
 * for a person to fill the gaps.
 *
 * `fallbackItemName` names the single line used when the receipt only shows a
 * total, so the bill can still be assigned to people.
 */
export function parseReceipt(
  raw: unknown,
  currency: CurrencyCode,
  fallbackItemName: string,
): ReceiptScan {
  if (!isRecord(raw) || raw.isReceipt === false) throw new ReceiptScanError('not-receipt');

  const merchant = text(raw.merchant).slice(0, 120);
  const date = text(raw.date);
  const code = text(raw.currency).toUpperCase();
  const total = number(raw.total);

  const items: ScannedItem[] = [];
  const fees: ExpenseFee[] = [];
  for (const entry of Array.isArray(raw.items) ? raw.items : []) {
    if (!isRecord(entry)) continue;
    const price = number(entry.price);
    if (price === null || price === 0) continue;
    const quantity = number(entry.quantity);
    const name = text(entry.name) || '—';
    const label = quantity && quantity > 1 ? `${quantity}× ${name}` : name;
    // A negative "item" is a discount line the model filed in the wrong place.
    if (price < 0) fees.push({ label, amount: roundMoney(price, currency) });
    else items.push({ name: label, price: roundMoney(price, currency) });
  }
  for (const entry of Array.isArray(raw.fees) ? raw.fees : []) {
    if (!isRecord(entry)) continue;
    const amount = number(entry.amount);
    if (amount === null || amount === 0) continue;
    fees.push({ label: text(entry.label) || '—', amount: roundMoney(amount, currency) });
  }

  const printedTotal = total !== null && total > 0 ? roundMoney(total, currency) : undefined;
  if (items.length === 0) {
    if (printedTotal === undefined) throw new ReceiptScanError('not-receipt');
    // Only a total could be read: one line for the whole bill, fees already in it.
    items.push({ name: merchant || fallbackItemName, price: printedTotal });
    fees.length = 0;
  }

  return {
    merchant,
    date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined,
    currency: /^[A-Z]{3}$/.test(code) ? code : undefined,
    total: printedTotal,
    items,
    fees,
  };
}

/** What went wrong, from an HTTP status and Google's error body. */
export function classifyHttpError(status: number, body: unknown): ScanErrorCode {
  const error = isRecord(body) && isRecord(body.error) ? body.error : {};
  const message = `${text(error.status)} ${text(error.message)}`.toLowerCase();
  if (status === 401 || status === 403 || message.includes('api key')) return 'invalid-key';
  if (status === 429 || message.includes('resource_exhausted')) return 'quota';
  if (status >= 500) return 'busy';
  return 'unknown';
}

async function call(path: string, key: string, init: RequestInit): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${API_ROOT}/${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ReceiptScanError('aborted');
    }
    throw new ReceiptScanError('network');
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const code = classifyHttpError(response.status, body);
    throw new ReceiptScanError(code, `Gemini HTTP ${response.status}`);
  }
  return body;
}

/** The text of the first candidate, which `responseMimeType` makes a JSON document. */
export function readCandidateJson(body: unknown): unknown {
  const candidates = isRecord(body) && Array.isArray(body.candidates) ? body.candidates : [];
  const first: unknown = candidates[0];
  const content = isRecord(first) && isRecord(first.content) ? first.content : null;
  const parts = content && Array.isArray(content.parts) ? content.parts : [];
  const joined = parts.map((part) => (isRecord(part) ? text(part.text) : '')).join('');
  try {
    return JSON.parse(joined);
  } catch {
    throw new ReceiptScanError('not-receipt');
  }
}

export async function scanReceipt(options: {
  key: string;
  imageBase64: string;
  mimeType: string;
  currency: CurrencyCode;
  fallbackItemName: string;
  signal?: AbortSignal;
}): Promise<ReceiptScan> {
  const body = await call(`models/${GEMINI_MODEL}:generateContent`, options.key, {
    method: 'POST',
    body: JSON.stringify(buildScanRequest(options.imageBase64, options.mimeType, options.currency)),
    signal: options.signal,
  });
  return parseReceipt(readCandidateJson(body), options.currency, options.fallbackItemName);
}

/** Look the model up with the key: costs no generation quota, and fails the same way a scan would. */
export async function checkGeminiKey(key: string): Promise<void> {
  await call(`models/${GEMINI_MODEL}`, key, { method: 'GET' });
}
