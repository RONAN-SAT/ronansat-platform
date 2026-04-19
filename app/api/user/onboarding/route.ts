import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  USERNAME_REQUIREMENTS,
  isValidBirthDate,
  isValidUsername,
  normalizeUsername,
} from "@/lib/userProfile";

const onboardingSchema = z.object({
  username: z.string().trim().transform(normalizeUsername),
  birthDate: z.string().trim(),
});

function getOnboardingErrorResponse(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
    return {
      status: 409,
      body: {
        error: "That username is already taken.",
      },
    };
  }

  const details = error instanceof Error && error.message ? error.message : "Unknown server error";

  return {
    status: 500,
    body: {
      error: "Failed to save your welcome profile.",
      details,
    },
  };
}

export async function PUT(req: Request) {
  let sessionUserId: string | undefined;

  try {
    const session = await getServerSession();
    sessionUserId = session?.user?.id;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = onboardingSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid profile payload" }, { status: 400 });
    }

    const { username, birthDate } = parsed.data;

    if (!isValidUsername(username)) {
      return NextResponse.json({ error: USERNAME_REQUIREMENTS }, { status: 400 });
    }

    if (!isValidBirthDate(birthDate)) {
      return NextResponse.json({ error: "Enter a valid birthdate." }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("username,birth_date")
      .eq("id", session.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (profile.username && profile.username !== username) {
      return NextResponse.json({ error: "Username is already locked for this account." }, { status: 409 });
    }

    if (profile.birth_date && profile.birth_date !== birthDate) {
      return NextResponse.json({ error: "Birthdate is already locked for this account." }, { status: 409 });
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        username: profile.username ?? username,
        birth_date: profile.birth_date ?? birthDate,
      })
      .eq("id", session.user.id);

    if (updateError) {
      throw updateError;
    }

    const finalUsername = profile.username ?? username;
    const finalBirthDate = profile.birth_date ?? birthDate;

    return NextResponse.json(
      {
        message: "Welcome setup saved.",
        user: {
          username: finalUsername,
          birthDate: finalBirthDate,
          hasCompletedProfile: Boolean(finalUsername && finalBirthDate),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const errorResponse = getOnboardingErrorResponse(error);

    console.error("PUT /api/user/onboarding error:", {
      userId: sessionUserId,
      error,
      response: errorResponse,
    });

    return NextResponse.json(errorResponse.body, { status: errorResponse.status });
  }
}
