import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export type MiddlewareAuthOptions = {
  pages?: {
    signIn?: string;
  };
  callbacks?: {
    authorized?: (args: { token?: object | null }) => boolean;
  };
};

export function withAuth(handler: (req: NextRequest) => Promise<Response> | Response, options?: MiddlewareAuthOptions) {
  return async function wrapped(req: NextRequest) {
    const hasAuthCookies = req.cookies.getAll().some((cookie) => cookie.name.startsWith("sb-"));
    const authorized = options?.callbacks?.authorized?.({ token: hasAuthCookies ? {} : null }) ?? hasAuthCookies;

    if (!authorized) {
      const signInPath = options?.pages?.signIn ?? "/auth";
      return NextResponse.redirect(new URL(signInPath, req.url));
    }

    return handler(req);
  };
}
