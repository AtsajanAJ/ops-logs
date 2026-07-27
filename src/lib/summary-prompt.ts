import type { GenerateSummaryInput } from "@/lib/summaries";

export function buildSummaryPrompt(input: GenerateSummaryInput): string {
  const incidents = input.incidents.map((incident) => ({
    title: incident.title,
    description: incident.description,
    severity: incident.severity,
    systemArea: incident.systemArea,
    tags: incident.tags,
    createdAt: incident.createdAt,
  }));

  return `You are an assistant summarizing operations incident logs into a weekly report
for internal HQ reporting. Use professional, concise Thai or English and match the
language used by most incident descriptions.

The human operator reviewed and anonymized these incident logs for
${input.weekStart} through ${input.weekEnd}:
${JSON.stringify(incidents, null, 2)}

Write a report with exactly these sections:
1. Overview (total incidents and severity breakdown)
2. Key incidents (most severe first; include only known facts)
3. Patterns noticed (recurring issues, or state that none are evident)
4. Suggested proactive actions

Do not invent details. If a root cause or resolution is not provided, say
"not yet determined". Do not infer or restore redacted names or identifiers.
Return only the report text, without a preamble or markdown code fence.`;
}
