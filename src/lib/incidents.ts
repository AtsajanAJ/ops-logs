import { z } from "zod";

import { siteValues } from "@/lib/sites";

export const severityValues = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export type SeverityValue = (typeof severityValues)[number];

/** Shared severity labels + criteria. Keep enum values English for DB. */
export const severityMeta: Record<
  SeverityValue,
  { label: string; shortLabel: string; description: string }
> = {
  CRITICAL: {
    label: "Critical",
    shortLabel: "Crit",
    description: "System down / unusable",
  },
  HIGH: {
    label: "High",
    shortLabel: "High",
    description: "Core function broken / many users impacted",
  },
  MEDIUM: {
    label: "Medium",
    shortLabel: "Med",
    description: "Secondary function issue / workaround exists",
  },
  LOW: {
    label: "Low",
    shortLabel: "Low",
    description: "Display / cosmetic issue",
  },
};

export const severityLabels: Record<SeverityValue, string> = {
  CRITICAL: severityMeta.CRITICAL.label,
  HIGH: severityMeta.HIGH.label,
  MEDIUM: severityMeta.MEDIUM.label,
  LOW: severityMeta.LOW.label,
};

export const entryTypeValues = ["INCIDENT", "SERVICE"] as const;

export type EntryTypeValue = (typeof entryTypeValues)[number];

export const entryTypeLabels: Record<EntryTypeValue, string> = {
  INCIDENT: "Incident",
  SERVICE: "Service",
};

/**
 * Suggested vocabulary for systemArea.
 * Prefer one primary system from this list; custom short labels are allowed.
 */
export const SYSTEM_AREAS = [
  "Network",
  "VPN",
  "PACS",
  "HIS",
  "LIS",
  "Access",
  "Server",
  "Endpoint",
  "Printer",
  "Email",
  "Backup",
  "Other",
] as const;

export type SystemAreaValue = (typeof SYSTEM_AREAS)[number];

/**
 * Suggested tags (lowercase). Prefer these over inventing synonyms.
 * Pattern: symptom / failure-mode + optional context — not site names.
 */
export const SUGGESTED_TAGS = [
  "outage",
  "slow",
  "timeout",
  "error",
  "disconnect",
  "login",
  "permission",
  "config",
  "update",
  "hardware",
  "vendor",
  "workaround",
  "intermittent",
] as const;

export const MAX_INCIDENT_IMAGES = 3;

export type IncidentFieldName =
  | "title"
  | "description"
  | "severity"
  | "systemArea"
  | "site"
  | "entryType"
  | "tags"
  | "imageUrls";

function isCloudinaryImageUrl(value: string): boolean {
  try {
    const { protocol, hostname } = new URL(value);
    return (
      protocol === "https:" &&
      (hostname === "res.cloudinary.com" || hostname.endsWith(".cloudinary.com"))
    );
  } catch {
    return false;
  }
}

export function parseImageUrls(values: unknown): string[] {
  const raw = Array.isArray(values)
    ? values
    : typeof values === "string"
      ? [values]
      : [];

  return [
    ...new Set(
      raw
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ].slice(0, MAX_INCIDENT_IMAGES);
}

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

export const incidentInputSchema = z
  .object({
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
    severity: z.string().optional(),
    entryType: z.enum(entryTypeValues, {
      error: "Choose Incident or Service.",
    }),
    systemArea: z
      .string()
      .trim()
      .max(80, "Keep the system area under 80 characters.")
      .transform((value) => value || undefined),
    site: z.enum(siteValues, {
      error: "Choose a site.",
    }),
    tags: z
      .string()
      .max(250, "Keep the tag list under 250 characters.")
      .transform(parseTags),
    imageUrls: z
      .array(z.string())
      .max(MAX_INCIDENT_IMAGES, "Attach up to 3 images.")
      .default([])
      .transform(parseImageUrls)
      .superRefine((urls, context) => {
        for (const [index, url] of urls.entries()) {
          if (!isCloudinaryImageUrl(url)) {
            context.addIssue({
              code: "custom",
              message: "Only Cloudinary image URLs are allowed.",
              path: [index],
            });
          }
        }
      }),
  })
  .superRefine((data, context) => {
    if (data.entryType !== "INCIDENT") return;

    if (
      !data.severity ||
      !(severityValues as readonly string[]).includes(data.severity)
    ) {
      context.addIssue({
        code: "custom",
        message: "Choose a valid severity.",
        path: ["severity"],
      });
    }
  })
  .transform((data) => ({
    title: data.title,
    description: data.description,
    entryType: data.entryType,
    systemArea: data.systemArea,
    site: data.site,
    tags: data.tags,
    imageUrls: data.imageUrls,
    severity:
      data.entryType === "SERVICE"
        ? ("LOW" as const)
        : (data.severity as SeverityValue),
  }));

export const incidentFilterSchema = z
  .object({
    severity: z.enum(severityValues).optional(),
    site: z.enum(siteValues).optional(),
    entryType: z.enum(entryTypeValues).optional(),
    start: z.iso.date().optional(),
    end: z.iso.date().optional(),
    query: z.string().trim().max(100).optional(),
    tag: z.string().trim().max(40).optional(),
    systemArea: z.string().trim().max(80).optional(),
    cursor: z.string().trim().min(1).max(100).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
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
  entryType: EntryTypeValue;
  systemArea: string | null;
  site: (typeof siteValues)[number];
  resolved: boolean;
  rootCause: string | null;
  resolution: string | null;
  tags: string[];
  imageUrls: string[];
  createdAt: string;
  resolvedAt: string | null;
  /** Display name of the user who logged the entry; null for legacy rows. */
  createdByName: string | null;
}

export interface IncidentPage {
  items: IncidentView[];
  nextCursor: string | null;
}

export interface IncidentFacets {
  tags: string[];
  systemAreas: string[];
}

export const incidentDraftInputSchema = z.object({
  notes: z
    .string()
    .trim()
    .min(10, "Describe the problem in at least 10 characters.")
    .max(2_000, "Keep notes under 2,000 characters."),
  confirmedAnonymized: z.literal(true, {
    error: "Confirm you removed real identifiers before generating.",
  }),
});

export interface IncidentDraft {
  title: string;
  description: string;
  severity: SeverityValue;
  entryType?: EntryTypeValue;
  systemArea?: string;
  site?: (typeof siteValues)[number];
  tags: string[];
}

export interface IncidentDraftActionState {
  status: "idle" | "generating" | "success" | "error";
  message: string;
  draft?: IncidentDraft;
}

export const initialIncidentDraftState: IncidentDraftActionState = {
  status: "idle",
  message: "",
};

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
