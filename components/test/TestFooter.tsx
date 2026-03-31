"use client";

import { useState } from "react";
// Đã thay đổi import: Xóa ChevronLeft/ChevronRight và thêm ChevronUp cho nút Grid
import { ChevronUp, Check, Flag } from "lucide-react";
import { Button } from "antd";

interface TestFooterProps {
    moduleName?: string;
    currentIndex: number;
    totalQuestions: number;
    onNext: () => void;
    onPrev: () => void;
    onJump: (index: number) => void;
    answers: Record<string, string>;
    flagged: Record<string, boolean>;
    questions: any[];
}

export default function TestFooter({
    moduleName,
    currentIndex,
    totalQuestions,
    onNext,
    onPrev,
    onJump,
    answers,
    flagged,
    questions
}: TestFooterProps) {

    const [isGridOpen, setIsGridOpen] = useState(false);

    return (
        <>
            {isGridOpen && (
                <>
                    {/* Lớp nền vô hình: Bấm ra ngoài vùng chữ nhật sẽ tự động đóng Grid */}
                    <div 
                        className="fixed inset-0 z-30" 
                        onClick={() => setIsGridOpen(false)}
                    ></div>

                    {/* Khung Pop-up hình chữ nhật nhỏ xinh */}
                    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.15)] border border-slate-200 z-40 w-[340px] sm:w-[420px] p-5 transition-all animate-in fade-in zoom-in-95 duration-200">
                        
                        {/* Header của pop-up */}
                        <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-800">Select a Question</h3>
                            <Button 
                                type="text" 
                                size="small" 
                                onClick={() => setIsGridOpen(false)}
                                className="text-slate-500 hover:text-slate-700"
                            >
                                Close
                            </Button>
                        </div>

                        {/* Chú thích (Legend) thu nhỏ lại thành 2 cột cho vừa khung */}
                        <div className="grid grid-cols-2 gap-y-2 gap-x-1 mb-5 text-xs font-medium text-slate-600">
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-slate-900 rounded-sm"></div> Current</div>
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 border border-blue-600 bg-blue-50 text-blue-600 flex items-center justify-center rounded-sm"><Check className="w-2 h-2" /></div> Answered</div>
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-slate-100 border border-slate-300 rounded-sm"></div> Unanswered</div>
                            <div className="flex items-center gap-1.5"><Flag className="w-3 h-3 fill-amber-400 text-amber-500" /> For Review</div>
                        </div>

                        {/* Lưới câu hỏi: Thu lại còn 5 cột thay vì 10 cột để nút không bị méo */}
                        <div className="grid grid-cols-5 gap-2 max-h-[45vh] overflow-y-auto pr-1">
                            {questions.map((q, i) => {
                                const isAnswered = !!answers[q._id];
                                const isFlagged = !!flagged[q._id];
                                const isCurrent = i === currentIndex;

                                return (
                                    <button
                                        key={q._id}
                                        onClick={() => {
                                            onJump(i);
                                            setIsGridOpen(false); 
                                        }}
                                        className={`
                                            cursor-pointer relative w-full aspect-square flex items-center justify-center rounded text-sm font-semibold transition-all border-2 
                                            ${isCurrent ? 'bg-slate-900 border-slate-900 text-white transform scale-105 z-10' :
                                            isAnswered ? 'bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100 hover:border-blue-300' :
                                            'bg-white border-slate-200 text-slate-600 hover:border-slate-400'}
                                        `}
                                    >
                                        {isAnswered && !isCurrent && <Check className="w-3 h-3 absolute top-0.5 right-0.5 opacity-50" />}
                                        {i + 1}
                                        {isFlagged && ( 
                                            <div className="absolute -top-1.5 -right-1.5 bg-white rounded-full">
                                                <Flag className="w-4 h-4 fill-amber-400 text-amber-500" />
                                            </div>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                        
                        {/* Mũi tên chĩa xuống thanh Footer cho đẹp */}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b border-r border-slate-200 transform rotate-45"></div>
                    </div>
                </>
            )}

            {/* ĐỔI bg-[#f2f6fa] THÀNH bg-[#ebf0f7] CHO BOTTOM BAR */}
            {/* Đã xóa bỏ class 'relative' ở cuối dòng này */}
            <footer className="fixed bottom-0 left-0 right-0 h-16 bg-[#ebf0f7] border-t border-slate-300 flex items-center justify-between px-6 z-50">
                
                {/* ĐƯỜNG PHÂN CÁCH DƯỚI (TRÊN BOTTOM BAR) */}
                <div 
                    className="absolute top-0 left-0 w-full h-[2px]" 
                    style={{ backgroundImage: 'repeating-linear-gradient(to right, #2d3642 0, #1c2128 19px, transparent 19px, transparent 20px)' }}
                ></div>

                <div className="flex-1">
                    <span className="font-semibold text-slate-800 text-sm sm:text-base">
                        {sessionStorage.getItem('testName') || "Vinh Le"}
                    </span>
                </div>

                <div className="flex-1 flex justify-center items-center">
                    {/* Nút Grid màu đen giống ảnh, thêm bo góc rounded-md, đổi icon thành ChevronUp */}
                    <button
                        onClick={() => setIsGridOpen(!isGridOpen)}
                        className="cursor-pointer font-bold text-white bg-[#1a1c23] hover:bg-black transition-colors px-4 py-2 rounded-md flex items-center shadow-sm text-sm"
                    >
                        <span>Question {currentIndex + 1} of {totalQuestions}</span>
                        <ChevronUp className={`w-4 h-4 transition-transform ${isGridOpen ? 'rotate-180' : ''} inline-block ml-2`} />
                    </button>
                </div>

                <div className="flex-1 flex justify-end items-center gap-3">
                    {/* Chuyển nút Back thành nút thường, màu xanh, dáng viên thuốc (pill), bỏ icon */}
                    {currentIndex > 0 && (
                        <button
                            onClick={onPrev}
                            className="cursor-pointer bg-[#3b5bd9] hover:bg-[#2e4bb5] text-white font-semibold py-1.5 px-6 rounded-full transition-colors text-sm"
                        >
                            Back
                        </button>
                    )}

                    {/* Chuyển nút Next thành nút thường, màu xanh, dáng viên thuốc (pill), bỏ icon */}
                    {currentIndex < totalQuestions - 1 && (
                        <button
                            onClick={onNext}
                            className="cursor-pointer bg-[#3b5bd9] hover:bg-[#2e4bb5] text-white font-semibold py-1.5 px-6 rounded-full transition-colors text-sm"
                        >
                            Next
                        </button>
                    )}
                </div>
            </footer>
        </>
    );
}