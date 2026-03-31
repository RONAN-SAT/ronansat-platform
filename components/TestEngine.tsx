"use client";

import TestHeader from "@/components/test/TestHeader";
import TestFooter from "@/components/test/TestFooter";
import QuestionViewer from "@/components/QuestionViewer";            
import Loading from "@/components/Loading";
import DesmosCalculator from "@/components/DesmosCalculator";        

import { useTestEngine } from "@/hooks/useTestEngine";
import { useResizableDivider } from "@/hooks/useResizableDivider";

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
        availableModules, // Nhận thêm dữ liệu này
        handleAnswerSelect,
        toggleFlag,
        handleNext,
        handlePrev,
        handleJump,
        handleSubmit,
        router
    } = useTestEngine(testId);

    const { leftWidth, isDragging, containerRef, handleDividerMouseDown } = useResizableDivider(50);

    if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loading /></div>;   

    if (questions.length === 0) {    
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
                <h1 className="text-2xl font-bold mb-4 text-slate-900">No questions found!</h1>
                <button onClick={() => router.push('/full-length')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Return to Dashboard</button>
            </div>
        );
    }

    // KIỂM TRA XEM MODULE HIỆN TẠI CÓ PHẢI LÀ MODULE CUỐI CÙNG TRONG CHUỖI KHÔNG
    const isLastModule = availableModules.length === 0 || availableModules[availableModules.length - 1].originalIndex === currentStageIndex;

    // Đổi chữ hiển thị và chức năng của chữ Confirm
    const buttonText = mode === "sectional" ? "Submit Module" : (isLastModule ? "Submit Test" : "Next Module");
    const confirmDescription = mode === "sectional" 
        ? "Are you sure you want to grade this module now?" 
        : (isLastModule ? "Are you sure you want to submit the entire test?" : "Are you sure you want to end this section?");

    return (
        <div className="min-h-screen flex flex-col bg-white overflow-hidden relative selection:bg-yellow-200">
            <TestHeader         
                sectionName={`${currentStage.section} - Module ${currentStage.module}`} 
                timeRemaining={timeRemaining}
                onTimeUp={handleSubmit}    
                isTimerHidden={isTimerHidden}           
                setIsTimerHidden={setIsTimerHidden}
                onToggleCalculator={() => setIsCalculatorOpen(!isCalculatorOpen)}       
                showCalculator={currentStage.section === "Math"}
                buttonText={buttonText}
                confirmTitle={buttonText}
                confirmDescription={confirmDescription}
                onLeave={() => router.push(mode === "sectional" ? "/sectional" : "/full-length")}
            />

            <DesmosCalculator
                isOpen={isCalculatorOpen}                      
                onClose={() => setIsCalculatorOpen(false)}     
            />

            <main
                ref={containerRef}
                className="flex-1 w-full bg-white relative overflow-hidden"
                style={{ userSelect: isDragging.current ? "none" : "auto" }}
                onMouseDown={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest("#qv-divider")) {
                        handleDividerMouseDown(e);
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