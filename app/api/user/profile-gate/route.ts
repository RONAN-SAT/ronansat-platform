import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select(
        `
          username,
          display_name,
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

    if (error || !profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const rolesValue = (profile.user_roles?.[0] as { roles?: { code?: string } | Array<{ code?: string }> } | undefined)?.roles;
    const roleCode = Array.isArray(rolesValue) ? rolesValue[0]?.code : rolesValue?.code;
    const role = roleCode === "admin" ? "ADMIN" : roleCode === "teacher" ? "TEACHER" : "STUDENT";

    return NextResponse.json(
      {
        role,
        username: profile.username ?? undefined,
        birthDate: profile.birth_date ?? undefined,
        displayName: profile.display_name ?? undefined,
        hasCompletedProfile: Boolean(profile.username && profile.birth_date),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/user/profile-gate error:", error);
    return NextResponse.json({ error: "Failed to resolve profile gate" }, { status: 500 });
  }
}
