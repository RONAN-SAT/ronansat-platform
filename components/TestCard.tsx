import Link from "next/link";
import { Clock, GraduationCap, RotateCcw } from "lucide-react";

import DownloadPdfButton from "@/components/DownloadPdfButton";
import type { TestListItem, UserResultSummary } from "@/types/testLibrary";

interface TestCardProps {
  test: TestListItem;
  isSectional?: boolean;
  subjectFilter?: string;
  userResults?: UserResultSummary[];
}

function getResultTestId(result: UserResultSummary) {
  if (typeof result.testId === "string") {
    return result.testId;
  }

  return result.testId?._id ?? "";
}

function getLatestResult(results: UserResultSummary[]) {
  return [...results].sort(
    (left, right) =>
      new Date(right.createdAt ?? right.updatedAt ?? right.date ?? 0).getTime() -
      new Date(left.createdAt ?? left.updatedAt ?? left.date ?? 0).getTime(),
  )[0] ?? null;
}

function getFullLengthScore(result: UserResultSummary | null) {
  const rawScore = result?.totalScore ?? result?.score ?? 0;
  return Math.max(400, rawScore);
}

function getSectionalScore(result: UserResultSummary | null) {
  if (!result) {
    return 0;
  }

  if (result.answers) {
    return result.answers.filter((answer) => answer.isCorrect).length;
  }

  return result.score || result.totalScore || 0;
}

