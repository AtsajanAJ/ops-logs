import type { Site, UserRole } from "@/generated/prisma/client";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  homeSite: Site | null;
};

export function canReadIncidents(user: AuthUser | null | undefined): boolean {
  return Boolean(user);
}

export function canWriteIncident(
  user: AuthUser | null | undefined,
  site: Site,
): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  if (user.role === "MEMBER" && user.homeSite === site) return true;
  return false;
}

export function canManageUsers(user: AuthUser | null | undefined): boolean {
  return user?.role === "ADMIN";
}

/** Summaries / exports: MEMBER+ can mutate; VISITOR read-only. */
export function canMutateSummaries(user: AuthUser | null | undefined): boolean {
  return user?.role === "ADMIN" || user?.role === "MEMBER";
}

export function writableSitesFor(user: AuthUser): Site[] {
  if (user.role === "ADMIN") return ["BANGKOK", "PHUKET"];
  if (user.role === "MEMBER" && user.homeSite) return [user.homeSite];
  return [];
}
