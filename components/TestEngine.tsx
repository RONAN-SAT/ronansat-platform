"use client";

import DesmosCalculator from "@/components/DesmosCalculator";
import QuestionViewer from "@/components/QuestionViewer";
import TestEntryLoading from "@/components/test/TestEntryLoading";
import TestFooter from "@/components/test/TestFooter";
import TestHeader from "@/components/test/TestHeader";
import { useResizableDivider } from "@/hooks/useResizableDivider";
import { useTestEngine } from "@/hooks/useTestEngine";

export default function TestEngine({ testId }: { testId: string }) {
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
    handleAnswerSelect,
    toggleFlag,
    handleNext,
    handlePrev,
    handleJump,
    handleSubmit,
    router,
  } = useTestEngine(testId);

  const { leftWidth, isDragging, containerRef, handleDividerMouseDown } = useResizableDivider(50);

  if (loading) {
    return <TestEntryLoading />;
  }

  if (questions.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
        <h1 className="mb-4 text-2xl font-bold text-slate-900">No questions found!</h1>
        <button
          onClick={() => router.push("/full-length")}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const isLastModule =
    availableModules.length === 0 || availableModules[availableModules.length - 1].originalIndex === currentStageIndex;

  const buttonText = mode === "sectional" ? "Submit Module" : isLastModule ? "Submit Test" : "Next Module";
  const confirmDescription =
    mode === "sectional"
      ? "Are you sure you want to grade this module now?"
      : isLastModule
        ? "Are you sure you want to submit the entire test?"
        : "Are you sure you want to end this section?";

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-white selection:bg-yellow-200">
      <TestHeader
        sectionName={`${currentStage.section} - Module ${currentStage.module}`}
        timeRemaining={timeRemaining}
        onTimeUp={handleSubmit}
        isSubmitting={isSubmitting}
        isTimerHidden={isTimerHidden}
        setIsTimerHidden={setIsTimerHidden}
        onToggleCalculator={() => setIsCalculatorOpen(!isCalculatorOpen)}
        showCalculator={currentStage.section === "Math"}
        buttonText={buttonText}
        confirmTitle={buttonText}
        confirmDescription={confirmDescription}
        onLeave={() => router.push(mode === "sectional" ? "/sectional" : "/full-length")}
      />

      <DesmosCalculator isOpen={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} />

      <main
        ref={containerRef}
        className="relative flex-1 overflow-hidden bg-white"
        style={{ userSelect: isDragging.current ? "none" : "auto" }}
        onMouseDown={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest("#qv-divider")) {
            handleDividerMouseDown(event);
          }
        }}
      >
        <QuestionViewer
          question={currentQuestion}
          userAnswer={answers[currentQuestion._id]}
          onAnswerSelect={handleAnswerSelect}
          isFlagged={!!flagged[currentQuestion._id]}
          onToggleFlag={toggleFlag}
          index={currentIndex}
          leftWidth={leftWidth}
        />
      </main>

      <TestFooter
        moduleName={`Section ${currentStage.section === "Math" ? 2 : 1}, Module ${currentStage.module}: ${currentStage.section}`}
        currentIndex={currentIndex}
        totalQuestions={currentModuleQuestions.length}
        onNext={handleNext}
        onPrev={handlePrev}
        onJump={handleJump}
        answers={answers}
        flagged={flagged}
        questions={currentModuleQuestions}
      />
    </div>
  );
}
