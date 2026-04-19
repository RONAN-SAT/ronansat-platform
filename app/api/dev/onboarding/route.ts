import { NextResponse } from "next/server";

import { getServerSession } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function isDevEnvironment() {
  return process.env.NODE_ENV !== "production";
}

export async function POST() {
  if (!isDevEnvironment()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", session.user.id)
    .maybeSingle();

  if (error || !profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      username: null,
      birth_date: null,
    })
    .eq("id", session.user.id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to reset onboarding" }, { status: 500 });
  }

  return NextResponse.json(
    {
      message: "Welcome onboarding reset.",
      user: {
        username: undefined,
        birthDate: undefined,
        hasCompletedProfile: false,
      },
    },
    { status: 200 }
  );
}
