import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { isAdminEmailAllowed } from "@/lib/auth-env";
import { checkSmtpConnection } from "@/lib/notifications";

// Ensure this route is evaluated dynamically, so we always get the latest state
export const dynamic = "force-dynamic";

function hasValidHealthcheckSecret(request: Request) {
  const configuredSecret = process.env.HEALTHCHECK_SECRET?.trim() ?? "";

  if (!configuredSecret) {
    return false;
  }

  const headerSecret = request.headers.get("x-healthcheck-secret")?.trim() ?? "";
  const authorization = request.headers.get("authorization")?.trim() ?? "";

  return (
    headerSecret === configuredSecret ||
    authorization === `Bearer ${configuredSecret}`
  );
}

export async function GET(request: Request) {
  if (!hasValidHealthcheckSecret(request)) {
    const session = await auth();
    const adminEmail = session?.user?.email ?? "";

    if (!session?.user?.id || !isAdminEmailAllowed(adminEmail)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
  }

  const result = await checkSmtpConnection();
  const responseBody = {
    success: result.status === "ok",
    status: result.status,
    message: result.message,
    config: result.config,
  };

  if (result.status === "ok") {
    return NextResponse.json(responseBody);
  }

  // Return 500 or 503 for error/unconfigured states so monitoring tools can pick it up
  return NextResponse.json(
    responseBody,
    { status: result.status === "unconfigured" ? 503 : 500 },
  );
}
