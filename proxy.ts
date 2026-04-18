import { withAuth } from "next-auth/middleware";
import type { NextAuthMiddlewareOptions } from "next-auth/middleware";
import { NextResponse } from "next/server";

const PROFILE_GATE_API_PATH = "/api/user/profile-gate";

function getHomePath(role?: string) {
  if (role === "PARENT") {
    return "/parent/dashboard";
  }

  if (role === "ADMIN") {
    return "/admin";
  }

  return "/dashboard";
}

const authOptions: NextAuthMiddlewareOptions = {
  callbacks: {
    authorized: ({ req, token }) => {
      const pathname = req.nextUrl.pathname;

      if (pathname.startsWith("/parent")) {
        return token?.role === "PARENT" || token?.role === "ADMIN";
      }

      if (pathname.startsWith("/admin")) {
        return token?.role === "ADMIN";
      }

      return !!token;
    },
  },
};

export default withAuth(
  async function proxy(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    if (token?.role) {
      try {
        const response = await fetch(new URL(PROFILE_GATE_API_PATH, req.url), {
          headers: {
            cookie: req.headers.get("cookie") ?? "",
          },
          cache: "no-store",
        });

        if (response.ok) {
          const payload = (await response.json()) as { hasCompletedProfile?: boolean };

          if (!payload.hasCompletedProfile && pathname !== "/welcome") {
            return NextResponse.redirect(new URL("/welcome", req.url));
          }

          if (payload.hasCompletedProfile && pathname === "/welcome") {
            return NextResponse.redirect(new URL(getHomePath(token.role), req.url));
          }
        }
      } catch (error) {
        console.error("Profile gate proxy fetch failed", error);
      }
    }

    if (pathname === "/welcome" && token?.hasCompletedProfile) {
      return NextResponse.redirect(new URL(getHomePath(token.role), req.url));
    }

    return NextResponse.next();
  },
  authOptions
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/full-length/:path*",
    "/sectional/:path*",
    "/review/:path*",
    "/vocab/:path*",
    "/hall-of-fame/:path*",
    "/settings/:path*",
    "/fix/:path*",
    "/admin/:path*",
    "/parent/:path*",
    "/welcome",
  ],
};
