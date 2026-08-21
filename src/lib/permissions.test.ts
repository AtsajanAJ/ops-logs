import { describe, expect, it } from "vitest";

import {
  assignableHomeSitesFor,
  assignableRolesFor,
  canManageUserTarget,
  canManageUsers,
  canMutateSummaries,
  canWriteIncident,
  homeSiteForRole,
  validateUserAccessUpdate,
  writableSitesFor,
  type AuthUser,
} from "./permissions";

const visitor: AuthUser = {
  id: "1",
  email: "v@example.com",
  name: "Visitor",
  role: "VISITOR",
  homeSite: null,
};

const memberPhuket: AuthUser = {
  id: "2",
  email: "m@example.com",
  name: "Member",
  role: "MEMBER",
  homeSite: "PHUKET",
};

const siteAdminPhuket: AuthUser = {
  id: "3",
  email: "a@example.com",
  name: "Site Admin",
  role: "ADMIN",
  homeSite: "PHUKET",
};

const siteAdminBangkok: AuthUser = {
  id: "4",
  email: "bkk@example.com",
  name: "Bangkok Admin",
  role: "ADMIN",
  homeSite: "BANGKOK",
};

const superAdmin: AuthUser = {
  id: "5",
  email: "super@example.com",
  name: "Super Admin",
  role: "SUPER_ADMIN",
  homeSite: null,
};

describe("permissions", () => {
  it("lets visitors mutate nothing", () => {
    expect(canWriteIncident(visitor, "BANGKOK")).toBe(false);
    expect(canMutateSummaries(visitor)).toBe(false);
    expect(canManageUsers(visitor)).toBe(false);
    expect(writableSitesFor(visitor)).toEqual([]);
  });

  it("scopes member writes to homeSite", () => {
    expect(canWriteIncident(memberPhuket, "PHUKET")).toBe(true);
    expect(canWriteIncident(memberPhuket, "BANGKOK")).toBe(false);
    expect(canMutateSummaries(memberPhuket)).toBe(true);
    expect(writableSitesFor(memberPhuket)).toEqual(["PHUKET"]);
  });

  it("scopes site admin writes to homeSite", () => {
    expect(canWriteIncident(siteAdminPhuket, "PHUKET")).toBe(true);
    expect(canWriteIncident(siteAdminPhuket, "BANGKOK")).toBe(false);
    expect(canMutateSummaries(siteAdminPhuket)).toBe(true);
    expect(canManageUsers(siteAdminPhuket)).toBe(true);
    expect(writableSitesFor(siteAdminPhuket)).toEqual(["PHUKET"]);
  });

  it("gives super admins full write and user management", () => {
    expect(canWriteIncident(superAdmin, "BANGKOK")).toBe(true);
    expect(canWriteIncident(superAdmin, "PHUKET")).toBe(true);
    expect(canManageUsers(superAdmin)).toBe(true);
    expect(writableSitesFor(superAdmin)).toEqual(["BANGKOK", "PHUKET"]);
  });

  it("limits site admin user-management targets", () => {
    expect(canManageUserTarget(siteAdminPhuket, visitor)).toBe(true);
    expect(canManageUserTarget(siteAdminPhuket, memberPhuket)).toBe(true);
    expect(canManageUserTarget(siteAdminPhuket, siteAdminBangkok)).toBe(false);
    expect(canManageUserTarget(siteAdminPhuket, superAdmin)).toBe(false);
    expect(canManageUserTarget(superAdmin, siteAdminBangkok)).toBe(true);
  });

  it("limits assignable roles and sites for site admin", () => {
    expect(assignableRolesFor(siteAdminPhuket)).toEqual([
      "VISITOR",
      "MEMBER",
      "ADMIN",
    ]);
    expect(assignableRolesFor(superAdmin)).toContain("SUPER_ADMIN");
    expect(assignableHomeSitesFor(siteAdminPhuket)).toEqual(["PHUKET"]);
    expect(assignableHomeSitesFor(superAdmin)).toEqual(["BANGKOK", "PHUKET"]);
  });

  it("validates access updates for site admin", () => {
    expect(
      validateUserAccessUpdate(siteAdminPhuket, visitor, "MEMBER", "PHUKET"),
    ).toBeNull();
    expect(
      validateUserAccessUpdate(siteAdminPhuket, visitor, "MEMBER", "BANGKOK"),
    ).toBe("You can only assign your own home site.");
    expect(
      validateUserAccessUpdate(
        siteAdminPhuket,
        visitor,
        "SUPER_ADMIN",
        null,
      ),
    ).toBe("You cannot assign that role.");
    expect(
      validateUserAccessUpdate(siteAdminPhuket, superAdmin, "MEMBER", "PHUKET"),
    ).toBe("You cannot manage this user.");
  });

  it("blocks self-demotion from admin roles", () => {
    expect(
      validateUserAccessUpdate(
        siteAdminPhuket,
        siteAdminPhuket,
        "MEMBER",
        "PHUKET",
      ),
    ).toBe("You cannot remove your own admin role.");
    expect(
      validateUserAccessUpdate(superAdmin, superAdmin, "ADMIN", "BANGKOK"),
    ).toBeNull();
  });

  it("normalizes homeSite by role", () => {
    expect(homeSiteForRole("SUPER_ADMIN", "BANGKOK")).toBeNull();
    expect(homeSiteForRole("VISITOR", "PHUKET")).toBeNull();
    expect(homeSiteForRole("ADMIN", "PHUKET")).toBe("PHUKET");
    expect(homeSiteForRole("MEMBER", "BANGKOK")).toBe("BANGKOK");
  });
});
