"use client";

import { useState, useEffect } from "react";   // useEffect để tự động chạy 1 hành động khi web vừa tải xong
import { useSession } from "next-auth/react";  // Kiểm tra ai đang login vào web
import Loading from "@/components/Loading";    // Component load trang
import api from "@/lib/axios";                 // Quy chuẩn api gửi đi ở dạng JSON
import { API_PATHS } from "@/lib/apiPaths";    // các routes cố định (tránh phải type lại nhiều gây lỗi)

// Import 3 components vừa được tách ra
import CreateTestForm from "@/components/admin/CreateTestForm";
import CreateQuestionForm from "@/components/admin/CreateQuestionForm";
import CreateStudentForm from "@/components/admin/CreateStudentForm";

export default function AdminDashboard() {
    console.log("Cloud Name đang nhận là:", process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);
    
    const { data: session, status } = useSession();   // useSesstion() trả về session (mọi data của user) và status (đang load, đã login, chưa login)
 
    const [tests, setTests] = useState<any[]>([]);  // Biến chứa các bài test cần in ra màn hình, ban đầu là rỗng [], setTest là hàm thay thế hàm rỗng ban đầu = hàm mới chứa các test muốn display
                                                    // <any[]> -> Biến test này phải là 1 mảng, trong mảng đó chứa gì cũng đc -> Bảo vệ kiểu dữ liệu của TypeScript
    const [loading, setLoading] = useState(true);   // Biến kiểm tra web có đang tải hay không (ban đầu là true)

    // [] là danh sách các biến mà hàm này phụ thuộc (biến thay đổi thì hàm mới chạy tiếp ngoài lần đầu load web)
    // Vấn đề khi k có [] -> useEffect() chạy lúc đầu load trang để đi lấy data các Tests -> setTests cất các bài tets vào hộp -> React vẽ lại màn hình -> UseEffect() -> setTest -> Lặp liên tục
    // có [] giúp react biết không cần phụ thuộc vào biến nào => Chỉ chạy 1 lần lúc load web lần đầu
    // nếu trong [] có 1 tên biến => hàm sẽ chạy mỗi khi biến đó bị thay đổi
    useEffect(() => {
        fetchTests();     // Ngay khi màn hình mở ra thì chạy hàm này (ngay dưới)
    }, []);        

    const fetchTests = async () => {
        try {
            // api.get là lấy giữ liệu về
            const res = await api.get(API_PATHS.TESTS);   // Call api để liên hệ với Backend để BE liên hệ với DB, lấy api từ địa chỉ API_PATHS.TESTS và lưu kết quả JSON vào res
            const data = res.data;                        // Lấy data từ kết quả chứa danh sách các bài Tests
            setTests(data.tests || []);                   // Nếu đúng là có kết quả thì lấy các bài "tests" ra còn không có thì trả về 1 mảng rỗng
        } catch (e) {
            console.error("Failed to fetch tests", e); 
        } finally {     // Dù try hay catch, chương trình luôn chạy finally
            setLoading(false);     // Tắt animation loading
        }
    };

    if (status === "loading" || loading) return <Loading />;    // Nếu status của session đăng nhập là loading thì hiện animation Loading thay vì để trắng tinh

    if (!session || session.user.role !== "ADMIN") {  // Nếu chưa đăng nhập (sẽ k có session) hoặc login rồi nhưng role k phải admin thì k đucợ access file này và return dòng chữ Unauthorized
        return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="p-8 text-red-600 font-bold bg-white rounded-lg border border-slate-200">Unauthorized. Admin access required.</div></div>;
    }

    //Nếu đúng là Admin và login rồi thì chạy tiếp

    return (
        <div className="min-h-screen bg-slate-50 p-8 pb-24">
            <div className="max-w-5xl mx-auto space-y-8">

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Test Creation */}
                    <CreateTestForm onSuccess={fetchTests} />

                    {/* Right Column: Question Creation */}
                    <CreateQuestionForm tests={tests} />
                </div>

                {/* Bottom Section: Student Creation */}
                <CreateStudentForm />

            </div>
        </div>
    );
}
