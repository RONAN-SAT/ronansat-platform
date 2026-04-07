import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/authOptions";
import { emptyFixBoard, normalizeFixBoard, type FixBoardState, type FixCard, type FixReportEntry } from "@/lib/fixBoard";
import dbConnect from "@/lib/mongodb";
import FixBoard from "@/lib/models/FixBoard";
import Test from "@/lib/models/Test";

const FIX_BOARD_KEY = "global";

const FixReportSchema = z.object({
  testId: z.string().min(1),
  questionId: z.string().min(1),
  section: z.string().min(1),
  module: z.number().int().positive(),
  questionNumber: z.number().int().positive(),
  errorType: z.enum(["Question", "Answers", "Missing Graph/Image"]),
  note: z.string().trim().max(500).optional().or(z.literal("")),
  source: z.enum(["test", "review"]).default("test"),
});

async function getFixBoardDocument() {
  return FixBoard.findOneAndUpdate(
    { key: FIX_BOARD_KEY },
    { $setOnInsert: { board: emptyFixBoard } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

function createUniqueId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildCardTitle(card: Pick<FixCard, "section" | "module" | "questionNumber" | "testTitle">) {
  return card.testTitle;
}

function appendReportToBoard(
  board: FixBoardState,
  payload: z.infer<typeof FixReportSchema>,
  report: FixReportEntry,
  testTitle: string,
) {
  const existingCard = Object.values(board.cards).find(
    (card) => card.testId === payload.testId && card.questionId === payload.questionId,
  );

  if (existingCard) {
    const alreadyReportedByUser = existingCard.reports.some((item) => item.reporterId && item.reporterId === report.reporterId);
    if (alreadyReportedByUser) {
      return {
        board,
        duplicate: true,
      };
    }

    const nextCard: FixCard = {
      ...existingCard,
      testTitle: testTitle || existingCard.testTitle,
      reportCount: existingCard.reportCount + 1,
      reports: [report, ...existingCard.reports],
      text: buildCardTitle({
        ...existingCard,
        testTitle: testTitle || existingCard.testTitle,
      }),
    };

    return {
      board: {
        ...board,
        cards: {
          ...board.cards,
          [existingCard.id]: nextCard,
        },
      },
      duplicate: false,
    };
  }

  const cardId = createUniqueId("fix");
  const nextCard: FixCard = {
    id: cardId,
    createdAt: report.createdAt,
    testId: payload.testId,
    questionId: payload.questionId,
    testTitle,
    section: payload.section,
    module: payload.module,
    questionNumber: payload.questionNumber,
    reportCount: 1,
    reports: [report],
    text: "",
  };

  nextCard.text = buildCardTitle(nextCard);

  return {
    board: {
      ...board,
      inboxIds: [...board.inboxIds, cardId],
      cards: {
        ...board.cards,
        [cardId]: nextCard,
      },
    },
    duplicate: false,
  };
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const payload = FixReportSchema.parse(body);

    await dbConnect();

    const [document, test] = await Promise.all([
      getFixBoardDocument(),
      Test.findById(payload.testId).select("title").lean<{ title?: string } | null>(),
    ]);

    const board = normalizeFixBoard(document.board);
    const report: FixReportEntry = {
      id: createUniqueId("report"),
      reporterId: session.user.id,
      reporterName: session.user.name ?? undefined,
      reporterEmail: session.user.email ?? undefined,
      errorType: payload.errorType,
      note: payload.note?.trim() || undefined,
      source: payload.source,
      createdAt: new Date().toISOString(),
    };

    const { board: nextBoard, duplicate } = appendReportToBoard(board, payload, report, test?.title || "Unknown Test");
    if (duplicate) {
      return NextResponse.json({ error: "You have already reported this question." }, { status: 409 });
    }

    document.board = nextBoard;
    await document.save();

    return NextResponse.json({ message: "Report submitted", board: nextBoard }, { status: 201 });
  } catch (error) {
    console.error("POST /api/fix-reports error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid report payload", details: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}
