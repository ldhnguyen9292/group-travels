# Home: share the app + getting-started guide — design

Date: 2026-11-17 · Size: small change

## Why

The owner wants to introduce the web app to other people, and found the app
hard to understand at first. Someone opening a shared link lands on an empty
Home page and needs to know where to start.

## Goals

- A share button on Home that sends the app's link to friends.
- A short getting-started guide on Home that a first-time visitor sees
  without hunting for it.
- A shared link that previews nicely in Zalo/Messenger.
- The Help page matches how the app works today.

## Non-goals

- Interactive tour that points at buttons on screen.
- Sharing trip data (that already exists on the trip page).

## Approaches

- **(a) "Get started in 4 steps" card on Home** — open by default when there
  are no trips, collapsed to one line once there are; links to Help.
  **Picked by the owner.**
- (b) Interactive tour — clearer, but slow to build and breaks when the UI changes.
- (c) Only a "Guide" link to the Help page — fastest, but newcomers still have to find it.

## Design

### Share button
- In the Home hero, next to "New trip": **"Giới thiệu cho bạn bè" / "Tell a friend"**.
- Uses the Web Share API (`nativeShare` in `src/hooks/useClipboard.ts`) with a
  title, one line of pitch and the site's root URL (`location.origin`).
- Without the Web Share API: copy the link to the clipboard and say "Link copied".

### Guide card
- Four numbered steps, each one short sentence:
  1. Create a trip and add the people coming.
  2. Add money in — what each person puts into the shared fund.
  3. Add expenses, or scan a receipt to split it item by item.
  4. See who gets money back and who owes, and share the results with the group.
- Open by default with no trips; collapsed to a one-line header once trips exist.
  Whether the visitor opened/closed it is remembered in localStorage (wrapped in
  try/catch; a convenience only).
- Footer link: "More help" → `/help`.
- EN + VN strings in the dictionary.

### Link preview (Open Graph)
- Add `og:title`, `og:description`, `og:image`, `og:url`, `og:type` and the
  Twitter card equivalents to `index.html`.
- Image: the existing `pwa-512x512.png` (square), as an absolute URL on the
  production domain `https://group-travels.onrender.com` — scrapers ignore
  relative image URLs.

### Help page
- Replace the outdated "paid with their own cash" answer (it describes a
  checkbox that no longer exists) with the current "Whose money was it?" choice.
- Add FAQ entries for scanning a receipt (needs a Gemini key on About) and the
  "By day" view.

## Builder's calls

- Exact styling of the card and the step icons follows the existing `card` /
  `puck` classes.
