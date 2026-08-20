import { z } from "zod";

import {
  severityMeta,
  severityValues,
  SUGGESTED_TAGS,
  SYSTEM_AREAS,
  type IncidentDraft,
} from "@/lib/incidents";

const incidentDraftResponseSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(2_000),
  severity: z.enum(severityValues),
  systemArea: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => v || undefined),
  tags: z
    .array(z.string().trim().min(1).max(40))
    .max(8)
    .default([]),
});

function severityGuide(): string {
  return severityValues
    .map((value) => {
      const meta = severityMeta[value];
      return `- ${value}: ${meta.label} — ${meta.description}`;
    })
    .join("\n");
}

export function buildIncidentDraftPrompt(notes: string): string {
  return `You are an operations logging assistant. The user describes an incident informally.
Your task: structure it into a proper incident log entry as JSON.

User notes (already anonymized — do NOT restore redacted names):
"""
${notes}
"""

Return ONLY a JSON object with these fields:
{
  "title": "concise title, max 120 chars",
  "description": "clear description of what happened, max 2000 chars",
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "systemArea": one of ${JSON.stringify(SYSTEM_AREAS)} (omit if unclear),
  "tags": ["lowercase tags", "max 8"]
}

Severity criteria (pick the best match):
${severityGuide()}

systemArea rules:
- Prefer exactly one value from the allowed list above.
- If nothing fits, use "Other".
- Never invent hospital/site names as systemArea.

tags rules:
- Prefer from this vocabulary when they fit: ${JSON.stringify(SUGGESTED_TAGS)}
- Tags describe symptom/failure mode (e.g. outage, timeout), not site names.
- Lowercase only. Max 8. Skip tags you are unsure about.

General rules:
- Match the language the user wrote in (Thai or English) for title and description.
- Use ONLY facts from the notes. Never invent details.
- If severity is unclear, default to MEDIUM.
- Use generic labels (Site A, Client B) — never real identifiers.
- Return valid JSON only, no markdown fences, no extra text.`;
}

export function parseIncidentDraftResponse(raw: string): IncidentDraft {
  const trimmed = raw
    .trim()
    .replace(/^```(?:json)?\s*/, "")
    .replace(/\s*```$/, "");

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error("Gemini returned invalid JSON. Try again.");
  }

  const result = incidentDraftResponseSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `Draft validation failed: ${result.error.issues[0]?.message ?? "invalid format"}`,
    );
  }

  return result.data;
}
