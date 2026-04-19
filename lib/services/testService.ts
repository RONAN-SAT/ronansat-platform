import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { MATH_SECTION, VERBAL_SECTION, isVerbalSection } from "@/lib/sections";
import { TestValidationSchema, type TestInput } from "@/lib/schema/test";

type SortableTestField = "createdAt" | "title";
type TestFilters = {
  period?: string | null;
  subject?: string | null;
};

type RawTestRow = {
  id: string;
  title: string;
  difficulty: string | null;
  time_limit_minutes: number;
  created_at: string;
  test_sections: Array<{
    id: string;
    name: string;
    module_number: number | null;
    question_count: number;
    time_limit_minutes: number;
    display_order: number;
  }> | null;
};

const MONTH_INDEX: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

function getTestPeriodLabel(title: string) {
  const parts = title.split(" ");
  if (parts.length >= 2) {
    return `${parts[0]} ${parts[1]}`;
  }

  return "Other";
}

function getPeriodSortValue(period: string) {
  if (period === "Other") {
    return -1;
  }

  const [monthLabel, yearLabel] = period.split(" ");
  const month = MONTH_INDEX[monthLabel?.toLowerCase?.() ?? ""] ?? 0;
  const year = Number.parseInt(yearLabel ?? "", 10);

  if (!Number.isFinite(year)) {
    return -1;
  }

  return year * 100 + month;
}

function sortPeriods(periods: string[]) {
  return [...periods].sort((left, right) => {
    const diff = getPeriodSortValue(right) - getPeriodSortValue(left);
    if (diff !== 0) {
      return diff;
    }

    return left.localeCompare(right);
  });
}

function matchesPeriod(title: string, period?: string | null) {
  if (!period || period === "All") {
    return true;
  }

  if (period === "Other") {
    return !/^[A-Za-z]+ \d{4}\b/.test(title);
  }

  return title.toLowerCase().startsWith(period.toLowerCase());
}

function matchesSubject(sections: RawTestRow["test_sections"], subject?: string | null) {
  if (!subject) {
    return true;
  }

  const target = subject === "math" ? MATH_SECTION : VERBAL_SECTION;
  return (sections ?? []).some((section) => {
    if (section.question_count <= 0) {
      return false;
    }

    return target === MATH_SECTION ? section.name === MATH_SECTION : isVerbalSection(section.name);
  });
}

function toLegacyTestShape(test: RawTestRow) {
  const sections = [...(test.test_sections ?? [])]
    .sort((left, right) => left.display_order - right.display_order)
    .map((section) => ({
      name: section.name,
      questionsCount: section.question_count,
      timeLimit: section.time_limit_minutes,
    }));

  const questionCounts = { rw_1: 0, rw_2: 0, math_1: 0, math_2: 0 };
  for (const section of test.test_sections ?? []) {
    const moduleNumber = section.module_number ?? 0;
    if (moduleNumber !== 1 && moduleNumber !== 2) {
      continue;
    }

    const key = `${isVerbalSection(section.name) ? "rw" : "math"}_${moduleNumber}` as keyof typeof questionCounts;
    questionCounts[key] = section.question_count;
  }

  return {
    _id: test.id,
    title: test.title,
    timeLimit: test.time_limit_minutes,
    difficulty: test.difficulty ?? "medium",
    sections,
    questionCounts,
    createdAt: test.created_at,
  };
}

export const testService = {
  async getTests(page: number, limit: number, sortBy: string, sortOrder: string, filters: TestFilters = {}) {
    const supabase = createSupabaseAdminClient();
    const normalizedSortBy: SortableTestField = sortBy === "title" ? "title" : "createdAt";
    const normalizedSortOrder: "asc" | "desc" = sortOrder === "asc" ? "asc" : "desc";

    const { data, error } = await supabase
      .from("tests")
      .select(
        `
          id,
          title,
          difficulty,
          time_limit_minutes,
          created_at,
          test_sections (
            id,
            name,
            module_number,
            question_count,
            time_limit_minutes,
            display_order
          )
        `
      )
      .eq("visibility", "public")
      .eq("status", "published");

    if (error) {
      throw new Error(error.message);
    }

    const rows = (data ?? []) as RawTestRow[];
    const filtered = rows.filter((test) => matchesPeriod(test.title, filters.period) && matchesSubject(test.test_sections, filters.subject));
    const availablePeriods = ["All", ...sortPeriods(Array.from(new Set(rows.map((test) => getTestPeriodLabel(test.title)))))];

    filtered.sort((left, right) => {
      if (normalizedSortBy === "title") {
        return normalizedSortOrder === "asc" ? left.title.localeCompare(right.title) : right.title.localeCompare(left.title);
      }

      const diff = getPeriodSortValue(getTestPeriodLabel(right.title)) - getPeriodSortValue(getTestPeriodLabel(left.title));
      return normalizedSortOrder === "asc" ? -diff : diff;
    });

    const usePagination = Number.isFinite(limit) && limit > 0;
    const paged = usePagination ? filtered.slice((page - 1) * limit, (page - 1) * limit + limit) : filtered;

    return {
      tests: paged.map(toLegacyTestShape),
      availablePeriods,
      pagination: {
        total: filtered.length,
        page,
        limit: usePagination ? limit : filtered.length,
        totalPages: usePagination ? Math.max(1, Math.ceil(filtered.length / limit)) : 1,
      },
    };
  },

  async getTestById(testId: string) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("tests")
      .select(
        `
          id,
          title,
          difficulty,
          time_limit_minutes,
          created_at,
          test_sections (
            id,
            name,
            module_number,
            question_count,
            time_limit_minutes,
            display_order
          )
        `
      )
      .eq("id", testId)
      .maybeSingle();

    if (error || !data) {
      throw new Error("Test not found");
    }

    return toLegacyTestShape(data as RawTestRow);
  },

  async createTest(data: unknown) {
    try {
      const validatedData: TestInput = TestValidationSchema.parse(data);
      if (!validatedData.timeLimit) {
        validatedData.timeLimit = validatedData.sections.reduce((acc, sec) => acc + sec.timeLimit, 0);
      }

      const supabase = createSupabaseAdminClient();
      const { data: createdTest, error: testError } = await supabase
        .from("tests")
        .insert({
          title: validatedData.title,
          time_limit_minutes: validatedData.timeLimit,
          difficulty: validatedData.difficulty ?? "medium",
          visibility: "public",
          status: "published",
        })
        .select("id")
        .single();

      if (testError || !createdTest) {
        throw new Error(testError?.message ?? "Failed to create test");
      }

      const sectionRows = validatedData.sections.map((section, index) => ({
        test_id: createdTest.id,
        name: section.name,
        module_number: null,
        display_order: index + 1,
        question_count: section.questionsCount,
        time_limit_minutes: section.timeLimit,
      }));

      const { error: sectionError } = await supabase.from("test_sections").insert(sectionRows);
      if (sectionError) {
        throw new Error(sectionError.message);
      }

      return this.getTestById(createdTest.id);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const validationError = new Error("Validation Error") as Error & {
          errors: z.ZodIssue[];
          name: string;
        };
        validationError.errors = error.issues;
        validationError.name = "ZodError";
        throw validationError;
      }

      throw error;
    }
  },
};
