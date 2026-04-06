import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import Question from "@/lib/models/Question";
import Result from "@/lib/models/Result";
import Test from "@/lib/models/Test";
import User from "@/lib/models/User";

type SessionUser = {
  id?: string;
  role?: string;
};

type TestLean = {
  _id: mongoose.Types.ObjectId;
  title: string;
  timeLimit?: number;
};

type QuestionLean = {
  _id: mongoose.Types.ObjectId;
  section?: string;
};

type ResultAnswerLean = {
  questionId: mongoose.Types.ObjectId;
  isCorrect: boolean;
};

type ResultLean = {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  testId: mongoose.Types.ObjectId;
  answers: ResultAnswerLean[];
  totalScore?: number;
  readingScore?: number;
  mathScore?: number;
  score?: number;
  date?: Date;
  createdAt?: Date;
  isSectional?: boolean;
};

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as SessionUser | undefined;

    if (!sessionUser?.id || sessionUser.role !== "PARENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();

    const parent = await User.findById(sessionUser.id)
      .select("childrenIds email name")
      .lean<{ childrenIds?: mongoose.Types.ObjectId[]; email?: string; name?: string } | null>();

    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    const childrenIds = parent.childrenIds ?? [];

    if (childrenIds.length === 0) {
      return NextResponse.json(
        {
          hasChildren: false,
          child: null,
          scoreTrend: [],
          strengths: [],
          activity: {
            testsCompleted: 0,
            totalTimeSpent: 0,
          },
          activityLog: [],
          goal: {
            currentScore: 0,
            targetScore: 1500,
          },
        },
        { status: 200 }
      );
    }

    const childId = childrenIds[0];

    const child = await User.findById(childId)
      .select("name email highestScore lastTestDate")
      .lean<{
        _id: mongoose.Types.ObjectId;
        name?: string;
        email: string;
        highestScore?: number;
        lastTestDate?: Date;
      } | null>();

    if (!child) {
      return NextResponse.json(
        {
          hasChildren: false,
          child: null,
          scoreTrend: [],
          strengths: [],
          activity: {
            testsCompleted: 0,
            totalTimeSpent: 0,
          },
          activityLog: [],
          goal: {
            currentScore: 0,
            targetScore: 1500,
          },
        },
        { status: 200 }
      );
    }

    const rawResults = await Result.find({ userId: child._id })
      .sort({ createdAt: 1 })
      .select(
        "userId testId answers totalScore readingScore mathScore score date createdAt isSectional"
      )
      .lean<ResultLean[]>();

    const testIds = Array.from(
      new Set(rawResults.map((result) => result.testId?.toString()).filter(Boolean))
    );

    const questionIds = Array.from(
      new Set(
        rawResults
          .flatMap((result) => result.answers ?? [])
          .map((answer) => answer.questionId?.toString())
          .filter(Boolean)
      )
    );

    const [tests, questions] = await Promise.all([
      Test.find({ _id: { $in: testIds } })
        .select("title timeLimit")
        .lean<TestLean[]>(),
      Question.find({ _id: { $in: questionIds } })
        .select("section")
        .lean<QuestionLean[]>(),
    ]);

    const testMap = new Map(tests.map((test) => [test._id.toString(), test]));
    const questionMap = new Map(questions.map((question) => [question._id.toString(), question]));

    const scoreTrend = rawResults.map((result) => {
      const occurredAt = result.createdAt ?? result.date ?? new Date();
      return {
        date: new Date(occurredAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        total: result.totalScore ?? result.score ?? 0,
        math: result.mathScore ?? 0,
        rw: result.readingScore ?? result.score ?? 0,
      };
    });

    const subjectBuckets = new Map<string, { total: number; correct: number }>();

    rawResults.forEach((result) => {
      result.answers.forEach((answer) => {
        const question = questionMap.get(answer.questionId.toString());
        const subject = question?.section?.trim() || "General";
        const bucket = subjectBuckets.get(subject) ?? { total: 0, correct: 0 };
        bucket.total += 1;
        if (answer.isCorrect) {
          bucket.correct += 1;
        }
        subjectBuckets.set(subject, bucket);
      });
    });

    const strengths = Array.from(subjectBuckets.entries())
      .map(([subject, stats]) => ({
        subject,
        correctRate: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      }))
      .sort((a, b) => b.correctRate - a.correctRate);

    const activityLog = rawResults
      .slice()
      .reverse()
      .map((result) => {
        const test = testMap.get(result.testId.toString());
        const score = result.totalScore ?? result.score ?? 0;
        const timeSpent = test?.timeLimit ?? 0;
        return {
          date: new Date(result.createdAt ?? result.date ?? new Date()).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          testName: test?.title ?? "Practice Test",
          score,
          timeSpent,
          status: score >= 1400 ? "Excellent" : score >= 1200 ? "On Track" : "Needs Support",
        };
      });

    const activity = {
      testsCompleted: rawResults.length,
      totalTimeSpent: rawResults.reduce((sum, result) => {
        const test = testMap.get(result.testId.toString());
        return sum + (test?.timeLimit ?? 0);
      }, 0),
    };

    const latestResult = rawResults[rawResults.length - 1];
    const currentScore =
      latestResult?.totalScore ??
      latestResult?.score ??
      child.highestScore ??
      0;

    return NextResponse.json(
      {
        hasChildren: true,
        child: {
          id: child._id.toString(),
          name: child.name ?? "Student",
          email: child.email,
        },
        scoreTrend,
        strengths,
        activity,
        activityLog,
        goal: {
          currentScore,
          targetScore: 1500,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/parent/dashboard error:", error);
    return NextResponse.json({ error: "Failed to load parent dashboard" }, { status: 500 });
  }
}
