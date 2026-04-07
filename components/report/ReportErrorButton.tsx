"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Send, X } from "lucide-react";

import { API_PATHS } from "@/lib/apiPaths";

type ReportErrorButtonProps = {
  context: {
    testId: string;
    questionId: string;
    section: string;
    module: number;
    questionNumber: number;
    source: "test" | "review";
  };
  className?: string;
  compact?: boolean;
};

export function ReportErrorButton({ context, className = "", compact = false }: ReportErrorButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [errorType, setErrorType] = useState<"Question" | "Answers" | "Missing Graph/Image">("Question");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const title = useMemo(
    () => `Q${context.questionNumber} - ${context.section} - Module ${context.module}`,
    [context.module, context.questionNumber, context.section],
  );

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch(API_PATHS.FIX_REPORTS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...context,
          errorType,
          note,
        }),
      });

      if (!response.ok) {
        if (response.status === 409) {
          setMessage("You already reported this question.");
          return;
        }

        throw new Error("Failed to submit report");
      }

      setMessage("Report sent.");
      setNote("");
      setErrorType("Question");
      window.setTimeout(() => {
        setIsOpen(false);
        setMessage(null);
      }, 900);
    } catch (error) {
      console.error(error);
      setMessage("Could not send report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
      title="Report Error"
aria-label="Report Error"
  type="button"
  
  onClick={() => {
    setIsOpen((current) => !current);
    setMessage(null);
  }}
  className={`inline-flex h-8 w-8 items-center justify-center rounded-md border transition-all hover:bg-amber-100/70  ${
  compact
    ? "border-amber-200 text-amber-700 hover:bg-amber-100"
    : "border-[#c2d0e8] text-[#1a4080] hover:bg-[#e8eef7]"
}`}
>
  <AlertTriangle className="h-4 w-4" />
</button>

      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+10px)] z-[120] w-[320px] rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.18)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Report Error</div>
              <div className="mt-1 text-[11px] leading-4 text-slate-500">{title}</div>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Error in</div>
            <div className="grid grid-cols-2 gap-2">
              {(["Question", "Answers", "Missing Graph/Image"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setErrorType(option)}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                    option === "Missing Graph/Image" ? "col-span-2" : ""
                  } ${
                    errorType === option
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Details (optional)</label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              placeholder="Tell us what looks wrong..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className={`text-[12px] ${message === "Report sent." ? "text-emerald-600" : message ? "text-rose-500" : "text-slate-400"}`}>{message ?? ""}</div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#0071e3] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#0077ed] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-3.5 w-3.5" />
              {isSubmitting ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
