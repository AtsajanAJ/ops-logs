"use server";

import { revalidatePath } from "next/cache";

import {
  GeminiConfigurationError,
  GeminiRateLimitError,
  generateIncidentDraft,
} from "@/lib/gemini";
import { getDb } from "@/lib/db";
import {
  incidentDraftInputSchema,
  incidentInputSchema,
  parseImageUrls,
  resolveIncidentSchema,
  type IncidentActionState,
  type IncidentDraftActionState,
  type IncidentFieldName,
  type IncidentLifecycleActionState,
} from "@/lib/incidents";
import {
  canMutateSummaries,
  canWriteIncident,
} from "@/lib/permissions";
import type { Site } from "@/generated/prisma/client";
import { getCurrentUser } from "@/lib/session";
import { maskSensitiveText } from "@/lib/summaries";

const fieldNames = [
  "title",
  "description",
  "severity",
  "systemArea",
  "site",
  "entryType",
  "tags",
  "imageUrls",
] as const;

function formValue(formData: FormData, key: IncidentFieldName): string {
  if (key === "imageUrls") return "";
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function requireWritableSite(
  site: Site,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Sign in to continue." };
  }
  if (!canWriteIncident(user, site)) {
    return {
      ok: false,
      message:
        user.role === "VISITOR"
          ? "Visitors are read-only. Ask an admin to grant Member access."
          : "You can only modify incidents for your home site.",
    };
  }
  return { ok: true };
}

export async function createIncident(
  _previousState: IncidentActionState,
  formData: FormData,
): Promise<IncidentActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      status: "error",
      message: "Sign in to continue.",
      fieldErrors: {},
    };
  }

  const parsed = incidentInputSchema.safeParse({
    title: formValue(formData, "title"),
    description: formValue(formData, "description"),
    severity: formValue(formData, "severity"),
    entryType: formValue(formData, "entryType"),
    systemArea: formValue(formData, "systemArea"),
    site: formValue(formData, "site"),
    tags: formValue(formData, "tags"),
    imageUrls: parseImageUrls(formData.getAll("imageUrls")),
  });

  if (!parsed.success) {
    const flattened = parsed.error.flatten().fieldErrors;
    const fieldErrors: Partial<Record<IncidentFieldName, string>> = {};

    for (const field of fieldNames) {
      const message = flattened[field]?.[0];
      if (message) fieldErrors[field] = message;
    }

    return {
      status: "error",
      message: "Check the highlighted fields and try again.",
      fieldErrors,
    };
  }

  if (!canWriteIncident(user, parsed.data.site)) {
    return {
      status: "error",
      message:
        user.role === "VISITOR"
          ? "Visitors are read-only. Ask an admin to grant Member access."
          : "You can only log incidents for your home site.",
      fieldErrors: {},
    };
  }

  try {
    await getDb().incidentLog.create({
      data: {
        ...parsed.data,
        createdById: user.id,
      },
    });
    revalidatePath("/");

    return {
      status: "success",
      message: "Incident logged.",
      fieldErrors: {},
    };
  } catch (error: unknown) {
    console.error("Failed to create incident", error);

    return {
      status: "error",
      message:
        "The incident could not be saved. Check the database connection and try again.",
      fieldErrors: {},
    };
  }
}

export async function resolveIncident(
  _previousState: IncidentLifecycleActionState,
  formData: FormData,
): Promise<IncidentLifecycleActionState> {
  const parsed = resolveIncidentSchema.safeParse({
    id: formData.get("id"),
    rootCause: formData.get("rootCause"),
    resolution: formData.get("resolution"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ?? "Check the resolution details.",
    };
  }

  try {
    const existing = await getDb().incidentLog.findUnique({
      where: { id: parsed.data.id },
      select: { site: true },
    });
    if (!existing) {
      return { status: "error", message: "Incident not found." };
    }

    const access = await requireWritableSite(existing.site);
    if (!access.ok) {
      return { status: "error", message: access.message };
    }

    await getDb().incidentLog.update({
      where: { id: parsed.data.id },
      data: {
        rootCause: parsed.data.rootCause,
        resolution: parsed.data.resolution,
        resolved: true,
        resolvedAt: new Date(),
      },
    });
    revalidatePath("/");
    revalidatePath("/dashboard");
    return { status: "success", message: "Incident marked resolved." };
  } catch (error: unknown) {
    console.error("Failed to resolve incident", error);
    return {
      status: "error",
      message: "The incident could not be resolved. Try again.",
    };
  }
}

export async function reopenIncident(
  _previousState: IncidentLifecycleActionState,
  formData: FormData,
): Promise<IncidentLifecycleActionState> {
  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) {
    return { status: "error", message: "The incident ID is invalid." };
  }

  try {
    const existing = await getDb().incidentLog.findUnique({
      where: { id },
      select: { site: true },
    });
    if (!existing) {
      return { status: "error", message: "Incident not found." };
    }

    const access = await requireWritableSite(existing.site);
    if (!access.ok) {
      return { status: "error", message: access.message };
    }

    await getDb().incidentLog.update({
      where: { id },
      data: { resolved: false, resolvedAt: null },
    });
    revalidatePath("/");
    revalidatePath("/dashboard");
    return { status: "success", message: "Incident reopened." };
  } catch (error: unknown) {
    console.error("Failed to reopen incident", error);
    return {
      status: "error",
      message: "The incident could not be reopened. Try again.",
    };
  }
}

export async function draftIncidentFromNotes(
  _previousState: IncidentDraftActionState,
  formData: FormData,
): Promise<IncidentDraftActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { status: "error", message: "Sign in to continue." };
  }
  if (!canMutateSummaries(user)) {
    return {
      status: "error",
      message: "Visitors are read-only. Ask an admin to grant Member access.",
    };
  }

  const parsed = incidentDraftInputSchema.safeParse({
    notes: typeof formData.get("notes") === "string" ? formData.get("notes") : "",
    confirmedAnonymized:
      formData.get("confirmedAnonymized") === "true" ? true : false,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ?? "Check input and try again.",
    };
  }

  try {
    const maskedNotes = maskSensitiveText(parsed.data.notes);
    const draft = await generateIncidentDraft(maskedNotes);

    return {
      status: "success",
      message: "Draft generated. Review and edit before saving.",
      draft,
    };
  } catch (error: unknown) {
    if (error instanceof GeminiConfigurationError) {
      return { status: "error", message: error.message };
    }
    if (error instanceof GeminiRateLimitError) {
      return { status: "error", message: error.message };
    }
    const message =
      error instanceof Error ? error.message : "Draft generation failed.";
    return { status: "error", message };
  }
}

export async function deleteIncident(
  _previousState: IncidentLifecycleActionState,
  formData: FormData,
): Promise<IncidentLifecycleActionState> {
  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) {
    return { status: "error", message: "The incident ID is invalid." };
  }

  try {
    const existing = await getDb().incidentLog.findUnique({
      where: { id },
      select: { site: true },
    });
    if (!existing) {
      return { status: "error", message: "Incident not found." };
    }

    const access = await requireWritableSite(existing.site);
    if (!access.ok) {
      return { status: "error", message: access.message };
    }

    await getDb().incidentLog.delete({
      where: { id },
    });
    revalidatePath("/");
    revalidatePath("/dashboard");
    return { status: "success", message: "Incident deleted." };
  } catch (error: unknown) {
    console.error("Failed to delete incident", error);
    return {
      status: "error",
      message: "The incident could not be deleted. Try again.",
    };
  }
}
