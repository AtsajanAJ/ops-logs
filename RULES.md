# RULES.md — Coding Conventions

## TypeScript
- Strict mode always on. No `any` unless truly unavoidable — prefer `unknown` + narrowing.
- Explicit return types on all exported functions.

## React / Next.js
- App Router only. Server Components by default; add `"use client"` only when needed
  (forms, interactivity, hooks).
- No `setState` inside `useEffect` bodies (React 19 forbids it) — use the async-function
  + cancellation-flag pattern documented in AGENTS.md.
- Prefer Server Actions for mutations (create incident, mark resolved, generate summary)
  over client-side `fetch` to API routes, unless the action needs to be called from a
  non-form context.

## Data fetching
- TanStack Query v5 for any client-side reads that need caching/refetch (e.g. incident list
  with filters). Server Components handle the initial/static reads.
- Query keys: `["incidents", filters]`, `["summaries", weekRange]` — keep them descriptive
  and consistent.

## Prisma / Database
- `schema.prisma` declares the PostgreSQL datasource provider; the connection URL lives
  in `prisma.config.ts` and runtime connections use `@prisma/adapter-neon`.
- Every schema change goes through `bunx prisma migrate dev` — never edit the DB by hand.
- Use `cuid()` for IDs, not auto-increment integers.

## Styling
- Tailwind v4 utility classes. Use shadcn/ui components as the base — don't hand-roll
  a button/input/dialog if shadcn already has one.
- Keep the Quick Log Entry form visually minimal — this screen is used under time pressure.

## AI / Gemini integration
- All Gemini calls go through `lib/gemini.ts` — no direct `fetch` to the Gemini endpoint
  from anywhere else in the codebase.
- Never pass real names of hospitals, clients, or patients into a prompt. Redact/anonymize
  first (see AGENTS.md data sensitivity rule).
- Every AI-generated summary is saved with `reviewed: false` by default. The UI must make
  it obvious a summary is a draft until a human confirms it.
- Handle Gemini rate-limit errors (429) with a clear in-UI message — never a raw error page.

## Error handling
- No silent failures. Every `try/catch` around a network call (Gemini, Prisma, Vercel Cron)
  must surface something to the user or log it clearly.
- Loading states required on every async UI interaction — this is a tool used quickly
  and under pressure, a spinner-less freeze is confusing.

## Commits / workflow
- Small, working commits per phase step in PLAN.md, not one giant commit per phase.
- Update PLAN.md checkboxes as steps complete — keep it as the living source of truth
  for project status.

## Testing
- Vitest for core logic (summary formatting, tag filtering, date-range calculations).
- Don't over-invest in tests for this — it's a personal tool. Test the parts that would
  silently corrupt data or waste an AI call if broken.