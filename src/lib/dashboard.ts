import type { EntryTypeValue, SeverityValue } from "@/lib/incidents";

export interface DashboardIncident {
  createdAt: Date | string;
  severity: SeverityValue;
  resolved: boolean;
  entryType: EntryTypeValue;
}

export interface WeeklyIncidentPoint {
  weekStart: string;
  label: string;
  total: number;
  services: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface SeverityPoint {
  severity: SeverityValue;
  count: number;
}

export interface DashboardData {
  totalIncidents: number;
  totalServices: number;
  unresolvedIncidents: number;
  weeklyTrend: WeeklyIncidentPoint[];
  severityBreakdown: SeverityPoint[];
}

const severityKeys: Record<
  SeverityValue,
  "critical" | "high" | "medium" | "low"
> = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

const weekLabelFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

function startOfUtcWeek(value: Date): Date {
  const start = new Date(value);
  start.setUTCHours(0, 0, 0, 0);
  const day = start.getUTCDay();
  start.setUTCDate(start.getUTCDate() - (day === 0 ? 6 : day - 1));
  return start;
}

export function getDashboardStart(
  reference = new Date(),
  weekCount = 8,
): Date {
  const start = startOfUtcWeek(reference);
  start.setUTCDate(start.getUTCDate() - (weekCount - 1) * 7);
  return start;
}

export function buildDashboardData(
  incidents: DashboardIncident[],
  reference = new Date(),
  weekCount = 8,
): DashboardData {
  const firstWeek = getDashboardStart(reference, weekCount);
  const points = new Map<string, WeeklyIncidentPoint>();

  for (let index = 0; index < weekCount; index += 1) {
    const start = new Date(firstWeek);
    start.setUTCDate(firstWeek.getUTCDate() + index * 7);
    const weekStart = start.toISOString().slice(0, 10);
    points.set(weekStart, {
      weekStart,
      label: weekLabelFormatter.format(start),
      total: 0,
      services: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    });
  }

  const severityCounts: Record<SeverityValue, number> = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    CRITICAL: 0,
  };
  let totalIncidents = 0;
  let totalServices = 0;
  let unresolvedIncidents = 0;

  for (const incident of incidents) {
    const createdAt = new Date(incident.createdAt);
    if (Number.isNaN(createdAt.getTime()) || createdAt < firstWeek) continue;

    const weekStart = startOfUtcWeek(createdAt).toISOString().slice(0, 10);
    const point = points.get(weekStart);
    if (!point) continue;

    if (!incident.resolved) unresolvedIncidents += 1;

    if (incident.entryType === "SERVICE") {
      totalServices += 1;
      point.services += 1;
      continue;
    }

    point.total += 1;
    point[severityKeys[incident.severity]] += 1;
    severityCounts[incident.severity] += 1;
    totalIncidents += 1;
  }

  return {
    totalIncidents,
    totalServices,
    unresolvedIncidents,
    weeklyTrend: [...points.values()],
    severityBreakdown: (
      ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const
    ).map((severity) => ({
      severity,
      count: severityCounts[severity],
    })),
  };
}
