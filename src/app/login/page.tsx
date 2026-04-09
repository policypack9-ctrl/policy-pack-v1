import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/auth/auth-shell";

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
      : "";
  const session = await auth();

  if (session?.user) {
    redirect(callbackUrl);
  }

  return (
    <AuthShell
      eyebrow="Secure Access"
      title="Professional authentication for your legal workspace."
      description="Use credentials or Google OAuth to enter your dashboard, save generated documents, and control premium export access through Supabase-backed accounts."
      footerLabel="Need a new workspace?"
      footerHref={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
      footerAction="Create account"
    >
      <LoginForm callbackUrl={callbackUrl} initialError={error} />
    </AuthShell>
  );
}
