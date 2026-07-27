"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BellRing } from "lucide-react";

async function fetchDraftCount(): Promise<number> {
  const response = await fetch("/api/summaries/draft-count");
  const payload: unknown = await response.json();

  if (
    !response.ok ||
    typeof payload !== "object" ||
    payload === null ||
    !("count" in payload) ||
    typeof payload.count !== "number"
  ) {
    throw new Error("Draft status is unavailable.");
  }

  return payload.count;
}

export function DraftNotification(): React.JSX.Element | null {
  const draftCountQuery = useQuery({
    queryKey: ["summary-draft-count"],
    queryFn: fetchDraftCount,
  });

  if (draftCountQuery.isPending) return null;

  if (draftCountQuery.isError) {
    return (
      <span
        className="hidden text-[0.65rem] font-medium text-red-700 xl:inline"
        title={draftCountQuery.error.message}
      >
        Draft status unavailable
      </span>
    );
  }

  if (draftCountQuery.data === 0) return null;

  return (
    <Link
      href="/summaries"
      className="flex h-8 items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100"
      aria-label={`${draftCountQuery.data} weekly report draft${
        draftCountQuery.data === 1 ? "" : "s"
      } ready for review`}
    >
      <BellRing aria-hidden="true" className="size-3.5" />
      <span>{draftCountQuery.data}</span>
      <span className="hidden xl:inline">ready for review</span>
    </Link>
  );
}
