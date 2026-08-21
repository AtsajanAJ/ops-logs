import { type NextRequest, NextResponse } from "next/server";

import { requireApiUser } from "@/lib/api-auth";
import { getDb } from "@/lib/db";
import {
  incidentFilterSchema,
  type IncidentPage,
  type IncidentView,
} from "@/lib/incidents";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authResult = await requireApiUser();
  if ("response" in authResult) {
    return authResult.response;
  }

  const parsedFilters = incidentFilterSchema.safeParse({
    severity: request.nextUrl.searchParams.get("severity") || undefined,
    site: request.nextUrl.searchParams.get("site") || undefined,
    entryType: request.nextUrl.searchParams.get("entryType") || undefined,
    start: request.nextUrl.searchParams.get("start") || undefined,
    end: request.nextUrl.searchParams.get("end") || undefined,
    query: request.nextUrl.searchParams.get("query") || undefined,
    tag: request.nextUrl.searchParams.get("tag") || undefined,
    systemArea: request.nextUrl.searchParams.get("systemArea") || undefined,
    cursor: request.nextUrl.searchParams.get("cursor") || undefined,
    limit: request.nextUrl.searchParams.get("limit") || undefined,
  });

  if (!parsedFilters.success) {
    return NextResponse.json(
      { message: "The incident filter is invalid." },
      { status: 400 },
    );
  }

  try {
    const {
      severity,
      site,
      entryType,
      start,
      end,
      query,
      tag,
      systemArea,
      cursor,
      limit,
    } = parsedFilters.data;
    const incidents = await getDb().incidentLog.findMany({
      where: {
        severity,
        site,
        entryType,
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
      include: {
        createdBy: {
          select: { name: true },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : undefined,
      take: limit ? limit + 1 : undefined,
    });

    const hasMore = limit ? incidents.length > limit : false;
    const visibleIncidents = limit ? incidents.slice(0, limit) : incidents;
    const data: IncidentView[] = visibleIncidents.map((incident) => ({
      id: incident.id,
      title: incident.title,
      description: incident.description,
      severity: incident.severity,
      entryType: incident.entryType,
      systemArea: incident.systemArea,
      site: incident.site,
      resolved: incident.resolved,
      rootCause: incident.rootCause,
      resolution: incident.resolution,
      tags: incident.tags,
      imageUrls: incident.imageUrls,
      createdAt: incident.createdAt.toISOString(),
      resolvedAt: incident.resolvedAt?.toISOString() ?? null,
      createdByName: incident.createdBy?.name ?? null,
    }));

    if (limit) {
      const page: IncidentPage = {
        items: data,
        nextCursor: hasMore ? (data.at(-1)?.id ?? null) : null,
      };

      return NextResponse.json(page);
    }

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
