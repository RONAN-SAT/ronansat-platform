import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server";

import { isDefaultReviewReasonCatalog, normalizeReviewReasonCatalog } from "@/lib/reviewReasonCatalog";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("user_review_reasons")
      .select("id,label,color,sort_order")
      .eq("user_id", session.user.id)
      .order("sort_order", { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      reasons: normalizeReviewReasonCatalog(
        (data ?? []).map((reason) => ({
          id: reason.id,
          label: reason.label,
          color: reason.color,
          order: reason.sort_order,
        }))
      ),
    });
  } catch (error) {
    console.error("GET /api/user/review-reasons error:", error);
    return NextResponse.json({ error: "Failed to load review reasons" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const reasons = normalizeReviewReasonCatalog(body?.reasons);
    const supabase = createSupabaseAdminClient();

    await supabase.from("user_review_reasons").delete().eq("user_id", session.user.id);

    if (!isDefaultReviewReasonCatalog(reasons)) {
      const { error } = await supabase.from("user_review_reasons").insert(
        reasons.map((reason) => ({
          id: reason.id,
          user_id: session.user.id,
          label: reason.label,
          color: reason.color,
          sort_order: reason.order,
          is_active: true,
        }))
      );

      if (error) {
        throw error;
      }
    }

    return NextResponse.json({ message: "Review reasons saved", reasons }, { status: 200 });
  } catch (error) {
    console.error("PUT /api/user/review-reasons error:", error);
    return NextResponse.json({ error: "Failed to save review reasons" }, { status: 500 });
  }
}
