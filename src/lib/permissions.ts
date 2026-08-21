import type { Site, UserRole } from "@/generated/prisma/client";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  homeSite: Site | null;
};

export type ManagedUserTarget = {
  id: string;
  role: UserRole;
  homeSite: Site | null;
};

const ALL_SITES: Site[] = ["BANGKOK", "PHUKET"];

export function isSuperAdmin(user: AuthUser | null | undefined): boolean {
  return user?.role === "SUPER_ADMIN";
}

export function isSiteAdmin(user: AuthUser | null | undefined): boolean {
  return user?.role === "ADMIN" && Boolean(user.homeSite);
}

/** SUPER_ADMIN or site ADMIN — can open user-access settings. */
export function canManageUsers(user: AuthUser | null | undefined): boolean {
  return isSuperAdmin(user) || isSiteAdmin(user);
}

export function canReadIncidents(user: AuthUser | null | undefined): boolean {
  return Boolean(user);
}

export function canWriteIncident(
  user: AuthUser | null | undefined,
  site: Site,
): boolean {
  if (!user) return false;
  if (user.role === "SUPER_ADMIN") return true;
  if (
    (user.role === "ADMIN" || user.role === "MEMBER") &&
    user.homeSite === site
  ) {
    return true;
  }
  return false;
}

/** Summaries / exports: MEMBER+ can mutate; VISITOR read-only. */
export function canMutateSummaries(user: AuthUser | null | undefined): boolean {
  return (
    user?.role === "SUPER_ADMIN" ||
    user?.role === "ADMIN" ||
    user?.role === "MEMBER"
  );
}

export function writableSitesFor(user: AuthUser): Site[] {
  if (user.role === "SUPER_ADMIN") return [...ALL_SITES];
  if (
    (user.role === "ADMIN" || user.role === "MEMBER") &&
    user.homeSite
  ) {
    return [user.homeSite];
  }
  return [];
}

/** Whether actor may change this target user's access at all. */
export function canManageUserTarget(
  actor: AuthUser,
  target: ManagedUserTarget,
): boolean {
  if (!canManageUsers(actor)) return false;
  if (isSuperAdmin(actor)) return true;

  // Site admin: visitors (no home site) or users already on the same site.
  if (target.role === "SUPER_ADMIN") return false;
  if (target.role === "VISITOR") return true;
  return target.homeSite === actor.homeSite;
}

export function assignableRolesFor(actor: AuthUser): UserRole[] {
  if (isSuperAdmin(actor)) {
    return ["VISITOR", "MEMBER", "ADMIN", "SUPER_ADMIN"];
  }
  if (isSiteAdmin(actor)) {
    return ["VISITOR", "MEMBER", "ADMIN"];
  }
  return [];
}

export function assignableHomeSitesFor(actor: AuthUser): Site[] {
  if (isSuperAdmin(actor)) return [...ALL_SITES];
  if (isSiteAdmin(actor) && actor.homeSite) return [actor.homeSite];
  return [];
}

export function homeSiteForRole(
  role: UserRole,
  requested: Site | null | undefined,
): Site | null {
  if (role === "SUPER_ADMIN" || role === "VISITOR") return null;
  return requested ?? null;
}

/**
 * Validate a proposed role/homeSite assignment by actor against target.
 * Returns an error message, or null when allowed.
 */
export function validateUserAccessUpdate(
  actor: AuthUser,
  target: ManagedUserTarget,
  nextRole: UserRole,
  nextHomeSite: Site | null,
): string | null {
  if (!canManageUserTarget(actor, target)) {
    return "You cannot manage this user.";
  }

  if (!assignableRolesFor(actor).includes(nextRole)) {
    return "You cannot assign that role.";
  }

  if (target.id === actor.id) {
    if (nextRole !== "SUPER_ADMIN" && nextRole !== "ADMIN") {
      return "You cannot remove your own admin role.";
    }
  }

  if (nextRole === "MEMBER" || nextRole === "ADMIN") {
    if (!nextHomeSite) {
      return nextRole === "ADMIN"
        ? "Site admins need a home site."
        : "Members need a home site.";
    }
    if (
      isSiteAdmin(actor) &&
      actor.homeSite &&
      nextHomeSite !== actor.homeSite
    ) {
      return "You can only assign your own home site.";
    }
  }

  if (
    (nextRole === "SUPER_ADMIN" || nextRole === "VISITOR") &&
    nextHomeSite
  ) {
    return "That role cannot have a home site.";
  }

  return null;
}
