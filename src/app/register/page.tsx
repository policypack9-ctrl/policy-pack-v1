import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { RegisterForm } from "@/components/auth/register-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { isGoogleAuthConfigured } from "@/lib/auth-env";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams?: Promise<{ callbackUrl?: string }>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const callbackUrl = resolvedSearchParams.callbackUrl || "/onboarding";
  const session = await auth();
  const googleEnabled = isGoogleAuthConfigured();

  if (session?.user) {
    redirect(callbackUrl);
  }

  return (
    <AuthShell
      eyebrow="Account Setup"
      title="Create your account before you launch."
      description="Set up your personal workspace so every generated document stays organized, saved, and ready to export."
      footerLabel="Already have an account?"
      footerHref={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
      footerAction="Login"
    >
      <RegisterForm callbackUrl={callbackUrl} showGoogle={googleEnabled} />
    </AuthShell>
  );
}
