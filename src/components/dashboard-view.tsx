"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertOctagon,
  CircleDot,
  FileWarning,
  RefreshCw,
} from "lucide-react";
import { useSyncExternalStore } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardData } from "@/lib/dashboard";

const severityColors: Record<string, string> = {
  CRITICAL: "var(--severity-critical)",
  HIGH: "var(--severity-high)",
  MEDIUM: "var(--severity-medium)",
  LOW: "var(--severity-low)",
};

const severityShortLabels: Record<string, string> = {
  CRITICAL: "Crit",
  HIGH: "High",
  MEDIUM: "Med",
  LOW: "Low",
};

const NARROW_QUERY = "(max-width: 639px)";

function subscribeNarrow(onChange: () => void): () => void {
  const media = window.matchMedia(NARROW_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getNarrowSnapshot(): boolean {
  return window.matchMedia(NARROW_QUERY).matches;
}

function getNarrowServerSnapshot(): boolean {
  return false;
}

function useIsNarrow(): boolean {
  return useSyncExternalStore(
    subscribeNarrow,
    getNarrowSnapshot,
    getNarrowServerSnapshot,
  );
}

async function fetchDashboard(): Promise<DashboardData> {
  const response = await fetch("/api/dashboard");
  const payload: unknown = await response.json();

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : "Dashboard data could not be loaded.";
    throw new Error(message);
  }

  return payload as DashboardData;
}

interface MetricCardProps {
  label: string;
  value: number;
  detail: string;
  icon: React.ReactNode;
}

function MetricCard({
  label,
  value,
  detail,
  icon,
}: MetricCardProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-4 border-b border-slate-200 p-4 last:border-b-0 sm:border-b-0 sm:p-5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
          <p className="text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
          <p className="text-xs text-slate-500">{detail}</p>
        </div>
      </div>
    </div>
  );
}

