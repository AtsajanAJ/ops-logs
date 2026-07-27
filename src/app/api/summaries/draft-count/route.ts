import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  try {
    const activeRanges = await getDb().weeklySummary.groupBy({
      by: ["weekStart", "weekEnd"],
      where: { reviewed: false },
    });
    return NextResponse.json({ count: activeRanges.length });
  } catch (error: unknown) {
    console.error("Failed to count summary drafts", error);
    return NextResponse.json(
      { message: "Draft status is unavailable." },
      { status: 503 },
    );
  }
}
