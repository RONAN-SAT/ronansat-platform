"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";                            // Link là tạo ra đường link cho user bấm vào còn useRouter là điều hướng ngay khi thực hiện xong 1 hành động
import { ArrowLeft, RefreshCcw, CheckCircle, XCircle, ChevronDown, ChevronUp, Sparkles, X } from "lucide-react";
import Loading from "@/components/Loading";
import ReviewChatbot from "@/components/ReviewChatbot";       // Chatbot 
import ReviewCard from "@/components/ReviewCard";             // Khuôn review card để không phải copy đi đi lại lại 1 đoạn HTML cho nhiều câu
import api from "@/lib/axios";
import { API_PATHS } from "@/lib/apiPaths";

export default function ReviewPage() {

    const { data: session, status } = useSession();   // Check đã đăng nhập chưa ở mọi phần của web, tránh việc user type url và vào được web
                                                      // lấy thông tin lần đăng nhập này: session và status

    const [results, setResults] = useState([]);  // Ban đầu là danh sách rỗng, hệ thống sẽ lấy toàn bộ lịch sử điểm số để cho vào mảng results này
    const [loading, setLoading] = useState(true);   // animation loading


    // <Record<string, string>> giống cuốn sổ lưu 2 cột thông tin: vd: cột một lưu mã câu hỏi, cột 2 lưu explanation
    const [expandedExplanations, setExpandedExplanations] = useState<Record<string, string>>({});              //  Lưu mã câu hỏi và explanation của câu đó
    const [loadingExplanations, setLoadingExplanations] = useState<Record<string, boolean>>({});               //  Lưu mã câu và giá trị boolean để xem câu cụ thể đó có đang load hay không, tránh vì 1 câu đang load và cả trang web bị freeze
    const [activeChat, setActiveChat] = useState<{ questionId: string; questionText: string } | null>(null);   //  state để gửi thông tin cho AI: Khi ấn hỏi AI thì gửi 2 thông tin là Mã câu hỏi và nội dung câu hỏi để AI biết trả lời, giá trị ban đầu là null (chưa ấn hỏi câu nào)
                                                                                                               // cái | null là vì TypeScript rất ngặt với type, giá trị ban đầu lại là null chứ k phải 2 giá trị ID và Text kia nên sẽ lỗi nếu k có | null
    const [expandedTests, setExpandedTests] = useState<Record<string, boolean>>({});                           //  Lưu mã test và giá trị boolean xem test đó có đang được mở rông ra không (xem thông tin cụ thể hơn)

    const toggleTestExpand = (testId: string) => {                               //Hàm xử lý việc bật/tắt trạng thái expand của test mà mình ấn vào
                                                                                 // React không cho update trực tiếp vào bản gốc => Tạo 1 copy và thay đổi bản copy rồi update bản copy để được hiện lên màn hình
        setExpandedTests((prev) => ({ ...prev, [testId]: !prev[testId] }));      // vì dữ liệu mới phụ thuộc vào dữ liệu cũ (toggle) nên truyền vào prev
                                                                                 // ...prev copy tất cả bài test kèm trạng thái true/false (đang expand or not) của từng bài
                                                                                 // [testId] k phải mảng mà là giá trị được thay đổi trong object prev, [] giúp JS biết mình cần lấy giá trị của testId (id của bài test) chứ k phải chữ "testId"
                                                                                 //  !prev[testId] -> Nhìn vào sổ cũ, xem giá trị của bài test cũ là gì và đảo lại từ true thành false và ngược lại
     };

    const handleExpandExplanation = async (questionId: string) => {         // Khi bấm vào nút expand phần xem lời giải, có 2 trường hợp: 1 là đã mở, 2 là chưa mở
        if (expandedExplanations[questionId]) {                    // True tức là đã mở phần lời giải
            const newExplanations = { ...expandedExplanations };   // Copy cuốn sổ lời giải
            delete newExplanations[questionId];                    // Xóa phần lời giải của câu hiện tại trong bộ nhớ chứa phần giải thích
            setExpandedExplanations(newExplanations);              // Lưu lại cuốn sổ mới
            return;    // Không chạy bên dưới (xử lý khi đang đóng phần explanation)
        }

        setLoadingExplanations((prev) => ({ ...prev, [questionId]: true }));    // Chuyển biến boolean của Id câu hỏi thành true để bật animation loading khi user bấm explanation cho câu hỏi cụ thể này
                                                                                // update lên bản nháp nên phải copy tạo bản nháp ...prev
        try {
            const res = await api.get(API_PATHS.getQuestionExplanation(questionId));  // Lấy phần giải thích của câu hỏi này
            const data = res.data;                                                    // Lấy thông tin từ bưu kiện res mà BE gửi lên
            if (data.explanation) {   // Nếu có explanation thì update lên lời giải thích mới lấy được từ data.explanation lên câu hỏi với questionId lên bản nháp ...prev
                setExpandedExplanations((prev) => ({ ...prev, [questionId]: data.explanation }));   
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingExplanations((prev) => ({ ...prev, [questionId]: false }));    // Tắt animation loading cho câu hỏi cụ thể này
        }
    };

    useEffect(() => {   //Hoạt động ngay khi mở trang và khi biến session OR status thay đổi -> Khi login hay logout đều xử lý data phù hợp
        if (status === "unauthenticated") {    // Chưa đăng nhập -> Bị lôi ra trang đăng nhập
            window.location.href = "/auth";    // Xử lý khi vừa logout
        }

        if (session) {                       // Nếu thẻ đăng nhập hợp lên (Tức vừa login )
            const fetchResults = async () => {       // Lấy điểm số cũ ngay khi vừa vào
                try {
                    const res = await api.get(API_PATHS.RESULTS);    
                    const data = res.data;
                    setResults(data.results || []);   // Nhét data vừa lấy đc từ BE vào bộ nhớ setResults
                                                      // Nếu data.results lỗi => Chưa làm bài nào => Trả về mảng rỗng tránh lỗi
                } catch (e) {
                    console.error(e);
                } finally {
                    setLoading(false);   // Tắt loading vì mặc định ban đầu của web là chạy animation load, lấy data xong mới stop load
                }
            };

            fetchResults();
        }
    }, [session, status]);

    if (loading || status === "loading") return <Loading />;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Main Two-Column Layout */}
            <div className="bg-slate-50 pl-20 pt-10 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-slate-900">Score Reports &amp; Review</h1>
                </div>
            </div>
            <div className="max-w-7xl mx-auto flex gap-6 p-8">

                {/* Left: Questions */}
                <div className={`flex-1 min-w-0 transition-all duration-300 ${activeChat ? "max-w-[calc(100%-420px)]" : ""}`}>
                    {results.length === 0 ? (
                        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center">
                            <RefreshCcw className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-slate-800 mb-2">No attempts yet</h2>
                            <p className="text-slate-500 mb-6">Take a practice test to see your score report and review mistakes here.</p>
                            <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium">
                                Return Home
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {results.map((result: any) => (      // Vẽ khuôn cho tất cả các bài test
                                <div key={result._id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                    {/* Test Result Header */}
                                    <button
                                        onClick={() => toggleTestExpand(result._id)}     // Lấy id của bài test đang được .map đi qua và nếu click vào nút thì lấy id của bài test để truyền vào hàm toggle
                                        className="w-full text-left p-6 border-b border-slate-100 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="flex justify-between items-end w-full pr-6">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                                    {new Date(result.date || result.createdAt).toLocaleDateString()}
                                                </p>
    
                                     {/* TÊN BÀI TEST & ĐIỂM SỐ */}
                                        {result.isSectional ? (
                                            <>
                                                <h3 className="text-2xl font-bold text-slate-900">
                                                    {/* Đã thêm tên bài test lên trước */}
                                                    {result.testId?.title} - {result.sectionalSubject} (Module {result.sectionalModule})
                                                </h3>
                                                <p className="font-bold text-xl text-blue-600 mt-1">
                                                    Score: {result.answers.filter((a: any) => a.isCorrect).length} / {result.answers.length}
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <h3 className="text-2xl font-bold text-slate-900">
                                                    {/* Đã thêm tên bài test cho bản Full-length */}
                                                    {result.testId?.title} - Full Test
                                                </h3>
                                                <p className="font-bold text-xl text-blue-600 mt-1">Total Score: {result.score}</p>
                                                
                                                {/* CHỈ HIỆN ĐIỂM THÀNH PHẦN NẾU LÀ FULL TEST */}
                                                <div className="flex gap-4 mt-2 text-sm text-slate-600 font-medium">
                                                    <span>Reading &amp; Writing: {result.sectionBreakdown?.readingAndWriting || 0}</span>
                                                    <span className="text-slate-300">|</span>
                                                    <span>Math: {result.sectionBreakdown?.math || 0}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                            <div className="text-right">
                                                <p className="text-sm text-slate-500 font-medium mb-1">Performance Details</p>
                                                <p className="text-lg font-bold">
                                                    <span className="text-emerald-600">{result.answers.filter((a: any) => a.isCorrect).length} Correct</span>
                                                    <span className="mx-2 text-slate-300">/</span>
                                                    <span className="text-red-500">{result.answers.filter((a: any) => !a.isCorrect).length} Incorrect</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-slate-400 shrink-0 border-l border-slate-200 pl-6 h-full flex items-center">
                                            {expandedTests[result._id] ? <ChevronUp className="w-8 h-8" /> : <ChevronDown className="w-8 h-8" />}
                                        </div>
                                    </button>

                                    {/* Expanded Question List */}
                                    {expandedTests[result._id] && (
                                        <div className="p-6 bg-white animate-in slide-in-from-top-2 duration-200">
                                            <h4 className="font-semibold text-slate-800 text-lg mb-4">Question Review</h4>
                                            <div className="space-y-3">
                                                {result.answers.map((ans: any, idx: number) => (
                                                    <ReviewCard
                                                        key={idx}
                                                        idx={idx}
                                                        ans={ans}
                                                        loadingExplanation={!!(ans.questionId && loadingExplanations[ans.questionId._id])}
                                                        expandedExplanation={ans.questionId ? expandedExplanations[ans.questionId._id] : undefined}
                                                        isActiveChat={!!(ans.questionId && ans.questionId._id === activeChat?.questionId)}
                                                        onExpandExplanation={handleExpandExplanation}
                                                        onToggleChat={(questionId, questionText) => {
                                                            setActiveChat(
                                                                activeChat?.questionId === questionId
                                                                    ? null
                                                                    : { questionId, questionText }
                                                            );
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Sticky AI Tutor Sidebar */}
                {activeChat && (
                    <div className="w-[400px] shrink-0">
                        <div className="sticky top-[73px] h-[calc(100vh-105px)] flex flex-col rounded-xl border border-indigo-100 shadow-lg overflow-hidden bg-white animate-in slide-in-from-right-4 duration-300">
                            {/* Sidebar Header */}
                            <div className="bg-indigo-600 px-4 py-3 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-indigo-200" />
                                    <div>
                                        <p className="font-bold text-white text-sm">AI Study Tutor</p>
                                        <p className="text-indigo-200 text-xs">Powered by Gemini</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setActiveChat(null)}       // Đây là nút X -> nút tắt của AI, truyền null để xóa thanh chat
                                    className="p-1.5 rounded-full text-indigo-200 hover:text-white hover:bg-indigo-500 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Context Banner */}
                            <div className="px-4 py-2.5 bg-indigo-50 border-b border-indigo-100 shrink-0">
                                <p className="text-xs text-indigo-600 font-medium">Reviewing question:</p>
                                <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{activeChat.questionText}</p>
                            </div>

                            {/* Chatbot */}
                            <ReviewChatbot
                                questionId={activeChat.questionId}
                                questionText={activeChat.questionText}
                                headless
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
