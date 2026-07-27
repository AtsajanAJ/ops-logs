import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { createIncidentCsv } from "@/lib/export";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  try {
    const incidents = await getDb().incidentLog.findMany({
      orderBy: { createdAt: "desc" },
    });
    const date = new Date().toISOString().slice(0, 10);

    return new NextResponse(createIncidentCsv(incidents), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="ops-incidents-${date}.csv"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: unknown) {
    console.error("Failed to export incident CSV", error);
    return NextResponse.json(
      { message: "The incident export could not be created." },
      { status: 503 },
    );
  }
}
