# Home Share Button + Getting-Started Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let people share the app's link from Home, show newcomers a 4-step guide on Home, make the link preview well in chat apps, and bring the Help page up to date.

**Architecture:** Two small pure helpers (guide open/closed default, app share payload) carry the logic and the tests; Home gains a `GuideCard` component and a share button that use them. Open Graph tags are static in `index.html`. All copy lives in `src/i18n/dictionary.ts` (EN + VN).

**Tech Stack:** React 19, TypeScript, Tailwind v4, Vitest (node environment — no DOM in tests).

**Spec:** `docs/superpowers/specs/2026-11-17-home-share-guide-design.md`

## Global Constraints

- Production URL: `https://group-travels.onrender.com` (Open Graph `og:url` and absolute `og:image`).
- Every user-visible string in both `en` and `vn` dictionaries; `vn` is typed as `Dictionary`, so a missing key fails `tsc -b`.
- localStorage access wrapped in try/catch; the guide must render correctly without it.
- Shared link is the site root, not the current page (a trip URL means nothing on another device).
- Checks that must pass before each commit: `npx tsc -b`, `npx eslint src`, `npx vitest run`.

## Review Focus

- localStorage unavailable (private mode): guide falls back to "open when no trips, closed otherwise" — covered by `initialGuideOpen(null, …)` tests in Task 1.
- Garbage in the stored value (`"maybe"`): treated as no preference — test in Task 1.
- Browser without Web Share API (desktop Firefox): button copies the link and says so — manual check in Task 2.
- User dismisses the share sheet: no error, no "copied" message — `shareLink` returns false on AbortError; manual check in Task 2.
- Visitor opens the shared link while it is a trip URL: payload always uses `origin` — test in Task 1.

---

### Task 1: Guide default and share payload helpers

**Files:**
- Create: `src/lib/homeGuide.ts`
- Test: `src/lib/homeGuide.test.ts`
- Modify: `src/hooks/useClipboard.ts` (add `shareLink`)

**Interfaces:**
- Produces:
  - `GUIDE_STORAGE_KEY = 'group-travel:guide-open'`
  - `initialGuideOpen(stored: string | null, hasTrips: boolean): boolean`
  - `loadGuidePreference(): string | null` and `saveGuidePreference(open: boolean): void` (try/catch around localStorage)
  - `buildAppShare(t: Dictionary, origin: string): { title: string; text: string; url: string }`
  - `shareLink(title: string, text: string, url: string): Promise<boolean>` in `useClipboard.ts` — `navigator.share({ title, text, url })`, false when unavailable or dismissed.

- [ ] **Step 1: Write the failing tests** in `src/lib/homeGuide.test.ts`:
  - `initialGuideOpen(null, false)` → `true`; `initialGuideOpen(null, true)` → `false`
  - `initialGuideOpen('1', true)` → `true`; `initialGuideOpen('0', false)` → `false`
  - `initialGuideOpen('maybe', true)` → `false` (garbage = no preference)
  - `buildAppShare(DICTIONARIES.vn, 'https://group-travels.onrender.com')` → `url === 'https://group-travels.onrender.com/'`, `title === DICTIONARIES.vn.app.name`, `text` contains `DICTIONARIES.vn.homeGuide.sharePitch`
  - `buildAppShare(DICTIONARIES.en, 'https://x.test/')` → `url === 'https://x.test/'` (no double slash)
- [ ] **Step 2: Run** `npx vitest run src/lib/homeGuide.test.ts` — Expected: FAIL (module not found).
- [ ] **Step 3: Implement** `src/lib/homeGuide.ts` and `shareLink`; add the `homeGuide` dictionary section (EN + VN) with at least `sharePitch` — the rest of the section lands in Task 2.
- [ ] **Step 4: Run** `npx vitest run src/lib/homeGuide.test.ts` — Expected: PASS.
- [ ] **Step 5: Commit** `feat: add home guide preference and app share helpers`.

