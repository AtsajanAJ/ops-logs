"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  GeminiConfigurationError,
  GeminiRateLimitError,
  GeminiResponseError,
  generateWeeklySummary,
} from "@/lib/gemini";
import { getDb } from "@/lib/db";
import {
  generateSummarySchema,
  toDateBounds,
  type SummaryActionState,
} from "@/lib/summaries";

const updateSummarySchema = z.object({
  id: z.string().min(1),
  summaryText: z
    .string()
    .trim()
    .min(1, "The report cannot be empty.")
    .max(20_000, "Keep the report under 20,000 characters."),
});

const summaryIdSchema = z.string().min(1);

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function generateSummaryDraft(
  _previousState: SummaryActionState,
  formData: FormData,
): Promise<SummaryActionState> {
  let incidents: unknown;

  try {
    incidents = JSON.parse(formString(formData, "incidents"));
  } catch {
    return {
      status: "error",
      message: "The anonymized preview is invalid. Prepare the report again.",
    };
  }

  const parsed = generateSummarySchema.safeParse({
    weekStart: formString(formData, "weekStart"),
    weekEnd: formString(formData, "weekEnd"),
    incidents,
    confirmedAnonymized:
      formString(formData, "confirmedAnonymized") === "true",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ??
        "Review the anonymized incidents before generating.",
    };
  }

  try {
    const incidentIds = [...new Set(parsed.data.incidents.map(({ id }) => id))];
    if (incidentIds.length !== parsed.data.incidents.length) {
      return {
        status: "error",
        message: "The preview contains duplicate incidents.",
      };
    }

    const bounds = toDateBounds(parsed.data);
    const existingIncidents = await getDb().incidentLog.findMany({
      where: {
        id: { in: incidentIds },
        createdAt: { gte: bounds.start, lte: bounds.end },
      },
      select: { id: true },
    });

    if (existingIncidents.length !== incidentIds.length) {
      return {
        status: "error",
        message: "One or more incidents no longer exist. Prepare the report again.",
      };
    }

    const summaryText = await generateWeeklySummary(parsed.data);
    const db = getDb();
    const existingDraft = await db.weeklySummary.findFirst({
      where: {
        weekStart: bounds.start,
        weekEnd: bounds.end,
        reviewed: false,
      },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    const summary = existingDraft
      ? await db.weeklySummary.update({
          where: { id: existingDraft.id },
          data: {
            summaryText,
            incidentIds,
            createdAt: new Date(),
          },
        })
      : await db.weeklySummary.create({
          data: {
            weekStart: bounds.start,
            weekEnd: bounds.end,
            summaryText,
            incidentIds,
            reviewed: false,
          },
        });

    revalidatePath("/summaries");
    return {
      status: "success",
      message: existingDraft
        ? "The active draft was regenerated. Review it before marking it complete."
        : "Draft report generated. Review it before marking it complete.",
      summaryId: summary.id,
    };
  } catch (error: unknown) {
    if (
      error instanceof GeminiConfigurationError ||
      error instanceof GeminiRateLimitError ||
      error instanceof GeminiResponseError
    ) {
      return { status: "error", message: error.message };
    }

    console.error("Failed to generate summary draft", error);
    return {
      status: "error",
      message: "The draft could not be generated or saved. Try again.",
    };
  }
}

export async function updateSummaryDraft(
  _previousState: SummaryActionState,
  formData: FormData,
): Promise<SummaryActionState> {
  const parsed = updateSummarySchema.safeParse({
    id: formString(formData, "id"),
    summaryText: formString(formData, "summaryText"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "The report is invalid.",
    };
  }

  try {
    const result = await getDb().weeklySummary.updateMany({
      where: { id: parsed.data.id, reviewed: false },
      data: { summaryText: parsed.data.summaryText },
    });

    if (result.count === 0) {
      return {
        status: "error",
        message: "Only draft reports can be edited.",
      };
    }

    revalidatePath("/summaries");
    return { status: "success", message: "Draft changes saved." };
  } catch (error: unknown) {
    console.error("Failed to update summary draft", error);
    return {
      status: "error",
      message: "The draft could not be saved. Try again.",
    };
  }
}

export async function markSummaryReviewed(
  _previousState: SummaryActionState,
  formData: FormData,
): Promise<SummaryActionState> {
  const parsedId = summaryIdSchema.safeParse(formString(formData, "id"));
  if (!parsedId.success) {
    return { status: "error", message: "The report ID is invalid." };
  }

  try {
    const result = await getDb().weeklySummary.updateMany({
      where: { id: parsedId.data, reviewed: false },
      data: { reviewed: true },
    });

    if (result.count === 0) {
      return {
        status: "error",
        message: "This report is already reviewed or no longer exists.",
      };
    }

    revalidatePath("/summaries");
    return {
      status: "success",
      message: "Report marked as reviewed.",
    };
  } catch (error: unknown) {
    console.error("Failed to mark summary reviewed", error);
    return {
      status: "error",
      message: "The report status could not be updated. Try again.",
    };
  }
}

export async function deleteSummaryDraft(
  _previousState: SummaryActionState,
  formData: FormData,
): Promise<SummaryActionState> {
  const parsedId = summaryIdSchema.safeParse(formString(formData, "id"));
  if (!parsedId.success) {
    return { status: "error", message: "The report ID is invalid." };
  }

  try {
    const result = await getDb().weeklySummary.deleteMany({
      where: { id: parsedId.data, reviewed: false },
    });

    if (result.count === 0) {
      return {
        status: "error",
        message: "Only draft reports can be deleted, or the report no longer exists.",
      };
    }

    revalidatePath("/summaries");
    return { status: "success", message: "Draft report deleted." };
  } catch (error: unknown) {
    console.error("Failed to delete summary draft", error);
    return {
      status: "error",
      message: "The draft could not be deleted. Try again.",
    };
  }
}
