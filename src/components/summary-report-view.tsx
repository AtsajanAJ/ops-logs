"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Check, LoaderCircle, Save } from "lucide-react";

import {
  markSummaryReviewed,
  updateSummaryDraft,
} from "@/app/actions/summaries";
import { useLocale } from "@/components/locale-provider";
import { SummaryDeleteDialog } from "@/components/summary-delete-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import {
  initialSummaryActionState,
  type SummaryView,
} from "@/lib/summaries";

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
});

function PendingButton({
  kind,
  disabled = false,
}: {
  kind: "save" | "review";
  disabled?: boolean;
}): React.JSX.Element {
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

interface SummaryReportViewProps {
  summary: SummaryView;
}

export function SummaryReportView({
  summary,
}: SummaryReportViewProps): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [draftText, setDraftText] = useState(summary.summaryText);
  const [saveState, saveAction] = useActionState(
    updateSummaryDraft,
    initialSummaryActionState,
  );
  const [reviewState, reviewAction] = useActionState(
    markSummaryReviewed,
    initialSummaryActionState,
  );
  const hasUnsavedChanges = draftText.trim() !== summary.summaryText;
  const rangeLabel = `${dateFormatter.format(new Date(summary.weekStart))} – ${dateFormatter.format(new Date(summary.weekEnd))}`;
  const feedback =
    reviewState.status !== "idle" ? reviewState : saveState;
  const { t } = useLocale();

  useEffect(() => {
    if (saveState.status !== "success") return;

    let cancelled = false;

    async function notifySaved() {
      await Promise.resolve();
      if (cancelled) return;
      void queryClient.invalidateQueries({ queryKey: ["summaries"] });
      void queryClient.invalidateQueries({ queryKey: ["summary-draft-count"] });
      router.refresh();
      toast.add({
        type: "success",
        title: t("toast.summarySavedTitle"),
        description: t("toast.summarySavedDescription"),
      });
    }

    void notifySaved();
    return () => {
      cancelled = true;
    };
  }, [queryClient, router, saveState.status, t]);

  useEffect(() => {
    if (reviewState.status !== "success") return;

    let cancelled = false;

    async function notifyReviewed() {
      await Promise.resolve();
      if (cancelled) return;
      void queryClient.invalidateQueries({ queryKey: ["summaries"] });
      void queryClient.invalidateQueries({ queryKey: ["summary-draft-count"] });
      router.refresh();
      toast.add({
        type: "success",
        title: t("toast.summaryReviewedTitle"),
        description: t("toast.summaryReviewedDescription"),
      });
    }

    void notifyReviewed();
    return () => {
      cancelled = true;
    };
  }, [queryClient, reviewState.status, router, t]);

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <header className="border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold text-slate-950 sm:text-xl">
            {rangeLabel}
          </h1>
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
        <p className="mt-1 text-xs text-slate-500">
          {summary.incidentIds.length} incident
          {summary.incidentIds.length === 1 ? "" : "s"} · Generated{" "}
          {dateFormatter.format(new Date(summary.createdAt))}
        </p>
      </header>

      <div className="p-4 sm:p-6">
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
                rows={20}
                maxLength={20_000}
                className="min-h-96 resize-y bg-white text-base leading-7"
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
              <div className="flex flex-wrap items-center justify-end gap-2">
                <SummaryDeleteDialog
                  summary={summary}
                  onSuccess={() => {
                    router.push("/reports");
                  }}
                />
                <form action={reviewAction}>
                  <input type="hidden" name="id" value={summary.id} />
                  <PendingButton
                    kind="review"
                    disabled={hasUnsavedChanges}
                  />
                </form>
              </div>
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
