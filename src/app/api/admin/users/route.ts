import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { listAdminUsers } from "@/lib/auth-data";
import { isAdminEmailAllowed } from "@/lib/auth-env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const sessionEmail = session?.user?.email ?? "";

  if (!session?.user?.id || !sessionEmail) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  if (!isAdminEmailAllowed(sessionEmail)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const users = await listAdminUsers();

    return NextResponse.json(
      { users },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to list users.",
      },
      { status: 500 },
    );
  }
}
