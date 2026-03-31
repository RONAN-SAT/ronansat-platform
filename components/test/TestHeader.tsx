"use client";

// Đã thay đổi import: Xóa ChevronLeft/ChevronRight và thêm ChevronUp cho nút Grid
import { EyeOff, Eye, Calculator } from "lucide-react";
import { Button, Popconfirm } from "antd";
import { CircleX } from "lucide-react"; // Thêm CircleX vào đây

interface TestHeaderProps {
    sectionName: string;
    timeRemaining: number;
    onTimeUp: () => void;
    isTimerHidden: boolean;
    setIsTimerHidden: (hide: boolean) => void;
    isLastModule?: boolean;
    showCalculator?: boolean; 
    buttonText?: string;
    confirmTitle?: string;
    confirmDescription?: string;
    onToggleCalculator?: () => void; // Gộp chung vào interface cho gọn
    onLeave: () => void; // THÊM DÒNG NÀY
}

export default function TestHeader({
    sectionName,
    timeRemaining,
    onTimeUp,
    isTimerHidden,
    setIsTimerHidden,
    onToggleCalculator,
    isLastModule,
    showCalculator = true,
    buttonText,
    confirmTitle,
    confirmDescription,
    onLeave
}: TestHeaderProps) {

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <header className="bg-[#ebf0f7] border-b border-slate-300 h-16 flex items-center justify-between px-6 z-50 fixed top-0 w-full left-0 right-0 shadow-sm">
            <div className="flex-1 flex items-center">
                <h1 className="font-bold text-lg text-slate-800 tracking-tight">
                    {sectionName}
                </h1>
            </div>

            {/* Timer luôn nằm giữa màn hình */}
            <div className="absolute left-1/2 -translate-x-1/2 flex justify-center items-center">
                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-3">
                        {!isTimerHidden ? (
                            <span className={`text-xl font-mono font-bold tracking-wider ${timeRemaining < 300 ? "text-red-600 animate-pulse" : "text-slate-900"}`}>
                                {formatTime(timeRemaining)}
                            </span>
                        ) : (
                            <span className="text-xl font-mono text-slate-400 tracking-wider">--:--</span>
                        )}

                        <Button
                            onClick={() => setIsTimerHidden(!isTimerHidden)}
                            type="text"
                            icon={isTimerHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            className="text-slate-500 hover:text-slate-800"
                        >
                            <span className="hidden sm:inline ml-1">{isTimerHidden ? "Show" : "Hide"}</span>
                        </Button>
                    </div>
                </div>
            </div>

           <div className="flex-1 flex justify-end items-center gap-4">
    {/* NÚT CALCULATOR ĐÃ ĐƯỢC SỬA LẠI */}
    {showCalculator && (
        <button
            onClick={onToggleCalculator}
            type="button"
            title="Calculator" // Thêm title để khi hơ chuột vào sẽ hiện chữ "Calculator" nhỏ xíu (tooltip mặc định)
            className="cursor-pointer p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors flex items-center justify-center outline-none"
        >
            <Calculator className="w-5 h-5" /> {/* Tăng size lên w-5 h-5 cho bằng với nút X bên dưới */}
        </button>
    )}

    {/* NÚT SUBMIT / NEXT MODULE GIỮ NGUYÊN */}
    <Popconfirm 
        title={confirmTitle || (isLastModule ? "Submit Entire Test?" : "Finish This Module?")}
        description={confirmDescription || (isLastModule 
            ? "You are about to finish the test. You cannot go back to any module after this." 
            : "Once you move to the next module, you cannot return to the current questions.")}
        onConfirm={onTimeUp} 
        okText="Yes"
        cancelText="No"
        placement="bottomRight"
    >
        <Button 
            type="default" 
            danger={buttonText === "Submit Module" || buttonText === "Submit Test" || isLastModule} 
            className={`
                rounded-full px-8 h-10 font-semibold transition-all border-2
                ${(buttonText === "Submit Module" || buttonText === "Submit Test" || isLastModule)
                    ? "!border-[#fb2a57] !text-[#fb2a57] hover:!bg-[#fb2a57]/10 bg-transparent" 
                    : "" 
                }
            `}
        >
            {buttonText || (isLastModule ? "Submit Test" : "Next Module")}
        </Button>
    </Popconfirm>

    {/* NÚT LEAVE EXAM GIỮ NGUYÊN */}
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
            className="cursor-pointer p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors flex items-center justify-center outline-none"
        >
            <CircleX className="w-5 h-5" />
        </button>
    </Popconfirm>
</div>

            {/* ĐƯỜNG PHÂN CÁCH TRÊN (DƯỚI TOP BAR) */}
            <div 
                className="absolute bottom-0 left-0 w-full h-[2px]" 
                style={{ backgroundImage: 'repeating-linear-gradient(to right, #2d3642 0, #1c2128 19px, transparent 19px, transparent 20px)' }}
            ></div>
        </header>
    );
}