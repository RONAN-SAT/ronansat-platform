// hooks/useTestEngine.ts
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/axios";
import { API_PATHS } from "@/lib/apiPaths";
import { checkIsCorrect } from "@/utils/gradingHelper";
import { useTimer } from "./useTimer";

export const testStages = [
    { section: "Reading and Writing", module: 1, duration: 32 * 60 },
    { section: "Reading and Writing", module: 2, duration: 32 * 60 },
    { section: "Math", module: 1, duration: 35 * 60 },
    { section: "Math", module: 2, duration: 35 * 60 },
];

export function useTestEngine(testId: string) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mode = searchParams.get("mode") || "full"; 
    const targetSection = searchParams.get("section");
    const targetModule = searchParams.get("module") ? parseInt(searchParams.get("module") as string) : null;

    const [testStats, setTestStats] = useState<any>(null);     
    const [questions, setQuestions] = useState<any[]>([]);     
    const [loading, setLoading] = useState(true);              

    const [currentIndex, setCurrentIndex] = useState(0);                   
    const [answers, setAnswers] = useState<Record<string, string>>({});    
    const [flagged, setFlagged] = useState<Record<string, boolean>>({});   
    const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);     

    // Tạm thời khởi tạo Stage ban đầu là 0, sẽ được tự động sửa chữa ngay khi Load xong questions
    const [currentStageIndex, setCurrentStageIndex] = useState(0);

    // Mảng này giúp ta biết được module nào thực sự có câu hỏi để bỏ qua module trống
    const availableModules = testStages.map((stage, index) => ({
        ...stage,
        originalIndex: index // Lưu lại vị trí thực tế trong mảng testStages gốc
    })).filter(stage =>
        questions.some(q => q.section === stage.section && q.module === stage.module)
    );

    const currentStage = testStages[currentStageIndex];
    const currentModuleQuestions = questions.filter(
        (q) => q.section === currentStage.section && q.module === currentStage.module
    );

    const { timeRemaining, setTimeRemaining, isTimerHidden, setIsTimerHidden } = useTimer(
        0, 
        loading,
        () => handleSubmit()
    );

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const res = await api.get(API_PATHS.getQuestionsByTestId(testId));     
                const fetchedQuestions = res.data.questions || [];
                setQuestions(fetchedQuestions);    

                // CHỐT CHẶN: Sau khi có dữ liệu, xác định ngay module hợp lệ đầu tiên để hiển thị
                const validStages = testStages.map((stage, idx) => ({ ...stage, originalIndex: idx }))
                    .filter(stage => fetchedQuestions.some((q: any) => q.section === stage.section && q.module === stage.module));

                if (validStages.length > 0) {
                    let startIndex = validStages[0].originalIndex; // Mặc định ở Full-length: lấy module hợp lệ đầu tiên

                    // Nếu user click từ chế độ Sectional, tìm đúng vị trí module đó
                    if (mode === "sectional" && targetSection && targetModule) {
                        const found = validStages.find(s => s.section === targetSection && s.module === targetModule);
                        if (found) startIndex = found.originalIndex;
                    }

                    setCurrentStageIndex(startIndex);
                    setTimeRemaining(testStages[startIndex].duration);
                }

                sessionStorage.setItem('testName', 'Practice Test');    
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);     
            }
        };
        fetchQuestions();   
    }, [testId, mode, targetSection, targetModule]);

    const handleAnswerSelect = (questionId: string, choice: string) => {    
        setAnswers({ ...answers, [questionId]: choice });     
    };

    const toggleFlag = (questionId: string) => {
        setFlagged({ ...flagged, [questionId]: !flagged[questionId] });
    };

    const handleNext = () => {          
        if (currentIndex < currentModuleQuestions.length - 1) setCurrentIndex(currentIndex + 1);   
    };

    const handlePrev = () => {
        if (currentIndex > 0) setCurrentIndex(currentIndex - 1); 
    };

    const handleJump = (index: number) => {
        setCurrentIndex(index);
    };

    const handleSubmit = async () => {
        // TÌM MODULE KẾ TIẾP CÓ CÂU HỎI
        const nextStage = availableModules.find(s => s.originalIndex > currentStageIndex);

        // 1. NẾU LÀ FULL TEST VÀ VẪN CÒN MODULE TRONG TƯƠNG LAI -> SKIP NHẢY VÀO NEXT STAGE
        if (mode === "full" && nextStage) {
            setCurrentStageIndex(nextStage.originalIndex);
            setCurrentIndex(0); 
            setTimeRemaining(testStages[nextStage.originalIndex].duration); 
            return; 
        }

        // 2. NẾU LÀ SECTIONAL HOẶC ĐÃ LÀ MODULE CUỐI CÙNG -> CHẤM ĐIỂM
        try {
            const questionsToGrade = mode === "sectional" ? currentModuleQuestions : questions;
            const formattedAnswers = questionsToGrade.map(q => {
                const userAns = answers[q._id] || "Omitted";
                return {
                    questionId: q._id,
                    userAnswer: userAns,
                    isCorrect: checkIsCorrect(q, userAns) 
                };
            });

            if (mode === "sectional") {
                let correctCount = 0;
                currentModuleQuestions.forEach(q => {
                    const userAns = answers[q._id] || "";
                    if (checkIsCorrect(q, userAns)) correctCount++; 
                });

                const res = await api.post(API_PATHS.RESULTS, {
                    testId,
                    isSectional: true,                       
                    sectionalSubject: currentStage.section,  
                    sectionalModule: currentStage.module,    
                    answers: formattedAnswers,
                    totalScore: correctCount,                
                    readingScore: 0,                         
                    mathScore: 0                             
                });

                if (res.status === 200 || res.status === 201) {
                    router.push(`/review?testId=${testId}&mode=sectional`);
                }
            } else {
                let earnedReadingPoints = 0;
                let earnedMathPoints = 0;

                questions.forEach(q => {
                    const userAns = answers[q._id] || "";
                    if (checkIsCorrect(q, userAns)) { 
                        const points = q.points || 0; 
                        if (q.section === "Reading and Writing") {
                            earnedReadingPoints += points;
                        } else if (q.section === "Math") {
                            earnedMathPoints += points;
                        }
                    }
                });

                const readingScore = Math.min(200 + earnedReadingPoints, 800);
                const mathScore = Math.min(200 + earnedMathPoints, 800);
                const totalScore = readingScore + mathScore;

                const res = await api.post(API_PATHS.RESULTS, {
                    testId,
                    isSectional: false,
                    answers: formattedAnswers,
                    score: totalScore,
                    sectionBreakdown: { readingAndWriting: readingScore, math: mathScore }
                });

                if (res.status === 200 || res.status === 201) {
                     router.push(`/review?testId=${testId}&mode=full`);                
                }
            }
        } catch (err) {
            console.error(err);
            alert("Failed to submit test");
        }
    };

    const currentQuestion = currentModuleQuestions[currentIndex] || questions[0];

    return {
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
        availableModules, // TRẢ THÊM MẢNG NÀY ĐỂ UI BIẾT
        handleAnswerSelect,
        toggleFlag,
        handleNext,
        handlePrev,
        handleJump,
        handleSubmit,
        router
    };
}