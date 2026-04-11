import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { deleteUserAccount, getAppUserProfileById } from "@/lib/auth-data";
import { getAdminEmailAllowlist, isAdminEmailAllowed } from "@/lib/auth-env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const deleteAttemptWindowMs = 60_000;
const maxDeleteAttemptsPerWindow = 12;
const deleteAttempts = new Map<string, number[]>();

function normalizeIdentifier(value: string) {
  return value.trim().toLowerCase();
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isRateLimited(key: string) {
  const now = Date.now();
  const currentAttempts = deleteAttempts.get(key) ?? [];
  const recentAttempts = currentAttempts.filter(
    (attemptAt) => now - attemptAt <= deleteAttemptWindowMs,
  );

  if (recentAttempts.length >= maxDeleteAttemptsPerWindow) {
    deleteAttempts.set(key, recentAttempts);
    return true;
  }

  recentAttempts.push(now);
  deleteAttempts.set(key, recentAttempts);
  return false;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const session = await auth();
  const sessionEmail = session?.user?.email ?? "";
  const sessionUserId = session?.user?.id ?? "";

  if (!sessionUserId || !sessionEmail) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  if (!isAdminEmailAllowed(sessionEmail)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { userId } = await params;
  const normalizedTargetUserId = userId.trim();
  const intentHeader = request.headers.get("x-admin-intent") ?? "";
  const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
  const clientIp = forwardedFor.split(",")[0]?.trim() ?? "unknown";
  const rateLimitKey = `${normalizeIdentifier(sessionUserId)}:${clientIp}`;

  if (intentHeader !== "delete-user") {
    return NextResponse.json(
      { error: "Invalid delete intent." },
      { status: 400 },
    );
  }

  if (isRateLimited(rateLimitKey)) {
    return NextResponse.json(
      { error: "Too many delete attempts. Try again shortly." },
      { status: 429 },
    );
  }

  if (!isUuid(normalizedTargetUserId)) {
    return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
  }

  if (normalizedTargetUserId === sessionUserId) {
    return NextResponse.json(
      { error: "You cannot delete your own admin account from this panel." },
      { status: 400 },
    );
  }

  const targetProfile = await getAppUserProfileById(normalizedTargetUserId);

  if (!targetProfile) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const adminAllowlist = getAdminEmailAllowlist();
  const isTargetAdmin = targetProfile.email
    ? adminAllowlist.includes(targetProfile.email.trim().toLowerCase())
    : false;

  if (isTargetAdmin) {
    return NextResponse.json(
      { error: "Deleting allowlisted admin users is blocked." },
      { status: 403 },
    );
  }

  try {
    await deleteUserAccount(normalizedTargetUserId);

    return NextResponse.json({
      ok: true,
      deletedUserId: normalizedTargetUserId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to delete user.",
      },
      { status: 500 },
    );
  }
}
