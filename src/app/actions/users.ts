"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { Site, UserRole } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";
import { canManageUsers } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { siteValues, userRoleValues } from "@/lib/sites";

const updateUserAccessSchema = z
  .object({
    userId: z.string().min(1),
    role: z.enum(userRoleValues),
    homeSite: z.enum(siteValues).optional().nullable(),
  })
  .superRefine((value, context) => {
    if (value.role === "MEMBER" && !value.homeSite) {
      context.addIssue({
        code: "custom",
        message: "Members need a home site.",
        path: ["homeSite"],
      });
    }
  });

export type UpdateUserAccessState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const initialUpdateUserAccessState: UpdateUserAccessState = {
  status: "idle",
  message: "",
};

export async function updateUserAccess(
  _previousState: UpdateUserAccessState,
  formData: FormData,
): Promise<UpdateUserAccessState> {
  const actor = await getCurrentUser();
  if (!canManageUsers(actor)) {
    return {
      status: "error",
      message: "Only admins can manage user access.",
    };
  }

  const homeSiteRaw = formData.get("homeSite");
  const parsed = updateUserAccessSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
    homeSite:
      typeof homeSiteRaw === "string" && homeSiteRaw.length > 0
        ? homeSiteRaw
        : null,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid user access update.",
    };
  }

  if (parsed.data.userId === actor?.id && parsed.data.role !== "ADMIN") {
    return {
      status: "error",
      message: "You cannot remove your own admin role.",
    };
  }

  const role = parsed.data.role as UserRole;
  const homeSite =
    role === "MEMBER" ? (parsed.data.homeSite as Site) : null;

  try {
    await getDb().user.update({
      where: { id: parsed.data.userId },
      data: {
        role,
        homeSite,
      },
    });
    revalidatePath("/settings/users");
    revalidatePath("/settings");
    return { status: "success", message: "User access updated." };
  } catch (error: unknown) {
    console.error("Failed to update user access", error);
    return {
      status: "error",
      message: "Could not update user access. Try again.",
    };
  }
}
