import { MongoClient } from "mongodb";

import { normalizeReviewReasonCatalog } from "../../../lib/reviewReasonCatalog";
import { normalizeVocabBoard } from "../../../lib/vocabBoard";
import { createSupabaseAdminClient } from "../../../lib/supabase/admin";

type MongoUserData = {
  _id: { toString(): string };
  reviewReasonCatalog?: unknown;
  vocabBoard?: unknown;
};

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function main() {
  const mongoUri = getRequiredEnv("MONGODB_URI");
  const mongoClient = new MongoClient(mongoUri);
  const supabase = createSupabaseAdminClient();

  await mongoClient.connect();

  try {
    const users = (await mongoClient
      .db()
      .collection("users")
      .find({}, { projection: { reviewReasonCatalog: 1, vocabBoard: 1 } })
      .toArray()) as MongoUserData[];

    const [{ data: profiles, error: profileError }, { data: questions, error: questionError }] = await Promise.all([
      supabase.from("profiles").select("id,legacy_mongo_id"),
      supabase.from("questions").select("id,legacy_mongo_id"),
    ]);

    if (profileError || !profiles) {
      throw new Error(`Failed to load profiles: ${profileError?.message ?? "unknown error"}`);
    }

    if (questionError || !questions) {
      throw new Error(`Failed to load question legacy ids: ${questionError?.message ?? "unknown error"}`);
    }

    const profileMap = new Map(profiles.filter((profile) => profile.legacy_mongo_id).map((profile) => [profile.legacy_mongo_id!, profile.id]));
    const questionMap = new Map(questions.filter((question) => question.legacy_mongo_id).map((question) => [question.legacy_mongo_id!, question.id]));

    let migratedReasonUsers = 0;
    let migratedVocabUsers = 0;

    for (const user of users) {
      const profileId = profileMap.get(user._id.toString());
      if (!profileId) {
        console.warn(`Skipping user ${user._id.toString()} because no Supabase profile was found.`);
        continue;
      }

      const reviewReasons = normalizeReviewReasonCatalog(user.reviewReasonCatalog);
      await supabase.from("user_review_reasons").delete().eq("user_id", profileId);
      const { error: reasonInsertError } = await supabase.from("user_review_reasons").insert(
        reviewReasons.map((reason) => ({
          user_id: profileId,
          label: reason.label,
          color: reason.color,
          sort_order: reason.order,
          is_active: true,
        }))
      );

      if (reasonInsertError) {
        throw new Error(`Failed to migrate review reasons for user ${user._id.toString()}: ${reasonInsertError.message}`);
      }

      migratedReasonUsers += 1;

      const board = normalizeVocabBoard(user.vocabBoard);
      await supabase.from("vocab_cards").delete().eq("user_id", profileId);
      await supabase.from("vocab_columns").delete().eq("user_id", profileId);

      const insertedColumns = new Map<string, string>();
      for (const [index, column] of board.columns.entries()) {
        const { data: insertedColumn, error: columnError } = await supabase
          .from("vocab_columns")
          .insert({
            user_id: profileId,
            title: column.title,
            color_key: column.colorKey,
            sort_order: index,
          })
          .select("id")
          .single();

        if (columnError || !insertedColumn) {
          throw new Error(`Failed to migrate vocab column ${column.id} for user ${user._id.toString()}: ${columnError?.message ?? "unknown error"}`);
        }

        insertedColumns.set(column.id, insertedColumn.id);
      }

      const insertedCards = new Map<string, string>();
      for (const card of Object.values(board.cards)) {
        const { data: insertedCard, error: cardError } = await supabase
          .from("vocab_cards")
          .insert({
            user_id: profileId,
            source_question_id: card.sourceQuestionId ? questionMap.get(card.sourceQuestionId) ?? null : null,
            term: card.term,
            definition: card.definition,
            audio_url: card.audioUrl ?? null,
          })
          .select("id")
          .single();

        if (cardError || !insertedCard) {
          throw new Error(`Failed to migrate vocab card ${card.id} for user ${user._id.toString()}: ${cardError?.message ?? "unknown error"}`);
        }

        insertedCards.set(card.id, insertedCard.id);
      }

      for (const [positionIndex, cardId] of board.inboxIds.entries()) {
        const insertedCardId = insertedCards.get(cardId);
        if (!insertedCardId) {
          continue;
        }

        const { error: positionError } = await supabase.from("vocab_card_positions").insert({
          card_id: insertedCardId,
          column_id: null,
          is_inbox: true,
          position_index: positionIndex,
        });

        if (positionError) {
          throw new Error(`Failed to migrate inbox vocab position for user ${user._id.toString()}: ${positionError.message}`);
        }
      }

      for (const column of board.columns) {
        const insertedColumnId = insertedColumns.get(column.id);
        if (!insertedColumnId) {
          continue;
        }

        for (const [positionIndex, cardId] of column.cardIds.entries()) {
          const insertedCardId = insertedCards.get(cardId);
          if (!insertedCardId) {
            continue;
          }

          const { error: positionError } = await supabase.from("vocab_card_positions").insert({
            card_id: insertedCardId,
            column_id: insertedColumnId,
            is_inbox: false,
            position_index: positionIndex,
          });

          if (positionError) {
            throw new Error(`Failed to migrate column vocab position for user ${user._id.toString()}: ${positionError.message}`);
          }
        }
      }

      migratedVocabUsers += 1;
    }

    console.log(`Migrated review reasons for ${migratedReasonUsers} users and vocab boards for ${migratedVocabUsers} users.`);
  } finally {
    await mongoClient.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
