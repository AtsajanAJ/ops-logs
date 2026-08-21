# Ops Logs

A team operations ledger for capturing incidents quickly and turning them into
reviewable weekly reports. It includes knowledge-base search, AI-assisted report drafts,
and an eight-week operational dashboard.

## Local setup

Requirements: Bun and a Neon PostgreSQL database.

```bash
cp .env.example .env
bun install
```

Replace `DATABASE_URL` in `.env` with the pooled connection string from Neon.
Set `BETTER_AUTH_SECRET` (e.g. `openssl rand -base64 32`), `BETTER_AUTH_URL=http://localhost:3000`,
and `ADMIN_EMAIL` to the email that should become Super Admin on first register.
Optional Google sign-in: set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from a Google Cloud
OAuth Web client. Authorized redirect URI must be
`{BETTER_AUTH_URL}/api/auth/callback/google` (local and production separately).
To generate weekly drafts, also add a `GEMINI_API_KEY` from Google AI Studio.
Then run:

```bash
bunx prisma migrate deploy
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) — you will be redirected to `/login`.
Register with `ADMIN_EMAIL` first, then promote teammates under Settings → User access.

- `/` — quick incident entry, search, and filters
- `/summaries` — anonymization review and weekly report drafts
- `/dashboard` — eight-week volume and severity trends
- `/settings` — exports, recovery guidance, and (admins) user access
- `/login`, `/register` — email/password and optional Google sign-in (new users start as Visitor)
## Commands

```bash
bun run dev
bun run lint
bun run test
bun run build
bunx prisma generate
bunx prisma migrate status
```

Use Bun only; npm, Yarn, and pnpm lockfiles should not be added.

## Daily workflow

1. Log an incident from `/`.
2. Search or filter the ledger when investigating recurring work.
3. Open **Resolve** to record the root cause and resolution. Reopen it if work resumes.
4. Prepare a weekly report from `/summaries`, review every AI-bound field, and confirm
   anonymization before generating.
5. Edit the draft, save changes, then mark it reviewed.
6. Use `/dashboard` to inspect the last eight weeks of volume and severity.

## Data safety

Incident data can contain sensitive customer context. Before Phase 2 sends any content
to Gemini, hospital names, patient identifiers, and client names must be anonymized.
AI summaries are drafts and are never finalized without human review.

The reports screen applies basic local pattern masking, then requires an editable
anonymization review before any incident text is sent to Gemini. Pattern masking
does not recognize every real name; the confirmation step is mandatory.

## Database changes

Never edit Neon tables manually. After changing `prisma/schema.prisma`, create and apply
a development migration:

```bash
bunx prisma migrate dev --name describe_the_change
bunx prisma generate
```

For an existing environment, apply committed migrations with `bunx prisma migrate deploy`.

## Export and recovery

The Settings page downloads an Excel-friendly incident CSV or a versioned JSON archive
containing incidents and weekly summaries. Both contain raw sensitive data and must be
stored securely. The JSON archive is a portable record, not an automated restore command.

Neon point-in-time restore retention varies by plan and project. Confirm the current
retention window in the Neon console. Keep periodic JSON exports if that window is not
enough for your recovery needs.

## Credential rotation

Update `DATABASE_URL` or `GEMINI_API_KEY` in `.env`, then restart `bun run dev`. Never
commit `.env`. After rotating the database URL, run `bunx prisma migrate status` before
using the app.

## Troubleshooting

- Database errors: verify `DATABASE_URL`, Neon availability, and `prisma migrate status`.
- Gemini 429/503: the app retries briefly, then asks you to wait before trying again.
- Gemini model errors: confirm `gemini-3.6-flash` is available to the API key.
- Empty reports: verify the selected date range includes incidents.
- Build failures: run `bun run lint`, `bun run test`, then `bun run build`.

## Deploying

Before exposing the app publicly, configure `DATABASE_URL`, `BETTER_AUTH_SECRET`,
`BETTER_AUTH_URL`, `ADMIN_EMAIL`, and `GEMINI_API_KEY` in Vercel (plus
`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` if using Google sign-in), then run production
migrations. Cron automation is still deferred and must never bypass the human
anonymization review.
