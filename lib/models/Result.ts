import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAnswer {
    questionId: mongoose.Types.ObjectId;
    userAnswer: string;
    isCorrect: boolean;
}

export interface IResult extends Document {
    userId: mongoose.Types.ObjectId;
    testId: mongoose.Types.ObjectId;
    
    // Thêm 3 biến này vào bộ khung (Interface) cho Sectional (Dấu ? nghĩa là không bắt buộc phải có)
    isSectional?: boolean;
    sectionalSubject?: string;
    sectionalModule?: number;

    answers: IAnswer[];
    
    // Điểm số giờ đây cũng không bắt buộc phải có (Thêm dấu ?)
    score?: number;
    sectionBreakdown?: {
        readingAndWriting?: number;
        math?: number;
    };
    date: Date;
}

const AnswerSchema: Schema<IAnswer> = new Schema({
    questionId: { type: Schema.Types.ObjectId, ref: "Question", required: true },
    userAnswer: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
});

const ResultSchema: Schema<IResult> = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        testId: { type: Schema.Types.ObjectId, ref: "Test", required: true },
        
        // --- CÁC TRƯỜNG MỚI DÀNH CHO SECTIONAL ---
        isSectional: { type: Boolean, default: false },       // Cờ đánh dấu có phải làm từng phần không
        sectionalSubject: { type: String, required: false },  // Lưu tên môn (Reading and Writing / Math)
        sectionalModule: { type: Number, required: false },   // Lưu số Module (1 hoặc 2)

        answers: [AnswerSchema],
        
        // --- ĐÃ ĐỔI required TỪ true THÀNH false ---
        score: { type: Number, required: false },             
        sectionBreakdown: {
            readingAndWriting: { type: Number, required: false }, 
            math: { type: Number, required: false },              
        },
        date: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

const Result: Model<IResult> = mongoose.models.Result || mongoose.model<IResult>("Result", ResultSchema);
export default Result;