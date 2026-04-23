"use client";

import { useState } from "react";
import { AlertCircle, BookOpen, Calculator, ChevronDown, ChevronUp, X } from "lucide-react";
import "katex/dist/katex.min.css";


import DesmosCalculator from "@/components/DesmosCalculator";
import QuestionExtraBlock from "@/components/question/QuestionExtraBlock";
import { ReportErrorButton } from "@/components/report/ReportErrorButton";
import PassageColumn from "@/components/review/PassageCollumn";
import AnswerDetails from "@/components/review/AnswerDetails";
import SelectableTextPanel, { type TextAnnotation } from "@/components/test/SelectableTextPanel";
import type { ReviewAnswer } from "@/types/review";
import { renderHtmlLatexContent } from "@/utils/renderContent";

interface ReviewPopupProps {
  ans: ReviewAnswer;
  onClose: () => void;
  loadingQuestion: boolean;
  variant?: "modal" | "page";
  closeLabel?: string;
  expandedExplanation: string | undefined;
  loadingExplanation: boolean;
  onExpandExplanation: (qId: string) => void;
  reportContext?: {
    testId: string;
    questionId: string;
    section: string;
    module: number;
    questionNumber: number;
    source: "test" | "review";
  };
}

export default function ReviewPopup({
  ans,
  onClose,
  loadingQuestion,
  variant = "modal",
  closeLabel = "Close",
  expandedExplanation,
  loadingExplanation,
  onExpandExplanation,
  reportContext,
}: ReviewPopupProps) {
  const q = ans?.questionId;

  const [showCalculator, setShowCalculator] = useState(false);
  const [isExplanationVisible, setIsExplanationVisible] = useState(false);
  const [annotations, setAnnotations] = useState<TextAnnotation[]>([]);

  const isPageVariant = variant === "page";

  if (!q || (loadingQuestion && !ans.questionLoaded)) {
    return (
      <div className={isPageVariant ? "flex h-screen items-center justify-center bg-paper-bg p-6 text-center text-ink-fg" : "fixed inset-0 z-[100] flex items-center justify-center bg-ink-fg/20 p-4"}>
        <div className={isPageVariant ? "mx-auto max-w-sm" : "workbook-modal-card max-w-sm p-8 text-center text-ink-fg"}>
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-accent-3" />
          <p className="font-display text-3xl font-black uppercase tracking-tight">
            {!q ? "Question data is missing." : "Loading question."}
          </p>
          {q ? <p className="mt-2 text-sm text-ink-fg/70">Fetching the full prompt, answers, and passage now.</p> : null}
          <button onClick={onClose} className="workbook-button mt-5" type="button">
            {closeLabel}
          </button>
        </div>
      </div>
    );
  }

  const isMath =
    q?.subject?.toLowerCase() === "math" ||
    q?.domain?.toLowerCase()?.includes("math") ||
    q?.section?.toLowerCase()?.includes("math");

  const handleToggleExplanation = () => {
    if (!isExplanationVisible && !expandedExplanation) {
      onExpandExplanation(q._id);
    }
    setIsExplanationVisible((current) => !current);
  };

  return (
    <div className={isPageVariant ? "flex min-h-screen flex-col bg-surface-white md:h-screen md:overflow-hidden" : "fixed inset-0 z-[100] flex flex-col bg-paper-bg"}>
      <DesmosCalculator isOpen={showCalculator} onClose={() => setShowCalculator(false)} />

      <header className="flex shrink-0 flex-col gap-3 border-b-4 border-ink-fg bg-surface-white px-4 py-3 sm:px-6 md:min-h-20 md:flex-row md:items-center md:justify-between md:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {q.domain ? <span className={`workbook-sticker ${isMath ? "bg-accent-2 text-white" : "bg-accent-1 text-ink-fg"}`}>{q.domain}</span> : null}
            {q.skill ? <span className="workbook-sticker bg-accent-1 text-ink-fg">{q.skill}</span> : null}
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 md:w-auto md:justify-end">
          {isMath ? (
            <button
              onClick={() => setShowCalculator((current) => !current)}
              title="Open Desmos Calculator"
              className={`flex-1 rounded-2xl border-2 border-ink-fg px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] brutal-shadow-sm workbook-press md:flex-none ${showCalculator ? "bg-accent-2 text-white" : "bg-surface-white text-ink-fg"}`}
              type="button"
            >
              <span className="flex items-center justify-center gap-1.5">
                <Calculator className="h-4 w-4" />
                Calc
              </span>
            </button>
          ) : null}

          {reportContext ? <ReportErrorButton context={reportContext} /> : null}

          <button
            onClick={handleToggleExplanation}
            className={`flex-1 rounded-2xl border-2 border-ink-fg px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] brutal-shadow-sm workbook-press md:flex-none ${isExplanationVisible ? "bg-primary text-ink-fg" : "bg-surface-white text-ink-fg"}`}
            type="button"
          >
            <span className="flex items-center justify-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              <span className="sm:hidden">Explain</span>
              <span className="hidden sm:inline">{loadingExplanation ? "Loading..." : "Explanation"}</span>
              {isExplanationVisible ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </span>
          </button>

          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border-2 border-ink-fg px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] brutal-shadow-sm workbook-press bg-surface-white text-ink-fg md:flex-none"
            type="button"
          >
            <span className="flex items-center justify-center gap-1.5 whitespace-nowrap">
              <X className="h-4 w-4" />
              <span className="sm:hidden">Back</span>
              <span className="hidden sm:inline">{closeLabel}</span>
              </span>
            </button>
          </div>
      </header>

      <SelectableTextPanel
        annotations={annotations}
        onChange={setAnnotations}
        sourceQuestionId={q._id}
        className={`relative flex min-h-0 flex-1 bg-surface-white md:overflow-hidden ${isPageVariant ? "bg-surface-white" : "bg-paper-bg bg-dot-pattern"}`}
      >
        <div className="flex min-h-0 flex-1 flex-col items-stretch overflow-visible md:h-full md:flex-row md:overflow-hidden">
          <PassageColumn q={q} />

          <div className={`${q.passage ? "w-full md:w-1/2" : "mx-auto w-full max-w-4xl"} min-h-0 overflow-visible bg-surface-white md:h-full md:overflow-y-auto`}>
            <div className="flex flex-col gap-5 px-2 pb-5 pt-2 sm:p-6 lg:p-8">
              {!q.passage ? (
                <QuestionExtraBlock
                  extra={q.extra}
                  className="rounded-2xl bg-surface-white p-4"
                  titleClassName="mb-2 text-center font-sans text-[16px] font-normal leading-[1.35] text-ink-fg"
                />
              ) : null}

              <div className="overflow-hidden rounded-2xl bg-surface-white px-1 py-2 sm:px-6 sm:py-5">
                <p className="font-[Georgia,serif] text-[15.5px] leading-[1.7] text-ink-fg sm:text-[17.5px]">
                  {renderHtmlLatexContent(q.questionText || "")}
                </p>
              </div>

              <AnswerDetails q={q} ans={ans} />

              {isExplanationVisible ? (
                <div className="overflow-hidden rounded-2xl border-2 border-ink-fg bg-surface-white p-6">
                  <div className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-ink-fg/70">Explanation</div>
                    {expandedExplanation ? (
                      <p className="whitespace-pre-wrap font-[Georgia,serif] text-[15px] leading-relaxed text-ink-fg">
                        {renderHtmlLatexContent(expandedExplanation || "")}
                      </p>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-ink-fg/70">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-ink-fg/20 border-t-ink-fg" />
                        Loading explanation...
                      </div>
                    )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </SelectableTextPanel>
    </div>
  );
}
