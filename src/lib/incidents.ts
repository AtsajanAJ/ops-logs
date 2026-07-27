import { z } from "zod";

export const severityValues = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export type SeverityValue = (typeof severityValues)[number];

export type IncidentFieldName =
  | "title"
  | "description"
  | "severity"
  | "systemArea"
  | "tags";

export interface IncidentActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors: Partial<Record<IncidentFieldName, string>>;
}

export interface IncidentLifecycleActionState {
  status: "idle" | "success" | "error";
  message: string;
}

export const initialIncidentActionState: IncidentActionState = {
  status: "idle",
  message: "",
  fieldErrors: {},
};

export const initialIncidentLifecycleState: IncidentLifecycleActionState = {
  status: "idle",
  message: "",
};

export const resolveIncidentSchema = z.object({
  id: z.string().min(1),
  rootCause: z
    .string()
    .trim()
    .max(2_000, "Keep the root cause under 2,000 characters.")
    .transform((value) => value || null),
  resolution: z
    .string()
    .trim()
    .min(1, "Describe how the incident was resolved.")
    .max(2_000, "Keep the resolution under 2,000 characters."),
});

export const incidentInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Add a short incident title.")
    .max(120, "Keep the title under 120 characters."),
  description: z
    .string()
    .trim()
    .min(1, "Describe what happened.")
    .max(2_000, "Keep the description under 2,000 characters."),
  severity: z.enum(severityValues, {
    error: "Choose a valid severity.",
  }),
  systemArea: z
    .string()
    .trim()
    .max(80, "Keep the system area under 80 characters.")
    .transform((value) => value || undefined),
  tags: z
    .string()
    .max(250, "Keep the tag list under 250 characters.")
    .transform(parseTags),
});

export const incidentFilterSchema = z
  .object({
    severity: z.enum(severityValues).optional(),
    start: z.iso.date().optional(),
    end: z.iso.date().optional(),
    query: z.string().trim().max(100).optional(),
    tag: z.string().trim().max(40).optional(),
    systemArea: z.string().trim().max(80).optional(),
  })
  .superRefine((filters, context) => {
    if (Boolean(filters.start) !== Boolean(filters.end)) {
      context.addIssue({
        code: "custom",
        message: "Start and end dates must be provided together.",
      });
    }

    if (filters.start && filters.end && filters.start > filters.end) {
      context.addIssue({
        code: "custom",
        message: "The end date must be on or after the start date.",
        path: ["end"],
      });
    }
  });

export interface IncidentView {
  id: string;
  title: string;
  description: string;
  severity: SeverityValue;
  systemArea: string | null;
  resolved: boolean;
  rootCause: string | null;
  resolution: string | null;
  tags: string[];
  createdAt: string;
  resolvedAt: string | null;
}

export interface IncidentFacets {
  tags: string[];
  systemAreas: string[];
}

export function parseTags(value: string): string[] {
  return [
    ...new Set(
      value
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
    ),
  ].slice(0, 8);
}
