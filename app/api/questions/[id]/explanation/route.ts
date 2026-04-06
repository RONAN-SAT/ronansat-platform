import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import Question from "@/lib/models/Question";

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, { params }: RouteContext) {
    try {
        const { id } = await params;

        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const question = await Question.findById(id).select("explanation");
        if (!question) {
            return NextResponse.json({ error: "Question not found" }, { status: 404 });
        }

        return NextResponse.json({ explanation: question.explanation });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal server error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
