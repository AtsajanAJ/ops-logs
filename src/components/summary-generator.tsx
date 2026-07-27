"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useFormStatus } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarRange,
  LoaderCircle,
  LockKeyhole,
  ShieldAlert,
  WandSparkles,
} from "lucide-react";

import { generateSummaryDraft } from "@/app/actions/summaries";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type IncidentView, parseTags } from "@/lib/incidents";
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
        : "Incidents could not be loaded.";
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
    <Button
      type="submit"
      size="lg"
      disabled={pending || !confirmed}
      className="h-11 bg-orange-600 px-5 text-white hover:bg-orange-700"
    >
      {pending ? (
        <LoaderCircle aria-hidden="true" className="animate-spin" />
      ) : (
        <WandSparkles aria-hidden="true" />
      )}
      {pending ? "Generating draft…" : "Generate draft"}
    </Button>
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
  const [confirmed, setConfirmed] = useState(false);
  const [state, formAction] = useActionState(
    generateSummaryDraft,
    initialSummaryActionState,
  );
  const queryClient = useQueryClient();

  useEffect(() => {
    if (state.status !== "success") return;
    void queryClient.invalidateQueries({ queryKey: ["summaries"] });
  }, [queryClient, state]);

  function updateIncident(
    index: number,
    field: "title" | "description" | "systemArea" | "tags",
    value: string,
  ): void {
    setIncidents((current) =>
      current.map((incident, incidentIndex) => {
        if (incidentIndex !== index) return incident;

        if (field === "tags") {
          return { ...incident, tags: parseTags(value) };
        }

        return {
          ...incident,
          [field]: field === "systemArea" ? value || null : value,
        };
      }),
    );
  }

  if (incidents.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-8 text-center">
        <CalendarRange className="mx-auto size-6 text-slate-400" />
        <h3 className="mt-3 font-semibold text-slate-900">
          No incidents in this range
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Choose dates containing at least one incident.
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

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
        <div className="flex gap-3">
          <ShieldAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold">Human review required</h3>
            <p className="mt-1 text-sm leading-6 text-amber-900">
              Pattern masking is only a first pass. Replace every real hospital,
              client, and person name with generic labels such as Site A before
              generating.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {incidents.map((incident, index) => (
          <fieldset
            key={incident.id}
            className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5"
          >
            <legend className="px-2 font-mono text-[0.68rem] font-semibold tracking-[0.14em] text-slate-500 uppercase">
              Incident {String(index + 1).padStart(2, "0")} ·{" "}
              {incident.severity}
            </legend>

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
    onRangePrepared(nextRange);
  }

  return (
    <div className="grid gap-6">
      <form
        onSubmit={preparePreview}
        className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:p-5"
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
            className="bg-white"
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
            className="bg-white"
          />
        </div>
        <Button type="submit" variant="outline" className="h-8 bg-white">
          <LockKeyhole aria-hidden="true" />
          Prepare safe preview
        </Button>
        {rangeError && (
          <p className="text-sm font-medium text-red-700 sm:col-span-3">
            {rangeError}
          </p>
        )}
      </form>

      {incidentsQuery.isFetching ? (
        <div className="grid h-40 place-items-center rounded-xl border border-slate-200 bg-white">
          <LoaderCircle
            aria-label="Preparing incident preview"
            className="animate-spin text-slate-400"
          />
        </div>
      ) : incidentsQuery.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-800">
          {incidentsQuery.error.message}
        </div>
      ) : preparedRange && incidentsQuery.data ? (
        <PrivacyEditor
          key={editorKey}
          range={preparedRange}
          sourceIncidents={incidentsQuery.data}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
          <LockKeyhole className="mx-auto size-6 text-slate-400" />
          <p className="mt-3 text-sm text-slate-600">
            Choose a date range to prepare the anonymized preview.
          </p>
        </div>
      )}
    </div>
  );
}
