import { NextResponse } from "next/server";

import { getServerSession } from "@/lib/auth/server";
import { testAccessStatusSchema, testAccessTokenSchema } from "@/lib/schema/testAccess";
import { testAccessService } from "@/lib/services/testAccessService";

export async function GET(request: Request) {
  const session = await getServerSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = testAccessStatusSchema.safeParse({
    testId: searchParams.get("testId"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Missing test id." }, { status: 400 });
  }

  try {
    const status = await testAccessService.getAccessStatus(parsed.data.testId);
    return NextResponse.json(status);
  } catch (error) {
    console.error("GET /api/test-access error:", error);
    return NextResponse.json({ error: "Failed to load test access status." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = testAccessTokenSchema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return NextResponse.json({ error: "Enter the token for this test." }, { status: 400 });
  }

  try {
    const result = await testAccessService.verifyToken(parsed.data);

    if (!result.unlocked) {
      return NextResponse.json({ error: "That token does not match this test." }, { status: 401 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/test-access error:", error);
    return NextResponse.json({ error: "Failed to verify this token." }, { status: 500 });
  }
}
