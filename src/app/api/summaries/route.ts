import { type NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import {
  summaryDateRangeSchema,
  toDateBounds,
  type SummaryView,
} from "@/lib/summaries";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const weekStart = request.nextUrl.searchParams.get("start");
  const weekEnd = request.nextUrl.searchParams.get("end");
  const hasRange = Boolean(weekStart || weekEnd);
  const parsedRange = hasRange
    ? summaryDateRangeSchema.safeParse({ weekStart, weekEnd })
    : null;

  if (parsedRange && !parsedRange.success) {
    return NextResponse.json(
      { message: "The summary date range is invalid." },
      { status: 400 },
    );
  }

  try {
    const bounds =
      parsedRange?.success === true ? toDateBounds(parsedRange.data) : null;
    const summaries = await getDb().weeklySummary.findMany({
      where: bounds
        ? {
            weekStart: { gte: bounds.start },
            weekEnd: { lte: bounds.end },
          }
        : undefined,
      orderBy: [{ reviewed: "asc" }, { createdAt: "desc" }],
    });

    const data: SummaryView[] = summaries.map((summary) => ({
      id: summary.id,
      weekStart: summary.weekStart.toISOString(),
      weekEnd: summary.weekEnd.toISOString(),
      summaryText: summary.summaryText,
      incidentIds: summary.incidentIds,
      reviewed: summary.reviewed,
      createdAt: summary.createdAt.toISOString(),
    }));

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Failed to list summaries", error);
    return NextResponse.json(
      { message: "Weekly reports are unavailable. Try again." },
      { status: 503 },
    );
  }
}
