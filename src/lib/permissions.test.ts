import { describe, expect, it } from "vitest";

import {
  canManageUsers,
  canMutateSummaries,
  canWriteIncident,
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

const admin: AuthUser = {
  id: "3",
  email: "a@example.com",
  name: "Admin",
  role: "ADMIN",
  homeSite: "BANGKOK",
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

  it("gives admins full write and user management", () => {
    expect(canWriteIncident(admin, "BANGKOK")).toBe(true);
    expect(canWriteIncident(admin, "PHUKET")).toBe(true);
    expect(canManageUsers(admin)).toBe(true);
    expect(writableSitesFor(admin)).toEqual(["BANGKOK", "PHUKET"]);
  });
});
