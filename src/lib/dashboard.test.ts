import { describe, expect, it } from "vitest";

import { buildDashboardData, getDashboardStart } from "./dashboard";

const reference = new Date("2026-07-27T12:00:00.000Z");

describe("dashboard aggregation", () => {
  it("buckets eight weeks from Monday through the current week", () => {
    expect(getDashboardStart(reference).toISOString()).toBe(
      "2026-06-08T00:00:00.000Z",
    );

    const data = buildDashboardData(
      [
        {
          createdAt: "2026-07-27T07:00:00.000Z",
          severity: "CRITICAL",
          resolved: false,
        },
        {
          createdAt: "2026-07-21T07:00:00.000Z",
          severity: "HIGH",
          resolved: true,
        },
        {
          createdAt: "2026-06-10T07:00:00.000Z",
          severity: "LOW",
          resolved: false,
        },
        {
          createdAt: "2026-05-01T07:00:00.000Z",
          severity: "MEDIUM",
          resolved: false,
        },
      ],
      reference,
    );

    expect(data.totalIncidents).toBe(3);
    expect(data.unresolvedIncidents).toBe(2);
    expect(data.highPriorityIncidents).toBe(2);
    expect(data.weeklyTrend).toHaveLength(8);
    expect(data.weeklyTrend[0]).toMatchObject({ weekStart: "2026-06-08", low: 1 });
    expect(data.weeklyTrend[6]).toMatchObject({ weekStart: "2026-07-20", high: 1 });
    expect(data.weeklyTrend[7]).toMatchObject({
      weekStart: "2026-07-27",
      critical: 1,
    });
    expect(data.severityBreakdown).toEqual([
      { severity: "CRITICAL", count: 1 },
      { severity: "HIGH", count: 1 },
      { severity: "MEDIUM", count: 0 },
      { severity: "LOW", count: 1 },
    ]);
  });

  it("returns zero-filled chart data for an empty ledger", () => {
    const data = buildDashboardData([], reference);

    expect(data.totalIncidents).toBe(0);
    expect(data.unresolvedIncidents).toBe(0);
    expect(data.highPriorityIncidents).toBe(0);
    expect(data.weeklyTrend.every(({ total }) => total === 0)).toBe(true);
    expect(data.severityBreakdown.every(({ count }) => count === 0)).toBe(true);
  });
});
