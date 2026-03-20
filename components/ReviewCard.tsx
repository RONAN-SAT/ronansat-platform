import { CheckCircle, XCircle, ChevronDown, ChevronUp, Sparkles } from "lucide-react";

interface ReviewCardProps {
    idx: number;
    ans: any;
    loadingExplanation: boolean;
    expandedExplanation?: string;
    isActiveChat: boolean;
    onExpandExplanation: (questionId: string) => void;
    onToggleChat: (questionId: string, questionText: string) => void;
}

export default function ReviewCard({
    idx,
    ans,
    loadingExplanation,
    expandedExplanation,
    isActiveChat,
    onExpandExplanation,
    onToggleChat
}: ReviewCardProps) {

    const isCorrect = ans.isCorrect;
    const q = ans.questionId;

    // Định nghĩa màu sắc tùy theo việc làm đúng hay sai để giao diện đồng bộ, mượt mượt hơn
    const bgClass = isCorrect ? "bg-emerald-50" : "bg-red-50";
    const borderClass = isCorrect ? "border-emerald-100" : "border-red-100";
    const hoverBgClass = isCorrect ? "hover:bg-emerald-100" : "hover:bg-red-100";

    return (  
        <div className={`rounded-lg border overflow-hidden ${bgClass} ${borderClass}`}>

            {/* Answer Header */}
            <div className="flex items-start justify-between p-4">
                <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center font-bold text-white mt-0.5 ${isCorrect ? "bg-emerald-500" : "bg-red-500"}`}>
                        {idx + 1}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-900">
                            Your answer: <span className="font-bold">{ans.userAnswer || "Omitted"}</span>
                        </p>
                        {!isCorrect && q && (
                            <p className="text-sm font-medium text-emerald-700 mt-1">
                                Correct answer: <span className="font-bold">{q.correctAnswer}</span>    
                            </p>
                        )}
                        {q && (
                            <p className="text-xs text-slate-500 mt-2 line-clamp-2">{q.questionText}</p>
                        )}
                    </div>
                </div>
                <div className="shrink-0 ml-3">
                    {isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                    ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                    )}
                </div>
            </div>

            {/* Actions */}
            {q && (
                <>
                    <button
                        onClick={() => onExpandExplanation(q._id)}   
                        disabled={loadingExplanation}                  
                        className={`w-full flex items-center justify-between px-4 py-2.5 ${bgClass} border-t ${borderClass} text-sm font-medium text-blue-700 ${hoverBgClass} transition-colors`}
                    >
                        <span>{loadingExplanation ? "Loading..." : expandedExplanation ? "Hide Explanation" : "View Explanation"}</span>
                        {expandedExplanation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {/* Explanation Body */}
                    {expandedExplanation && (
                        <div className={`px-4 py-4 ${bgClass} border-t ${borderClass} text-sm text-slate-700 animate-in slide-in-from-top-1 duration-150 flex flex-col gap-4`}>
                            
                            {/* 1. HIỂN THỊ ẢNH NẾU CÂU HỎI CÓ ẢNH (Đã sửa từ q.image thành q.imageUrl) */}
                            {q.imageUrl && (
                                <div className="w-full bg-white p-2 rounded-lg border border-slate-200 shadow-sm flex justify-center">
                                    <img 
                                        src={q.imageUrl} 
                                        alt="Question graphic" 
                                        className="max-w-full max-h-[400px] object-contain rounded"
                                        loading="lazy"
                                    />
                                </div>
                            )}

                            {/* 2. HIỂN THỊ FULL CÂU HỎI */}
                            <div className="bg-white p-3 rounded border border-slate-200">
                                <span className="font-bold text-slate-800 block mb-1">Full Question:</span>
                                <p className="whitespace-pre-wrap text-slate-600">{q.questionText}</p>
                            </div>

                            {/* 3. HIỂN THỊ LỜI GIẢI CHI TIẾT */}
                            <div className="bg-white p-3 rounded border border-slate-200">
                                <span className="font-bold text-slate-800">Explanation: </span>
                                <div className="mt-1 whitespace-pre-wrap">{expandedExplanation}</div>
                            </div>
                        </div>
                    )}

                    {/* AI Tutor Button */}
                    <div className={`px-4 py-2.5 border-t ${borderClass} flex`}>
                        <button                
                            onClick={() => onToggleChat(q._id, q.questionText)}     
                            className={`text-sm font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${isActiveChat
                                ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                                : "bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                }`}
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            {isActiveChat ? "Tutoring this" : "Ask AI Tutor"}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}