export function DashboardView(): React.JSX.Element {
  const isNarrow = useIsNarrow();
  const dashboardQuery = useQuery({
    queryKey: ["dashboard", { weeks: 8 }],
    queryFn: fetchDashboard,
  });

  if (dashboardQuery.isPending) {
    return (
      <div className="grid gap-6" aria-label="Loading dashboard">
        <div className="grid overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="flex gap-4 border-b border-slate-200 p-5 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0">
              <Skeleton className="size-9 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-16" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-72 w-full sm:h-80" />
          <Skeleton className="h-64 w-full sm:h-80" />
        </div>
      </div>
    );
  }

  if (dashboardQuery.isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-900">
        <h2 className="font-semibold">Dashboard unavailable</h2>
        <p className="mt-1 text-sm">{dashboardQuery.error.message}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void dashboardQuery.refetch()}
          className="mt-4 border-red-300 bg-white"
        >
          <RefreshCw aria-hidden="true" />
          Try again
        </Button>
      </div>
    );
  }

  const data = dashboardQuery.data;
  const weeklySummary = data.weeklyTrend
    .map(
      (week) =>
        `${week.label}: ${week.low + week.medium + week.high + week.critical} incidents`,
    )
    .join("; ");
  const severitySummary = data.severityBreakdown
    .map((point) => `${point.severity.toLowerCase()}: ${point.count}`)
    .join("; ");
  const tickSize = isNarrow ? 10 : 11;
  const tooltipStyle = {
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
    fontSize: isNarrow ? 12 : 13,
    maxWidth: isNarrow ? 220 : undefined,
  } as const;

  return (
    <div className="grid gap-6">
      <section
        aria-label="Incident metrics"
        className="grid overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-3 sm:divide-x sm:divide-slate-200"
      >
        <MetricCard
          label="Total incidents"
          value={data.totalIncidents}
          detail="Across the last 8 weeks"
          icon={<CircleDot aria-hidden="true" className="size-4" />}
        />
        <MetricCard
          label="Unresolved"
          value={data.unresolvedIncidents}
          detail="Still marked open"
          icon={<FileWarning aria-hidden="true" className="size-4" />}
        />
        <MetricCard
          label="High priority"
          value={data.highPriorityIncidents}
          detail="High and critical severity"
          icon={<AlertOctagon aria-hidden="true" className="size-4" />}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.75fr)]">
        <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="mb-4 sm:mb-5">
            <h2 className="text-lg font-semibold text-slate-950">
              Eight-week incident trend
            </h2>
            <p className="mt-1 text-sm text-slate-500">Weekly volume by severity.</p>
          </div>
          <p className="sr-only">{weeklySummary}</p>
          <div
            className="h-64 min-w-0 w-full sm:h-72"
            aria-hidden="true"
          >
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <BarChart
                data={data.weeklyTrend}
                margin={
                  isNarrow
                    ? { top: 4, right: 4, left: -12, bottom: 8 }
                    : { top: 8, right: 8, left: 0, bottom: 0 }
                }
                barCategoryGap={isNarrow ? "18%" : "22%"}
              >
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  interval={isNarrow ? "preserveStartEnd" : 0}
                  minTickGap={isNarrow ? 8 : 16}
                  angle={isNarrow ? -35 : 0}
                  textAnchor={isNarrow ? "end" : "middle"}
                  height={isNarrow ? 48 : 30}
                  tick={{ fill: "#64748b", fontSize: tickSize }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  width={isNarrow ? 24 : 28}
                  tick={{ fill: "#64748b", fontSize: tickSize }}
                />
                <Tooltip
                  cursor={{ fill: "#f1f5f9" }}
                  contentStyle={tooltipStyle}
                  wrapperStyle={{ outline: "none" }}
                />
                <Bar dataKey="low" name="Low" stackId="severity" fill="var(--severity-low)" />
                <Bar
                  dataKey="medium"
                  name="Medium"
                  stackId="severity"
                  fill="var(--severity-medium)"
                />
                <Bar
                  dataKey="high"
                  name="High"
                  stackId="severity"
                  fill="var(--severity-high)"
                />
                <Bar
                  dataKey="critical"
                  name="Critical"
                  stackId="severity"
                  fill="var(--severity-critical)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="mb-4 sm:mb-5">
            <h2 className="text-lg font-semibold text-slate-950">
              Severity breakdown
            </h2>
            <p className="mt-1 text-sm text-slate-500">Incident count by priority.</p>
          </div>
          <p className="sr-only">{severitySummary}</p>
          <div
            className="h-56 min-w-0 w-full sm:h-72"
            aria-hidden="true"
          >
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <BarChart
                data={data.severityBreakdown}
                layout="vertical"
                margin={
                  isNarrow
                    ? { top: 4, right: 12, left: 0, bottom: 0 }
                    : { top: 8, right: 16, left: 8, bottom: 0 }
                }
                barCategoryGap={isNarrow ? "28%" : "24%"}
              >
                <CartesianGrid horizontal={false} stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: tickSize }}
                />
                <YAxis
                  type="category"
                  dataKey="severity"
                  tickLine={false}
                  axisLine={false}
                  width={isNarrow ? 40 : 72}
                  tickFormatter={(value: string) =>
                    isNarrow
                      ? (severityShortLabels[value] ?? value)
                      : value
                  }
                  tick={{ fill: "#475569", fontSize: tickSize, fontWeight: 600 }}
                />
                <Tooltip
                  cursor={{ fill: "#f1f5f9" }}
                  contentStyle={tooltipStyle}
                  wrapperStyle={{ outline: "none" }}
                  formatter={(value) => [value, "Incidents"]}
                  labelFormatter={(label) => String(label)}
                />
                <Bar dataKey="count" name="Incidents" radius={[0, 4, 4, 0]}>
                  {data.severityBreakdown.map((point) => (
                    <Cell
                      key={point.severity}
                      fill={severityColors[point.severity]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
