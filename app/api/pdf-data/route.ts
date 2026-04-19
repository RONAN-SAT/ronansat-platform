import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSectionQueryNames, normalizeSectionName } from "@/lib/sections";

function normalizeSection(rawSection: string | null): string | undefined {
  return normalizeSectionName(rawSection) || undefined;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const testId = searchParams.get("testId");
    const sectionName = normalizeSection(searchParams.get("section"));

    if (!testId) {
      return NextResponse.json({ error: "Missing testId" }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const sectionNames = getSectionQueryNames(sectionName);

    const [rawTest, rawQuestions] = await Promise.all([
      supabase.from("tests").select("id,title").eq("id", testId).maybeSingle(),
      supabase
        .from("questions")
        .select(
          `
            id,
            question_type,
            question_text,
            passage,
            explanation,
            difficulty,
            points,
            domain,
            skill,
            image_url,
            extra,
            question_options (
              id,
              option_text,
              display_order
            ),
            question_correct_options (
              option_id
            ),
            question_spr_accepted_answers (
              accepted_answer,
              display_order
            ),
            test_sections!inner (
              test_id,
              name,
              module_number
            )
          `
        )
        .eq("test_sections.test_id", testId),
    ]);

    if (rawTest.error || !rawTest.data?.title) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    const questions = (rawQuestions.data ?? [])
      .filter((question) => {
        if (!sectionNames.length) {
          return true;
        }

        const section = Array.isArray(question.test_sections) ? question.test_sections[0] : question.test_sections;
        return Boolean(section?.name && sectionNames.includes(section.name));
      })
      .map((question) => {
        const options = [...(question.question_options ?? [])].sort((left, right) => left.display_order - right.display_order);
        const correctOptionRelation = question.question_correct_options as { option_id?: string } | Array<{ option_id?: string }> | null;
        const correctOptionId = Array.isArray(correctOptionRelation)
          ? correctOptionRelation[0]?.option_id
          : correctOptionRelation?.option_id;
        const correctOption = options.find((option) => option.id === correctOptionId);
        const section = Array.isArray(question.test_sections) ? question.test_sections[0] : question.test_sections;

        return {
          _id: question.id,
          testId,
          section: section?.name,
          module: section?.module_number,
          questionType: question.question_type,
          questionText: question.question_text,
          passage: question.passage,
          choices: options.map((option) => option.option_text),
          correctAnswer: correctOption?.option_text,
          sprAnswers: [...(question.question_spr_accepted_answers ?? [])]
            .sort((left, right) => left.display_order - right.display_order)
            .map((answer) => answer.accepted_answer),
          explanation: question.explanation,
          difficulty: question.difficulty,
          points: question.points,
          domain: question.domain,
          skill: question.skill,
          imageUrl: question.image_url,
          extra: question.extra,
        };
      });

    if (!questions.length) {
      return NextResponse.json({ error: "No questions found for this test" }, { status: 404 });
    }

    return NextResponse.json(
      {
        testId: rawTest.data.id,
        testTitle: rawTest.data.title,
        questions,
        sectionName,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to fetch PDF data", error);
    return NextResponse.json({ error: "Failed to fetch PDF data" }, { status: 500 });
  }
}
