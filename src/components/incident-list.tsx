"use client";

import { useDeferredValue, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ChevronDown,
  Inbox,
  LoaderCircle,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IncidentDeleteDialog } from "@/components/incident-delete-dialog";
import { IncidentLifecycleDialog } from "@/components/incident-lifecycle-dialog";
import { SectionHeading } from "@/components/page-heading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/components/locale-provider";
import {
  entryTypeValues,
  severityValues,
  type EntryTypeValue,
  type IncidentFacets,
  type IncidentPage,
  type IncidentView,
  type SeverityValue,
} from "@/lib/incidents";
import { canWriteIncident } from "@/lib/permissions";
import { siteValues, type SiteValue } from "@/lib/sites";
import { useCurrentAuthUser } from "@/lib/use-current-auth-user";
import { cn } from "@/lib/utils";

type SeverityFilter = SeverityValue | "ALL";
type SiteFilter = SiteValue | "ALL";
type FacetFilter = string | "ALL";

interface IncidentFilters {
  entryType: EntryTypeValue;
  severity: SeverityFilter;
  site: SiteFilter;
  tag: FacetFilter;
  systemArea: FacetFilter;
  query: string;
}

const severityStyles: Record<SeverityValue, string> = {
  LOW: "bg-severity-low",
  MEDIUM: "bg-severity-medium",
  HIGH: "bg-severity-high",
  CRITICAL: "bg-severity-critical",
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

async function fetchIncidents(
  filters: IncidentFilters,
  cursor: string | null,
): Promise<IncidentPage> {
  const params = new URLSearchParams({
    limit: "10",
    entryType: filters.entryType,
  });
  if (filters.severity !== "ALL" && filters.entryType === "INCIDENT") {
    params.set("severity", filters.severity);
  }
  if (filters.site !== "ALL") {
    params.set("site", filters.site);
  }
  if (filters.tag !== "ALL") params.set("tag", filters.tag);
  if (filters.systemArea !== "ALL") {
    params.set("systemArea", filters.systemArea);
  }
  if (filters.query) params.set("query", filters.query);
  if (cursor) params.set("cursor", cursor);

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

  return payload as IncidentPage;
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
        <div key={item} className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface IncidentCardProps {
  incident: IncidentView;
  canWrite: boolean;
}

function IncidentCard({
  incident,
  canWrite,
}: IncidentCardProps): React.JSX.Element {
  const { t } = useLocale();

  return (
    <article
      className={cn(
        "ui-transition rounded-xl border border-slate-200 p-4 transition-colors sm:p-5",
        incident.resolved
          ? "bg-slate-50/70 text-slate-600"
          : "bg-white hover:border-slate-300",
      )}
    >
      <div className="grid gap-3 sm:grid-cols-[8.5rem_1fr]">
        <div className="flex items-start justify-between gap-3 sm:block">
          <time
            dateTime={incident.createdAt}
            className="text-xs leading-5 text-slate-500"
          >
            {dateFormatter.format(new Date(incident.createdAt))}
          </time>
          {incident.entryType === "SERVICE" ? (
            <Badge
              variant="secondary"
              className="mt-0.5 bg-sky-50 text-sky-800 sm:mt-2"
            >
              {t("entryType.SERVICE")}
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="mt-0.5 gap-1.5 border-slate-200 bg-white text-slate-700 sm:mt-2"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "size-2 rounded-full",
                  severityStyles[incident.severity],
                )}
              />
              {t(`severity.${incident.severity}`)}
            </Badge>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-start gap-2">
            <h3
              className="min-w-0 flex-1 truncate text-base leading-6 font-semibold text-slate-950"
              title={incident.title}
            >
              {incident.title}
            </h3>
            {canWrite && (
              <div className="flex shrink-0 flex-nowrap items-center gap-2">
                <IncidentLifecycleDialog incident={incident} />
                <IncidentDeleteDialog incident={incident} />
              </div>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500">
              {t(`sites.${incident.site}`)}
            </span>
            {incident.systemArea && (
              <span className="text-xs font-medium text-slate-500">
                {incident.systemArea}
              </span>
            )}
            {incident.resolved && (
              <Badge className="bg-emerald-100 text-emerald-800">
                {t("ledger.resolved")}
              </Badge>
            )}
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
            {incident.description}
          </p>
          {(incident.tags.length > 0 || incident.createdByName) && (
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              {incident.tags.length > 0 && (
                <div className="flex min-w-0 flex-1 flex-wrap gap-1.5" aria-label="Tags">
                  {incident.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-slate-100 text-xs text-slate-600"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
              {incident.createdByName && (
                <span
                  className={cn(
                    "text-xs font-medium text-slate-500",
                    incident.tags.length > 0 ? "ml-auto shrink-0" : "w-full text-right",
                  )}
                >
                  {t("ledger.loggedBy", { name: incident.createdByName })}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export function IncidentList(): React.JSX.Element {
  const [entryType, setEntryType] = useState<EntryTypeValue>("INCIDENT");
  const [severity, setSeverity] = useState<SeverityFilter>("ALL");
  const [site, setSite] = useState<SiteFilter>("ALL");
  const [tag, setTag] = useState<FacetFilter>("ALL");
  const [systemArea, setSystemArea] = useState<FacetFilter>("ALL");
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const deferredQuery = useDeferredValue(query.trim());
  const { user } = useCurrentAuthUser();
  const { t } = useLocale();
  const filters: IncidentFilters = {
    entryType,
    severity,
    site,
    tag,
    systemArea,
    query: deferredQuery,
  };
  const incidentsQuery = useInfiniteQuery({
    queryKey: ["incidents", filters],
    queryFn: ({ pageParam }) => fetchIncidents(filters, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
  const facetsQuery = useQuery({
    queryKey: ["incident-facets"],
    queryFn: fetchIncidentFacets,
  });
  const activeFilterCount = [
    entryType === "INCIDENT" && severity !== "ALL",
    site !== "ALL",
    tag !== "ALL",
    systemArea !== "ALL",
    Boolean(query.trim()),
  ].filter(Boolean).length;
  const incidents =
    incidentsQuery.data?.pages.flatMap((page) => page.items) ?? [];

  function clearFilters(): void {
    setSeverity("ALL");
    setSite("ALL");
    setTag("ALL");
    setSystemArea("ALL");
    setQuery("");
  }

  return (
    <section aria-label="Ops ledger">
      <div className="mb-5">
        <SectionHeading
          title={t("ledger.title")}
          description={
            entryType === "SERVICE"
              ? t("ledger.newestServices")
              : t("ledger.newestIncidents")
          }
          meta={
            incidentsQuery.data ? (
              <Badge variant="secondary">
                {t("ledger.shown", { count: incidents.length })}
              </Badge>
            ) : undefined
          }
        />

        <div className="mt-4 flex gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
          {entryTypeValues.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setEntryType(value);
                if (value === "SERVICE") setSeverity("ALL");
              }}
              aria-pressed={entryType === value}
              className={cn(
                "flex flex-1 items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                entryType === value
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-600 hover:text-slate-950",
              )}
            >
              {value === "INCIDENT"
                ? t("entryType.incidents")
                : t("entryType.services")}
            </button>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
            />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("ledger.searchPlaceholder")}
              aria-label={t("ledger.searchAria")}
              className="h-11 bg-white pl-9 md:h-9"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowFilters((current) => !current)}
            aria-expanded={showFilters}
            aria-controls="incident-filters"
            className="h-11 shrink-0 md:hidden"
          >
            <SlidersHorizontal aria-hidden="true" />
            {t("ledger.filters")}
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-slate-950 px-1.5 text-xs text-white">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown
              aria-hidden="true"
              className={cn("ui-transition transition-transform", showFilters && "rotate-180")}
            />
          </Button>
        </div>

        <div
          id="incident-filters"
          className={cn(
            "mt-3 items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 md:flex",
            showFilters ? "flex" : "hidden",
          )}
        >
          <div
            className={cn(
              "grid min-w-0 flex-1 gap-3 md:grid-cols-2",
              entryType === "INCIDENT" ? "xl:grid-cols-4" : "xl:grid-cols-3",
            )}
          >
            {entryType === "INCIDENT" && (
              <Select
                value={severity}
                onValueChange={(value) =>
                  setSeverity((value ?? "ALL") as SeverityFilter)
                }
              >
                <SelectTrigger
                  aria-label={t("ledger.allSeverities")}
                  className="h-9! w-full bg-white"
                >
                  <SelectValue>
                    {(value) =>
                      value === "ALL"
                        ? t("ledger.allSeverities")
                        : t(`severity.${value as SeverityValue}`)
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="ALL">{t("ledger.allSeverities")}</SelectItem>
                  {severityValues.map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`severity.${value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select
              value={site}
              onValueChange={(value) => setSite((value ?? "ALL") as SiteFilter)}
            >
              <SelectTrigger
                aria-label={t("ledger.allSites")}
                className="h-9! w-full bg-white"
              >
                <SelectValue>
                  {(value) =>
                    value === "ALL"
                      ? t("ledger.allSites")
                      : t(`sites.${value as SiteValue}`)
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("ledger.allSites")}</SelectItem>
                {siteValues.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`sites.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={systemArea}
              onValueChange={(value) => setSystemArea(value ?? "ALL")}
            >
              <SelectTrigger
                aria-label={t("ledger.allSystemAreas")}
                className="h-9! w-full bg-white"
              >
                <SelectValue>
                  {(value) =>
                    value === "ALL" ? t("ledger.allSystemAreas") : String(value)
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("ledger.allSystemAreas")}</SelectItem>
                {facetsQuery.data?.systemAreas.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={tag} onValueChange={(value) => setTag(value ?? "ALL")}>
              <SelectTrigger
                aria-label={t("ledger.allTags")}
                className="h-9! w-full bg-white"
              >
                <SelectValue>
                  {(value) =>
                    value === "ALL" ? t("ledger.allTags") : `#${String(value)}`
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("ledger.allTags")}</SelectItem>
                {facetsQuery.data?.tags.map((value) => (
                  <SelectItem key={value} value={value}>
                    #{value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            disabled={activeFilterCount === 0}
            aria-label={t("ledger.clear")}
            className="size-9 shrink-0 self-start px-0 text-slate-600"
          >
            <X aria-hidden="true" />
            <span className="sr-only">{t("ledger.clear")}</span>
          </Button>
        </div>

        <div className="mt-2 flex min-h-5 items-start gap-2 text-xs leading-5 text-slate-500">
          <SlidersHorizontal aria-hidden="true" className="size-3.5" />
          {activeFilterCount > 0
            ? t(
                activeFilterCount === 1
                  ? "ledger.activeFilters"
                  : "ledger.activeFiltersPlural",
                { count: activeFilterCount },
              )
            : t("ledger.filterHint")}
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
              <h3 className="font-semibold">{t("ledger.unavailable")}</h3>
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
                {t("ledger.tryAgain")}
              </Button>
            </div>
          </div>
        </div>
      ) : incidents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center">
          <Inbox aria-hidden="true" className="mx-auto size-6 text-slate-400" />
          <h3 className="mt-3 font-semibold text-slate-800">
            {entryType === "SERVICE"
              ? t("ledger.emptyServices")
              : t("ledger.emptyIncidents")}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {activeFilterCount > 0
              ? t("ledger.emptyFiltered")
              : t("ledger.emptyDefault")}
          </p>
        </div>
      ) : (
        <div>
          <div className="grid gap-3">
            {incidents.map((incident) => (
              <IncidentCard
                key={incident.id}
                incident={incident}
                canWrite={canWriteIncident(user, incident.site)}
              />
            ))}
          </div>
          {incidentsQuery.hasNextPage && (
            <div className="mt-5 flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => void incidentsQuery.fetchNextPage()}
                disabled={incidentsQuery.isFetchingNextPage}
                className="h-11 min-w-36 bg-white"
              >
                {incidentsQuery.isFetchingNextPage && (
                  <LoaderCircle aria-hidden="true" className="animate-spin" />
                )}
                {incidentsQuery.isFetchingNextPage
                  ? t("ledger.loading")
                  : t("ledger.loadOlder")}
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
