import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const updateSettingsSchema = z.object({
    testingRoomTheme: z.string().trim().min(1).optional(),
});

export async function GET() {
    try {
        const session = await getServerSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = await createSupabaseServerClient();
        const { data: authUser } = await supabase.auth.getUser();
        const [{ data: profile, error }, { data: userSettings, error: settingsError }] = await Promise.all([
            supabase
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
            .maybeSingle(),
            supabase.from("user_settings").select("testing_room_theme").eq("user_id", session.user.id).maybeSingle(),
        ]);

        if (error || settingsError || !profile || !authUser.user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const rolesValue = (profile.user_roles?.[0] as { roles?: { code?: string } | Array<{ code?: string }> } | undefined)?.roles;
        const roleCode = Array.isArray(rolesValue)
            ? rolesValue[0]?.code
            : rolesValue?.code;
        const role = roleCode === "admin" ? "ADMIN" : roleCode === "teacher" ? "TEACHER" : "STUDENT";

        return NextResponse.json(
            {
                user: {
                    name: profile.display_name ?? authUser.user.user_metadata?.name ?? authUser.user.email ?? null,
                    username: profile.username,
                    birthDate: profile.birth_date,
                    email: authUser.user.email,
                    role,
                    hasCompletedProfile: Boolean(profile.username && profile.birth_date),
                    testingRoomTheme: userSettings?.testing_room_theme ?? "ronan",
                },
            },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error("GET /api/user/settings error:", error);
        return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const parsed = updateSettingsSchema.safeParse(await req.json());
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid settings payload" }, { status: 400 });
        }

        if (!parsed.data.testingRoomTheme) {
            return NextResponse.json({ error: "No supported setting changes were provided" }, { status: 400 });
        }

        const supabase = await createSupabaseServerClient();
        const { error } = await supabase
            .from("user_settings")
            .upsert({
                user_id: session.user.id,
                testing_room_theme: parsed.data.testingRoomTheme,
            });

        if (error) {
            throw error;
        }

        return NextResponse.json({ message: "Settings updated successfully" }, { status: 200 });
    } catch (error) {
        console.error("PUT /api/user/settings error:", error);
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }
}
