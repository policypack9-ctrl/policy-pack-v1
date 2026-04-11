import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { AdminUsersPanel } from "@/components/admin/admin-users-panel";
import { listAdminUsers } from "@/lib/auth-data";
import { isAdminEmailAllowed } from "@/lib/auth-env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await auth();
  const sessionEmail = session?.user?.email ?? "";

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin/users");
  }

  if (!isAdminEmailAllowed(sessionEmail)) {
    notFound();
  }

  const users = await listAdminUsers();

  return <AdminUsersPanel initialUsers={users} adminEmail={sessionEmail} />;
}
