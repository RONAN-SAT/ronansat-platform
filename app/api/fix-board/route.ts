import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/authOptions";
import { emptyFixBoard, normalizeFixBoard } from "@/lib/fixBoard";
import dbConnect from "@/lib/mongodb";
import FixBoard from "@/lib/models/FixBoard";

const FIX_BOARD_KEY = "global";

async function getFixBoardDocument() {
  return FixBoard.findOneAndUpdate(
    { key: FIX_BOARD_KEY },
    { $setOnInsert: { board: emptyFixBoard } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

function isAdminSession(role?: string) {
  return role === "ADMIN";
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !isAdminSession(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const document = await getFixBoardDocument();

    return NextResponse.json({ board: normalizeFixBoard(document.board) }, { status: 200 });
  } catch (error) {
    console.error("GET /api/fix-board error:", error);
    return NextResponse.json({ error: "Failed to load fix board" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !isAdminSession(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const board = normalizeFixBoard(body?.board);

    await dbConnect();
    await FixBoard.findOneAndUpdate(
      { key: FIX_BOARD_KEY },
      { board },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return NextResponse.json({ message: "Fix board saved", board }, { status: 200 });
  } catch (error) {
    console.error("PUT /api/fix-board error:", error);
    return NextResponse.json({ error: "Failed to save fix board" }, { status: 500 });
  }
}
