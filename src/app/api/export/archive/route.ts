import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { createJsonArchive } from "@/lib/export";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  try {
    const [incidents, summaries] = await Promise.all([
      getDb().incidentLog.findMany({ orderBy: { createdAt: "desc" } }),
      getDb().weeklySummary.findMany({ orderBy: { createdAt: "desc" } }),
    ]);
    const date = new Date().toISOString().slice(0, 10);

    return new NextResponse(createJsonArchive(incidents, summaries), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="ops-logs-archive-${date}.json"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: unknown) {
    console.error("Failed to export JSON archive", error);
    return NextResponse.json(
      { message: "The data archive could not be created." },
      { status: 503 },
    );
  }
}
