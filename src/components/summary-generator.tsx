"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarRange,
  ChevronDown,
  ExternalLink,
  LoaderCircle,
  LockKeyhole,
  ShieldAlert,
  WandSparkles,
} from "lucide-react";

import { generateSummaryDraft } from "@/app/actions/summaries";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { entryTypeLabels, type IncidentView, parseTags } from "@/lib/incidents";
import {
  createSafeIncident,
  initialSummaryActionState,
  summaryDateRangeSchema,
  type SafeIncident,
} from "@/lib/summaries";

export interface DateRange {
  weekStart: string;
  weekEnd: string;
}

interface SummaryGeneratorProps {
  defaultRange: DateRange;
  onRangePrepared: (range: DateRange) => void;
}

async function fetchRangeIncidents(range: DateRange): Promise<IncidentView[]> {
  const params = new URLSearchParams({
    start: range.weekStart,
    end: range.weekEnd,
  });
  const response = await fetch(`/api/incidents?${params.toString()}`);
  const payload: unknown = await response.json();

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : "Ops entries could not be loaded.";
    throw new Error(message);
  }

  return payload as IncidentView[];
}

interface GenerateButtonProps {
  confirmed: boolean;
}

function GenerateButton({
  confirmed,
}: GenerateButtonProps): React.JSX.Element {
  const { pending } = useFormStatus();

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      {pending && (
        <p className="text-xs font-medium text-orange-700" role="status">
          Gemini is preparing the report. This can take a moment.
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        disabled={pending || !confirmed}
        aria-busy={pending}
        className="h-11 w-full bg-orange-600 px-5 text-white hover:bg-orange-700 sm:w-auto"
      >
        {pending ? (
          <LoaderCircle aria-hidden="true" className="animate-spin" />
        ) : (
          <WandSparkles aria-hidden="true" />
        )}
        {pending ? "Generating with Gemini…" : "Generate draft"}
      </Button>
    </div>
  );
}

interface PrivacyEditorProps {
  range: DateRange;
  sourceIncidents: IncidentView[];
}

function PrivacyEditor({
  range,
  sourceIncidents,
}: PrivacyEditorProps): React.JSX.Element {
  const [incidents, setIncidents] = useState<SafeIncident[]>(() =>
    sourceIncidents.map(createSafeIncident),
  );
  const [expandedIncidentId, setExpandedIncidentId] = useState<string | null>(
    sourceIncidents[0]?.id ?? null,
  );
  const [confirmed, setConfirmed] = useState(false);
  const [state, formAction] = useActionState(
    generateSummaryDraft,
    initialSummaryActionState,
  );
  const queryClient = useQueryClient();

  useEffect(() => {
    if (state.status !== "success") return;
    void queryClient.invalidateQueries({ queryKey: ["summaries"] });
    void queryClient.invalidateQueries({ queryKey: ["summary-draft-count"] });
  }, [queryClient, state]);

  function updateIncident(
    index: number,
    field:
      | "title"
      | "description"
      | "systemArea"
      | "rootCause"
      | "resolution"
      | "tags",
    value: string,
  ): void {
    setConfirmed(false);
    setIncidents((current) =>
      current.map((incident, incidentIndex) => {
        if (incidentIndex !== index) return incident;

        if (field === "tags") {
          return { ...incident, tags: parseTags(value) };
        }

        return {
          ...incident,
          [field]:
            field === "systemArea" ||
            field === "rootCause" ||
            field === "resolution"
              ? value || null
              : value,
        };
      }),
    );
  }

  if (incidents.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-8 text-center">
        <CalendarRange className="mx-auto size-6 text-slate-400" />
        <h3 className="mt-3 font-semibold text-slate-900">
          No entries in this range
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Choose dates containing at least one incident or service.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-5">
      <input type="hidden" name="weekStart" value={range.weekStart} />
      <input type="hidden" name="weekEnd" value={range.weekEnd} />
      <input type="hidden" name="incidents" value={JSON.stringify(incidents)} />
      <input
        type="hidden"
        name="confirmedAnonymized"
        value={confirmed ? "true" : "false"}
      />

      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
        <div className="flex gap-3">
          <ShieldAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold">Check every identifier</h3>
            <p className="mt-1 text-sm leading-6 text-amber-900">
              Automatic masking is only a first pass. Replace real patient,
              hospital, client, and person names with labels such as Site A.
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {incidents.map((incident, index) => (
          <fieldset
            key={incident.id}
            className="border-0"
          >
            <legend className="sr-only">
              Entry {index + 1} of {incidents.length}: {incident.title}
            </legend>

            <button
              type="button"
              onClick={() =>
                setExpandedIncidentId((current) =>
                  current === incident.id ? null : incident.id,
                )
              }
              aria-expanded={expandedIncidentId === incident.id}
              aria-controls={`safe-incident-panel-${incident.id}`}
              className="ui-transition flex min-h-16 w-full items-center justify-between gap-4 px-4 py-3 text-left outline-none transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-inset sm:px-5"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-slate-900">
                  {index + 1}. {incident.title}
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                    {entryTypeLabels[incident.entryType]}
                  </span>
                  {incident.entryType === "INCIDENT" && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                      {incident.severity.toLowerCase()}
                    </span>
                  )}
                  {incident.systemArea && <span>{incident.systemArea}</span>}
                </span>
              </span>
              <ChevronDown
                aria-hidden="true"
                className={`ui-transition size-5 shrink-0 text-slate-500 transition-transform ${
                  expandedIncidentId === incident.id ? "rotate-180" : ""
                }`}
              />
            </button>

            <div
              id={`safe-incident-panel-${incident.id}`}
              hidden={expandedIncidentId !== incident.id}
              className="grid gap-4 border-t border-slate-200 bg-slate-50/40 p-4 sm:p-5"
            >
              <div className="grid gap-2">
              <Label htmlFor={`safe-title-${incident.id}`}>Safe title</Label>
              <Input
                id={`safe-title-${incident.id}`}
                value={incident.title}
                maxLength={120}
                onChange={(event) =>
                  updateIncident(index, "title", event.target.value)
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`safe-area-${incident.id}`}>
                Safe system area
              </Label>
              <Input
                id={`safe-area-${incident.id}`}
                value={incident.systemArea ?? ""}
                maxLength={80}
                placeholder="Site A / Network"
                onChange={(event) =>
                  updateIncident(index, "systemArea", event.target.value)
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`safe-description-${incident.id}`}>
                Safe description
              </Label>
              <Textarea
                id={`safe-description-${incident.id}`}
                value={incident.description}
                maxLength={2_000}
                rows={4}
                onChange={(event) =>
                  updateIncident(index, "description", event.target.value)
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`safe-tags-${incident.id}`}>Safe tags</Label>
              <Input
                id={`safe-tags-${incident.id}`}
                value={incident.tags.join(", ")}
                maxLength={250}
                onChange={(event) =>
                  updateIncident(index, "tags", event.target.value)
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor={`safe-root-cause-${incident.id}`}>
                  Safe root cause
                </Label>
                <Textarea
                  id={`safe-root-cause-${incident.id}`}
                  value={incident.rootCause ?? ""}
                  maxLength={2_000}
                  rows={3}
                  placeholder="Not yet determined"
                  onChange={(event) =>
                    updateIncident(index, "rootCause", event.target.value)
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`safe-resolution-${incident.id}`}>
                  Safe resolution
                </Label>
                <Textarea
                  id={`safe-resolution-${incident.id}`}
                  value={incident.resolution ?? ""}
                  maxLength={2_000}
                  rows={3}
                  placeholder="Not yet determined"
                  onChange={(event) =>
                    updateIncident(index, "resolution", event.target.value)
                  }
                />
              </div>
            </div>
            </div>
          </fieldset>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="confirm-anonymized"
            checked={confirmed}
            onCheckedChange={(checked) => setConfirmed(checked)}
            className="mt-0.5"
          />
          <Label
            htmlFor="confirm-anonymized"
            className="cursor-pointer text-sm leading-6 font-normal text-slate-700"
          >
            I reviewed every field above. It contains no real patient,
            hospital, client, or person identifiers and is safe to send to
            Gemini.
          </Label>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p
            aria-live="polite"
            className={
              state.status === "error"
                ? "text-sm font-medium text-red-700"
                : "text-sm font-medium text-emerald-700"
            }
          >
            {state.message}
          </p>
          {state.status === "success" && state.summaryId && (
            <Link
              href={`/reports/${state.summaryId}`}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 underline-offset-4 hover:underline"
            >
              <ExternalLink aria-hidden="true" className="size-3.5" />
              Open in weekly reports
            </Link>
          )}
        </div>
        <GenerateButton confirmed={confirmed} />
      </div>
    </form>
  );
}

export function SummaryGenerator({
  defaultRange,
  onRangePrepared,
}: SummaryGeneratorProps): React.JSX.Element {
  const [range, setRange] = useState(defaultRange);
  const [preparedRange, setPreparedRange] = useState<DateRange | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [rangeError, setRangeError] = useState("");
  const incidentsQuery = useQuery({
    queryKey: ["incidents", { ...preparedRange, purpose: "summary" }],
    queryFn: () =>
      preparedRange ? fetchRangeIncidents(preparedRange) : Promise.resolve([]),
    enabled: preparedRange !== null,
  });
  const editorKey = useMemo(
    () =>
      preparedRange && incidentsQuery.data
        ? `${preparedRange.weekStart}:${preparedRange.weekEnd}:${incidentsQuery.data
            .map(({ id }) => id)
            .join(",")}`
        : "empty",
    [incidentsQuery.data, preparedRange],
  );

  function preparePreview(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const parsed = summaryDateRangeSchema.safeParse(range);

    if (!parsed.success) {
      setRangeError(parsed.error.issues[0]?.message ?? "Choose valid dates.");
      return;
    }

    setRangeError("");
    const nextRange = { ...range };
    setPreparedRange(nextRange);
    setPreviewOpen(true);
    onRangePrepared(nextRange);
  }

  return (
    <div className="grid gap-6">
      <form
        onSubmit={preparePreview}
        className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:p-5"
      >
        <div className="grid gap-2">
          <Label htmlFor="week-start">Start date</Label>
          <Input
            id="week-start"
            type="date"
            value={range.weekStart}
            onChange={(event) =>
              setRange((current) => ({
                ...current,
                weekStart: event.target.value,
              }))
            }
            className="h-11 bg-white"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="week-end">End date</Label>
          <Input
            id="week-end"
            type="date"
            value={range.weekEnd}
            onChange={(event) =>
              setRange((current) => ({
                ...current,
                weekEnd: event.target.value,
              }))
            }
            className="h-11 bg-white"
          />
        </div>
        <Button type="submit" variant="outline" className="h-11 bg-white">
          <LockKeyhole aria-hidden="true" />
          Prepare safe preview
        </Button>
        {rangeError && (
          <p className="text-sm font-medium text-red-700 sm:col-span-3">
            {rangeError}
          </p>
        )}
      </form>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader className="pr-10">
            <DialogTitle className="text-lg font-semibold">
              Review safe preview
            </DialogTitle>
            <DialogDescription>
              Verify and anonymize every field before generating the report.
            </DialogDescription>
          </DialogHeader>

          {incidentsQuery.isFetching ? (
            <div
              className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"
              aria-label="Preparing entry preview"
            >
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-11 w-2/3" />
            </div>
          ) : incidentsQuery.isError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-800">
              <p>{incidentsQuery.error.message}</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => void incidentsQuery.refetch()}
                className="mt-4 h-11 border-red-300 bg-white"
              >
                Try again
              </Button>
            </div>
          ) : preparedRange && incidentsQuery.data ? (
            <PrivacyEditor
              key={editorKey}
              range={preparedRange}
              sourceIncidents={incidentsQuery.data}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
