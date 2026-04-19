import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, { params }: RouteContext) {
    try {
        const { id } = await params;

        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createSupabaseAdminClient();
        const { data: question, error } = await supabase
            .from("questions")
            .select("explanation")
            .eq("id", id)
            .maybeSingle();

        if (error || !question) {
            return NextResponse.json({ error: "Question not found" }, { status: 404 });
        }

        return NextResponse.json({ explanation: question.explanation });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal server error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
