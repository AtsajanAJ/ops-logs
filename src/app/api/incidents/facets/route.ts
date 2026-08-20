import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/api-auth";
import { getDb } from "@/lib/db";
import type { IncidentFacets } from "@/lib/incidents";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  const authResult = await requireApiUser();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const incidents = await getDb().incidentLog.findMany({
      select: { systemArea: true, tags: true },
    });
    const facets: IncidentFacets = {
      tags: [
        ...new Set(incidents.flatMap(({ tags }) => tags).filter(Boolean)),
      ].sort((left, right) => left.localeCompare(right)),
      systemAreas: [
        ...new Set(
          incidents
            .map(({ systemArea }) => systemArea?.trim())
            .filter((value): value is string => Boolean(value)),
        ),
      ].sort((left, right) => left.localeCompare(right)),
    };

    return NextResponse.json(facets);
  } catch (error: unknown) {
    console.error("Failed to load incident facets", error);
    return NextResponse.json(
      { message: "Incident filters are unavailable. Try again." },
      { status: 503 },
    );
  }
}
