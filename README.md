# Ops Logs

A single-user operations ledger for capturing incidents quickly and turning them into
reviewable weekly reports. Phase 1 provides the incident entry and filtering workflow.

## Local setup

Requirements: Bun and a Neon PostgreSQL database.

```bash
cp .env.example .env
bun install
```

Replace `DATABASE_URL` in `.env` with the pooled connection string from Neon.
To generate weekly drafts, also add a `GEMINI_API_KEY` from Google AI Studio.
Then run:

```bash
bunx prisma migrate dev --name init
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

```bash
bun run dev
bun run lint
bun run test
bun run build
bunx prisma generate
```

Use Bun only; npm, Yarn, and pnpm lockfiles should not be added.

## Data safety

Incident data can contain sensitive customer context. Before Phase 2 sends any content
to Gemini, hospital names, patient identifiers, and client names must be anonymized.
AI summaries are drafts and are never finalized without human review.

The reports screen applies basic local pattern masking, then requires an editable
anonymization review before any incident text is sent to Gemini. Pattern masking
does not recognize every real name; the confirmation step is mandatory.

## Deploying

Set `DATABASE_URL` in the Vercel project, run the production Prisma migration against the
Neon branch, and deploy the Next.js application. Deployment remains a manual Phase 1 step.
