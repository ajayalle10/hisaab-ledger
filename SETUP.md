# Hisaab — connecting your Google Sheet (Vercel backend)

Your spreadsheet itself doesn't change — same sheet, same 4 tabs, same data
already in it. What's changing is *how* the app talks to it: instead of a
script living inside the sheet (Apps Script, which turned out to have an
unreliable delivery layer), a small API is hosted on Vercel (free, and lets
us set proper CORS headers so requests never randomly fail the way Apps
Script's did).

## 1. Create a Google Cloud service account (lets the backend read/write your sheet)

This is separate from your Google *login* — it's a robot identity just for
the backend to use.

1. Go to [Google Cloud Console](https://console.cloud.google.com) and create
   a project (or reuse one) — any name.
2. **APIs & Services → Library** → search "Google Sheets API" → **Enable**.
3. **IAM & Admin → Service Accounts → Create service account** — any name
   (e.g. `hisaab-backend`). Skip the optional role/access steps.
4. Click into the new service account → **Keys** tab → **Add key → Create
   new key → JSON** → this downloads a `.json` file. Keep it — you'll paste
   its contents into Vercel in step 3.
5. Open that JSON file and copy the `client_email` value (looks like
   `hisaab-backend@your-project.iam.gserviceaccount.com`).
6. Open your Google Sheet → **Share** → paste that email → give it **Editor**
   access → Send/Share.

## 2. Deploy to Vercel

From this project's folder:

```bash
npx vercel login
```

This will ask for your email and send a verification link — click it, then
come back to the terminal.

```bash
npx vercel
```

Answer the prompts (defaults are fine — link to a new project, keep the
detected settings). This does a first deploy and gives you a URL like
`https://hisaab-xxxx.vercel.app`. **Copy that URL.**

## 3. Configure the backend secrets

In the [Vercel dashboard](https://vercel.com/dashboard), open your new
project → **Settings → Environment Variables**, and add:

- `SHEETS_SERVICE_ACCOUNT_KEY` — paste the **entire contents** of the JSON
  key file from step 1.
- `SPREADSHEET_ID` — the ID from your sheet's URL:
  `https://docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`.
- `VITE_SHEETS_API_URL` — `https://<your-vercel-url>/api/sheets` (use the URL
  from step 2, with `/api/sheets` on the end).

Apply all three to Production (and Preview/Development if you want).

## 4. Redeploy so the new settings take effect

```bash
npx vercel --prod
```

Vite bakes `VITE_SHEETS_API_URL` in at build time, so this redeploy is what
actually picks up the values you just set.

## 5. Point local dev at it too

Copy `.env.example` to `.env.local` and set:

```
VITE_SHEETS_API_URL=https://<your-vercel-url>/api/sheets
```

Restart `npm run dev` if it's running.

## 6. Verify

- Open the app (locally or the Vercel URL) — your existing People/Loans data
  (including "Test Person") should load.
- Add a loan or log an expense — check it appears in the actual spreadsheet.
- This should now be reliably fast and consistent — no more random "took too
  long to respond" errors, since Vercel doesn't have Apps Script's delivery
  quirk.
