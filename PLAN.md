# PLAN.md — AI-Assisted Incident Log + Auto-Summary

## 🎯 Goal

Personal tool to log operational incidents quickly, then use Gemini API to auto-generate
weekly summary reports (for HQ) and build a searchable personal knowledge base.

## 🧱 Tech Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Prisma v7 (`@prisma/adapter-neon`; connection URL in `prisma.config.ts`)
- Neon PostgreSQL
- TanStack Query v5
- Bun (package manager)
- Google Gemini API (`gemini-3.6-flash`) for summarization — free tier
- Vercel (hosting + Cron Jobs for weekly auto-summary)

## ⚠️ Data Sensitivity Rule (read before building anything)

This tool may reference hospital/customer incidents. Never send real patient data,
hospital names, or identifying details to the Gemini free tier (data may be used for
model training). Always mask/anonymize sensitive fields before calling the AI —
use generic labels like "Site A", "Client B" instead of real names in any `description`
field that gets sent to the summarization prompt.

---



## Phase 1 — MVP: Core Logging (Week 1)

**Goal**: Be able to log an incident in under 30 seconds and see a list of past entries.

- [x] Scaffold Next.js 16 project (Bun, TypeScript, Tailwind v4, shadcn/ui)
- [x] Set up Prisma v7 with `@prisma/adapter-neon`
- [x] Connect Neon PostgreSQL and run the initial migration
- [x] Define `IncidentLog` model (see schema below)
- [x] Build Quick Log Entry form (title, severity, systemArea, description, tags)
- [x] Build Incident List page (table/cards, sorted by date, filter by severity)
- [ ] Deploy to Vercel (deferred by choice; ยังไม่ต้อง deploy on vercel)

**Exit criteria**: Can open the site on phone, log an incident in <30s, see it in the list.

---



## Phase 2 — AI Summarization (Week 2)

**Goal**: Generate a readable weekly report on demand.

- [x] Get Gemini API key (Google AI Studio, no credit card needed)
- [ ] Store `GEMINI_API_KEY` in Vercel env vars
- [x] Build `lib/gemini.ts` — wrapper function to call Gemini API
- [x] Write and iterate on summarization prompt (see prompt template below)
- [x] Build "Generate Summary" button → calls server action → shows result
- [x] Store generated summaries in `WeeklySummary` model
- [x] Add manual review/edit step before "finalizing" a summary (never auto-send unreviewed AI output)

**Exit criteria**: Select a date range → get a draft report → edit if needed → save.

---



## Phase 3 — Automation + Knowledge Base (Week 3)

**Goal**: Reduce manual work further, make old incidents searchable.

- [ ] Add Vercel Cron Job — deferred; automation must not bypass anonymization review
- [x] Add notification (email or simple in-app banner) when draft is ready for review
- [x] Add full-text search on `IncidentLog` (Postgres `ILIKE` or `tsvector`, keep it simple)
- [x] Add filter by tag / systemArea / severity on the log list
- [x] Add simple dashboard: incidents per week, severity breakdown (Recharts)

**Exit criteria**: Tool runs mostly hands-off — you just log incidents; summaries appear automatically for review.

---



## Phase 4 — Production Hardening (Week 4, before relying on it daily)

- [ ] Add basic auth (deferred while the app remains local-only)
- [x] Add incident resolution workflow (root cause, resolution, resolve/reopen)
- [x] Add data export (CSV/JSON) — don't lock your own data in
- [x] Add error handling + loading states everywhere (no silent failures)
- [x] Add rate-limit awareness for Gemini free tier (bounded backoff for 429/503)
- [x] Write a short README for future-you (how to run, deploy, rotate API key)
- [ ] Backup strategy: Neon has point-in-time restore — confirm retention window is enough

**Exit criteria**: You'd trust this tool to hold a real record of your work without babysitting it.

---



## 📐 Data Model (Prisma)

```prisma
model IncidentLog {
  id          String    @id @default(cuid())
  title       String
  description String
  severity    Severity  @default(LOW)
  systemArea  String?
  resolved    Boolean   @default(false)
  rootCause   String?
  resolution  String?
  tags        String[]
  createdAt   DateTime  @default(now())
  resolvedAt  DateTime?
}

model WeeklySummary {
  id          String   @id @default(cuid())
  weekStart   DateTime
  weekEnd     DateTime
  summaryText String
  incidentIds String[]
  reviewed    Boolean  @default(false)
  createdAt   DateTime @default(now())
}

enum Severity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}
```



## 🧠 Gemini Prompt Template (starting point — iterate on this)

```
You are an assistant summarizing operations incident logs into a weekly report
for internal HQ reporting. Use professional, concise Thai or English (match input language).

Given these incident logs from the week of {weekStart} to {weekEnd}:
{incidents_json}

Write a report with these sections:
1. Overview (total incidents, severity breakdown)
2. Key incidents (root cause + resolution, most severe first)
3. Patterns noticed (recurring issues, if any)
4. Suggested proactive actions

Do not invent details not present in the logs. If root cause is missing, say "not yet determined".
```



## 🚀 Deployment Checklist (before first real production use)

- [ ] Env vars set on Vercel: `DATABASE_URL`, `GEMINI_API_KEY`
- [ ] Prisma migration run against Neon production branch
- [ ] Cron job schedule confirmed in `vercel.json`
- [ ] Manual smoke test: log entry → summary generation → search → export