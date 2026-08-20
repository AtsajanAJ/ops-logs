import type { GenerateSummaryInput } from "@/lib/summaries";

export function buildSummaryPrompt(input: GenerateSummaryInput): string {
  const incidents = input.incidents.map((incident) => {
    const base = {
      title: incident.title,
      description: incident.description,
      entryType: incident.entryType,
      systemArea: incident.systemArea,
      rootCause: incident.rootCause,
      resolution: incident.resolution,
      tags: incident.tags,
      createdAt: incident.createdAt,
    };

    if (incident.entryType === "SERVICE") {
      return base;
    }

    return { ...base, severity: incident.severity };
  });

  const incidentCount = input.incidents.filter(
    (entry) => entry.entryType === "INCIDENT",
  ).length;
  const serviceCount = input.incidents.filter(
    (entry) => entry.entryType === "SERVICE",
  ).length;

  return `You are an assistant summarizing operations log entries into a weekly report
for internal HQ reporting. Use professional, concise Thai or English and match the
language used by most entry descriptions.

The human operator reviewed and anonymized these ops log entries for
${input.weekStart} through ${input.weekEnd}
(${incidentCount} incidents, ${serviceCount} services):
${JSON.stringify(incidents, null, 2)}

Write a report with exactly these sections:
1. Overview (incident count with severity breakdown, plus service count)
2. Key incidents (INCIDENT entries only, most severe first; include only known facts)
3. Service work (SERVICE entries; summarize completed or logged work, or state that none are present)
4. Patterns noticed (recurring issues across entries, or state that none are evident)
5. Suggested proactive actions

Do not invent details. If a root cause or resolution is not provided, say
"not yet determined". Do not infer or restore redacted names or identifiers.
Do not treat SERVICE entries as outages or assign them a severity ranking.
Return only the report text, without a preamble or markdown code fence.`;
}
