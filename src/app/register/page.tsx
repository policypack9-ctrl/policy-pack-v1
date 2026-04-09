import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { RegisterForm } from "@/components/auth/register-form";
import { AuthShell } from "@/components/auth/auth-shell";

export default async function RegisterPage({
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
    <AuthShell
      eyebrow="Account Setup"
      title="Create a secure workspace before you launch."
      description="Provision credentials, attach premium billing state, and keep every generated legal document synced inside your PolicyPack account."
      footerLabel="Already have an account?"
      footerHref={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
      footerAction="Login"
    >
      <RegisterForm callbackUrl={callbackUrl} />
    </AuthShell>
  );
}
