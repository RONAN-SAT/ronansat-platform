import { z } from "zod";

export const AnswerValidationSchema = z.object({
    questionId: z.string().min(1, "Question ID is required"),
    userAnswer: z.string(),
    isCorrect: z.boolean(),
});

export const ResultValidationSchema = z.object({
    userId: z.string().min(1, "User ID is required").optional(), // Thường do controller tự thêm vào
    testId: z.string().min(1, "Test ID is required"),
    answers: z.array(AnswerValidationSchema),
    
    // --- KHAI BÁO THÊM 3 TRƯỜNG CHO SECTIONAL ---
    isSectional: z.boolean().optional(),
    sectionalSubject: z.string().optional(),
    sectionalModule: z.number().optional(),

    // --- THÊM .optional() ĐỂ KHÔNG BẮT BUỘC NỮA ---
    score: z.number().min(0, "Score cannot be negative").optional(),
    sectionBreakdown: z.object({
        readingAndWriting: z.number().min(0).optional(),
        math: z.number().min(0).optional(),
    }).optional(),
});

export type ResultInput = z.infer<typeof ResultValidationSchema>;