import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  try {
    const count = await getDb().weeklySummary.count({
      where: { reviewed: false },
    });
    return NextResponse.json({ count });
  } catch (error: unknown) {
    console.error("Failed to count summary drafts", error);
    return NextResponse.json(
      { message: "Draft status is unavailable." },
      { status: 503 },
    );
  }
}
