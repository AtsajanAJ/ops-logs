import { z } from "zod";

import { entryTypeValues, severityValues, type IncidentView } from "@/lib/incidents";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const safeIncidentSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(2_000),
  severity: z.enum(severityValues),
  entryType: z.enum(entryTypeValues),
  systemArea: z.string().trim().max(80).nullable(),
  rootCause: z.string().trim().max(2_000).nullable(),
  resolution: z.string().trim().max(2_000).nullable(),
  tags: z.array(z.string().trim().min(1).max(40)).max(8),
  createdAt: z.iso.datetime(),
});

export type SafeIncident = z.infer<typeof safeIncidentSchema>;

export const summaryDateRangeSchema = z
  .object({
    weekStart: z.string().regex(datePattern, "Choose a valid start date."),
    weekEnd: z.string().regex(datePattern, "Choose a valid end date."),
  })
  .superRefine((range, context) => {
    const start = new Date(`${range.weekStart}T00:00:00.000Z`);
    const end = new Date(`${range.weekEnd}T23:59:59.999Z`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      context.addIssue({
        code: "custom",
        message: "Choose a valid date range.",
      });
      return;
    }

    if (start > end) {
      context.addIssue({
        code: "custom",
        message: "The end date must be on or after the start date.",
        path: ["weekEnd"],
      });
    }

    const rangeInDays = (end.getTime() - start.getTime()) / 86_400_000;
    if (rangeInDays > 31) {
      context.addIssue({
        code: "custom",
        message: "Keep one report range to 31 days or less.",
        path: ["weekEnd"],
      });
    }
  });

export const generateSummarySchema = summaryDateRangeSchema.and(
  z.object({
    incidents: z.array(safeIncidentSchema).min(1).max(100),
    confirmedAnonymized: z.literal(true),
  }),
);

export type GenerateSummaryInput = z.infer<typeof generateSummarySchema>;

export interface SummaryView {
  id: string;
  weekStart: string;
  weekEnd: string;
  summaryText: string;
  incidentIds: string[];
  reviewed: boolean;
  createdAt: string;
}

export interface SummaryActionState {
  status: "idle" | "success" | "error";
  message: string;
  summaryId?: string;
}

export const initialSummaryActionState: SummaryActionState = {
  status: "idle",
  message: "",
};

export function maskSensitiveText(value: string): string {
  return value
    .replace(
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
      "[REDACTED EMAIL]",
    )
    .replace(
      /\b(?:https?:\/\/|www\.)\S+\b/gi,
      "[REDACTED URL]",
    )
    .replace(
      /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g,
      "[REDACTED IP]",
    )
    .replace(
      /\b(patient|mrn|hn|client|case|ticket)\s*(?:id|no\.?|number)?\s*[:#-]?\s*[a-z0-9-]{4,}\b/gi,
      "$1 [REDACTED ID]",
    )
    .replace(
      /(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?){2,}\d{3,4}/g,
      "[REDACTED PHONE]",
    );
}

export function createSafeIncident(incident: IncidentView): SafeIncident {
  return {
    id: incident.id,
    title: maskSensitiveText(incident.title),
    description: maskSensitiveText(incident.description),
    severity: incident.severity,
    entryType: incident.entryType,
    systemArea: incident.systemArea
      ? maskSensitiveText(incident.systemArea)
      : null,
    rootCause: incident.rootCause
      ? maskSensitiveText(incident.rootCause)
      : null,
    resolution: incident.resolution
      ? maskSensitiveText(incident.resolution)
      : null,
    tags: incident.tags.map(maskSensitiveText),
    createdAt: incident.createdAt,
  };
}

export function toDateBounds(range: {
  weekStart: string;
  weekEnd: string;
}): { start: Date; end: Date } {
  return {
    start: new Date(`${range.weekStart}T00:00:00.000Z`),
    end: new Date(`${range.weekEnd}T23:59:59.999Z`),
  };
}

export function getCurrentWeekRange(reference = new Date()): {
  weekStart: string;
  weekEnd: string;
} {
  const day = reference.getUTCDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  const start = new Date(reference);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - daysSinceMonday);

  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);

  return {
    weekStart: start.toISOString().slice(0, 10),
    weekEnd: end.toISOString().slice(0, 10),
  };
}
