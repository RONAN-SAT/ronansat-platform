import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { validatePasswordStrength } from "@/lib/security";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(1),
    confirmPassword: z.string().min(1),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });

export async function PUT(req: Request) {
  try {
    const session = await getServerSession();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = checkRateLimit(`change-password:${session.user.id}:${getClientIp(req)}`, {
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateLimit.success) {
      return NextResponse.json({ error: "Too many password change attempts" }, { status: 429 });
    }

    const parsed = updatePasswordSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid password payload" }, { status: 400 });
    }

    const passwordError = validatePasswordStrength(parsed.data.newPassword);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const publicClient = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    const signInResult = await publicClient.auth.signInWithPassword({
      email: session.user.email,
      password: parsed.data.currentPassword,
    });

    if (signInResult.error) {
      return NextResponse.json({ error: "Incorrect current password" }, { status: 401 });
    }

    const supabaseAdmin = createSupabaseAdminClient();
    const updateResult = await supabaseAdmin.auth.admin.updateUserById(session.user.id, {
      password: parsed.data.newPassword,
    });

    if (updateResult.error) {
      return NextResponse.json({ error: updateResult.error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Password updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("PUT /api/user/password error:", error);
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
  }
}
