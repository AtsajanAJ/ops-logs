import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/api-auth";
import {
  isCloudinaryConfigured,
  signUpload,
} from "@/lib/cloudinary";
import { writableSitesFor } from "@/lib/permissions";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ enabled: isCloudinaryConfigured() });
}

export async function POST(): Promise<NextResponse> {
  const authResult = await requireApiUser();
  if ("response" in authResult) {
    return authResult.response;
  }

  if (writableSitesFor(authResult.user).length === 0) {
    return NextResponse.json(
      { message: "You do not have permission to upload images." },
      { status: 403 },
    );
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { message: "Image uploads are not configured." },
      { status: 503 },
    );
  }

  try {
    return NextResponse.json(signUpload());
  } catch (error: unknown) {
    console.error("Failed to sign Cloudinary upload", error);
    return NextResponse.json(
      { message: "Could not prepare image upload." },
      { status: 500 },
    );
  }
}
