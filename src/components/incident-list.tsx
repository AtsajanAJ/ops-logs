"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  severityValues,
  type IncidentView,
  type SeverityValue,
} from "@/lib/incidents";
import { cn } from "@/lib/utils";

type SeverityFilter = SeverityValue | "ALL";

const severityLabels: Record<SeverityValue, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

const severityStyles: Record<SeverityValue, string> = {
  LOW: "border-sky-300 bg-sky-50 text-sky-800",
  MEDIUM: "border-amber-300 bg-amber-50 text-amber-800",
  HIGH: "border-orange-300 bg-orange-50 text-orange-800",
  CRITICAL: "border-red-300 bg-red-50 text-red-800",
};

const railStyles: Record<SeverityValue, string> = {
  LOW: "bg-sky-400",
  MEDIUM: "bg-amber-400",
  HIGH: "bg-orange-500",
  CRITICAL: "bg-red-600",
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

async function fetchIncidents(
  severity: SeverityFilter,
): Promise<IncidentView[]> {
  const params = new URLSearchParams();
  if (severity !== "ALL") params.set("severity", severity);

  const response = await fetch(`/api/incidents?${params.toString()}`);
  const payload: unknown = await response.json();

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : "Incidents could not be loaded.";
    throw new Error(message);
  }

  return payload as IncidentView[];
}

function IncidentSkeleton(): React.JSX.Element {
  return (
    <div className="grid gap-3" aria-label="Loading incidents">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="h-32 animate-pulse rounded-xl border border-slate-200 bg-white/60"
        />
      ))}
    </div>
  );
}

interface IncidentCardProps {
  incident: IncidentView;
}

function IncidentCard({ incident }: IncidentCardProps): React.JSX.Element {
  return (
    <article className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)] transition-transform duration-200 motion-safe:hover:-translate-y-0.5">
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-y-0 left-0 w-1.5",
          railStyles[incident.severity],
        )}
      />
      <div className="grid gap-4 p-4 pl-5 sm:grid-cols-[9rem_1fr] sm:p-5 sm:pl-6">
        <div className="flex items-start justify-between gap-3 sm:block">
          <time
            dateTime={incident.createdAt}
            className="font-mono text-[0.68rem] leading-5 font-semibold tracking-[0.08em] text-slate-500 uppercase"
          >
            {dateFormatter.format(new Date(incident.createdAt))}
          </time>
          <Badge
            variant="outline"
            className={cn(
              "mt-0.5 sm:mt-3",
              severityStyles[incident.severity],
            )}
          >
            {severityLabels[incident.severity]}
          </Badge>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-base leading-6 font-semibold text-slate-950">
              {incident.title}
            </h3>
            {incident.systemArea && (
              <span className="font-mono text-[0.68rem] font-semibold tracking-[0.08em] text-slate-500 uppercase">
                {incident.systemArea}
              </span>
            )}
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
            {incident.description}
          </p>
          {incident.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Tags">
              {incident.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="bg-slate-100 font-mono text-[0.68rem] text-slate-600"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export function IncidentList(): React.JSX.Element {
  const [severity, setSeverity] = useState<SeverityFilter>("ALL");
  const incidentsQuery = useQuery({
    queryKey: ["incidents", { severity }],
    queryFn: () => fetchIncidents(severity),
  });

  return (
    <section aria-labelledby="incident-ledger-title">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[0.68rem] font-semibold tracking-[0.16em] text-slate-500 uppercase">
            Recorded events
          </p>
          <h2
            id="incident-ledger-title"
            className="mt-1 text-2xl font-semibold tracking-tight text-slate-950"
          >
            Incident ledger
            {incidentsQuery.data && (
              <span className="ml-2 align-middle font-mono text-sm font-medium text-slate-400">
                {incidentsQuery.data.length.toString().padStart(2, "0")}
              </span>
            )}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Show</span>
          <Select
            value={severity}
            onValueChange={(value) =>
              setSeverity((value ?? "ALL") as SeverityFilter)
            }
          >
            <SelectTrigger
              aria-label="Filter by severity"
              className="h-9! w-36 bg-white"
            >
              <SelectValue>
                {(value) =>
                  value === "ALL"
                    ? "All severities"
                    : severityLabels[value as SeverityValue]
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="ALL">All severities</SelectItem>
              {severityValues.map((value) => (
                <SelectItem key={value} value={value}>
                  {severityLabels[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {incidentsQuery.isPending ? (
        <IncidentSkeleton />
      ) : incidentsQuery.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-900">
          <div className="flex items-start gap-3">
            <AlertTriangle aria-hidden="true" className="mt-0.5 size-5" />
            <div>
              <h3 className="font-semibold">Incident ledger unavailable</h3>
              <p className="mt-1 text-sm leading-6 text-red-800">
                {incidentsQuery.error.message}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void incidentsQuery.refetch()}
                className="mt-4 border-red-300 bg-white text-red-900 hover:bg-red-100"
              >
                <RefreshCw aria-hidden="true" />
                Try again
              </Button>
            </div>
          </div>
        </div>
      ) : incidentsQuery.data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center">
          <Inbox aria-hidden="true" className="mx-auto size-6 text-slate-400" />
          <h3 className="mt-3 font-semibold text-slate-800">
            No incidents in this view
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Log the first event or choose a different severity.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {incidentsQuery.data.map((incident) => (
            <IncidentCard key={incident.id} incident={incident} />
          ))}
        </div>
      )}
    </section>
  );
}
