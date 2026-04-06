import { z } from "zod";

import dbConnect from "@/lib/mongodb";
import Question from "@/lib/models/Question";
import Test from "@/lib/models/Test";
import redis from "@/lib/redis";
import { TestValidationSchema, type TestInput } from "@/lib/schema/test";

type SortableTestField = "createdAt" | "title";

const CACHE_TTL_SECONDS = 3600;

function getTestsCacheKey(page: number, limit: number, sortBy: SortableTestField, sortOrder: "asc" | "desc") {
  return `tests:page:${page}:limit:${limit}:sortBy:${sortBy}:sortOrder:${sortOrder}`;
}

async function deleteCacheKeys(keys: Array<string | null | undefined>) {
  const uniqueKeys = [...new Set(keys.filter((key): key is string => Boolean(key)))];

  if (uniqueKeys.length > 0) {
    await redis.del(...uniqueKeys);
  }
}

async function deleteCacheKeysByPattern(pattern: string) {
  const keys = await redis.keys(pattern);

  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

export const testService = {
  async getTests(page: number, limit: number, sortBy: string, sortOrder: string) {
    const normalizedSortBy: SortableTestField = sortBy === "title" ? "title" : "createdAt";
    const normalizedSortOrder: "asc" | "desc" = sortOrder === "asc" ? "asc" : "desc";
    const cacheKey = getTestsCacheKey(page, limit, normalizedSortBy, normalizedSortOrder);
    const cachedTests = await redis.get(cacheKey);

    if (cachedTests) {
      return JSON.parse(cachedTests);
    }

    await dbConnect();

    const skip = (page - 1) * limit;
    const sortDirection = normalizedSortOrder === "asc" ? 1 : -1;
    const sortObj: Record<SortableTestField, 1 | -1> = {
      createdAt: normalizedSortBy === "createdAt" ? sortDirection : -1,
      title: normalizedSortBy === "title" ? sortDirection : 1,
    };

    const totalTests = await Test.countDocuments({});
    const tests = await Test.find({}).sort(sortObj).skip(skip).limit(limit).lean();

    const testIds = tests.map((test) => test._id);
    const questionCountsData = await Question.aggregate([
      { $match: { testId: { $in: testIds } } },
      {
        $group: {
          _id: { testId: "$testId", section: "$section", module: "$module" },
          count: { $sum: 1 },
        },
      },
    ]);

    const testsWithCounts = tests.map((test) => {
      const counts = { rw_1: 0, rw_2: 0, math_1: 0, math_2: 0 };

      questionCountsData.forEach((questionCount) => {
        if (questionCount._id.testId.toString() === test._id.toString()) {
          const sectionPrefix = questionCount._id.section === "Reading and Writing" ? "rw" : "math";
          const key = `${sectionPrefix}_${questionCount._id.module}` as keyof typeof counts;
          counts[key] = questionCount.count;
        }
      });

      return { ...test, questionCounts: counts };
    });

    const result = {
      tests: testsWithCounts,
      pagination: {
        total: totalTests,
        page,
        limit,
        totalPages: Math.ceil(totalTests / limit),
      },
    };

    await redis.set(cacheKey, JSON.stringify(result), "EX", CACHE_TTL_SECONDS);

    return result;
  },

  async createTest(data: unknown) {
    try {
      const validatedData: TestInput = TestValidationSchema.parse(data);
      await dbConnect();
      const newTest = await Test.create(validatedData);

      await Promise.all([
        deleteCacheKeys([`test:${newTest._id.toString()}`]),
        deleteCacheKeysByPattern("tests:*"),
      ]);

      return newTest;
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
