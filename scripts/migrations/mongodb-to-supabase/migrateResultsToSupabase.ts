import { MongoClient } from "mongodb";

import { normalizeSectionName } from "../../../lib/sections";
import { createSupabaseAdminClient } from "../../../lib/supabase/admin";

type MongoAnswer = {
  questionId?: { toString(): string };
  userAnswer?: string;
  isCorrect: boolean;
  errorReason?: string;
};

type MongoResult = {
  _id: { toString(): string };
  userId?: { toString(): string };
  testId?: { toString(): string };
  isSectional?: boolean;
  sectionalSubject?: string;
  sectionalModule?: number;
  answers?: MongoAnswer[];
  score?: number;
  totalScore?: number;
  readingScore?: number;
  mathScore?: number;
  date?: Date;
  createdAt?: Date;
};

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function isOmittedAnswer(value: string | undefined) {
  const normalized = value?.trim();
  return !normalized || normalized === "Omitted";
}

function makeOptionLookupKey(questionId: string, value: string) {
  return `${questionId}::${value.trim()}`;
}

async function main() {
  const mongoUri = getRequiredEnv("MONGODB_URI");
  const mongoClient = new MongoClient(mongoUri);
  const supabase = createSupabaseAdminClient();

  await mongoClient.connect();

  try {
    const results = (await mongoClient.db().collection("results").find({}).sort({ createdAt: 1, _id: 1 }).toArray()) as MongoResult[];

    const [profilesResult, testsResult, questionsResult, sectionsResult, optionsResult, reasonsResult] = await Promise.all([
      supabase.from("profiles").select("id,legacy_mongo_id"),
      supabase.from("tests").select("id,legacy_mongo_id"),
      supabase.from("questions").select("id,legacy_mongo_id,question_type"),
      supabase.from("test_sections").select("id,test_id,name,module_number"),
      supabase.from("question_options").select("id,question_id,option_text,display_order"),
      supabase.from("user_review_reasons").select("id,user_id,label"),
    ]);

    if (profilesResult.error || !profilesResult.data) {
      throw new Error(`Failed to load profiles: ${profilesResult.error?.message ?? "unknown error"}`);
    }

    if (testsResult.error || !testsResult.data) {
      throw new Error(`Failed to load tests: ${testsResult.error?.message ?? "unknown error"}`);
    }

    if (questionsResult.error || !questionsResult.data) {
      throw new Error(`Failed to load questions: ${questionsResult.error?.message ?? "unknown error"}`);
    }

    if (sectionsResult.error || !sectionsResult.data) {
      throw new Error(`Failed to load sections: ${sectionsResult.error?.message ?? "unknown error"}`);
    }

    if (optionsResult.error || !optionsResult.data) {
      throw new Error(`Failed to load options: ${optionsResult.error?.message ?? "unknown error"}`);
    }

    if (reasonsResult.error || !reasonsResult.data) {
      throw new Error(`Failed to load review reasons: ${reasonsResult.error?.message ?? "unknown error"}`);
    }

    const profileMap = new Map(profilesResult.data.filter((row) => row.legacy_mongo_id).map((row) => [row.legacy_mongo_id!, row.id]));
    const testMap = new Map(testsResult.data.filter((row) => row.legacy_mongo_id).map((row) => [row.legacy_mongo_id!, row.id]));
    const questionMap = new Map(questionsResult.data.filter((row) => row.legacy_mongo_id).map((row) => [row.legacy_mongo_id!, row]));
    const sectionMap = new Map(sectionsResult.data.map((row) => [`${row.test_id}::${row.name}::${row.module_number ?? 0}`, row.id]));
    const optionMap = new Map<string, string>();
    const reasonMap = new Map(reasonsResult.data.map((row) => [`${row.user_id}::${row.label.trim()}`, row.id]));

    for (const option of optionsResult.data) {
      optionMap.set(makeOptionLookupKey(option.question_id, option.option_text), option.id);
      optionMap.set(makeOptionLookupKey(option.question_id, `choice_${option.display_order - 1}`), option.id);
    }

    let migratedAttempts = 0;
    let skippedAttempts = 0;
    let skippedAnswers = 0;

    for (const result of results) {
      const legacyResultId = result._id.toString();
      const profileId = result.userId ? profileMap.get(result.userId.toString()) : null;
      const testId = result.testId ? testMap.get(result.testId.toString()) : null;

      if (!profileId || !testId) {
        skippedAttempts += 1;
        continue;
      }

      const sectionId = result.isSectional
        ? sectionMap.get(`${testId}::${normalizeSectionName(result.sectionalSubject)}::${result.sectionalModule ?? 0}`) ?? null
        : null;

      const { data: savedAttempt, error: attemptError } = await supabase
        .from("test_attempts")
        .upsert(
          {
            legacy_mongo_id: legacyResultId,
            user_id: profileId,
            test_id: testId,
            mode: result.isSectional ? "sectional" : "full",
            section_id: sectionId,
            submitted_at: (result.createdAt ?? result.date ?? new Date()).toISOString(),
            score: result.score ?? null,
            total_score: result.totalScore ?? null,
            reading_score: result.readingScore ?? null,
            math_score: result.mathScore ?? null,
          },
          { onConflict: "legacy_mongo_id" }
        )
        .select("id")
        .single();

      if (attemptError || !savedAttempt) {
        throw new Error(`Failed to upsert result ${legacyResultId}: ${attemptError?.message ?? "unknown error"}`);
      }

      await supabase.from("attempt_answers").delete().eq("attempt_id", savedAttempt.id);

      for (const answer of result.answers ?? []) {
        const question = answer.questionId ? questionMap.get(answer.questionId.toString()) : null;
        if (!question) {
          skippedAnswers += 1;
          continue;
        }

        const rawUserAnswer = answer.userAnswer?.trim();
        const omitted = isOmittedAnswer(rawUserAnswer);
        const selectedOptionId = !omitted && question.question_type === "multiple_choice"
          ? optionMap.get(makeOptionLookupKey(question.id, rawUserAnswer ?? "")) ?? null
          : null;
        const textAnswer = !omitted && question.question_type === "spr" ? rawUserAnswer ?? null : null;

        const { data: savedAnswer, error: answerError } = await supabase
          .from("attempt_answers")
          .insert({
            attempt_id: savedAttempt.id,
            question_id: question.id,
            selected_option_id: selectedOptionId,
            text_answer: textAnswer,
            is_correct: answer.isCorrect,
          })
          .select("id")
          .single();

        if (answerError || !savedAnswer) {
          throw new Error(`Failed to insert attempt answer for result ${legacyResultId}: ${answerError?.message ?? "unknown error"}`);
        }

        const normalizedReason = answer.errorReason?.trim();
        if (normalizedReason) {
          const reasonId = reasonMap.get(`${profileId}::${normalizedReason}`);
          if (reasonId) {
            const { error: reasonError } = await supabase.from("attempt_answer_reasons").insert({
              attempt_answer_id: savedAnswer.id,
              review_reason_id: reasonId,
            });

            if (reasonError) {
              throw new Error(`Failed to insert attempt answer reason for result ${legacyResultId}: ${reasonError.message}`);
            }
          }
        }
      }

      migratedAttempts += 1;
    }

    console.log(`Migrated ${migratedAttempts} attempts. Skipped ${skippedAttempts} attempts and ${skippedAnswers} answers due to missing mapped relations.`);
  } finally {
    await mongoClient.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
