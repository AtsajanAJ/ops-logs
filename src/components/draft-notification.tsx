"use client";

import { useQuery } from "@tanstack/react-query";

interface DraftCountResponse {
  count: number;
}

async function fetchDraftCount(): Promise<DraftCountResponse> {
  const response = await fetch("/api/summaries/draft-count");

  if (!response.ok) {
    throw new Error("Could not load report draft count.");
  }

  return response.json() as Promise<DraftCountResponse>;
}

export function DraftCountBadge(): React.JSX.Element | null {
  const query = useQuery({
    queryKey: ["summary-draft-count"],
    queryFn: fetchDraftCount,
    staleTime: 30_000,
  });

  if (query.isError) {
    return (
      <span className="sr-only" role="status">
        Report draft count unavailable
      </span>
    );
  }

  const count = query.data?.count ?? 0;

  if (count === 0) {
    return null;
  }

  return (
    <span
      className="flex min-w-5 items-center justify-center rounded-full bg-orange-600 px-1.5 text-[11px] font-semibold leading-5 text-white"
      aria-label={`${count} report ${count === 1 ? "draft" : "drafts"} awaiting review`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
