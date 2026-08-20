import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { SummaryReportView } from "@/components/summary-report-view";
import { buttonVariants } from "@/components/ui/button";
import { getDb } from "@/lib/db";
import type { SummaryView } from "@/lib/summaries";
import { cn } from "@/lib/utils";

interface ReportDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportDetailPage({
  params,
}: ReportDetailPageProps): Promise<React.JSX.Element> {
  const { id } = await params;
  const record = await getDb().weeklySummary.findUnique({
    where: { id },
  });

  if (!record) {
    notFound();
  }

  const summary: SummaryView = {
    id: record.id,
    weekStart: record.weekStart.toISOString(),
    weekEnd: record.weekEnd.toISOString(),
    summaryText: record.summaryText,
    incidentIds: record.incidentIds,
    reviewed: record.reviewed,
    createdAt: record.createdAt.toISOString(),
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <Link
        href="/reports"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "mb-4 -ml-2 h-11 text-slate-600 sm:h-9",
        )}
      >
        <ArrowLeft aria-hidden="true" />
        Back to weekly reports
      </Link>

      <SummaryReportView summary={summary} />
    </div>
  );
}
