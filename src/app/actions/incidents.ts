"use server";

import { revalidatePath } from "next/cache";

import { getDb } from "@/lib/db";
import {
  incidentInputSchema,
  type IncidentActionState,
  type IncidentFieldName,
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
