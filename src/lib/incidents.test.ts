import { describe, expect, it } from "vitest";

import {
  incidentFilterSchema,
  incidentInputSchema,
  parseTags,
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
});
