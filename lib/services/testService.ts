// Thêm thư viện Question model vào đầu file
import dbConnect from "@/lib/mongodb";
import Test from "@/lib/models/Test";
import Question from "@/lib/models/Question"; // Thêm dòng này để gọi được bảng Question
import { TestValidationSchema } from "@/lib/schema/test";
import { z } from "zod";

export const testService = {
    async getTests(page: number, limit: number, sortBy: string, sortOrder: string) {
        await dbConnect();

        const skip = (page - 1) * limit;
        const sortObj: any = {};
        sortObj[sortBy] = sortOrder === "asc" ? 1 : -1;

        const totalTests = await Test.countDocuments({});
        // Thêm .lean() để chuyển dữ liệu MongoDB thành JSON thuần túy, dễ thêm trường mới
        const tests = await Test.find({}).sort(sortObj).skip(skip).limit(limit).lean();

        // Lấy danh sách ID của các bài test trong trang hiện tại
        const testIds = tests.map(t => t._id);

        // Gom nhóm (aggregate) để đếm số câu hỏi của từng bài test chia theo section và module
        const questionCountsData = await Question.aggregate([
            { $match: { testId: { $in: testIds } } },
            {
                $group: {
                    _id: { testId: "$testId", section: "$section", module: "$module" },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Gắn số liệu vừa đếm được vào từng bài test
        const testsWithCounts = tests.map((test: any) => {
            const counts = { rw_1: 0, rw_2: 0, math_1: 0, math_2: 0 };
            
            questionCountsData.forEach(qc => {
                if (qc._id.testId.toString() === test._id.toString()) {
                    // Chuyển đổi tên section thành prefix viết tắt (rw hoặc math)
                    const secStr = qc._id.section === "Reading and Writing" ? "rw" : "math";
                    // Lắp đúng format (ví dụ: rw_1, math_2)
                    const key = `${secStr}_${qc._id.module}` as keyof typeof counts;
                    counts[key] = qc.count;
                }
            });

            return { ...test, questionCounts: counts };
        });

        return {
            tests: testsWithCounts, // Trả về danh sách bài test đã kèm bộ đếm
            pagination: {
                total: totalTests,
                page,
                limit,
                totalPages: Math.ceil(totalTests / limit)
            }
        };
    },

    async createTest(data: any) {
        // ... (Giữ nguyên phần này)
        try {
            const validatedData = TestValidationSchema.parse(data);
            await dbConnect();
            const newTest = await Test.create(validatedData);
            return newTest;
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                const err: any = new Error("Validation Error");
                err.errors = (error as any).errors;
                err.name = "ZodError";
                throw err;
            }
            throw error;
        }
    }
};
