import Link from "next/link";
import { Clock, BookOpen, GraduationCap } from "lucide-react";

interface Test {
    _id: string;
    title: string;
    timeLimit: number;
    difficulty: string;
    sections: any[];
}

interface TestCardProps {
    test: Test;
    isSectional?: boolean;
    subjectFilter?: string;
    userResults?: any[];
}

export default function TestCard({ test, isSectional = false, subjectFilter, userResults = [] }: TestCardProps) {
    const totalQuestions = test.sections?.reduce((acc, sec) => acc + sec.questionsCount, 0) || 0;

    // 1. Chuyển đổi tên môn học để khớp hoàn toàn với dữ liệu lưu trên Database
    const formattedSectionName = subjectFilter === "reading" ? "Reading and Writing" : "Math";

    // 2. TÌM KẾT QUẢ: Đã đổi tên biến thành `sectionalSubject` và `sectionalModule` cho chuẩn xác
    const getModuleResult = (moduleNumber: number) => {
        return userResults.find(
            (r) => r.testId === test._id && r.sectionalSubject === formattedSectionName && r.sectionalModule === moduleNumber
        );
    };

    const mod1Result = isSectional ? getModuleResult(1) : null;
    const mod2Result = isSectional ? getModuleResult(2) : null;

    // 3. TỰ ĐỘNG TÍNH ĐIỂM: Khắc phục lỗi điểm trống bằng cách đếm số câu có isCorrect = true
    const getScore = (res: any) => {
        if (res?.answers) return res.answers.filter((a: any) => a.isCorrect).length;
        return res?.score || 0;
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-blue-200 transition-all group flex flex-col h-full">
            <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-700">
                        {test.title}
                    </h3>
                </div>

                <div className="space-y-2 mt-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>{test.timeLimit} Minutes Total</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-slate-400" />
                        <span>{totalQuestions} Questions</span>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 mt-auto">
                {isSectional ? (
                    <div className="flex flex-col gap-3">
                        {/* Nút Module 1 */}
                        <div className="relative group/btn">
                            {mod1Result && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-max whitespace-nowrap bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow-sm border border-amber-600">
                                    Previous Result: {getScore(mod1Result)} / {subjectFilter === "reading" ? 27 : 22}
                                </div>
                            )}
                            <Link
                                    href={`/test/${test._id}?section=${formattedSectionName}&module=1&mode=sectional`}                                className={`relative block w-full text-center font-medium py-2.5 px-4 rounded-lg border transition-all ${
                                    mod1Result 
                                        ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300" 
                                        : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md border-transparent"
                                }`}
                            >
                                {mod1Result ? "Retake Module 1" : "Start Module 1"}
                            </Link>
                        </div>

                        {/* Nút Module 2 */}
                        <div className="relative group/btn mt-2">
                            {mod2Result && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-max whitespace-nowrap bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow-sm border border-amber-600">
                                    Previous Result: {getScore(mod2Result)} / {subjectFilter === "reading" ? 27 : 22}
                                </div>
                            )}
                            <Link
                                    href={`/test/${test._id}?section=${formattedSectionName}&module=2&mode=sectional`}                                className={`relative block w-full text-center font-medium py-2.5 px-4 rounded-lg border transition-all ${
                                    mod2Result 
                                        ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300" 
                                        : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md border-transparent"
                                }`}
                            >
                                {mod2Result ? "Retake Module 2" : "Start Module 2"}
                            </Link>
                        </div>
                    </div>
                ) : (
                    /* NẾU LÀ TRANG FULL-LENGTH BÌNH THƯỜNG -> HIỂN THỊ 1 NÚT NHƯ CŨ */
                    <Link
                        href={`/test/${test._id}?mode=full`}
                        className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
                    >
                        Start Practice
                    </Link>
                )}
            </div>
        </div>
    );
}