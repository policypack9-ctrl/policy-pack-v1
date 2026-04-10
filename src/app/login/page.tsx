import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { isGoogleAuthConfigured } from "@/lib/auth-env";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const callbackUrl = resolvedSearchParams.callbackUrl || "/dashboard";
  const error =
    resolvedSearchParams.error === "CredentialsSignin"
      ? "Invalid email or password."
      : resolvedSearchParams.error === "Configuration"
        ? "Sign-in is temporarily unavailable. Please try again in a moment."
      : "";
  const session = await auth();
  const googleEnabled = isGoogleAuthConfigured();

  if (session?.user) {
    redirect(callbackUrl);
  }

  return (
    <AuthShell
      eyebrow="Secure Access"
      title="Secure sign-in for your PolicyPack workspace."
      description="Use your email and password or continue with Google to reach your saved documents, downloads, and account settings."
      footerLabel="Need a new account?"
      footerHref={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
      footerAction="Create account"
    >
      <LoginForm
        callbackUrl={callbackUrl}
        initialError={error}
        showGoogle={googleEnabled}
      />
    </AuthShell>
  );
}
