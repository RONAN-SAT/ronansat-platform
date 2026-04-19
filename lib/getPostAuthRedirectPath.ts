import type { AppSessionUser } from "@/lib/auth/session";

type RedirectUser = Pick<AppSessionUser, "role" | "hasCompletedProfile"> | null | undefined;

export function getPostAuthRedirectPath(user: RedirectUser) {
  if (!user) {
    return "/auth";
  }

  if (!user.hasCompletedProfile) {
    return "/welcome";
  }

  return "/dashboard";
}
