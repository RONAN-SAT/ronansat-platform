"use client";

import BrandLogo from "@/components/BrandLogo";
import QuestionExtraBlock from "@/components/question/QuestionExtraBlock";
import type { ReviewQuestion } from "@/types/review";
import { renderHtmlLatexContent } from "@/utils/renderContent";

interface PassageColumnProps {
  q: ReviewQuestion;
}

export default function PassageColumn({ q }: PassageColumnProps) {
  if (!q.passage) {
    return null;
  }

  return (
    <div className="w-full self-stretch overflow-visible bg-surface-white md:h-full md:min-h-0 md:w-1/2 md:overflow-y-auto md:border-r-4 md:border-ink-fg">
      <div className="px-2 py-4 sm:p-6 lg:p-10">
        <BrandLogo className="mb-5" labelClassName="text-xl sm:text-2xl" size={40} priority />

        <QuestionExtraBlock
          extra={q.extra}
          className="mb-6 rounded-2xl bg-surface-white p-4"
          titleClassName="mb-2 text-center font-sans text-[16px] font-normal leading-[1.35] text-ink-fg"
        />

        <div className="rounded-2xl px-2 py-4 font-[Georgia,serif] text-[16px] leading-[1.85] text-ink-fg selection:bg-primary sm:p-6">
          {renderHtmlLatexContent(q.passage)}
        </div>
      </div>
    </div>
  );
}