export default function TestCard({
  test,
  isSectional = false,
  subjectFilter,
  userResults = [],
}: TestCardProps) {
  const formattedSectionName = subjectFilter === "reading" ? "Reading and Writing" : "Math";

  const rw1Count = test.questionCounts?.rw_1 || 0;
  const rw2Count = test.questionCounts?.rw_2 || 0;
  const math1Count = test.questionCounts?.math_1 || 0;
  const math2Count = test.questionCounts?.math_2 || 0;

  let totalQuestions = 0;
  let totalTime = 0;

  if (isSectional) {
    if (subjectFilter === "reading") {
      if (rw1Count > 0) {
        totalQuestions += 27;
        totalTime += 32;
      }
      if (rw2Count > 0) {
        totalQuestions += 27;
        totalTime += 32;
      }
    } else if (subjectFilter === "math") {
      if (math1Count > 0) {
        totalQuestions += 22;
        totalTime += 35;
      }
      if (math2Count > 0) {
        totalQuestions += 22;
        totalTime += 35;
      }
    }
  } else {
    if (rw1Count > 0) {
      totalQuestions += 27;
      totalTime += 32;
    }
    if (rw2Count > 0) {
      totalQuestions += 27;
      totalTime += 32;
    }
    if (math1Count > 0) {
      totalQuestions += 22;
      totalTime += 35;
    }
    if (math2Count > 0) {
      totalQuestions += 22;
      totalTime += 35;
    }
  }

  const secPrefix = subjectFilter === "reading" ? "rw" : "math";
  const mod1Count = test.questionCounts?.[`${secPrefix}_1` as keyof NonNullable<TestListItem["questionCounts"]>] || 0;
  const mod2Count = test.questionCounts?.[`${secPrefix}_2` as keyof NonNullable<TestListItem["questionCounts"]>] || 0;

  if (isSectional && mod1Count === 0 && mod2Count === 0) {
    return null;
  }

  const latestFullLengthResult = getLatestResult(
    userResults.filter((result) => getResultTestId(result) === test._id && !result.isSectional),
  );

  const getModuleResult = (moduleNumber: number) =>
    getLatestResult(
      userResults.filter(
        (result) =>
          getResultTestId(result) === test._id &&
          result.sectionalSubject === formattedSectionName &&
          result.sectionalModule === moduleNumber,
      ),
    );

  const mod1Result = isSectional ? getModuleResult(1) : null;
  const mod2Result = isSectional ? getModuleResult(2) : null;

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:border-blue-200">
      <div className="flex-1 p-5">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-700">{test.title}</h3>
            {!isSectional && latestFullLengthResult ? (
              <div className="mt-2 inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                Last score: {getFullLengthScore(latestFullLengthResult)}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-4 space-y-2 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <span>{totalTime} Minutes Total</span>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-slate-400" />
            <span>{totalQuestions} Questions</span>
          </div>
        </div>
      </div>

      <div className="mt-auto border-t border-slate-100 bg-slate-50 p-4">
        {isSectional ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Module 1</span>
                {mod1Result && mod1Count > 0 ? (
                  <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                    Last score: {getSectionalScore(mod1Result)} / {subjectFilter === "reading" ? 27 : 22}
                  </span>
                ) : null}
              </div>
              {mod1Count === 0 ? (
                <button
                  title="Coming Soon"
                  disabled
                  className="block w-full cursor-not-allowed rounded-lg border bg-slate-200 px-4 py-2.5 text-center font-medium text-slate-400 opacity-50 transition-all"
                >
                  Module 1 (Coming Soon)
                </button>
              ) : mod1Result?._id ? (
                <div className="grid grid-cols-[minmax(0,1fr)_68px] gap-3">
                  <Link
                    href={`/review?mode=sectional&resultId=${mod1Result._id}`}
                    className="flex items-center justify-center rounded-lg border border-indigo-200 bg-white px-4 py-2.5 text-center font-semibold text-indigo-700 transition-all hover:border-indigo-300 hover:bg-indigo-50"
                  >
                    Review
                  </Link>
                  <Link
                    href={`/test/${test._id}?section=${formattedSectionName}&module=1&mode=sectional`}
                    className="flex items-center justify-center rounded-lg border border-indigo-200 bg-white px-4 py-2.5 text-indigo-700 transition-all hover:border-indigo-300 hover:bg-indigo-50"
                    aria-label="Retake sectional module 1"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <Link
                  href={`/test/${test._id}?section=${formattedSectionName}&module=1&mode=sectional`}
                  className="block w-full rounded-lg bg-blue-600 px-4 py-2 text-center font-medium text-white hover:bg-blue-700"
                >
                  Start Module 1
                </Link>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Module 2</span>
                {mod2Result && mod2Count > 0 ? (
                  <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                    Last score: {getSectionalScore(mod2Result)} / {subjectFilter === "reading" ? 27 : 22}
                  </span>
                ) : null}
              </div>
              {mod2Count === 0 ? (
                <button
                  title="Coming Soon"
                  disabled
                  className="block w-full cursor-not-allowed rounded-lg border bg-slate-200 px-4 py-2.5 text-center font-medium text-slate-400 opacity-50 transition-all"
                >
                  Module 2 (Coming Soon)
                </button>
              ) : mod2Result?._id ? (
                <div className="grid grid-cols-[minmax(0,1fr)_68px] gap-3">
                  <Link
                    href={`/review?mode=sectional&resultId=${mod2Result._id}`}
                    className="flex items-center justify-center rounded-lg border border-indigo-200 bg-white px-4 py-2.5 text-center font-semibold text-indigo-700 transition-all hover:border-indigo-300 hover:bg-indigo-50"
                  >
                    Review
                  </Link>
                  <Link
                    href={`/test/${test._id}?section=${formattedSectionName}&module=2&mode=sectional`}
                    className="flex items-center justify-center rounded-lg border border-indigo-200 bg-white px-4 py-2.5 text-indigo-700 transition-all hover:border-indigo-300 hover:bg-indigo-50"
                    aria-label="Retake sectional module 2"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <Link
                  href={`/test/${test._id}?section=${formattedSectionName}&module=2&mode=sectional`}
                  className="block w-full rounded-lg bg-blue-600 px-4 py-2 text-center font-medium text-white hover:bg-blue-700"
                >
                  Start Module 2
                </Link>
              )}
            </div>

            <DownloadPdfButton
              testId={test._id}
              testName={test.title}
              sectionName={formattedSectionName}
            />
          </div>
        ) : latestFullLengthResult?._id ? (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[minmax(0,1fr)_68px] gap-3">
              <Link
                href={`/review?mode=full&resultId=${latestFullLengthResult._id}`}
                className="flex items-center justify-center rounded-lg border border-indigo-200 bg-white px-4 py-2.5 text-center font-semibold text-indigo-700 transition-all hover:border-indigo-300 hover:bg-indigo-50"
              >
                Review
              </Link>
              <Link
                href={`/test/${test._id}?mode=full`}
                className="flex items-center justify-center rounded-lg border border-indigo-200 bg-white px-4 py-2.5 text-indigo-700 transition-all hover:border-indigo-300 hover:bg-indigo-50"
                aria-label="Retake full-length test"
              >
                <RotateCcw className="h-4 w-4" />
              </Link>
            </div>
            <DownloadPdfButton testId={test._id} testName={test.title} />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Link
              href={`/test/${test._id}?mode=full`}
              className="block w-full rounded-lg bg-blue-600 px-4 py-2 text-center font-medium text-white hover:bg-blue-700"
            >
              Start Practice
            </Link>
            <DownloadPdfButton testId={test._id} testName={test.title} />
          </div>
        )}
      </div>
    </div>
  );
}
