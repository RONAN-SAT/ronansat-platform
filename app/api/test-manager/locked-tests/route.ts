import { NextResponse } from "next/server";

import { getServerSession } from "@/lib/auth/server";
import { adminLockedTestSchema, testAccessStatusSchema } from "@/lib/schema/testAccess";
import { testAccessService } from "@/lib/services/testAccessService";

function getErrorStatus(error: unknown) {
  return error instanceof Error && error.message.includes("permission") ? 403 : 500;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Failed to manage locked tests.";
}

export async function GET() {
  const session = await getServerSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await testAccessService.getAdminLockedTests(session);
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/test-manager/locked-tests error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: getErrorStatus(error) });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = adminLockedTestSchema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a test and enter a token." }, { status: 400 });
  }

  try {
    const data = await testAccessService.upsertAdminLockedTest(session, parsed.data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("PUT /api/test-manager/locked-tests error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: getErrorStatus(error) });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = testAccessStatusSchema.safeParse({
    testId: searchParams.get("testId"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a test to unlock." }, { status: 400 });
  }

  try {
    const data = await testAccessService.deleteAdminLockedTest(session, parsed.data.testId);
    return NextResponse.json(data);
  } catch (error) {
    console.error("DELETE /api/test-manager/locked-tests error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: getErrorStatus(error) });
  }
}
