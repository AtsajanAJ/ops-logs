"use client";

import { authClient } from "@/lib/auth-client";
import type { AuthUser } from "@/lib/permissions";
import type { Site, UserRole } from "@/generated/prisma/client";

export function useCurrentAuthUser(): {
  user: AuthUser | null;
  isPending: boolean;
} {
  const { data, isPending } = authClient.useSession();

  if (!data?.user) {
    return { user: null, isPending };
  }

  return {
    user: {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      role: (data.user.role as UserRole | undefined) ?? "VISITOR",
      homeSite: (data.user.homeSite as Site | null | undefined) ?? null,
    },
    isPending,
  };
}
