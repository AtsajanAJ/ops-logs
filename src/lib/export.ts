export interface ExportIncident {
  id: string;
  title: string;
  description: string;
  severity: string;
  entryType?: string;
  systemArea: string | null;
  site?: string;
  resolved: boolean;
  rootCause: string | null;
  resolution: string | null;
  tags: string[];
  createdAt: Date | string;
  resolvedAt: Date | string | null;
  createdByName?: string | null;
}

export interface ExportSummary {
  id: string;
  weekStart: Date | string;
  weekEnd: Date | string;
  summaryText: string;
  incidentIds: string[];
  reviewed: boolean;
  createdAt: Date | string;
}

function csvCell(value: unknown): string {
  let text: string;

  if (value === null || value === undefined) {
    text = "";
  } else if (value instanceof Date) {
    text = value.toISOString();
  } else if (Array.isArray(value)) {
    text = value.join("|");
  } else {
    text = String(value);
  }

  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function createIncidentCsv(incidents: ExportIncident[]): string {
  const headers = [
    "id",
    "title",
    "description",
    "severity",
    "entryType",
    "systemArea",
    "site",
    "resolved",
    "rootCause",
    "resolution",
    "tags",
    "createdAt",
    "resolvedAt",
    "createdByName",
  ];
  const rows = incidents.map((incident) =>
    [
      incident.id,
      incident.title,
      incident.description,
      incident.severity,
      incident.entryType ?? "INCIDENT",
      incident.systemArea,
      incident.site ?? "",
      incident.resolved,
      incident.rootCause,
      incident.resolution,
      incident.tags,
      incident.createdAt,
      incident.resolvedAt,
      incident.createdByName ?? "",
    ]
      .map(csvCell)
      .join(","),
  );

  return `\uFEFF${headers.map(csvCell).join(",")}\r\n${rows.join("\r\n")}`;
}

export function createJsonArchive(
  incidents: ExportIncident[],
  summaries: ExportSummary[],
  exportedAt = new Date(),
): string {
  return JSON.stringify(
    {
      archiveVersion: 1,
      exportedAt: exportedAt.toISOString(),
      warning: "Contains sensitive operational data. Store securely.",
      incidents,
      weeklySummaries: summaries,
    },
    null,
    2,
  );
}
