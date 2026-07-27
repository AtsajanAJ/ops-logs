"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertOctagon,
  CircleDot,
  FileWarning,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
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
import type { DashboardData } from "@/lib/dashboard";

const severityColors: Record<string, string> = {
  CRITICAL: "#dc2626",
  HIGH: "#f97316",
  MEDIUM: "#f59e0b",
  LOW: "#38bdf8",
};

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
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <p className="font-mono text-[0.68rem] font-semibold tracking-[0.14em] text-slate-500 uppercase">
          {label}
        </p>
        <span className="text-slate-400">{icon}</span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

export function DashboardView(): React.JSX.Element {
  const dashboardQuery = useQuery({
    queryKey: ["dashboard", { weeks: 8 }],
    queryFn: fetchDashboard,
  });

  if (dashboardQuery.isPending) {
    return (
      <div className="grid h-64 place-items-center rounded-xl border border-slate-200 bg-white">
        <LoaderCircle
          aria-label="Loading dashboard"
          className="animate-spin text-slate-400"
        />
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

  return (
    <div className="grid gap-6">
      <section
        aria-label="Incident metrics"
        className="grid gap-3 sm:grid-cols-3"
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
        <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="mb-5">
            <p className="font-mono text-[0.68rem] font-semibold tracking-[0.14em] text-slate-500 uppercase">
              Weekly volume
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">
              Eight-week incident trend
            </h2>
          </div>
          <div
            className="h-72 min-w-0"
            role="img"
            aria-label="Stacked bar chart of incidents per week by severity"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weeklyTrend}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                />
                <Tooltip
                  cursor={{ fill: "#f1f5f9" }}
                  contentStyle={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
                  }}
                />
                <Bar dataKey="low" name="Low" stackId="severity" fill="#38bdf8" />
                <Bar
                  dataKey="medium"
                  name="Medium"
                  stackId="severity"
                  fill="#f59e0b"
                />
                <Bar
                  dataKey="high"
                  name="High"
                  stackId="severity"
                  fill="#f97316"
                />
                <Bar
                  dataKey="critical"
                  name="Critical"
                  stackId="severity"
                  fill="#dc2626"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="mb-5">
            <p className="font-mono text-[0.68rem] font-semibold tracking-[0.14em] text-slate-500 uppercase">
              Risk profile
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">
              Severity breakdown
            </h2>
          </div>
          <div
            className="h-72 min-w-0"
            role="img"
            aria-label="Horizontal bar chart of incidents by severity"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.severityBreakdown}
                layout="vertical"
                margin={{ left: 8 }}
              >
                <CartesianGrid horizontal={false} stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                />
                <YAxis
                  type="category"
                  dataKey="severity"
                  tickLine={false}
                  axisLine={false}
                  width={72}
                  tick={{ fill: "#475569", fontSize: 11, fontWeight: 600 }}
                />
                <Tooltip
                  cursor={{ fill: "#f1f5f9" }}
                  contentStyle={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
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
