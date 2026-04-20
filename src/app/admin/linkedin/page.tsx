import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getAuthBaseUrl, isAdminEmailAllowed } from "@/lib/auth-env";
import {
  isLinkedInConfigured,
  LINKEDIN_EXPIRES_AT_COOKIE,
  LINKEDIN_MEMBER_NAME_COOKIE,
  LINKEDIN_MEMBER_SUB_COOKIE,
} from "@/lib/linkedin";

export const dynamic = "force-dynamic";

type AdminLinkedInPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readQueryValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function AdminLinkedInPage({
  searchParams,
}: AdminLinkedInPageProps) {
  const session = await auth();
  const sessionEmail = session?.user?.email ?? "";

  if (!session?.user?.id || !isAdminEmailAllowed(sessionEmail)) {
    redirect("/login");
  }

  const params = searchParams ? await searchParams : {};
  const connected = readQueryValue(params.connected) === "1";
  const error = readQueryValue(params.error);

  const cookieStore = await cookies();
  const memberSub = cookieStore.get(LINKEDIN_MEMBER_SUB_COOKIE)?.value ?? "";
  const memberName = cookieStore.get(LINKEDIN_MEMBER_NAME_COOKIE)?.value ?? "";
  const expiresAtRaw = cookieStore.get(LINKEDIN_EXPIRES_AT_COOKIE)?.value ?? "";
  const expiresAt = Number(expiresAtRaw || "0");

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-teal-600">
          LinkedIn Admin
        </p>
        <h1 className="text-3xl font-bold text-slate-900">
          LinkedIn posting connection
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Connect your LinkedIn profile once, then we can continue with publishing
          from the app.
        </p>

        {!isLinkedInConfigured() ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            LinkedIn env vars are missing on the server.
          </div>
        ) : null}

        {connected ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            LinkedIn connection completed successfully.
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            LinkedIn error: {error}
          </div>
        ) : null}

        <div className="mt-8 rounded-2xl border border-slate-200 p-5">
          <p className="text-sm font-semibold text-slate-900">Current status</p>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p>
              <span className="font-medium text-slate-900">Connected:</span>{" "}
              {memberSub ? "Yes" : "No"}
            </p>
            <p>
              <span className="font-medium text-slate-900">Member:</span>{" "}
              {memberName || "Not connected yet"}
            </p>
            <p>
              <span className="font-medium text-slate-900">Member URN:</span>{" "}
              {memberSub ? `urn:li:person:${memberSub}` : "Not available yet"}
            </p>
            <p>
              <span className="font-medium text-slate-900">Token expires:</span>{" "}
              {expiresAt ? new Date(expiresAt).toLocaleString("en-US") : "Unknown"}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`${getAuthBaseUrl()}/api/admin/linkedin/connect`}
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Connect LinkedIn profile
          </Link>
          <Link
            href="/api/admin/linkedin/status"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Open connection status
          </Link>
        </div>
      </div>
    </main>
  );
}

