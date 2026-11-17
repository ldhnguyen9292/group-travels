import type { CurrencyCode, ExpenseFee, ExpenseItem, ExpenseSplit, ID } from '../types/trip';
import { currencyDecimals, splitEvenly, toMinorUnits } from './money';

export interface ItemSplitResult {
  /** Items plus fees: what the expense is worth. */
  amount: number;
  itemsTotal: number;
  feesTotal: number;
  /** One per person carrying anything, in `memberOrder`. Adds up to `amount` exactly. */
  splits: ExpenseSplit[];
}

/**
 * Turn an itemised bill into per-person shares.
 *
 * Each item is shared evenly between the people it is assigned to. The fees —
 * tax, service, tip, and discounts as negative amounts — are summed and shared
 * evenly between everyone who has at least one item, so somebody who only
 * joined for a drink pays the same service charge as the rest of the table.
 *
 * Everything is done in minor units and every even split hands its leftover
 * đồng/cents out one by one (see `splitEvenly`), so the shares always add back
 * up to the bill exactly. People are ordered by `memberOrder`, which also
 * decides who receives those leftover units: the same people every time.
 */
export function computeItemSplits(
  items: ExpenseItem[],
  fees: ExpenseFee[],
  memberOrder: ID[],
  currency: CurrencyCode,
): ItemSplitResult {
  const factor = 10 ** currencyDecimals(currency);
  const rank = (id: ID) => {
    const index = memberOrder.indexOf(id);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  };
  const ordered = (ids: ID[]) => [...new Set(ids)].sort((a, b) => rank(a) - rank(b));

  const units = new Map<ID, number>();
  const add = (id: ID, value: number) => units.set(id, (units.get(id) ?? 0) + value);

  let itemUnits = 0;
  for (const item of items) {
    const price = toMinorUnits(item.price, currency);
    itemUnits += price;
    const people = ordered(item.participantIds);
    splitEvenly(item.price, people.length, currency).forEach((part, index) =>
      add(people[index], toMinorUnits(part, currency)),
    );
  }

  const feeUnits = fees.reduce((sum, fee) => sum + toMinorUnits(fee.amount, currency), 0);
  const diners = ordered([...units.keys()]);
  splitEvenly(feeUnits / factor, diners.length, currency).forEach((part, index) =>
    add(diners[index], toMinorUnits(part, currency)),
  );

  return {
    amount: (itemUnits + feeUnits) / factor,
    itemsTotal: itemUnits / factor,
    feesTotal: feeUnits / factor,
    splits: diners.map((participantId) => ({
      participantId,
      amount: (units.get(participantId) ?? 0) / factor,
    })),
  };
}
