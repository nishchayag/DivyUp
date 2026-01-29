import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IExpense extends Document {
  title: string;
  amount: number;
  paidBy: Types.ObjectId;
  splitBetween: Types.ObjectId[];
  group: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    paidBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    splitBetween: [
      { type: Schema.Types.ObjectId, ref: "User", required: true },
    ],
    group: { type: Schema.Types.ObjectId, ref: "Group", required: true },
  },
  { timestamps: true }
);

const Expense: Model<IExpense> =
  mongoose.models.Expense || mongoose.model<IExpense>("Expense", ExpenseSchema);

export default Expense;
