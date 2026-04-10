import { NextResponse } from "next/server";

import { auth } from "@/auth";
import {
  getOrCreatePaddleClientToken,
  getPaddleConfig,
  getPaddleEnvironmentLabel,
  getPaddleMismatchMessage,
  hasPaddleEnvironmentMismatch,
} from "@/lib/paddle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const config = getPaddleConfig();

  if (config.apiKey && hasPaddleEnvironmentMismatch()) {
    return NextResponse.json(
      {
        error: getPaddleMismatchMessage(),
      },
      { status: 409 },
    );
  }

  const clientToken = await getOrCreatePaddleClientToken();

  if (!clientToken) {
    return NextResponse.json(
      {
        error:
          "Billing setup is unavailable right now. Please check the billing settings and try again.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    token: clientToken.token,
    source: clientToken.source,
    environment: getPaddleEnvironmentLabel(config.environment),
  });
}
