import { type NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { incidentFilterSchema, type IncidentView } from "@/lib/incidents";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const parsedFilters = incidentFilterSchema.safeParse({
    severity: request.nextUrl.searchParams.get("severity") || undefined,
    start: request.nextUrl.searchParams.get("start") || undefined,
    end: request.nextUrl.searchParams.get("end") || undefined,
    query: request.nextUrl.searchParams.get("query") || undefined,
    tag: request.nextUrl.searchParams.get("tag") || undefined,
    systemArea: request.nextUrl.searchParams.get("systemArea") || undefined,
  });

  if (!parsedFilters.success) {
    return NextResponse.json(
      { message: "The incident filter is invalid." },
      { status: 400 },
    );
  }

  try {
    const { severity, start, end, query, tag, systemArea } =
      parsedFilters.data;
    const incidents = await getDb().incidentLog.findMany({
      where: {
        severity,
        tags: tag ? { has: tag } : undefined,
        systemArea: systemArea
          ? { equals: systemArea, mode: "insensitive" }
          : undefined,
        createdAt:
          start && end
            ? {
                gte: new Date(`${start}T00:00:00.000Z`),
                lte: new Date(`${end}T23:59:59.999Z`),
              }
            : undefined,
        OR: query
          ? [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
              { systemArea: { contains: query, mode: "insensitive" } },
              { tags: { has: query.toLowerCase() } },
            ]
          : undefined,
      },
      orderBy: { createdAt: "desc" },
    });

    const data: IncidentView[] = incidents.map((incident) => ({
      id: incident.id,
      title: incident.title,
      description: incident.description,
      severity: incident.severity,
      systemArea: incident.systemArea,
      resolved: incident.resolved,
      rootCause: incident.rootCause,
      resolution: incident.resolution,
      tags: incident.tags,
      createdAt: incident.createdAt.toISOString(),
      resolvedAt: incident.resolvedAt?.toISOString() ?? null,
    }));

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Failed to list incidents", error);

    return NextResponse.json(
      {
        message:
          "Incidents are unavailable. Check the Neon connection and try again.",
      },
      { status: 503 },
    );
  }
}
