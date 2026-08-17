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

## Installing it, and working offline

The app is a PWA: `vite-plugin-pwa` generates `manifest.webmanifest` and a Workbox
service worker that precaches the whole build. Until that existed the app made no
network requests but still could not *start* without one — `render.yaml` serves
`index.html` with `Cache-Control: no-cache`, so with no signal the revalidation
failed and the browser showed its offline page. The service worker answers that
navigation instead, and `navigateFallback` points client-side routes like
`/trip/<id>` at the precached shell.

The same headers now cover `sw.js` and `registerSW.js`. A cached service worker
would pin users to an old precache list — the identical trap as a cached
`index.html`, one level down.

`AppPrompts` renders the two notices this needs, both bottom-anchored and
dismissible:

- **Install** — `usePWAInstall` captures Chromium's `beforeinstallprompt` and
  offers a one-tap install. WebKit has no such API at all, so on iOS the hook
  falls back to detecting the platform and showing where the *Share → Add to Home
  Screen* item lives. Dismissal is remembered under `install-prompt-dismissed`.
- **Update** — registration uses `registerType: 'prompt'`, so a new worker waits
  instead of reloading the page under someone mid-way through typing an expense.
  Without a visible "reload" affordance a waiting worker would never activate, so
  the two go together.

Icons in `public/` (`pwa-*.png`, `apple-touch-icon.png`) are generated from
`group-travel-logo.svg`. The maskable one scales the glyph to 62% so it survives
being cropped to a circle; `apple-touch-icon.png` is deliberately full-bleed,
because iOS composites it over black and applies its own corner radius.

Offline behaviour is verified in a real browser rather than assumed — load, cut
the network, reload, and deep-link to a client-side route.

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
  hooks/         useClipboard, usePagination, usePWAInstall
  components/ui/ design-system pieces: Button, Modal, Field, StatTile, Pagination…
  components/    feature pieces: forms, lists, header, footer, AppPrompts
  pages/         Home, TripPage, Participants, ParticipantDetail, About, Help
  index.css      design tokens (@theme) + dark overrides + component classes
```

Rules worth keeping:

- Colours only ever come from the tokens in `index.css` — never a raw hex in a component.
- Fonts stay on the system stack. A webfont from a CDN would put a network
  request on the critical path of an app whose whole point is starting without
  one; self-hosting is the only version of that worth doing.
- Control outlines use `--color-control-border` (≥3:1 against every surface, per
  WCAG 1.4.11). `--color-border` is for dividers and is deliberately fainter.
- Touch sizing lives in the `@media (pointer: coarse)` block, so the desktop UI
  keeps its compact proportions. Form fields go to 16px there: under that,
  Safari zooms the page on focus and an installed app cannot pinch back out.
- Anything pinned to a screen edge pays back `env(safe-area-inset-*)` — see the
  `.safe-*` helpers. `index.html` opts into `viewport-fit=cover`, so the notch
  and home indicator are the page's problem now.
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
