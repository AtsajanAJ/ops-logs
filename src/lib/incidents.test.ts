import { describe, expect, it } from "vitest";

import {
  incidentFilterSchema,
  incidentInputSchema,
  parseTags,
  resolveIncidentSchema,
} from "./incidents";

describe("incident validation", () => {
  it("normalizes and de-duplicates comma-separated tags", () => {
    expect(parseTags(" VPN, access, vpn,  Update ")).toEqual([
      "vpn",
      "access",
      "update",
    ]);
  });

  it("limits normalized tags to eight", () => {
    expect(parseTags("a,b,c,d,e,f,g,h,i,j")).toHaveLength(8);
  });

  it("accepts a complete incident and removes an empty system area", () => {
    const result = incidentInputSchema.parse({
      title: "  Service unavailable  ",
      description: "Requests returned a timeout.",
      severity: "HIGH",
      systemArea: " ",
      tags: "network, timeout",
    });

    expect(result).toEqual({
      title: "Service unavailable",
      description: "Requests returned a timeout.",
      severity: "HIGH",
      systemArea: undefined,
      tags: ["network", "timeout"],
    });
  });

  it("rejects invalid severity filters", () => {
    expect(
      incidentFilterSchema.safeParse({ severity: "EMERGENCY" }).success,
    ).toBe(false);
  });

  it("accepts combined knowledge-base filters", () => {
    expect(
      incidentFilterSchema.parse({
        severity: "CRITICAL",
        query: "network timeout",
        tag: "vpn",
        systemArea: "Site A",
      }),
    ).toEqual({
      severity: "CRITICAL",
      query: "network timeout",
      tag: "vpn",
      systemArea: "Site A",
    });
  });

  it("rejects overlong search input", () => {
    expect(
      incidentFilterSchema.safeParse({ query: "x".repeat(101) }).success,
    ).toBe(false);
  });

  it("requires a resolution while allowing an unknown root cause", () => {
    expect(
      resolveIncidentSchema.parse({
        id: "incident-1",
        rootCause: " ",
        resolution: "Restarted the affected service.",
      }),
    ).toEqual({
      id: "incident-1",
      rootCause: null,
      resolution: "Restarted the affected service.",
    });
    expect(
      resolveIncidentSchema.safeParse({
        id: "incident-1",
        rootCause: "",
        resolution: "",
      }).success,
    ).toBe(false);
  });
});
