"use client";    // Tương tác với user

import TestHeader from "@/components/test/TestHeader";
import TestFooter from "@/components/test/TestFooter";
import QuestionViewer from "@/components/QuestionViewer";            // Hiển thị câu hỏi
import Loading from "@/components/Loading";
import DesmosCalculator from "@/components/DesmosCalculator";        // Máy tính desmos

// Import 2 bộ não (Hooks) vừa được tạo
import { useTestEngine } from "@/hooks/useTestEngine";
import { useResizableDivider } from "@/hooks/useResizableDivider";

export default function TestEngine({ testId }: { testId: string }) {    
    // Nhận toàn bộ súng đạn từ Hook bài thi
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
        handleAnswerSelect,
        toggleFlag,
        handleNext,
        handlePrev,
        handleJump,
        handleSubmit,
        router
    } = useTestEngine(testId);

    // Nhận công cụ từ Hook chia đôi màn hình
    const { leftWidth, isDragging, containerRef, handleDividerMouseDown } = useResizableDivider(50);

    // Dưới là các chốt chặn trc khi hiển thị giao diện làm bài
    if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loading /></div>;   // Nếu đanh load thì load animation

    if (questions.length === 0) {    // Nếu mà k có câu hỏi nào sau khi lấy về thì hiện No question found và hiện 1 nút quay về trang chủ
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
                <h1 className="text-2xl font-bold mb-4 text-slate-900">No questions found!</h1>
                <button onClick={() => router.push('/full-length')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Return to Dashboard</button>
            </div>
        );
    }

    // Qua 2 chốt trên => Dữ liệu đã tải xong và chắc chắn có câu hỏi

    return (
        <div className="min-h-screen flex flex-col bg-white overflow-hidden relative selection:bg-yellow-200">
            <TestHeader         // Phần header trên bài test có: Tên section (Verbal or Math), Đồng hồ tgian còn lại, gọi hàm handleSubmit khi hết giờ
                sectionName={`${currentStage.section} - Module ${currentStage.module}`} // Hiện kèm tên module đang làm
                timeRemaining={timeRemaining}
                onTimeUp={handleSubmit}    // hàm xử lý khi hết giờ thì submit, onTimeUp chỉ là tên (ở phần khai báo thì nó là 1 hàm để truyền được handleSubmit vào), handleSubmit mới là bộ não, biết hết giờ và gửi
                isTimerHidden={isTimerHidden}           // Đây là component con k dùng logic để bật tắt timer mà chỉ nhạn tín hiệu từ component cha là TestLayout
                setIsTimerHidden={setIsTimerHidden}
                onToggleCalculator={() => setIsCalculatorOpen(!isCalculatorOpen)}       // Lật ngược lại bool bật tắt Calc
                showCalculator={currentStage.section === "Math"}

                buttonText={mode === "sectional" ? "Submit Module" : (currentStageIndex < 3 ? "Next Module" : "Submit Test")}
                confirmTitle={mode === "sectional" ? "Submit Module" : (currentStageIndex < 3 ? "Next Module" : "Submit Full Test")}
                confirmDescription={mode === "sectional" ? "Are you sure you want to grade this module now?" : "Are you sure you want to end this section?"}
            />

            <DesmosCalculator
                isOpen={isCalculatorOpen}                      // Nhận tín hiệu bật or tắt
                onClose={() => setIsCalculatorOpen(false)}     // nếu đang tắt thì tắt máy tính đi
            />

            <main
                ref={containerRef}
                className="flex-1 w-full bg-white relative overflow-hidden"
                style={{ userSelect: isDragging.current ? "none" : "auto" }}
                // THÊM MỚI: Bắt mousedown bubble lên từ #qv-divider bên trong QuestionViewer
                onMouseDown={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest("#qv-divider")) {
                        handleDividerMouseDown(e);
                    }
                }}
            >
                <QuestionViewer                                         // Truyền vào các tham số, hàm cho component con QuestionViewer
                    question={currentQuestion}                          // nội dung câu
                    userAnswer={answers[currentQuestion._id]}           // hiện đáp án user đã chọn 
                    onAnswerSelect={handleAnswerSelect}                 // hàm xử lý khi user chọn
                    isFlagged={!!flagged[currentQuestion._id]}
                    onToggleFlag={toggleFlag}                           // Hàm xử lý bật tắt cờ
                    index={currentIndex}                                // Truyền vào index của câu hiện tại cho component QuestionViewer, nó sẽ tự + 1
                    leftWidth={leftWidth}      // THÊM MỚI: truyền % vào để QuestionViewer tự chia layout
                />
            </main>
            {/* ─────────────────────────────────────────────────────────────────────── */}

            {/** Đây là mục  để di chuyển giữa các câu, và là cả thanh ở dưới trang, có nút next prev 
             * Đang thiếu Tên: FIX
            */}
            <TestFooter                              // Truyền tham số và hàm cho component con TestFooter
                currentIndex={currentIndex}           // Báo cho biết đây là câu số mấy
                totalQuestions={currentModuleQuestions.length}     // FIX: Tổng sổ câu giới hạn trong Module hiện tại
                onNext={handleNext}                   // hàm xử lý các nút next prev và jump
                onPrev={handlePrev}
                onJump={handleJump} 
                answers={answers}                     // Truyền vào các câu đã chọn để hiển thị màu khác các câu chưa chọn
                flagged={flagged}                     // Lấy thông tin các câu đã flag để hiện lên mục di chuyển giữa các câu
                questions={currentModuleQuestions}    // FIX: Giao danh sách câu hỏi CỦA MODULE HIỆN TẠI để vẽ số ô Grid tương ứng
            />
        </div>
    );
}