### Task 2: Home page — share button and guide card

**Files:**
- Create: `src/components/GuideCard.tsx`
- Modify: `src/pages/Home/index.tsx`, `src/i18n/dictionary.ts` (`homeGuide` section)

**Interfaces:**
- Consumes: everything Task 1 produces.
- Produces: `GuideCard({ hasTrips }: { hasTrips: boolean })`.

Copy (exact, `homeGuide` section):

| key | en | vn |
|---|---|---|
| `shareApp` | Tell a friend | Giới thiệu cho bạn bè |
| `sharePitch` | Split group trip costs without a spreadsheet — no account needed. | Chia tiền chuyến đi nhóm không cần bảng tính, không cần tài khoản. |
| `linkCopied` | Link copied — paste it to your friends. | Đã sao chép link — dán gửi bạn bè nhé. |
| `title` | Get started in 4 steps | Bắt đầu trong 4 bước |
| `steps` (4) | Create a trip and add the people coming. / Add money in — what each person puts into the shared fund. / Add expenses, or scan a receipt to split it item by item. / See who gets money back and who owes, then share the results with the group. | Tạo chuyến đi và thêm những người tham gia. / Thêm tiền góp — số tiền mỗi người bỏ vào quỹ chung. / Thêm khoản chi, hoặc quét hoá đơn để chia theo từng món. / Xem ai dư ai thiếu, rồi chia sẻ kết quả cho cả nhóm. |
| `moreHelp` | More help | Xem thêm trợ giúp |
| `show` / `hide` | Show the guide / Hide the guide | Xem hướng dẫn / Ẩn hướng dẫn |

- [ ] **Step 1: Build `GuideCard`**: a `card` with a header button (`aria-expanded`, chevron, `title`) toggling a numbered list (`puck` numbers) and a `Link` to `/help`. Initial state `initialGuideOpen(loadGuidePreference(), hasTrips)`; every toggle calls `saveGuidePreference`.
- [ ] **Step 2: Home hero**: add a `secondary` button with `IconShare` + `t.homeGuide.shareApp` beside "New trip". On click: `shareLink(...buildAppShare(t, location.origin))`; if it returns false **and** `!canNativeShare()`, copy `url` with `useClipboard().copy` and show `linkCopied` in a `role="status"` line under the hero.
- [ ] **Step 3: Render `<GuideCard hasTrips={trips.length > 0} />`** between the hero and the trip grid / empty state.
- [ ] **Step 4: Verify** `npx tsc -b && npx eslint src && npx vitest run` — all pass; then in the browser at 400px width: guide open with no trips, collapsed with trips, state survives reload, share copies the link where Web Share is missing.
- [ ] **Step 5: Commit** `feat: add share button and getting-started guide to home`.

### Task 3: Link preview tags and Help page

**Files:**
- Modify: `index.html` (head), `src/i18n/dictionary.ts` (`help.faq` in EN + VN)

- [ ] **Step 1: Open Graph** — in `index.html` head add: `og:type=website`, `og:url=https://group-travels.onrender.com/`, `og:title=Group Travel — split trip costs`, `og:description` = existing meta description, `og:image=https://group-travels.onrender.com/pwa-512x512.png`, `og:image:width/height=512`, `twitter:card=summary`.
- [ ] **Step 2: Help FAQ** — replace the "Someone paid with their own cash" answer (both languages) with: pick them as the payer and choose "The payer's own" under "Whose money was it?"; the amount then counts as money they put in and shows in Money in as "fronted". Add two entries: scanning a receipt (needs a free Gemini API key saved on About; review items, tap who had each, Save) and the By day view (Expenses → By day; share a day or all days).
- [ ] **Step 3: Verify** `npx tsc -b && npx eslint src && npx vitest run && npm run build` — all pass; `grep -c 'og:' dist/index.html` ≥ 6.
- [ ] **Step 4: Commit** `feat: add link preview tags and refresh help FAQ`.
