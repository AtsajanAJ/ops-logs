import { describe, expect, it } from "vitest";

import { buildSummaryPrompt } from "./summary-prompt";
import {
  generateSummarySchema,
  getCurrentWeekRange,
  maskSensitiveText,
  summaryDateRangeSchema,
  type GenerateSummaryInput,
} from "./summaries";

const safeInput: GenerateSummaryInput = {
  weekStart: "2026-07-20",
  weekEnd: "2026-07-26",
  confirmedAnonymized: true,
  incidents: [
    {
      id: "incident-private-id",
      title: "Site A VPN outage",
      description: "Users could not authenticate.",
      severity: "HIGH",
      entryType: "INCIDENT",
      systemArea: "Site A / Network",
      rootCause: "Configuration drift",
      resolution: "Restored the approved settings",
      tags: ["vpn", "access"],
      createdAt: "2026-07-22T04:00:00.000Z",
    },
    {
      id: "service-private-id",
      title: "Firewall patch",
      description: "Applied vendor update.",
      severity: "LOW",
      entryType: "SERVICE",
      systemArea: "Site A / Network",
      rootCause: null,
      resolution: null,
      tags: ["update"],
      createdAt: "2026-07-23T04:00:00.000Z",
    },
  ],
};

describe("summary privacy boundary", () => {
  it("masks common direct identifiers without calling an AI", () => {
    const value =
      "Email ops@example.com, phone 081-234-5678, IP 10.20.30.40, HN: AB-12345.";

    expect(maskSensitiveText(value)).toBe(
      "Email [REDACTED EMAIL], phone [REDACTED PHONE], IP [REDACTED IP], HN [REDACTED ID].",
    );
  });

  it("requires explicit anonymization confirmation", () => {
    expect(
      generateSummarySchema.safeParse({
        ...safeInput,
        confirmedAnonymized: false,
      }).success,
    ).toBe(false);
  });

  it("builds the prompt only from reviewed fields", () => {
    const prompt = buildSummaryPrompt(safeInput);

    expect(prompt).toContain("Site A VPN outage");
    expect(prompt).toContain("Configuration drift");
    expect(prompt).toContain('"entryType": "INCIDENT"');
    expect(prompt).toContain('"entryType": "SERVICE"');
    expect(prompt).toContain("1 incidents, 1 services");
    expect(prompt).toContain("Service work");
    expect(prompt).toContain("Do not invent details");
    expect(prompt).not.toContain("incident-private-id");
    expect(prompt).not.toContain("service-private-id");
    expect(prompt).not.toContain("confirmedAnonymized");
    expect(prompt).not.toMatch(
      /"entryType": "SERVICE"[\s\S]*?"severity"/,
    );
  });
});

describe("summary date ranges", () => {
  it("rejects reversed and overlong report ranges", () => {
    expect(
      summaryDateRangeSchema.safeParse({
        weekStart: "2026-07-27",
        weekEnd: "2026-07-20",
      }).success,
    ).toBe(false);
    expect(
      summaryDateRangeSchema.safeParse({
        weekStart: "2026-01-01",
        weekEnd: "2026-03-01",
      }).success,
    ).toBe(false);
  });

  it("calculates a Monday-to-Sunday current week", () => {
    expect(getCurrentWeekRange(new Date("2026-07-27T07:00:00.000Z"))).toEqual({
      weekStart: "2026-07-27",
      weekEnd: "2026-08-02",
    });
  });
});
