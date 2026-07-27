"use client";

import { useDeferredValue, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Inbox,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IncidentLifecycleDialog } from "@/components/incident-lifecycle-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  severityValues,
  type IncidentFacets,
  type IncidentView,
  type SeverityValue,
} from "@/lib/incidents";
import { cn } from "@/lib/utils";

type SeverityFilter = SeverityValue | "ALL";
type FacetFilter = string | "ALL";

interface IncidentFilters {
  severity: SeverityFilter;
  tag: FacetFilter;
  systemArea: FacetFilter;
  query: string;
}

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
  filters: IncidentFilters,
): Promise<IncidentView[]> {
  const params = new URLSearchParams();
  if (filters.severity !== "ALL") {
    params.set("severity", filters.severity);
  }
  if (filters.tag !== "ALL") params.set("tag", filters.tag);
  if (filters.systemArea !== "ALL") {
    params.set("systemArea", filters.systemArea);
  }
  if (filters.query) params.set("query", filters.query);

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

async function fetchIncidentFacets(): Promise<IncidentFacets> {
  const response = await fetch("/api/incidents/facets");
  const payload: unknown = await response.json();

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : "Incident filters could not be loaded.";
    throw new Error(message);
  }

  return payload as IncidentFacets;
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
            <div className="flex flex-wrap items-center gap-2">
              {incident.resolved && (
                <Badge className="bg-emerald-100 text-emerald-800">
                  Resolved
                </Badge>
              )}
              {incident.systemArea && (
                <span className="font-mono text-[0.68rem] font-semibold tracking-[0.08em] text-slate-500 uppercase">
                  {incident.systemArea}
                </span>
              )}
              <IncidentLifecycleDialog incident={incident} />
            </div>
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
  const [tag, setTag] = useState<FacetFilter>("ALL");
  const [systemArea, setSystemArea] = useState<FacetFilter>("ALL");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim());
  const filters: IncidentFilters = {
    severity,
    tag,
    systemArea,
    query: deferredQuery,
  };
  const incidentsQuery = useQuery({
    queryKey: ["incidents", filters],
    queryFn: () => fetchIncidents(filters),
  });
  const facetsQuery = useQuery({
    queryKey: ["incident-facets"],
    queryFn: fetchIncidentFacets,
  });
  const activeFilterCount = [
    severity !== "ALL",
    tag !== "ALL",
    systemArea !== "ALL",
    Boolean(query.trim()),
  ].filter(Boolean).length;

  function clearFilters(): void {
    setSeverity("ALL");
    setTag("ALL");
    setSystemArea("ALL");
    setQuery("");
  }

  return (
    <section aria-labelledby="incident-ledger-title">
      <div className="mb-5">
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

        <div className="mt-5 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2 xl:grid-cols-[minmax(13rem,1fr)_repeat(3,minmax(8rem,0.55fr))_auto]">
          <div className="relative sm:col-span-2 xl:col-span-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
            />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search incidents…"
              aria-label="Search incidents"
              className="h-9 bg-white pl-9"
            />
          </div>

          <Select
            value={severity}
            onValueChange={(value) =>
              setSeverity((value ?? "ALL") as SeverityFilter)
            }
          >
            <SelectTrigger
              aria-label="Filter by severity"
              className="h-9! w-full bg-white"
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

          <Select
            value={systemArea}
            onValueChange={(value) => setSystemArea(value ?? "ALL")}
          >
            <SelectTrigger
              aria-label="Filter by system area"
              className="h-9! w-full bg-white"
            >
              <SelectValue>
                {(value) =>
                  value === "ALL" ? "All system areas" : String(value)
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All system areas</SelectItem>
              {facetsQuery.data?.systemAreas.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={tag} onValueChange={(value) => setTag(value ?? "ALL")}>
            <SelectTrigger
              aria-label="Filter by tag"
              className="h-9! w-full bg-white"
            >
              <SelectValue>
                {(value) => (value === "ALL" ? "All tags" : `#${String(value)}`)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All tags</SelectItem>
              {facetsQuery.data?.tags.map((value) => (
                <SelectItem key={value} value={value}>
                  #{value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            disabled={activeFilterCount === 0}
            className="h-9 justify-center text-slate-600"
          >
            <X aria-hidden="true" />
            Clear
          </Button>
        </div>

        <div className="mt-2 flex min-h-5 items-center gap-2 text-xs text-slate-500">
          <SlidersHorizontal aria-hidden="true" className="size-3.5" />
          {activeFilterCount > 0
            ? `${activeFilterCount} active filter${activeFilterCount === 1 ? "" : "s"}`
            : "Search title, description, system area, or an exact tag"}
          {facetsQuery.isError && (
            <span className="font-medium text-red-700">
              · {facetsQuery.error.message}
            </span>
          )}
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
            {activeFilterCount > 0
              ? "No entries match these filters. Clear one or broaden the search."
              : "Log the first event to start the knowledge base."}
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
