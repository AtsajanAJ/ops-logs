"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ChevronDown,
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
import { Skeleton } from "@/components/ui/skeleton";
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
      className={
        isSave
          ? "h-11 bg-white sm:h-9"
          : "h-11 bg-emerald-700 hover:bg-emerald-800 sm:h-9"
      }
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
  expanded: boolean;
  activeDraft: boolean;
  onToggle: () => void;
}

function SummaryCard({
  summary,
  expanded,
  activeDraft,
  onToggle,
}: SummaryCardProps): React.JSX.Element {
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
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={`summary-panel-${summary.id}`}
          className="ui-transition flex min-h-16 w-full items-center justify-between gap-4 bg-slate-50 px-4 py-3 text-left outline-none transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-inset sm:px-5"
        >
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-950">
                {dateFormatter.format(new Date(summary.weekStart))} –{" "}
                {dateFormatter.format(new Date(summary.weekEnd))}
              </span>
              <Badge
                variant="outline"
                className={
                  summary.reviewed
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                    : "border-amber-300 bg-amber-50 text-amber-800"
                }
              >
                {summary.reviewed
                  ? "Reviewed"
                  : activeDraft
                    ? "Active draft"
                    : "Previous draft"}
              </Badge>
            </span>
            <span className="mt-1 block text-xs font-normal text-slate-500">
              {summary.incidentIds.length} incident
              {summary.incidentIds.length === 1 ? "" : "s"} · Generated{" "}
              {dateFormatter.format(new Date(summary.createdAt))}
            </span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className={`ui-transition size-5 shrink-0 text-slate-500 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </button>
      </h3>

      <div
        id={`summary-panel-${summary.id}`}
        hidden={!expanded}
        className="border-t border-slate-200 p-4 sm:p-5"
      >
        {summary.reviewed ? (
          <div className="max-w-[75ch] whitespace-pre-wrap text-base leading-7 text-slate-700">
            {summary.summaryText}
          </div>
        ) : (
          <div className="grid gap-4">
            <form action={saveAction} className="grid gap-3">
              <input type="hidden" name="id" value={summary.id} />
              <Textarea
                name="summaryText"
                aria-label="Report draft"
                value={draftText}
                onChange={(event) => setDraftText(event.target.value)}
                rows={16}
                maxLength={20_000}
                className="min-h-80 resize-y bg-white text-base leading-7"
              />
              <div className="flex justify-end">
                <PendingButton kind="save" disabled={!hasUnsavedChanges} />
              </div>
            </form>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p
                className={
                  hasUnsavedChanges
                    ? "text-sm font-medium text-amber-700"
                    : "text-sm text-slate-600"
                }
              >
                {hasUnsavedChanges
                  ? "Unsaved changes — save before marking reviewed."
                  : "All changes saved. This draft is ready for final review."}
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

function SummaryResults({
  summaries,
}: {
  summaries: SummaryView[];
}): React.JSX.Element {
  const activeDraftId = summaries.find((summary) => !summary.reviewed)?.id ?? null;
  const [expandedId, setExpandedId] = useState<string | null>(activeDraftId);
  const [visibleCount, setVisibleCount] = useState(5);
  const visibleSummaries = summaries.slice(0, visibleCount);

  return (
    <div>
      <div className="grid gap-3">
        {visibleSummaries.map((summary) => (
          <SummaryCard
            key={`${summary.id}:${summary.summaryText}:${summary.reviewed}`}
            summary={summary}
            expanded={expandedId === summary.id}
            activeDraft={summary.id === activeDraftId}
            onToggle={() =>
              setExpandedId((current) =>
                current === summary.id ? null : summary.id,
              )
            }
          />
        ))}
      </div>
      {visibleCount < summaries.length && (
        <div className="mt-5 flex flex-col items-center gap-2">
          <p className="text-xs text-slate-500">
            Showing {visibleSummaries.length} of {summaries.length} reports
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setVisibleCount((current) => current + 5)}
            className="h-11 bg-white"
          >
            Load more reports
          </Button>
        </div>
      )}
    </div>
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
      <div
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"
        aria-label="Loading weekly reports"
      >
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-5 w-52" />
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="ml-auto h-9 w-32" />
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

  const resultsKey = summariesQuery.data
    .map(
      (summary) =>
        `${summary.id}:${summary.reviewed}:${summary.createdAt}`,
    )
    .join("|");

  return <SummaryResults key={resultsKey} summaries={summariesQuery.data} />;
}
