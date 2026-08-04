import { describe, expect, it } from 'vitest';
import { MAX_AMOUNT } from './money';
import { normaliseAppData, parseImportedData } from './storage';

const validTrip = {
  id: 'trip-1',
  name: 'Da Nang',
  currency: 'VND',
  startDate: '2025-10-24',
  participants: [{ id: 'a', name: 'An' }],
  createdAt: '2025-10-01T00:00:00.000Z',
  updatedAt: '2025-10-01T00:00:00.000Z',
};

describe('normaliseAppData', () => {
  it('rejects anything that is not app data', () => {
    expect(normaliseAppData(null)).toBeNull();
    expect(normaliseAppData('nope')).toBeNull();
    expect(normaliseAppData({})).toBeNull();
    expect(normaliseAppData([])).toBeNull();
  });

  it('keeps valid data and defaults the missing bits', () => {
    const data = normaliseAppData({ trips: [validTrip] });
    expect(data?.trips).toHaveLength(1);
    expect(data?.trips[0].currency).toBe('VND');
    expect(data?.expenses).toEqual([]);
    expect(data?.contributions).toEqual([]);
  });

  it('drops trips without a name or id, and unknown currencies fall back', () => {
    const data = normaliseAppData({
      trips: [validTrip, { id: '', name: 'No id' }, { id: 'x', name: '' }, { id: 'y', name: 'Y', currency: 'XYZ' }],
    });
    expect(data?.trips.map((trip) => trip.id)).toEqual(['trip-1', 'y']);
    expect(data?.trips[1].currency).toBe('VND');
  });

  it('drops records that point at a trip which no longer exists', () => {
    const data = normaliseAppData({
      trips: [validTrip],
      expenses: [
        {
          id: 'e1',
          tripId: 'ghost',
          description: 'Orphan',
          amount: 10,
          paidById: 'a',
          splits: [],
          splitType: 'equal',
          date: '2025-10-24',
        },
      ],
      contributions: [
        { id: 'c1', tripId: 'trip-1', participantId: 'a', amount: 10, date: '2025-10-24' },
      ],
    });
    expect(data?.expenses).toEqual([]);
    expect(data?.contributions).toHaveLength(1);
  });

  it('converts the legacy participant-object shape to ids', () => {
    const data = normaliseAppData({
      trips: [validTrip],
      expenses: [
        {
          id: 'e1',
          tripId: 'trip-1',
          description: 'Dinner',
          amount: 100,
          paidBy: { id: 'a', name: 'An' },
          splits: [{ participant: { id: 'a', name: 'An' }, amount: 100 }],
          splitType: 'equal',
          date: '2025-10-24T00:00:00.000Z',
        },
      ],
      contributions: [
        { id: 'c1', tripId: 'trip-1', participant: { id: 'a', name: 'An' }, amount: 50, date: '2025-10-24' },
      ],
    });
    expect(data?.expenses[0].paidById).toBe('a');
    expect(data?.expenses[0].splits).toEqual([{ participantId: 'a', amount: 100 }]);
    // Full timestamps are collapsed to a plain date so <input type="date"> accepts them.
    expect(data?.expenses[0].date).toBe('2025-10-24');
    expect(data?.contributions[0].participantId).toBe('a');
  });

  it('coerces bad amounts to a number instead of producing NaN', () => {
    const data = normaliseAppData({
      trips: [validTrip],
      contributions: [
        { id: 'c1', tripId: 'trip-1', participantId: 'a', amount: 'oops', date: '2025-10-24' },
      ],
    });
    expect(data?.contributions[0].amount).toBe(0);
  });

  it('clamps amounts too large to add up exactly', () => {
    const data = normaliseAppData({
      trips: [validTrip],
      contributions: [
        { id: 'c1', tripId: 'trip-1', participantId: 'a', amount: 1e21, date: '2025-10-24' },
        { id: 'c2', tripId: 'trip-1', participantId: 'a', amount: -50, date: '2025-10-24' },
      ],
      expenses: [
        {
          id: 'e1',
          tripId: 'trip-1',
          description: 'Huge',
          amount: 1e30,
          paidById: 'a',
          splits: [{ participantId: 'a', amount: 1e30 }],
          splitType: 'equal',
          date: '2025-10-24',
        },
      ],
    });
    expect(data?.contributions[0].amount).toBe(MAX_AMOUNT);
    expect(data?.contributions[1].amount).toBe(0);
    expect(data?.expenses[0].amount).toBe(MAX_AMOUNT);
    expect(data?.expenses[0].splits[0].amount).toBe(MAX_AMOUNT);
  });
});

describe('parseImportedData', () => {
  it('returns null for files that are not backups', () => {
    expect(parseImportedData('not json')).toBeNull();
    expect(parseImportedData('{"hello":1}')).toBeNull();
  });

  it('reads a backup this app wrote', () => {
    const backup = JSON.stringify({ version: 2, trips: [validTrip], expenses: [], contributions: [] });
    expect(parseImportedData(backup)?.trips).toHaveLength(1);
  });
});
