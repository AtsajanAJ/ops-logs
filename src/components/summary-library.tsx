"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ExternalLink,
  FileText,
  LoaderCircle,
  RefreshCw,
  WandSparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SummaryDeleteDialog } from "@/components/summary-delete-dialog";
import type { SummaryView } from "@/lib/summaries";
import { cn } from "@/lib/utils";

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
});

async function fetchAllSummaries(): Promise<SummaryView[]> {
  const response = await fetch("/api/summaries");
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

function LibrarySkeleton(): React.JSX.Element {
  return (
    <div className="space-y-3" aria-label="Loading weekly reports">
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-20 w-full rounded-xl" />
    </div>
  );
}

export function SummaryLibrary(): React.JSX.Element {
  const summariesQuery = useQuery({
    queryKey: ["summaries", "library"],
    queryFn: fetchAllSummaries,
  });

  if (summariesQuery.isPending) {
    return <LibrarySkeleton />;
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
        <h3 className="mt-3 font-semibold text-slate-900">No saved reports yet</h3>
        <p className="mt-1 text-sm text-slate-500">
          Generate a draft from Prepare, then it will appear here.
        </p>
        <Link
          href="/summaries"
          className={cn(buttonVariants(), "mt-5 inline-flex h-11")}
        >
          <WandSparkles aria-hidden="true" />
          Go to Prepare
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {summariesQuery.data.map((summary) => {
        const rangeLabel = `${dateFormatter.format(new Date(summary.weekStart))} – ${dateFormatter.format(new Date(summary.weekEnd))}`;

        return (
          <article
            key={summary.id}
            className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-slate-950">{rangeLabel}</h3>
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
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {!summary.reviewed && (
                <SummaryDeleteDialog summary={summary} />
              )}
              <Link
                href={`/reports/${summary.id}`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "h-11 bg-white sm:h-9",
                )}
              >
                <ExternalLink aria-hidden="true" className="size-3.5" />
                Open
              </Link>
            </div>
          </article>
        );
      })}
      {summariesQuery.isFetching && (
        <p className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />
          Refreshing…
        </p>
      )}
    </div>
  );
}
