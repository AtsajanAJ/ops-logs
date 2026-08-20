import { describe, expect, it } from "vitest";

import {
  buildIncidentDraftPrompt,
  parseIncidentDraftResponse,
} from "./incident-draft-prompt";

describe("buildIncidentDraftPrompt", () => {
  it("includes the user notes in the prompt", () => {
    const prompt = buildIncidentDraftPrompt("VPN ล่มตอนเช้า");
    expect(prompt).toContain("VPN ล่มตอนเช้า");
    expect(prompt).toContain("JSON");
  });

  it("includes severity criteria and system area vocabulary", () => {
    const prompt = buildIncidentDraftPrompt("VPN ล่ม");
    expect(prompt).toContain("CRITICAL");
    expect(prompt).toContain("System down");
    expect(prompt).toContain("Network");
    expect(prompt).toContain("outage");
  });
});

describe("parseIncidentDraftResponse", () => {
  it("parses a valid JSON response", () => {
    const raw = JSON.stringify({
      title: "VPN outage",
      description: "VPN service became unreachable at 08:00.",
      severity: "HIGH",
      systemArea: "Network",
      tags: ["vpn", "network"],
    });

    const result = parseIncidentDraftResponse(raw);
    expect(result).toEqual({
      title: "VPN outage",
      description: "VPN service became unreachable at 08:00.",
      severity: "HIGH",
      systemArea: "Network",
      tags: ["vpn", "network"],
    });
  });

  it("strips markdown code fences", () => {
    const raw = "```json\n" + JSON.stringify({
      title: "Test",
      description: "Something happened.",
      severity: "LOW",
      tags: [],
    }) + "\n```";

    const result = parseIncidentDraftResponse(raw);
    expect(result.title).toBe("Test");
  });

  it("throws on invalid JSON", () => {
    expect(() => parseIncidentDraftResponse("not json")).toThrow("invalid JSON");
  });

  it("throws on missing required fields", () => {
    const raw = JSON.stringify({ title: "x" });
    expect(() => parseIncidentDraftResponse(raw)).toThrow("validation failed");
  });

  it("omits systemArea when empty string", () => {
    const raw = JSON.stringify({
      title: "Test",
      description: "Desc.",
      severity: "MEDIUM",
      systemArea: "",
      tags: ["test"],
    });

    const result = parseIncidentDraftResponse(raw);
    expect(result.systemArea).toBeUndefined();
  });

  it("rejects invalid severity values", () => {
    const raw = JSON.stringify({
      title: "Test",
      description: "Desc.",
      severity: "EMERGENCY",
      tags: [],
    });

    expect(() => parseIncidentDraftResponse(raw)).toThrow("validation failed");
  });
});
