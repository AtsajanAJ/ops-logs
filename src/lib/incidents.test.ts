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
      entryType: "INCIDENT",
      systemArea: " ",
      site: "BANGKOK",
      tags: "network, timeout",
    });

    expect(result).toEqual({
      title: "Service unavailable",
      description: "Requests returned a timeout.",
      severity: "HIGH",
      entryType: "INCIDENT",
      systemArea: undefined,
      site: "BANGKOK",
      tags: ["network", "timeout"],
    });
  });

  it("defaults service severity to LOW when omitted", () => {
    const result = incidentInputSchema.parse({
      title: "Patch firewall",
      description: "Applied vendor update on Site A.",
      entryType: "SERVICE",
      systemArea: "",
      site: "BANGKOK",
      tags: "update",
    });

    expect(result.severity).toBe("LOW");
    expect(result.entryType).toBe("SERVICE");
  });

  it("requires severity for incidents", () => {
    expect(
      incidentInputSchema.safeParse({
        title: "Outage",
        description: "Network down",
        entryType: "INCIDENT",
        site: "BANGKOK",
        tags: "",
      }).success,
    ).toBe(false);
  });

  it("rejects invalid entry types", () => {
    expect(
      incidentInputSchema.safeParse({
        title: "Title",
        description: "Description",
        severity: "LOW",
        entryType: "TASK",
        site: "BANGKOK",
        tags: "",
      }).success,
    ).toBe(false);
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
        entryType: "SERVICE",
        query: "network timeout",
        tag: "vpn",
        systemArea: "Site A",
      }),
    ).toEqual({
      severity: "CRITICAL",
      entryType: "SERVICE",
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

  it("validates and coerces incident pagination parameters", () => {
    expect(
      incidentFilterSchema.parse({ cursor: "incident-20", limit: "20" }),
    ).toEqual({
      cursor: "incident-20",
      limit: 20,
    });
    expect(incidentFilterSchema.safeParse({ limit: "51" }).success).toBe(false);
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
