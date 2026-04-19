import type { User } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AppRole = "STUDENT" | "TEACHER" | "ADMIN";

export type AppSessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  role: AppRole;
  username?: string;
  birthDate?: string;
  hasCompletedProfile: boolean;
};

export type AppSession = {
  user: AppSessionUser;
};

type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  birth_date: string | null;
  user_roles: Array<{
    roles: {
      code: "student" | "teacher" | "admin";
    } | null;
  }> | null;
};

export function mapDatabaseRoleToAppRole(roleCode: string | null | undefined): AppRole {
  if (roleCode === "admin") {
    return "ADMIN";
  }

  if (roleCode === "teacher") {
    return "TEACHER";
  }

  return "STUDENT";
}

export function hasCompletedProfileValue(profile: { username?: string | null; birth_date?: string | null; birthDate?: string | null }) {
  return Boolean(profile.username && (profile.birth_date || profile.birthDate));
}

export function buildAppSession(user: User, profile: ProfileRow | null): AppSession {
  const roleCode = profile?.user_roles?.[0]?.roles?.code;
  const role = mapDatabaseRoleToAppRole(roleCode);
  const birthDate = profile?.birth_date ?? undefined;
  const username = profile?.username ?? undefined;
  const name = profile?.display_name ?? user.user_metadata?.name ?? user.email ?? null;

  return {
    user: {
      id: user.id,
      email: user.email ?? null,
      name,
      role,
      username,
      birthDate,
      hasCompletedProfile: hasCompletedProfileValue({ username, birthDate }),
    },
  };
}

export async function getServerAppSession(): Promise<AppSession | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      `
        id,
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
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  return buildAppSession(user, profile ?? null);
}
