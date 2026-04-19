import { getServerSession } from "@/lib/auth/server";
import { redirect } from "next/navigation";

import AdminDashboardClient from "@/components/admin/AdminDashboardClient";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const session = await getServerSession();

  if (!session?.user?.id) {
    redirect("/auth");
  }

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      `
        username,
        birth_date,
        user_roles (
          roles (
            code
          )
        )
      `
    )
    .eq("id", session.user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/auth");
  }

  if (!profile.username || !profile.birth_date) {
    redirect("/welcome");
  }

  const rolesValue = (profile.user_roles?.[0] as { roles?: { code?: string } | Array<{ code?: string }> } | undefined)?.roles;
  const roleCode = Array.isArray(rolesValue) ? rolesValue[0]?.code : rolesValue?.code;
  if (roleCode !== "admin") {
    redirect("/dashboard");
  }

  return <AdminDashboardClient />;
}
