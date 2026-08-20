import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/api-auth";
import {
  buildDashboardData,
  getDashboardStart,
} from "@/lib/dashboard";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  const authResult = await requireApiUser();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const reference = new Date();
    const incidents = await getDb().incidentLog.findMany({
      where: { createdAt: { gte: getDashboardStart(reference) } },
      select: { createdAt: true, severity: true, resolved: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(buildDashboardData(incidents, reference));
  } catch (error: unknown) {
    console.error("Failed to load dashboard", error);
    return NextResponse.json(
      { message: "Dashboard data is unavailable. Try again." },
      { status: 503 },
    );
  }
}
