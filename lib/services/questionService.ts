import { z } from "zod";

import dbConnect from "@/lib/mongodb";
import Question from "@/lib/models/Question";
import Test from "@/lib/models/Test";
import redis from "@/lib/redis";
import { QuestionValidationSchema } from "@/lib/schema/question";

const CACHE_TTL_SECONDS = 3600;

function getQuestionListCacheKey(testId?: string | null) {
  return testId ? `questions:test:${testId}` : "all_questions";
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

export const questionService = {
  async getQuestions(testId?: string | null) {
    const cacheKey = getQuestionListCacheKey(testId);
    const cachedQuestions = await redis.get(cacheKey);

    if (cachedQuestions) {
      return JSON.parse(cachedQuestions);
    }

    await dbConnect();

    const query = testId ? { testId } : {};
    const questions = await Question.find(query).lean();

    await redis.set(cacheKey, JSON.stringify(questions), "EX", CACHE_TTL_SECONDS);

    return questions;
  },

  async createQuestion(data: unknown) {
    try {
      const validatedData = QuestionValidationSchema.parse(data);
      await dbConnect();

      const test = await Test.findById(validatedData.testId);
      if (!test) {
        throw new Error("Test not found");
      }

      const newQuestion = await Question.create(validatedData);

      if (!test.questions) {
        test.questions = [];
      }

      test.questions.push(newQuestion._id as (typeof test.questions)[number]);
      await test.save();

      await Promise.all([
        deleteCacheKeys([
          `question:${newQuestion._id.toString()}`,
          `test:${validatedData.testId}`,
          getQuestionListCacheKey(null),
          getQuestionListCacheKey(validatedData.testId),
        ]),
        deleteCacheKeysByPattern("tests:*"),
      ]);

      return newQuestion;
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
