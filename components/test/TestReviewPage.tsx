"use client";

import { Bookmark, Check, MapPin } from "lucide-react";

import { getTestingRoomThemePreset, type TestingRoomTheme } from "@/lib/testingRoomTheme";

interface TestReviewPageProps {
  theme?: TestingRoomTheme;
  moduleName: string;
  currentIndex: number;
  questions: Array<{ _id: string }>;
  answers: Record<string, string>;
  flagged: Record<string, boolean>;
  submitLabel: string;
  onJump: (index: number) => void;
  onReturn: () => void;
  onSubmit: () => void;
}

export default function TestReviewPage({
  theme = "ronan",
  moduleName,
  currentIndex,
  questions,
  answers,
  flagged,
  submitLabel,
  onJump,
  onReturn,
  onSubmit,
}: TestReviewPageProps) {
  const themePreset = getTestingRoomThemePreset(theme);
  const answeredCount = questions.filter((question) => !!answers[question._id]).length;
  const flaggedCount = questions.filter((question) => !!flagged[question._id]).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <section className="mx-auto mb-16 mt-14 flex h-[calc(100vh-7rem)] w-full max-w-5xl items-start justify-center overflow-y-auto px-4 py-6 sm:mb-20 sm:mt-20 sm:h-[calc(100vh-10rem)] sm:px-6 sm:py-8">
      <div className="workbook-panel w-full max-w-3xl overflow-hidden bg-surface-white">
        <div className="border-b-4 border-ink-fg bg-paper-bg px-6 py-5 sm:px-8">
          <div className="workbook-sticker bg-primary text-ink-fg">Review Page</div>
          <h2 className="mt-4 font-display text-3xl font-black uppercase tracking-tight text-ink-fg sm:text-4xl">
            {moduleName}
          </h2>
          <p className="mt-3 text-sm leading-6 text-ink-fg/75 sm:text-base">
            Check unanswered and marked questions before you continue. Select any number to jump back into that question.
          </p>
        </div>

        <div className="grid gap-3 border-b-2 border-ink-fg bg-white px-6 py-4 text-sm font-semibold text-ink-fg sm:grid-cols-3 sm:px-8">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>{answeredCount} Answered</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{unansweredCount} Unanswered</span>
          </div>
          <div className="flex items-center gap-2">
            <Bookmark className="h-4 w-4 fill-current text-accent-3" />
            <span>{flaggedCount} For Review</span>
          </div>
        </div>

        <div className="px-6 py-6 sm:px-8">
          <div className="flex flex-wrap gap-3">
            {questions.map((question, index) => {
              const isAnswered = !!answers[question._id];
              const isFlagged = !!flagged[question._id];
              const isCurrent = index === currentIndex;

              return (
                <button
                  key={question._id}
                  type="button"
                  onClick={() => onJump(index)}
                  className={`relative flex h-11 w-11 items-center justify-center text-sm font-bold transition-all ${
                    isAnswered ? themePreset.footer.gridAnsweredClass : themePreset.footer.gridUnansweredClass
                  } ${isCurrent ? "ring-2 ring-accent-2 ring-offset-2 ring-offset-surface-white" : ""}`}
                  aria-label={`Jump to question ${index + 1}`}
                >
                  <span>{index + 1}</span>
                  {isFlagged ? (
                    <Bookmark className="pointer-events-none absolute -right-1 -top-1 h-3.5 w-3.5 fill-current text-accent-3" strokeWidth={1.9} />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t-2 border-ink-fg bg-paper-bg px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
          <button type="button" onClick={onReturn} className="workbook-button workbook-button-secondary justify-center">
            Return to Questions
          </button>
          <button type="button" onClick={onSubmit} className="workbook-button justify-center">
            {submitLabel}
          </button>
        </div>
      </div>
    </section>
  );
}
