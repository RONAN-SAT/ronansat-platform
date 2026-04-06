import mongoose, { Schema, Document } from "mongoose";

export interface IParentVerificationCode extends Document {
    studentEmail: string;
    code: string;
    expiresAt: Date;
    attemptCount: number;
}

const parentVerificationCodeSchema: Schema<IParentVerificationCode> = new Schema(
    {
        studentEmail: { type: String, required: true },
        code: { type: String, required: true },
        expiresAt: { type: Date, required: true, index: { expires: 0 } },
        attemptCount: { type: Number, default: 0 },
    },
    { timestamps: true }
);

const ParentVerificationCode =
    mongoose.models.ParentVerificationCode ||
    mongoose.model<IParentVerificationCode>("ParentVerificationCode", parentVerificationCodeSchema);

export default ParentVerificationCode;
