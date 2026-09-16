# Hisaab — Ledger

*Every rupee, in its place.*

A private lending-ledger + household expense app, replacing a paper ledger.
Built as a mobile-first Progressive Web App (installable to a phone's home
screen) with a parchment/ink-green ledger aesthetic — ruled rows instead of
rounded cards, Fraunces for headers, IBM Plex Sans/Mono for body text and
numbers.

**Live app:** https://hisaab-ledger.vercel.app
*(⚠️ No login is implemented — anyone with this URL can read and write the
data. Don't share it publicly. See [Architecture](#architecture) below.)*

## What it does

- **Lending ledger** — track money lent out or borrowed, per person. A person
  can have multiple separate loans (never merged), each with its own
  principal, interest rate, and dates.
- **Interest reminders** — auto-computed monthly (outstanding × the loan's
  own rate), surfaced on Home and the Calendar. Never auto-charged — every
  actual payment's principal/interest split is entered by hand.
- **Overdue watchlist** — any loan past its promised return date, computed
  live, not stored.
- **Household expense book** — a fully separate credit/debit tracker with
  Day/Month/Year views, unrelated to the lending totals.
- **Duplicate-name handling** — adding a loan for a name that already exists
  prompts for a short nickname (e.g. "VK-30K") so multiple loans to the same
  person stay easy to tell apart, without merging their data.

## Architecture

```
┌─────────────────┐      ┌──────────────────────┐      ┌───────────────┐
│  React + Vite    │      │  Vercel serverless   │      │  Google Sheet │
│  PWA frontend    │─────▶│  API (api/sheets.ts) │─────▶│  (4 tabs)     │
│  (this repo)     │ fetch│  + a service account  │ Sheets API │  the database │
└─────────────────┘      └──────────────────────┘      └───────────────┘
```

- **Frontend:** React 19 + TypeScript + Vite, React Router, plain CSS (no UI
  framework — the ledger look is custom). `vite-plugin-pwa` makes it
  installable and works offline for the app shell.
- **Backend:** a single Vercel serverless function (`api/sheets.ts`) that
  reads/writes a Google Sheet via a service account (`googleapis`). No
  database of its own — the spreadsheet *is* the database, so it's always
  viewable/editable directly in Google Sheets too.
- **No authentication.** An earlier version tried Firebase Auth + Google
  Sign-In, then a Google Apps Script backend — both were dropped in favor of
  something that actually stayed working reliably for a two-person household
  app. The tradeoff is real: **this app has no access control.** Revisit this
  if it ever needs to be locked down.

### Why not Google Apps Script?

An earlier version used a script bound to the Sheet itself as the backend
(no separate hosting needed). It turned out Apps Script Web Apps have an
unreliable delivery layer — the script would execute correctly and fast
(confirmed via its own execution logs), but responses would still
intermittently fail to reach the browser. Moving the same logic to a small
Vercel function (which can set proper CORS headers, something Apps Script
cannot do at all) fixed this entirely. The old Apps Script code is kept in
[`apps-script/`](apps-script/) for reference but is no longer used.

## Project structure

```
src/                 — the React frontend
  pages/             — one file per screen (Home, People, LoanDetail, Book, …)
  components/        — shared UI pieces (Row, Modal, SegmentedControl, …)
  data/DataContext.tsx — the app's single data layer; swaps between mock
                          data and the real API based on whether
                          VITE_SHEETS_API_URL is set
  lib/derive.ts      — all the business math (outstanding balances, interest
                        due dates, overdue detection) as pure functions
api/                 — Vercel serverless functions (the backend)
  sheets.ts          — the single API endpoint, dispatches by `?action=`
  _lib/sheets.ts     — low-level Google Sheets read/write/update helpers
apps-script/         — legacy Apps Script backend (superseded, kept for reference)
```

## Data model

One Google Sheet, four tabs. See [SETUP.md](SETUP.md) for the exact header
row each tab needs.

| Tab | Purpose |
|---|---|
| `People` | Everyone you've lent to or borrowed from |
| `Loans` | Each individual loan — always linked to a person, never merged even when a person has several |
| `Payments` | Repayments against a loan — principal/interest split is always entered manually |
| `Transactions` | The separate household credit/debit book |

## Local development

```bash
npm install
npm run dev
```

Runs on mock/seed data by default — no setup required. To connect it to a
real Google Sheet (locally or to deploy your own copy), follow
[SETUP.md](SETUP.md).

## Deploying your own copy

See [SETUP.md](SETUP.md) for the full walkthrough: create a Google Cloud
service account, share your Sheet with it, and deploy `api/` + the built
frontend together to Vercel with `vercel --prod`.
