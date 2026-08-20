import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type { Site, UserRole } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import type { AuthUser } from "@/lib/permissions";

function toAuthUser(sessionUser: {
  id: string;
  email: string;
  name: string;
  role?: string | null;
  homeSite?: string | null;
}): AuthUser {
  return {
    id: sessionUser.id,
    email: sessionUser.email,
    name: sessionUser.name,
    role: (sessionUser.role as UserRole | undefined) ?? "VISITOR",
    homeSite: (sessionUser.homeSite as Site | null | undefined) ?? null,
  };
}

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getSession();
  if (!session?.user) return null;
  return toAuthUser(session.user);
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    redirect("/");
  }
  return user;
}
