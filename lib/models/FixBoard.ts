import mongoose, { Document, Model, Schema } from "mongoose";

export interface IFixBoard extends Document {
  key: string;
  board: unknown;
}

const FixBoardSchema = new Schema<IFixBoard>(
  {
    key: { type: String, required: true, unique: true, index: true },
    board: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

const FixBoard: Model<IFixBoard> = mongoose.models.FixBoard || mongoose.model<IFixBoard>("FixBoard", FixBoardSchema);

export default FixBoard;
