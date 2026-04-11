import { Types } from "mongoose";
import { z } from "zod";

import dbConnect from "@/lib/mongodb";
import Question from "@/lib/models/Question";
import Test from "@/lib/models/Test";
import redis from "@/lib/redis";
import { TestValidationSchema, type TestInput } from "@/lib/schema/test";

type SortableTestField = "createdAt" | "title";
const TESTS_CACHE_TTL_SECONDS = 120;

function getTestsCacheKey(page: number, limit: number, sortBy: SortableTestField, sortOrder: "asc" | "desc") {
  return `tests:page:${page}:limit:${limit}:sortBy:${sortBy}:sortOrder:${sortOrder}`;
}

function getTestCacheKey(testId: string) {
  return `test:${testId}`;
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

async function getQuestionCountsForTests(testIds: Types.ObjectId[]) {
  const questionCountsData = await Question.aggregate([
    { $match: { testId: { $in: testIds } } },
    {
      $group: {
        _id: { testId: "$testId", section: "$section", module: "$module" },
        count: { $sum: 1 },
      },
    },
  ]);

  return questionCountsData;
}

function attachQuestionCounts<T extends { _id: Types.ObjectId }>(
  tests: T[],
  questionCountsData: Array<{
    _id: { testId: Types.ObjectId; section: string; module: number };
    count: number;
  }>
) {
  return tests.map((test) => {
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
}

async function invalidateTestCaches(testId?: string) {
  await Promise.all([
    deleteCacheKeys([testId ? getTestCacheKey(testId) : null]),
    deleteCacheKeysByPattern("tests:*"),
  ]);
}

export const testService = {
  async getTests(page: number, limit: number, sortBy: string, sortOrder: string) {
    const normalizedSortBy: SortableTestField = sortBy === "title" ? "title" : "createdAt";
    const normalizedSortOrder: "asc" | "desc" = sortOrder === "asc" ? "asc" : "desc";
    const cacheKey = getTestsCacheKey(page, limit, normalizedSortBy, normalizedSortOrder);
    const cachedTests = await redis.get(cacheKey);

    if (cachedTests) {
      const ttl = await redis.ttl(cacheKey);

      if (ttl > 0) {
        return JSON.parse(cachedTests);
      }

      await redis.del(cacheKey);
    }

    await dbConnect();

    const usePagination = Number.isFinite(limit) && limit > 0;
    const skip = usePagination ? (page - 1) * limit : 0;
    const sortDirection = normalizedSortOrder === "asc" ? 1 : -1;
    const sortObj: Record<SortableTestField, 1 | -1> = {
      createdAt: normalizedSortBy === "createdAt" ? sortDirection : -1,
      title: normalizedSortBy === "title" ? sortDirection : 1,
    };

    const totalTests = await Test.countDocuments({});
    let testsQuery = Test.find({}).sort(sortObj).skip(skip);

    if (usePagination) {
      testsQuery = testsQuery.limit(limit);
    }

    const tests = await testsQuery.lean();
    const questionCountsData = await getQuestionCountsForTests(tests.map((test) => test._id as Types.ObjectId));
    const testsWithCounts = attachQuestionCounts(tests, questionCountsData);

    const result = {
      tests: testsWithCounts,
      pagination: {
        total: totalTests,
        page,
        limit: usePagination ? limit : totalTests,
        totalPages: usePagination ? Math.ceil(totalTests / limit) : 1,
      },
    };

    await redis.set(cacheKey, JSON.stringify(result), "EX", TESTS_CACHE_TTL_SECONDS);

    return result;
  },

  async getTestById(testId: string) {
    const cacheKey = getTestCacheKey(testId);
    const cachedTest = await redis.get(cacheKey);

    if (cachedTest) {
      const ttl = await redis.ttl(cacheKey);

      if (ttl > 0) {
        return JSON.parse(cachedTest);
      }

      await redis.del(cacheKey);
    }

    await dbConnect();

    const test = await Test.findById(testId).lean();
    if (!test) {
      throw new Error("Test not found");
    }

    const questionCountsData = await getQuestionCountsForTests([test._id as Types.ObjectId]);
    const [testWithCounts] = attachQuestionCounts([test], questionCountsData);

    await redis.set(cacheKey, JSON.stringify(testWithCounts), "EX", TESTS_CACHE_TTL_SECONDS);

    return testWithCounts;
  },

  async createTest(data: unknown) {
    try {
      const validatedData: TestInput = TestValidationSchema.parse(data);
      
      if (!validatedData.timeLimit) {
        validatedData.timeLimit = validatedData.sections.reduce((acc, sec) => acc + sec.timeLimit, 0);
      }

      await dbConnect();
      const newTest = await Test.create(validatedData);

      await invalidateTestCaches(newTest._id.toString());

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
