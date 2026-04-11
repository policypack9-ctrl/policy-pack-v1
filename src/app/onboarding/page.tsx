import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { buildAuthRedirectHref } from "@/lib/auth-routing";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect(buildAuthRedirectHref("register", "/onboarding"));
  }

  redirect("/dashboard");
}
