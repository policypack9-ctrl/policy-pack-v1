import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { auth } from "@/auth";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ callbackUrl?: string }>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const callbackUrl = resolvedSearchParams.callbackUrl || "/dashboard";
  const session = await auth();

  if (session?.user) {
    redirect(callbackUrl);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-6 py-12">
      <div className="glass-panel w-full max-w-md rounded-[32px] p-8 sm:p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.28em] text-teal-100/76">
          <ShieldCheck className="size-4 text-teal-200" />
          Secure Google Login
        </div>

        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.055em] text-white">
          Sign in to unlock your legal workspace.
        </h1>
        <p className="mt-4 text-base leading-7 text-white/68">
          Continue with Google to access your dashboard, export PDF documents,
          and keep your PolicyPack synced across sessions.
        </p>

        <div className="mt-8 space-y-3">
          <GoogleSignInButton
            callbackUrl={callbackUrl}
            className="w-full justify-center"
          />
          <p className="text-center text-xs uppercase tracking-[0.22em] text-white/34">
            Callback: {callbackUrl}
          </p>
        </div>
      </div>
    </main>
  );
}
