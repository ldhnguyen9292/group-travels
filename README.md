# Group Travel

A small, offline-first web app for tracking who paid what on a group trip and working out
who owes whom at the end. No account, no server, no ads. Available in English and
Vietnamese, with light and dark themes.

## How the money works

Each trip has one **shared fund**:

- **Money in** (`Contribution`) — cash a member hands to the fund.
- **Expense** — money the group spends, split between the members it was for
  (equally, or with custom amounts). It also records who physically paid.
- **Balance** — `paid in − their share of the spending`.
  Positive means the fund owes them money back, negative means they still owe.

The nets always add up to what is left in the fund, which is asserted in
`src/lib/balances.test.ts`.

When someone pays with their own cash instead of the fund, tick *"Count this as money
the payer put in"* on the expense form — that writes the expense and their contribution
in one step.

## Where the data lives

Everything is kept in `localStorage` under the single key `group-travel:v2`, on the
user's own device. Nothing is uploaded and nothing is shared. The About page has
**Export backup** / **Restore backup** (a JSON file the user keeps) and **Delete all
data**.

Data from the earlier version (per-trip `expenses<id>` / `contributions<id>` keys) is
migrated on first load; those trips lived on a remote endpoint, so a local trip is
rebuilt from the member names found in the records and the legacy keys are then removed.

## Scripts

```bash
npm run dev        # dev server
npm run build      # type-check + production build
npm run preview    # serve the production build
npm run lint       # eslint
npm test           # vitest (pure logic: money, dates, balances, storage)
```

## Layout

```
src/
  lib/           pure logic, no React: money maths, dates, balances, storage + migration
  types/trip.ts  the data model
  store/         one TripStoreProvider holds all trips/expenses/contributions and persists them
  i18n/          dictionary (en + vn) and the language context
  theme/         light/dark context, applied via data-theme on <html>
  components/ui/ design-system pieces: Button, Modal, Field, StatTile, Pagination…
  components/    feature pieces: forms, lists, header, footer
  pages/         Home, TripPage, Participants, ParticipantDetail, About, Help
  index.css      design tokens (@theme) + dark overrides + component classes
```

Rules worth keeping:

- Colours only ever come from the tokens in `index.css` — never a raw hex in a component.
- `lib/` stays free of React so it can be unit-tested directly.
- Amounts are rounded per currency (`VND` has no decimals) and split with
  `splitEvenly`, which hands out the leftover minor units so the parts always add
  back up to the total.
- Amounts are capped at `MAX_AMOUNT` (1e12). Above that, minor units approach
  `Number.MAX_SAFE_INTEGER` and splits stop being exact. Forms reject larger
  values; stored and imported data is clamped by `clampAmount`.
- Every amount on screen carries the `.money` class. `Intl` emits a
  non-breaking space before symbols like `₫` and digit groups offer no break
  point, so without `overflow-wrap: anywhere` a large amount spills out of its
  container instead of wrapping.

## Sharing results

`lib/summary.ts` builds a plain-text summary — whole trip, or one member's
statement — which `ShareDialog` shows for review before it goes anywhere. On a
phone the native share sheet (`navigator.share`) hands it to Zalo, Messenger,
SMS or email; elsewhere it is copied to the clipboard, and if that is blocked
the text is already selected for a manual copy.

Nothing is uploaded: the text only travels where the user pastes it. The
summary deliberately has no space-padded columns — chat apps render a
proportional font, so padding misaligns instead of tidying.

## Feedback

Bug reports and feature ideas go to the address in `src/lib/contact.ts`
(`repagtor@gmail.com`), surfaced by `FeedbackCard` on the Help and About pages and
by a link in the footer. The buttons pre-fill a subject and a short template;
the address is also shown as plain text, because `mailto:` does nothing on a
desktop with no mail client configured.
