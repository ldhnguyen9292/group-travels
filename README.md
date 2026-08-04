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

## Known placeholder

`src/pages/Help/index.tsx` still uses `developer@example.com` for the contact button.
Replace `CONTACT_EMAIL` with the real address.
