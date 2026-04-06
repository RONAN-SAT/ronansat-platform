import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { testService } from "@/lib/services/testService";

export const testController = {
    async getTests(req: Request) {
        try {
            // Lấy từ url các yêu cầu lấy test từ user: Lấy page ( 1 2 3 4...) hiện tại, giới hạn mỗi trang, cách sort và thứ tự sort
            const { searchParams } = new URL(req.url);
            const page = parseInt(searchParams.get("page") || "1");   
            const limit = parseInt(searchParams.get("limit") || "10");
            const sortBy = searchParams.get("sortBy") || "createdAt";
            const sortOrder = searchParams.get("sortOrder") || "desc";

            // Giao các tham số cho service làm
            const result = await testService.getTests(page, limit, sortBy, sortOrder);

            return NextResponse.json(result);
        } catch (error: any) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
    },

    async createTest(req: Request) {
        try {
            // Check có phải admin không
            const session = await getServerSession(authOptions);
            if (!session || session.user.role !== "ADMIN") {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            // Nếu đúng là admin thì lấy data dạng json
            const body = await req.json();

            try {
                const newTest = await testService.createTest(body);   // Giao dữ liệu bài test cho service kiểm tra data bài thi theo schema vào tạo, lưu vào DB
                return NextResponse.json({ test: newTest }, { status: 201 });
            } catch (error: any) {
                if (error.name === "ZodError") {
                    return NextResponse.json({ error: error.errors }, { status: 400 });
                }
                throw error;
            }
        } catch (error: any) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
    }
};
