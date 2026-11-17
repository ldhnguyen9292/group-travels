import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ReceiptScanError,
  buildScanRequest,
  classifyHttpError,
  parseReceipt,
  readCandidateJson,
  scanReceipt,
} from './receiptAi';

const receipt = {
  isReceipt: true,
  merchant: 'Phở Thìn',
  date: '2026-11-17',
  currency: 'vnd',
  total: 165_000,
  items: [
    { name: 'Phở tái', quantity: 2, price: 120_000 },
    { name: 'Trà đá', quantity: 1, price: 10_000 },
    { name: 'Giảm giá', price: -5_000 },
    { name: 'Nothing', price: 0 },
  ],
  fees: [
    { label: 'Phí phục vụ', amount: 40_000 },
    { label: 'Zero', amount: 0 },
  ],
};

describe('parseReceipt', () => {
  const scan = parseReceipt(receipt, 'VND', 'Bill');

  it('reads the header fields, normalising the currency code', () => {
    expect(scan).toMatchObject({
      merchant: 'Phở Thìn',
      date: '2026-11-17',
      currency: 'VND',
      total: 165_000,
    });
  });

  it('keeps priced items, naming the quantity when there is more than one', () => {
    expect(scan.items).toEqual([
      { name: '2× Phở tái', price: 120_000 },
      { name: 'Trà đá', price: 10_000 },
    ]);
  });

  it('moves a negative item into the fees as a discount and drops zero lines', () => {
    expect(scan.fees).toEqual([
      { label: 'Giảm giá', amount: -5_000 },
      { label: 'Phí phục vụ', amount: 40_000 },
    ]);
  });

  it('rounds to the trip currency', () => {
    const usd = parseReceipt({ ...receipt, items: [{ name: 'Coffee', price: 3.456 }], fees: [] }, 'USD', 'Bill');
    expect(usd.items[0].price).toBe(3.46);
  });

  it('drops a date or currency it cannot trust', () => {
    const odd = parseReceipt({ ...receipt, date: '17/11/2026', currency: 'đồng' }, 'VND', 'Bill');
    expect(odd.date).toBeUndefined();
    expect(odd.currency).toBeUndefined();
  });

  it('turns a total-only receipt into one line for the whole bill', () => {
    const totalOnly = parseReceipt({ ...receipt, items: [], fees: [{ label: 'VAT', amount: 1 }] }, 'VND', 'Bill');
    expect(totalOnly.items).toEqual([{ name: 'Phở Thìn', price: 165_000 }]);
    expect(totalOnly.fees).toEqual([]);
  });

  it('refuses something that is not a receipt', () => {
    expect(() => parseReceipt({ isReceipt: false }, 'VND', 'Bill')).toThrow(ReceiptScanError);
    expect(() => parseReceipt({ isReceipt: true, items: [], total: 0 }, 'VND', 'Bill')).toThrow(
      ReceiptScanError,
    );
    expect(() => parseReceipt('nope', 'VND', 'Bill')).toThrow(ReceiptScanError);
  });
});

describe('classifyHttpError', () => {
  it('recognises a bad key, an exhausted quota and an overloaded service', () => {
    expect(
      classifyHttpError(400, { error: { status: 'INVALID_ARGUMENT', message: 'API key not valid.' } }),
    ).toBe('invalid-key');
    expect(classifyHttpError(403, null)).toBe('invalid-key');
    expect(classifyHttpError(429, null)).toBe('quota');
    expect(classifyHttpError(503, null)).toBe('busy');
    expect(classifyHttpError(400, { error: { message: 'Image too large' } })).toBe('unknown');
  });
});

describe('readCandidateJson', () => {
  it('parses the first candidate’s text', () => {
    const body = { candidates: [{ content: { parts: [{ text: '{"a":' }, { text: '1}' }] } }] };
    expect(readCandidateJson(body)).toEqual({ a: 1 });
  });

  it('treats a blocked or empty answer as unreadable', () => {
    expect(() => readCandidateJson({ candidates: [] })).toThrow(ReceiptScanError);
    expect(() => readCandidateJson({ promptFeedback: { blockReason: 'OTHER' } })).toThrow(
      ReceiptScanError,
    );
  });
});

describe('buildScanRequest', () => {
  it('sends the image inline and asks for JSON', () => {
    const request = buildScanRequest('abc', 'image/jpeg', 'VND');
    expect(request.contents[0].parts[0]).toEqual({ inlineData: { mimeType: 'image/jpeg', data: 'abc' } });
    expect(request.generationConfig.responseMimeType).toBe('application/json');
  });
});

describe('scanReceipt', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const options = {
    key: 'secret',
    imageBase64: 'abc',
    mimeType: 'image/jpeg',
    currency: 'VND' as const,
    fallbackItemName: 'Bill',
  };

  it('posts to Gemini with the key in a header, never in the URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(receipt) }] } }] }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const scan = await scanReceipt(options);

    expect(scan.merchant).toBe('Phở Thìn');
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(':generateContent');
    expect(url).not.toContain('secret');
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe('secret');
  });

  it('reports an exhausted quota', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 429 })));
    await expect(scanReceipt(options)).rejects.toMatchObject({ code: 'quota' });
  });

  it('reports a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(scanReceipt(options)).rejects.toMatchObject({ code: 'network' });
  });
});
