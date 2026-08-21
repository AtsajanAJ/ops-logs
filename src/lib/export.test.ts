import { describe, expect, it } from "vitest";

import { createIncidentCsv, createJsonArchive } from "./export";

const incident = {
  id: "incident-1",
  title: '=SUM(1,2) "ทดสอบ"',
  description: "Line one,\nLine two",
  severity: "HIGH",
  entryType: "SERVICE",
  systemArea: "Site A",
  resolved: true,
  rootCause: "Configuration drift",
  resolution: "Restored settings",
  tags: ["network", "ทดสอบ"],
  createdAt: new Date("2026-07-27T07:00:00.000Z"),
  resolvedAt: new Date("2026-07-27T08:00:00.000Z"),
  createdByName: "Ada Ops",
};

describe("data export", () => {
  it("creates an Excel-friendly UTF-8 CSV with safe escaping", () => {
    const csv = createIncidentCsv([incident]);

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain(`"'=SUM(1,2) ""ทดสอบ"""`);
    expect(csv).toContain(`"Line one,\nLine two"`);
    expect(csv).toContain(`"network|ทดสอบ"`);
    expect(csv).toContain('"SERVICE"');
    expect(csv).toContain("2026-07-27T07:00:00.000Z");
    expect(csv).toContain('"Ada Ops"');
    expect(csv).toContain('"createdByName"');
  });

  it("creates a versioned complete JSON archive", () => {
    const archive = JSON.parse(
      createJsonArchive(
        [incident],
        [
          {
            id: "summary-1",
            weekStart: "2026-07-27T00:00:00.000Z",
            weekEnd: "2026-08-02T23:59:59.999Z",
            summaryText: "Weekly report",
            incidentIds: ["incident-1"],
            reviewed: false,
            createdAt: "2026-08-03T01:00:00.000Z",
          },
        ],
        new Date("2026-08-03T02:00:00.000Z"),
      ),
    ) as {
      archiveVersion: number;
      exportedAt: string;
      incidents: unknown[];
      weeklySummaries: unknown[];
    };

    expect(archive.archiveVersion).toBe(1);
    expect(archive.exportedAt).toBe("2026-08-03T02:00:00.000Z");
    expect(archive.incidents).toHaveLength(1);
    expect(archive.weeklySummaries).toHaveLength(1);
  });
});
