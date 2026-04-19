import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server";

import { emptyVocabBoard, normalizeVocabBoard } from "@/lib/vocabBoard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function buildBoard(userId: string) {
  const supabase = createSupabaseAdminClient();
  const [{ data: columns, error: columnsError }, { data: cards, error: cardsError }, { data: positions, error: positionsError }] = await Promise.all([
    supabase.from("vocab_columns").select("id,title,color_key,sort_order").eq("user_id", userId).order("sort_order", { ascending: true }),
    supabase.from("vocab_cards").select("id,term,definition,audio_url,source_question_id,created_at").eq("user_id", userId),
    supabase.from("vocab_card_positions").select("card_id,column_id,is_inbox,position_index"),
  ]);

  if (columnsError || cardsError || positionsError) {
    throw columnsError ?? cardsError ?? positionsError;
  }

  const cardMap = Object.fromEntries(
    (cards ?? []).map((card) => [
      card.id,
      {
        id: card.id,
        term: card.term,
        definition: card.definition,
        audioUrl: card.audio_url ?? undefined,
        createdAt: card.created_at,
        sourceQuestionId: card.source_question_id ?? undefined,
      },
    ])
  );

  const positionsByCardId = new Map((positions ?? []).map((position) => [position.card_id, position]));
  const board = {
    inboxIds: (positions ?? [])
      .filter((position) => position.is_inbox)
      .sort((left, right) => left.position_index - right.position_index)
      .map((position) => position.card_id)
      .filter((cardId) => Boolean(cardMap[cardId])),
    columns: (columns ?? []).map((column) => ({
      id: column.id,
      title: column.title,
      colorKey: column.color_key,
      cardIds: (cards ?? [])
        .filter((card) => positionsByCardId.get(card.id)?.column_id === column.id)
        .sort((left, right) => (positionsByCardId.get(left.id)?.position_index ?? 0) - (positionsByCardId.get(right.id)?.position_index ?? 0))
        .map((card) => card.id),
    })),
    cards: cardMap,
  };

  return normalizeVocabBoard(board);
}

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const board = await buildBoard(session.user.id);
    return NextResponse.json({ board: normalizeVocabBoard(board ?? emptyVocabBoard) }, { status: 200 });
  } catch (error) {
    console.error("GET /api/user/vocab-board error:", error);
    return NextResponse.json({ error: "Failed to load vocab board" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const board = normalizeVocabBoard(body?.board);
    const supabase = createSupabaseAdminClient();

    await supabase.from("vocab_cards").delete().eq("user_id", session.user.id);
    await supabase.from("vocab_columns").delete().eq("user_id", session.user.id);

    const columnIdMap = new Map<string, string>();
    for (const [index, column] of board.columns.entries()) {
      const { data: insertedColumn, error: columnError } = await supabase
        .from("vocab_columns")
        .insert({
          user_id: session.user.id,
          title: column.title,
          color_key: column.colorKey,
          sort_order: index,
        })
        .select("id")
        .single();

      if (columnError || !insertedColumn) {
        throw columnError ?? new Error("Failed to save vocab column");
      }

      columnIdMap.set(column.id, insertedColumn.id);
    }

    const cardIdMap = new Map<string, string>();
    for (const card of Object.values(board.cards)) {
      const { data: insertedCard, error: cardError } = await supabase
        .from("vocab_cards")
        .insert({
          user_id: session.user.id,
          source_question_id: card.sourceQuestionId ?? null,
          term: card.term,
          definition: card.definition,
          audio_url: card.audioUrl ?? null,
        })
        .select("id")
        .single();

      if (cardError || !insertedCard) {
        throw cardError ?? new Error("Failed to save vocab card");
      }

      cardIdMap.set(card.id, insertedCard.id);
    }

    for (const [positionIndex, legacyCardId] of board.inboxIds.entries()) {
      const cardId = cardIdMap.get(legacyCardId);
      if (!cardId) {
        continue;
      }

      const { error } = await supabase.from("vocab_card_positions").insert({
        card_id: cardId,
        column_id: null,
        is_inbox: true,
        position_index: positionIndex,
      });

      if (error) {
        throw error;
      }
    }

    for (const column of board.columns) {
      const columnId = columnIdMap.get(column.id);
      if (!columnId) {
        continue;
      }

      for (const [positionIndex, legacyCardId] of column.cardIds.entries()) {
        const cardId = cardIdMap.get(legacyCardId);
        if (!cardId) {
          continue;
        }

        const { error } = await supabase.from("vocab_card_positions").insert({
          card_id: cardId,
          column_id: columnId,
          is_inbox: false,
          position_index: positionIndex,
        });

        if (error) {
          throw error;
        }
      }
    }

    return NextResponse.json({ message: "Vocab board saved", board: await buildBoard(session.user.id) }, { status: 200 });
  } catch (error) {
    console.error("PUT /api/user/vocab-board error:", error);
    return NextResponse.json({ error: "Failed to save vocab board" }, { status: 500 });
  }
}
