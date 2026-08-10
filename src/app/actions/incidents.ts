"use server";

import { revalidatePath } from "next/cache";

import { getDb } from "@/lib/db";
import {
  incidentInputSchema,
  resolveIncidentSchema,
  type IncidentActionState,
  type IncidentFieldName,
  type IncidentLifecycleActionState,
} from "@/lib/incidents";

const fieldNames = [
  "title",
  "description",
  "severity",
  "systemArea",
  "tags",
] as const;

function formValue(formData: FormData, key: IncidentFieldName): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createIncident(
  _previousState: IncidentActionState,
  formData: FormData,
): Promise<IncidentActionState> {
  const parsed = incidentInputSchema.safeParse({
    title: formValue(formData, "title"),
    description: formValue(formData, "description"),
    severity: formValue(formData, "severity"),
    systemArea: formValue(formData, "systemArea"),
    tags: formValue(formData, "tags"),
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

  try {
    await getDb().incidentLog.create({
      data: parsed.data,
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
  if (typeof id !== "string" || !id) {
    return { status: "error", message: "The incident ID is invalid." };
  }

  try {
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
// Delete Incident Button
export async function deleteIncident(
  _previousState: IncidentLifecycleActionState,
  formData: FormData,
): Promise<IncidentLifecycleActionState> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { status: "error", message: "The incident ID is invalid." };
  }

  try {
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
