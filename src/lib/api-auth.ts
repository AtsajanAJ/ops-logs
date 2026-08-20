import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import type { AuthUser } from "@/lib/permissions";
import type { Site, UserRole } from "@/generated/prisma/client";

function toAuthUser(sessionUser: {
  id: string;
  email: string;
  name: string;
  role?: string | null;
  homeSite?: string | null;
}): AuthUser {
  return {
    id: sessionUser.id,
    email: sessionUser.email,
    name: sessionUser.name,
    role: (sessionUser.role as UserRole | undefined) ?? "VISITOR",
    homeSite: (sessionUser.homeSite as Site | null | undefined) ?? null,
  };
}

export async function requireApiUser(): Promise<
  { user: AuthUser } | { response: NextResponse }
> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return {
      response: NextResponse.json(
        { message: "Authentication required." },
        { status: 401 },
      ),
    };
  }

  return { user: toAuthUser(session.user) };
}
