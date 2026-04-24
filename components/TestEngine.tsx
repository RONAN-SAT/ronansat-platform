"use client";

import { useState } from "react";

import DesmosCalculator from "@/components/DesmosCalculator";
import InitialTabBootReady from "@/components/InitialTabBootReady";
import QuestionViewer from "@/components/QuestionViewer";
import SimpleLoading from "@/components/SimpleLoading";
import TestFooter from "@/components/test/TestFooter";
import TestHeader from "@/components/test/TestHeader";
import TestReviewPage from "@/components/test/TestReviewPage";
import { useTestingRoomTheme } from "@/hooks/useTestingRoomTheme";
import { useIntentPrefetch } from "@/hooks/useIntentPrefetch";
import { getTestingRoomThemePreset } from "@/lib/testingRoomTheme";
import { useResizableDivider } from "@/hooks/useResizableDivider";
import { useTestEngine } from "@/hooks/useTestEngine";

export default function TestEngine({ testId }: { testId: string }) {   // Khởi tạo phòng thi, lấy về id của bài test
  const { theme: testingRoomTheme } = useTestingRoomTheme();           // Lấy theme bài test, đổi tên thành testingRoomTheme
  const themePreset = getTestingRoomThemePreset(testingRoomTheme);     // Lấy thông số cấu hình của theme mới
  const {
    mode,
    loading,
    questions,
    currentQuestion,
    currentModuleQuestions,
    currentIndex,
    answers,
    flagged,
    timeRemaining,
    isTimerHidden,
    setIsTimerHidden,
    isCalculatorOpen,
    setIsCalculatorOpen,
    currentStage,
    currentStageIndex,
    isSubmitting,
    availableModules,
    answeredCurrentModuleQuestions,
    minimumRequiredCurrentModuleAnswers,
    handleAnswerSelect,
    toggleFlag,
    handleNext,
    handlePrev,
    handleJump,
    handleSubmit,
    router,
  } = useTestEngine(testId);  // hàm này (đã được lập trình ở chỗ khác) sẽ nhận mã testId, tự động tính toán và đưa ra các dữ liệu để dùng 
  
  
  const [isReviewPageOpen, setIsReviewPageOpen] = useState(false);   // Check trang review đang đóng hay mở

  const { leftWidth, isDragging, containerRef, handleDividerMouseDown } = useResizableDivider(50);  // Công cụ cho kéo thay đổi kich thước bài test
  const isLastModule =
    availableModules.length === 0 || availableModules[availableModules.length - 1].originalIndex === currentStageIndex;
  const buttonText = mode === "sectional" ? "Submit Module" : isLastModule ? "Submit Test" : "Next Module";
  const canIntentPrefetchReview =
    !isSubmitting &&
    answeredCurrentModuleQuestions >= minimumRequiredCurrentModuleAnswers &&
    (mode === "sectional" || (mode === "full" && isLastModule));
  const reviewHref = `/review?testId=${testId}&mode=${mode === "sectional" ? "sectional" : "full"}`;
  const submitIntentPrefetchHandlers = useIntentPrefetch({
    prefetchKey: `test-submit-review:${testId}:${mode}`,
    disabled: !canIntentPrefetchReview,
    touchDelayMs: 175,
    prefetch: () => {
      router.prefetch(reviewHref);
    },
  });

  if (loading) {
    return <SimpleLoading />;
  }

  if (questions.length === 0) {
    return (
      <div className="bg-dot-pattern flex min-h-screen items-center justify-center bg-paper-bg p-6">
        <InitialTabBootReady />
        <div className="workbook-panel max-w-lg px-8 py-10 text-center">
          <div className="workbook-sticker bg-accent-3 text-white">Test Unavailable</div>
          <h1 className="mt-5 font-display text-4xl font-black uppercase tracking-tight text-ink-fg">No questions found</h1>
          <p className="mt-3 text-base leading-7 text-ink-fg/75">
            This test could not be loaded, so there is nothing to start right now.
          </p>
          <div className="mt-6 flex justify-center">
            <button onClick={() => router.push("/full-length")} className="workbook-button" type="button">
              Return to Library
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Logic yêu cầu hoàn thành min câu để được nộp
  const confirmDescription =
    mode === "sectional"
      ? `Answer at least ${minimumRequiredCurrentModuleAnswers} questions to submit before time runs out.`
      : isLastModule
        ? `Answer at least ${minimumRequiredCurrentModuleAnswers} questions in this module to submit before time runs out.`
        : `Answer at least ${minimumRequiredCurrentModuleAnswers} questions in this module to move on early.`;


  return (
    <div
      className={`relative flex min-h-screen flex-col overflow-hidden ${themePreset.shell.rootClass}`}
    >
      <InitialTabBootReady />
      <TestHeader
        theme={testingRoomTheme}
        sectionName={`${currentStage.section} - Module ${currentStage.module}`}
        timeRemaining={timeRemaining}
        onTimeUp={() => {
          void handleSubmit({ trigger: "manual" });
        }}
        isSubmitting={isSubmitting}
        isTimerHidden={isTimerHidden}
        setIsTimerHidden={setIsTimerHidden}
        onToggleCalculator={() => setIsCalculatorOpen(!isCalculatorOpen)}
        showCalculator={currentStage.section === "Math"}
        buttonText={buttonText}
        confirmTitle={buttonText}
        confirmDescription={confirmDescription}
        submitIntentPrefetchHandlers={submitIntentPrefetchHandlers}
        onLeave={() => router.push(mode === "sectional" ? "/sectional" : "/full-length")}
        reportContext={{
          testId,
          questionId: currentQuestion._id,
          section: currentStage.section,
          module: currentStage.module,
          questionNumber: currentIndex + 1,
          source: "test",
        }}
      />

      <DesmosCalculator theme={testingRoomTheme} isOpen={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} />

      <main
        ref={containerRef}
        className={`relative flex-1 overflow-hidden ${themePreset.shell.mainClass}`}
        style={{ userSelect: isDragging.current ? "none" : "auto" }}
        onMouseDown={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest("#qv-divider")) {
            handleDividerMouseDown(event);
          }
        }}
      >
        {isReviewPageOpen ? (
          <TestReviewPage
            theme={testingRoomTheme}
            moduleName={`Section ${currentStage.section === "Math" ? 2 : 1}, Module ${currentStage.module}: ${currentStage.section}`}
            currentIndex={currentIndex}
            questions={currentModuleQuestions}
            answers={answers}
            flagged={flagged}
            submitLabel={buttonText}
            minimumRequiredAnswers={minimumRequiredCurrentModuleAnswers}
            answeredCount={answeredCurrentModuleQuestions}
            onJump={(index) => {
              handleJump(index);
              setIsReviewPageOpen(false);
            }}
            onReturn={() => setIsReviewPageOpen(false)}
            onSubmit={() => {
              setIsReviewPageOpen(false);
              void handleSubmit({ trigger: "manual" });
            }}
          />
        ) : (
          <QuestionViewer
            theme={testingRoomTheme}
            question={currentQuestion}
            userAnswer={answers[currentQuestion._id]}
            onAnswerSelect={handleAnswerSelect}
            isFlagged={!!flagged[currentQuestion._id]}
            onToggleFlag={toggleFlag}
            index={currentIndex}
            leftWidth={leftWidth}
          />
        )}
      </main>

      {isReviewPageOpen ? null : (
        <TestFooter
          theme={testingRoomTheme}
          moduleName={`Section ${currentStage.section === "Math" ? 2 : 1}, Module ${currentStage.module}: ${currentStage.section}`}
          currentIndex={currentIndex}
          totalQuestions={currentModuleQuestions.length}
          onNext={handleNext}
          onPrev={handlePrev}
          onJump={handleJump}
          answers={answers}
          flagged={flagged}
          questions={currentModuleQuestions}
          onOpenReviewPage={() => setIsReviewPageOpen(true)}
        />
      )}
    </div>
  );
}
