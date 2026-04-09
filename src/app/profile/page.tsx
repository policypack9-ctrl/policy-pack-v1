import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BadgeCheck, LockKeyhole, UserRound } from "lucide-react";

import { auth } from "@/auth";
import { getAppUserProfileById } from "@/lib/auth-data";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/profile");
  }

  const profile = await getAppUserProfileById(session.user.id);

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-8 sm:px-10 sm:py-10 lg:px-12">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-white/58 transition-colors hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Link>

        <section className="soft-panel mt-6 rounded-[32px] p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-teal-200/72">
                Profile
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">
                {profile?.name || session.user.name || "PolicyPack User"}
              </h1>
              <p className="mt-3 text-sm leading-7 text-white/60">
                {profile?.email || session.user.email}
              </p>
            </div>

            <div
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium ${
                profile?.isPremium
                  ? "border border-emerald-400/14 bg-emerald-400/10 text-emerald-100"
                  : "border border-white/[0.08] bg-white/[0.03] text-white/72"
              }`}
            >
              {profile?.isPremium ? (
                <BadgeCheck className="size-4" />
              ) : (
                <LockKeyhole className="size-4" />
              )}
              {profile?.isPremium ? "Premium Access" : "Draft Access"}
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              {
                label: "User ID",
                value: session.user.id,
              },
              {
                label: "Provider Access",
                value: session.user.email ? "Google + Credentials ready" : "Credentials ready",
              },
              {
                label: "Export State",
                value: profile?.isPremium ? "PDF export unlocked" : "Premium required",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[24px] border border-white/[0.08] bg-white/[0.02] p-5"
              >
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">
                  {item.label}
                </p>
                <p className="mt-3 break-all text-sm leading-6 text-white/74">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[24px] border border-white/[0.08] bg-white/[0.02] p-5">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-11 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-teal-200">
                <UserRound className="size-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-white">Account-backed workspace</p>
                <p className="mt-1 text-sm leading-6 text-white/56">
                  Generated documents are persisted through Supabase when they are created
                  from the dashboard.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
