"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { Site, UserRole } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";
import {
  canManageUsers,
  homeSiteForRole,
  validateUserAccessUpdate,
} from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { siteValues, userRoleValues } from "@/lib/sites";
import type { UpdateUserAccessState } from "@/lib/user-access";

const updateUserAccessSchema = z
  .object({
    userId: z.string().min(1),
    role: z.enum(userRoleValues),
    homeSite: z.enum(siteValues).optional().nullable(),
  })
  .superRefine((value, context) => {
    if (
      (value.role === "MEMBER" || value.role === "ADMIN") &&
      !value.homeSite
    ) {
      context.addIssue({
        code: "custom",
        message:
          value.role === "ADMIN"
            ? "Site admins need a home site."
            : "Members need a home site.",
        path: ["homeSite"],
      });
    }
  });

export async function updateUserAccess(
  _previousState: UpdateUserAccessState,
  formData: FormData,
): Promise<UpdateUserAccessState> {
  const actor = await getCurrentUser();
  if (!actor || !canManageUsers(actor)) {
    return {
      status: "error",
      message: "Only admins can manage user access.",
    };
  }

  const homeSiteRaw = formData.get("homeSite");
  const homeSiteNormalized =
    typeof homeSiteRaw === "string" &&
    homeSiteRaw.length > 0 &&
    homeSiteRaw !== "__none__"
      ? homeSiteRaw
      : null;
  const parsed = updateUserAccessSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
    homeSite: homeSiteNormalized,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid user access update.",
    };
  }

  const role = parsed.data.role as UserRole;
  const homeSite = homeSiteForRole(
    role,
    parsed.data.homeSite as Site | null | undefined,
  );

  const target = await getDb().user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, role: true, homeSite: true },
  });

  if (!target) {
    return {
      status: "error",
      message: "User not found.",
    };
  }

  const validationError = validateUserAccessUpdate(
    actor,
    target,
    role,
    homeSite,
  );
  if (validationError) {
    return {
      status: "error",
      message: validationError,
    };
  }

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
    return { status: "success", message: "Access updated." };
  } catch (error: unknown) {
    console.error("Failed to update user access", error);
    return {
      status: "error",
      message: "Could not update user access. Try again.",
    };
  }
}
