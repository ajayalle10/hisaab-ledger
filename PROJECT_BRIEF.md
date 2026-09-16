# Hisaab — Project Brief

A private lending-ledger + household expense app, replacing a paper ledger. Two users: the son (building/maintaining it) and his dad (primary daily user). Mobile-first, works on any device.

Reference design (look, screens, and flow — build to match this): **https://claude.ai/artifact/BGHHHadYSiF2hb7soivXh1**

## 1. Core entities

**Person**
- name, contact (optional), notes

**Loan** — belongs to one Person. A person can have several Loans; they are never merged.
- person_id
- direction: given (he lent it) / taken (he borrowed it)
- principal amount
- date given
- interest_rate (per month — set individually per loan, since it varies loan to loan)
- promised_return_date (optional — not every loan has one)
- nickname (optional short label, e.g. "VK-30K") — see naming rule below
- status: active / closed
- notes (why, where, by whom)
- payment_mode of the original disbursement: Cash / PhonePe / Google Pay / Bank transfer / Other

**Payment** — belongs to one Loan
- date
- total amount received
- principal_portion, interest_portion — **manually split by the user**, not auto-calculated (he decides case by case how a payment applies)
- payment_mode
- notes

**Interest Reminder** — not a stored ledger entry. Auto-generated per active loan each month as a suggested amount (outstanding principal × that loan's rate), surfaced on the Home screen and Calendar. Becomes a real Payment only once he actually logs one.

**Transaction** — the separate household credit/debit book, unrelated to loans
- date, type (credit/debit), amount, category (Household, Clothing, Utilities, Interest income, Gift, Other), payment_mode, notes

**Watchlist / overdue list** — not stored. A computed view: any Loan whose promised_return_date has passed without being marked returned.

## 2. Key business rules

1. **Duplicate-name handling on new loans**: the check happens when **Save loan** is tapped, not while typing. If the entered name matches an existing Person, show a pop-up: tell the user how many loans that person already has, and require a short nickname for *this* loan before saving (e.g. Vijay Kumar → "VK-30K", "VK-80K"). The loan is still saved under the same Person — the nickname is just a display label. If the name doesn't match anyone, save straight through and create the Person automatically, no interruption.
2. **Interest is never auto-deducted.** Reminders are suggestions; every actual Payment's principal/interest split is entered by hand.
3. **Promise to repay is optional** on every loan.
4. **Every money-moving record** (Loan creation, Payment, Transaction) carries an optional free-text notes field plus a required payment_mode dropdown (Cash / PhonePe / Google Pay / Bank transfer / Other).
5. **Credit/debit book is fully separate** from the lending ledger — different data, different screen, never mixed into loan totals.

## 3. Screens (see reference mockup for exact layout/visual design)

- **Home** (app opens directly here — no login screen) — today's/this-week's reminders and overdue items, outstanding totals, quick actions (+ New loan, Log payment).
- **People** — list of all people with a running total per person; tap into a person.
- **Person detail** — that person's loans listed separately (nickname + date + rate + amount each), never merged.
- **Loan detail** — full loan facts, notes, payment history; action to log a payment.
- **Calendar** — month grid with dots on days with activity; agenda list of upcoming interest reminders and overdue promises below it.
- **Book (credit/debit)** — Day / Month / Year filter toggle; Day view defaults to today with prev/next arrows plus a tappable date picker to jump to any date; Month and Year views show rolled-up totals (Year shows a month-by-month breakdown). "+ Log expense" opens a short form (type, amount, date, category, payment mode, notes).
- **Add loan** — person name, direction, principal, date, rate, optional promise date, payment mode, notes; Save triggers the duplicate-name check (rule #1).
- **Log payment** — pick the loan, total amount, manual interest/principal split, date, payment mode, notes.

## 4. Design system

Pull the exact tokens from the reference mockup rather than reinventing them:
- Palette: parchment paper background, deep ink-green text, oxblood/maroon for money given out, forest green for money taken/received, brass/gold as the tertiary accent.
- Type: Fraunces (display/headers), IBM Plex Sans (UI/body), IBM Plex Mono (all numeric amounts, right-aligned/tabular).
- Layout motif: ruled horizontal lines between list rows (like a physical ledger page), not rounded SaaS-style cards.
- Bottom tab bar: Home / People / Calendar / Book.

## 5. Architecture — decided (revised)

- **Shape:** mobile-first, works on any device — a responsive web app / PWA rather than separate native builds.
- **Data storage:** a Google Sheet as the backing store, with a small Google Apps Script attached directly to that sheet acting as the API (see `apps-script/Code.gs` and `SETUP.md`). No separate backend hosting, no service account — the script runs as the sheet's owner and is deployed as a Web App URL that the frontend calls directly.
- **No login.** An earlier plan (custom OTP-by-email, then real Google Sign-In with a 2-email allowlist) was dropped after repeated setup friction — the app now opens straight to Home. This trades away access control: anyone with the Web App URL can read/write the data, mitigated only by that URL being long/unguessable. Revisit if this needs to be locked down later.

## 6. Sample data (for seeding/testing — matches the mockup)

People: Vijay Kumar (2 loans: ₹30,000 @ 2%/mo with a 3-month promise; ₹80,000 @ 1.5%/mo, no promise), Manoj Iyer (₹15,000 @ 3%/mo, promise overdue), Priya Nair (₹1,00,000 @ 2%/mo, pays interest reliably on the 25th via bank transfer), Asha Reddy (₹50,000 taken from her @ 1%/mo).
