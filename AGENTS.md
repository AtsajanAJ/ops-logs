# AGENTS.md

Context file for AI coding agents (Claude Code, Cursor, Codex CLI) working on this project.
Read this before making any changes.

## What this project is
A personal Operations tool: log incidents quickly, generate AI-summarized weekly reports
via Gemini API, and search past incidents as a personal knowledge base. Single-user.
Not a customer-facing product — optimize for "works reliably for one person", not scale.

## Stack (do not deviate without asking)
- Next.js 16, App Router only (no Pages Router)
- TypeScript strict mode
- Tailwind CSS v4 + shadcn/ui components
- Prisma v7 with `@prisma/adapter-neon` — `schema.prisma` declares only the PostgreSQL
  provider; the connection URL lives in `prisma.config.ts`
- Neon PostgreSQL
- TanStack Query v5 for client-side data fetching/caching
- Bun as package manager (`bun install`, `bun run dev`, never npm/yarn)
- Gemini API (`gemini-3.6-flash` model) for summarization — not Claude, not OpenAI

## Critical rules from prior experience (do not violate)
- **React 19 setState-in-useEffect rule**: never call `setState` inside a `useEffect` body
  directly or via a function that calls `setState` synchronously on mount. Always use the
  local async function + cancellation flag pattern:
  ```ts
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const data = await fetch(...);
      if (!cancelled) setState(data);
    }
    load();
    return () => { cancelled = true };
  }, [deps]);
  ```
- Never send real hospital names, patient identifiers, or client names to the Gemini API.
  Anonymize (`Site A`, `Client B`) before it enters any prompt. See PLAN.md "Data Sensitivity Rule".
- Gemini free tier has rate limits (RPM/RPD) — always handle 429 errors gracefully,
  never let a failed AI call crash the whole page.

## Workflow expectations
1. Before writing code for a new feature, check PLAN.md — work phase by phase, don't jump ahead.
2. When touching the Prisma schema, always run a migration, never hand-edit the DB.
3. Prefer server actions over API routes for simple mutations (log entry, mark resolved).
4. Keep the Quick Log Entry form fast — this is the one screen that must never feel slow,
   since the whole point of the tool is capturing incidents in under 30 seconds.
5. Every AI-generated summary must have a `reviewed: false` default — never auto-mark
   AI output as final without a human looking at it first.

## What NOT to do
- Don't add authentication complexity beyond a single-user gate (this isn't multi-tenant).
- Don't over-engineer the search — Postgres `ILIKE`/basic full-text is enough at this scale.
- Don't call Gemini API directly from client components — always through a server
  action or route handler, so the API key never reaches the browser.
- Don't add features not in PLAN.md without flagging it back to the user first.

## File/folder conventions
- `src/app/` — routes (App Router)
- `src/lib/gemini.ts` — Gemini API wrapper, single place all AI calls go through
- `src/lib/db.ts` — Prisma client singleton
- `src/components/` — shared UI (shadcn/ui based)
- `prisma/schema.prisma` + `prisma.config.ts` — DB schema/config