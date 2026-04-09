import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ComplianceDashboard } from "@/components/dashboard/compliance-dashboard";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  return <ComplianceDashboard />;
}
