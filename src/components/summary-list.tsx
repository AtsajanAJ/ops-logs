"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  FileText,
  LoaderCircle,
  RefreshCw,
  Save,
} from "lucide-react";

import {
  markSummaryReviewed,
  updateSummaryDraft,
} from "@/app/actions/summaries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  initialSummaryActionState,
  type SummaryView,
} from "@/lib/summaries";

interface DateRange {
  weekStart: string;
  weekEnd: string;
}

interface SummaryListProps {
  range: DateRange;
}

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
});

async function fetchSummaries(range: DateRange): Promise<SummaryView[]> {
  const params = new URLSearchParams({
    start: range.weekStart,
    end: range.weekEnd,
  });
  const response = await fetch(`/api/summaries?${params.toString()}`);
  const payload: unknown = await response.json();

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : "Weekly reports could not be loaded.";
    throw new Error(message);
  }

  return payload as SummaryView[];
}

interface PendingButtonProps {
  kind: "save" | "review";
  disabled?: boolean;
}

function PendingButton({
  kind,
  disabled = false,
}: PendingButtonProps): React.JSX.Element {
  const { pending } = useFormStatus();
  const isSave = kind === "save";

  return (
    <Button
      type="submit"
      variant={isSave ? "outline" : "default"}
      size="sm"
      disabled={pending || disabled}
      className={isSave ? "bg-white" : "bg-emerald-700 hover:bg-emerald-800"}
    >
      {pending ? (
        <LoaderCircle aria-hidden="true" className="animate-spin" />
      ) : isSave ? (
        <Save aria-hidden="true" />
      ) : (
        <Check aria-hidden="true" />
      )}
      {pending ? "Working…" : isSave ? "Save changes" : "Mark reviewed"}
    </Button>
  );
}

interface SummaryCardProps {
  summary: SummaryView;
}

function SummaryCard({ summary }: SummaryCardProps): React.JSX.Element {
  const [draftText, setDraftText] = useState(summary.summaryText);
  const [saveState, saveAction] = useActionState(
    updateSummaryDraft,
    initialSummaryActionState,
  );
  const [reviewState, reviewAction] = useActionState(
    markSummaryReviewed,
    initialSummaryActionState,
  );
  const queryClient = useQueryClient();
  const hasUnsavedChanges = draftText.trim() !== summary.summaryText;

  useEffect(() => {
    if (saveState.status !== "success" && reviewState.status !== "success") {
      return;
    }
    void queryClient.invalidateQueries({ queryKey: ["summaries"] });
    void queryClient.invalidateQueries({ queryKey: ["summary-draft-count"] });
  }, [queryClient, reviewState.status, saveState.status]);

  const feedback =
    reviewState.status !== "idle" ? reviewState : saveState;

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <header className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-950">
              {dateFormatter.format(new Date(summary.weekStart))} –{" "}
              {dateFormatter.format(new Date(summary.weekEnd))}
            </h3>
            <Badge
              variant="outline"
              className={
                summary.reviewed
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : "border-amber-300 bg-amber-50 text-amber-800"
              }
            >
              {summary.reviewed ? "Reviewed" : "Draft"}
            </Badge>
          </div>
          <p className="mt-1 font-mono text-[0.68rem] tracking-[0.08em] text-slate-500 uppercase">
            {summary.incidentIds.length} incident
            {summary.incidentIds.length === 1 ? "" : "s"} · Generated{" "}
            {dateFormatter.format(new Date(summary.createdAt))}
          </p>
        </div>
      </header>

      <div className="p-4 sm:p-5">
        {summary.reviewed ? (
          <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
            {summary.summaryText}
          </div>
        ) : (
          <div className="grid gap-4">
            <form action={saveAction} className="grid gap-3">
              <input type="hidden" name="id" value={summary.id} />
              <Textarea
                name="summaryText"
                value={draftText}
                onChange={(event) => setDraftText(event.target.value)}
                rows={16}
                maxLength={20_000}
                className="resize-y bg-white font-mono text-xs leading-6"
              />
              <div className="flex justify-end">
                <PendingButton kind="save" disabled={!hasUnsavedChanges} />
              </div>
            </form>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-slate-500">
                Save all edits before marking the report reviewed.
              </p>
              <form action={reviewAction}>
                <input type="hidden" name="id" value={summary.id} />
                <PendingButton
                  kind="review"
                  disabled={hasUnsavedChanges}
                />
              </form>
            </div>
          </div>
        )}

        <p
          aria-live="polite"
          className={
            feedback.status === "error"
              ? "mt-4 text-sm font-medium text-red-700"
              : "mt-4 text-sm font-medium text-emerald-700"
          }
        >
          {feedback.message}
        </p>
      </div>
    </article>
  );
}

export function SummaryList({
  range,
}: SummaryListProps): React.JSX.Element {
  const summariesQuery = useQuery({
    queryKey: ["summaries", range],
    queryFn: () => fetchSummaries(range),
  });

  if (summariesQuery.isPending) {
    return (
      <div className="grid h-40 place-items-center rounded-xl border border-slate-200 bg-white">
        <LoaderCircle
          aria-label="Loading weekly reports"
          className="animate-spin text-slate-400"
        />
      </div>
    );
  }

  if (summariesQuery.isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-900">
        <p className="text-sm font-medium">{summariesQuery.error.message}</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void summariesQuery.refetch()}
          className="mt-4 border-red-300 bg-white"
        >
          <RefreshCw aria-hidden="true" />
          Try again
        </Button>
      </div>
    );
  }

  if (summariesQuery.data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
        <FileText className="mx-auto size-6 text-slate-400" />
        <h3 className="mt-3 font-semibold text-slate-900">
          No reports for this range
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Prepare and generate the first draft above.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {summariesQuery.data.map((summary) => (
        <SummaryCard
          key={`${summary.id}:${summary.summaryText}:${summary.reviewed}`}
          summary={summary}
        />
      ))}
    </div>
  );
}
