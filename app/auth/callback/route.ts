import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const redirectTo = requestUrl.searchParams.get("next") ?? "/auth/redirect";

  if (errorDescription) {
    return NextResponse.redirect(new URL(`/auth?error=${encodeURIComponent(errorDescription)}`, requestUrl.origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/auth", requestUrl.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(`/auth?error=${encodeURIComponent(error.message)}`, requestUrl.origin));
  }

  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
}
