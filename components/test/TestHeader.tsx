"use client";

import { Button, Popconfirm } from "antd";
import { Calculator, CircleX, Eye, EyeOff } from "lucide-react";

import { ReportErrorButton } from "@/components/report/ReportErrorButton";

interface TestHeaderProps {
  sectionName: string;
  timeRemaining: number;
  onTimeUp: () => void;
  isSubmitting?: boolean;
  isTimerHidden: boolean;
  setIsTimerHidden: (hide: boolean) => void;
  isLastModule?: boolean;
  showCalculator?: boolean;
  buttonText?: string;
  confirmTitle?: string;
  confirmDescription?: string;
  onToggleCalculator?: () => void;
  onLeave: () => void;
  reportContext?: {
    testId: string;
    questionId: string;
    section: string;
    module: number;
    questionNumber: number;
    source: "test" | "review";
  };
}

export default function TestHeader({
  sectionName,
  timeRemaining,
  onTimeUp,
  isSubmitting = false,
  isTimerHidden,
  setIsTimerHidden,
  onToggleCalculator,
  isLastModule,
  showCalculator = true,
  buttonText,
  confirmTitle,
  confirmDescription,
  onLeave,
  reportContext,
}: TestHeaderProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-slate-300 bg-[#ebf0f7] px-6 shadow-sm">
      <div className="flex flex-1 items-center">
        <h1 className="text-lg font-bold tracking-tight text-slate-800">{sectionName}</h1>
      </div>

      <div className="absolute left-1/2 flex -translate-x-1/2 items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-3">
            {!isTimerHidden ? (
              <span
                className={`text-xl font-mono font-bold tracking-wider ${
                  timeRemaining < 300 ? "animate-pulse text-red-600" : "text-slate-900"
                }`}
              >
                {formatTime(timeRemaining)}
              </span>
            ) : (
              <span className="text-xl font-mono tracking-wider text-slate-400">--:--</span>
            )}

            <Button
              onClick={() => setIsTimerHidden(!isTimerHidden)}
              type="text"
              icon={isTimerHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              className="text-slate-500 hover:text-slate-800"
            >
              <span className="ml-1 hidden sm:inline">{isTimerHidden ? "Show" : "Hide"}</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end gap-4">
        {reportContext ? <ReportErrorButton context={reportContext} compact /> : null}

        {showCalculator ? (
          <button
            onClick={onToggleCalculator}
            type="button"
            title="Calculator"
            className="flex cursor-pointer items-center justify-center rounded-full p-2 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-600 outline-none"
          >
            <Calculator className="h-5 w-5" />
          </button>
        ) : null}

        <Popconfirm
          title={confirmTitle || (isLastModule ? "Submit Entire Test?" : "Finish This Module?")}
          description={
            confirmDescription ||
            (isLastModule
              ? "You are about to finish the test. You cannot go back to any module after this."
              : "Once you move to the next module, you cannot return to the current questions.")
          }
          onConfirm={onTimeUp}
          disabled={isSubmitting}
          okText="Yes"
          cancelText="No"
          placement="bottomRight"
        >
          <Button
            type="default"
            loading={isSubmitting}
            disabled={isSubmitting}
            danger={buttonText === "Submit Module" || buttonText === "Submit Test" || isLastModule}
            className={`rounded-full border-2 px-8 font-semibold transition-all h-10 ${
              buttonText === "Submit Module" || buttonText === "Submit Test" || isLastModule
                ? "!border-[#fb2a57] !text-[#fb2a57] bg-transparent hover:!bg-[#fb2a57]/10"
                : ""
            }`}
          >
            {buttonText || (isLastModule ? "Submit Test" : "Next Module")}
          </Button>
        </Popconfirm>

        <Popconfirm
          title="Leave Exam?"
          description="Are you sure you want to leave? Your progress will not be saved."
          onConfirm={onLeave}
          okText="Leave"
          cancelText="Stay"
          placement="bottomRight"
          okButtonProps={{ danger: true }}
        >
          <button
            type="button"
            className="flex cursor-pointer items-center justify-center rounded-full p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 outline-none"
          >
            <CircleX className="h-5 w-5" />
          </button>
        </Popconfirm>
      </div>

      <div
        className="absolute bottom-0 left-0 h-[2px] w-full"
        style={{ backgroundImage: "repeating-linear-gradient(to right, #2d3642 0, #1c2128 19px, transparent 19px, transparent 20px)" }}
      />
    </header>
  );
}
