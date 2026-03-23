"use client";

import { useState } from "react";
import { X, Sparkles, Calculator, BookOpen, AlertCircle, ChevronDown, ChevronUp, CheckCircle, XCircle } from "lucide-react";
import DesmosCalculator from "@/components/DesmosCalculator";
import ReviewChatbot from "@/components/ReviewChatbot";

interface ReviewPopupProps {
    ans: any;
    onClose: () => void;
    expandedExplanation: string | undefined;
    loadingExplanation: boolean;
    onExpandExplanation: (qId: string) => void;
}

export default function ReviewPopup({ ans, onClose, expandedExplanation, loadingExplanation, onExpandExplanation }: ReviewPopupProps) {
    const q = ans?.questionId;

    const [showCalculator, setShowCalculator] = useState(false);
    const [showAI, setShowAI] = useState(false);
    const [isExplanationVisible, setIsExplanationVisible] = useState(false);

    if (!q) {
        return (
            <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-sm">
                    <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                    <p className="text-slate-800 font-bold text-base">Question data is missing or corrupted.</p>
                    <button onClick={onClose} className="mt-4 px-6 py-2 bg-slate-900 text-white hover:bg-slate-700 rounded-lg font-medium transition text-sm">Close</button>
                </div>
            </div>
        );
    }

    const isMath = q?.subject?.toLowerCase() === "math" || q?.domain?.toLowerCase()?.includes("math");
    const optionLabels = ["A", "B", "C", "D"];
    const choices = q?.choices || [];

    const handleToggleExplanation = () => {
        if (!isExplanationVisible && !expandedExplanation) {
            onExpandExplanation(q._id);
        }
        setIsExplanationVisible(!isExplanationVisible);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col">

            <DesmosCalculator isOpen={showCalculator} onClose={() => setShowCalculator(false)} />

            {/* ── Header ── */}
            <header className="h-14 bg-slate-900 flex items-center justify-between px-5 shrink-0 z-10">
                {/* Left */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-1.5 h-5 bg-blue-400 rounded-full" />
                        <span className="font-bold text-white text-sm tracking-wide">Review Question</span>
                    </div>
                    {q.domain && (
                        <span className="text-xs bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full border border-slate-600">
                            {q.domain}
                        </span>
                    )}
                    {isMath && (
                        <button
                            onClick={() => setShowCalculator(!showCalculator)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                showCalculator
                                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                                    : "bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600"
                            }`}
                        >
                            <Calculator className="w-3.5 h-3.5" /> Desmos
                        </button>
                    )}
                </div>

                {/* Right */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleToggleExplanation}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            isExplanationVisible
                                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                                : "bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600"
                        }`}
                    >
                        <BookOpen className="w-3.5 h-3.5" />
                        {loadingExplanation ? "Loading..." : "Explanation"}
                        {isExplanationVisible ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
                    </button>

                    <button
                        onClick={() => setShowAI(!showAI)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            showAI
                                ? "bg-violet-500 text-white shadow-lg shadow-violet-500/30"
                                : "bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600"
                        }`}
                    >
                        <Sparkles className="w-3.5 h-3.5" /> Ask AI Tutor
                    </button>

                    <div className="w-px h-5 bg-slate-700 mx-1" />

                    <button
                        onClick={onClose}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-red-600 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-all border border-slate-600 hover:border-red-500"
                    >
                        <X className="w-3.5 h-3.5" /> Close
                    </button>
                </div>
            </header>

            {/* ── Body ── */}
            <div className="flex-1 overflow-hidden flex relative">
                <div className="flex-1 flex h-full overflow-hidden">

                    {/* ── Passage column ── */}
                    {q.passage && (
                        <div className="w-1/2 h-full overflow-y-auto bg-white border-r border-slate-200">
                            <div className="p-8 lg:p-10">
                                {q.imageUrl && (
                                    <div className="flex justify-center bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                                        <img src={q.imageUrl} alt="Reference" className="max-w-full max-h-[320px] object-contain rounded-lg shadow-sm" />
                                    </div>
                                )}
                                {/* Passage label */}
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1 h-4 bg-slate-300 rounded-full" />
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Passage</span>
                                </div>
                                <div className="text-[15px] leading-[1.85] font-serif text-slate-700 selection:bg-blue-100">
                                    <div dangerouslySetInnerHTML={{ __html: q.passage.replace(/\n/g, "<br/>") }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Question + Choices column ── */}
                    <div className={`${q.passage ? "w-1/2" : "w-full max-w-3xl mx-auto"} h-full overflow-y-auto bg-slate-50`}>
                        <div className="p-8 lg:p-10 flex flex-col gap-6">

                            {/* Image (no passage case) */}
                            {!q.passage && q.imageUrl && (
                                <div className="flex justify-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <img src={q.imageUrl} alt="Reference" className="max-w-full max-h-[320px] object-contain rounded-lg" />
                                </div>
                            )}

                            {/* Question text card */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-1 h-4 bg-blue-400 rounded-full" />
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Question</span>
                                </div>
                                <p className="text-[17px] text-slate-900 leading-relaxed font-medium">
                                    {q.questionText}
                                </p>
                            </div>

                            {/* Answer choices */}
                            {choices.length === 0 ? (
                                <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl">
                                    <div className="flex items-center gap-2 font-bold text-amber-800 mb-2 text-sm">
                                        <AlertCircle className="w-4 h-4" />
                                        Missing "choices" data from API
                                    </div>
                                    <p className="text-xs text-amber-700 mb-4">
                                        Update <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">app/api/results/route.ts</code> to return <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">choices</code> for each question.
                                    </p>
                                    <div className="bg-white rounded-xl border border-amber-100 p-4 flex flex-col gap-2 text-sm">
                                        <div className="flex gap-2">
                                            <span className="text-slate-500 font-medium w-28 shrink-0">Your answer:</span>
                                            <span className={`font-bold ${ans.isCorrect ? "text-emerald-600" : "text-red-600"}`}>
                                                {ans.userAnswer || "Omitted"}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-slate-500 font-medium w-28 shrink-0">Correct answer:</span>
                                            <span className="font-bold text-emerald-600">{q.correctAnswer}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {choices.map((choice: string, i: number) => {
                                        const isUserChoice = ans?.userAnswer === choice;
                                        const isCorrectChoice = q?.correctAnswer === choice;

                                        let wrapClass = "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:shadow-sm";
                                        let circleClass = "border-slate-300 text-slate-500 bg-white";
                                        let Icon = null;

                                        if (isCorrectChoice) {
                                            wrapClass = "bg-emerald-50 border-emerald-400 text-emerald-900 shadow-sm shadow-emerald-100";
                                            circleClass = "bg-emerald-500 border-emerald-500 text-white";
                                            Icon = CheckCircle;
                                        } else if (isUserChoice && !isCorrectChoice) {
                                            wrapClass = "bg-red-50 border-red-400 text-red-900 shadow-sm shadow-red-100";
                                            circleClass = "bg-red-500 border-red-500 text-white";
                                            Icon = XCircle;
                                        }

                                        return (
                                            <div
                                                key={i}
                                                className={`flex items-center gap-3.5 px-4 py-3.5 border-2 rounded-xl transition-all duration-150 ${wrapClass}`}
                                            >
                                                {/* Letter circle */}
                                                <div className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-full border-2 font-bold text-sm ${circleClass}`}>
                                                    {optionLabels[i] || ""}
                                                </div>
                                                {/* Choice text */}
                                                <span className="flex-1 text-[15px] font-medium leading-snug">{choice}</span>
                                                {/* Status icon */}
                                                {Icon && <Icon className="w-4.5 h-4.5 shrink-0 opacity-70" />}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Explanation panel */}
                            {isExplanationVisible && (
                                <div className="bg-white rounded-2xl border border-blue-200 shadow-sm overflow-hidden">
                                    <div className="flex items-center gap-2.5 px-5 py-3.5 bg-blue-600 border-b border-blue-500">
                                        <BookOpen className="w-4 h-4 text-blue-100" />
                                        <span className="font-bold text-sm text-white">Explanation</span>
                                    </div>
                                    <div className="p-5">
                                        {expandedExplanation ? (
                                            <p className="text-slate-700 leading-relaxed text-[15px] whitespace-pre-wrap">
                                                {expandedExplanation}
                                            </p>
                                        ) : (
                                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                                                <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
                                                Loading explanation...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── AI Tutor panel ── */}
                {showAI && (
                    <div className="w-[420px] border-l border-slate-200 bg-white flex flex-col shrink-0 shadow-2xl z-20">
                        <div className="bg-violet-600 px-4 py-3 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-violet-500 rounded-lg">
                                    <Sparkles className="w-4 h-4 text-violet-100" />
                                </div>
                                <div>
                                    <p className="font-bold text-white text-sm">AI Study Tutor</p>
                                    <p className="text-xs text-violet-300">Powered by Gemini</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAI(false)}
                                className="p-1.5 hover:bg-violet-500 rounded-lg transition"
                            >
                                <X className="w-4 h-4 text-violet-200" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden relative bg-slate-50">
                            <ReviewChatbot questionId={q._id} questionText={q.questionText} headless />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}