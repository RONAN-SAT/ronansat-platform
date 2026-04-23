"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Loading from "@/components/Loading";
import ReviewPopup from "@/components/ReviewPopup";
import { fetchQuestionExplanation, fetchReviewQuestion } from "@/lib/services/reviewService";
import type { ReviewAnswer } from "@/types/review";

function ReviewQuestionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resultId = searchParams.get("resultId") ?? "";
  const questionId = searchParams.get("questionId") ?? "";
  const testId = searchParams.get("testId") ?? undefined;
  const testType = searchParams.get("mode") === "sectional" ? "sectional" : "full";
  const source = searchParams.get("source") === "results" ? "results" : "error-log";
  const questionNumber = Number.parseInt(searchParams.get("questionNumber") ?? "1", 10);
  const [answer, setAnswer] = useState<ReviewAnswer | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, string>>({});
  const [loadingExplanations, setLoadingExplanations] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;

    const loadQuestion = async () => {
      if (!resultId || !questionId) {
        setLoadingQuestion(false);
        setAnswer(null);
        return;
      }

      setLoadingQuestion(true);

      try {
        const nextAnswer = await fetchReviewQuestion(resultId, questionId);
        if (!cancelled) {
          setAnswer(nextAnswer);
        }
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          setAnswer(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingQuestion(false);
        }
      }
    };

    void loadQuestion();

    return () => {
      cancelled = true;
    };
  }, [questionId, resultId]);

  const handleExpandExplanation = async (nextQuestionId: string) => {
    if (expandedExplanations[nextQuestionId]) {
      return;
    }

    setLoadingExplanations((current) => ({ ...current, [nextQuestionId]: true }));
    try {
      const explanation = await fetchQuestionExplanation(nextQuestionId);
      if (explanation) {
        setExpandedExplanations((current) => ({ ...current, [nextQuestionId]: explanation }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingExplanations((current) => ({ ...current, [nextQuestionId]: false }));
    }
  };

  const handleBack = () => {
    if (source === "results") {
      const params = new URLSearchParams({ mode: testType, resultId });
      if (testId) {
        params.set("testId", testId);
      }

      router.push(`/review?${params.toString()}`);
      return;
    }

    router.push(`/review?view=error-log&mode=${testType}`);
  };

  if (loadingQuestion && !answer) {
    return <Loading showQuote={false} />;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface-white md:h-screen md:overflow-hidden">
      <ReviewPopup
        ans={answer ?? { isCorrect: false }}
        onClose={handleBack}
        loadingQuestion={loadingQuestion}
        variant="page"
        closeLabel="Back to error log"
        expandedExplanation={expandedExplanations[answer?.questionId?._id || ""]}
        loadingExplanation={!!loadingExplanations[answer?.questionId?._id || ""]}
        onExpandExplanation={handleExpandExplanation}
        reportContext={
          testId && answer?.questionId?._id && answer.questionId.section && answer.questionId.module
            ? {
                testId,
                questionId: answer.questionId._id,
                section: answer.questionId.section,
                module: answer.questionId.module,
                questionNumber: Number.isFinite(questionNumber) && questionNumber > 0 ? questionNumber : 1,
                source: "review",
              }
            : undefined
        }
      />
    </div>
  );
}

export default function ReviewQuestionPage() {
  return (
    <Suspense fallback={<Loading showQuote={false} />}>
      <ReviewQuestionContent />
    </Suspense>
  );
}
