import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type ExpenseCategory =
  | "food"
  | "transport"
  | "utilities"
  | "entertainment"
  | "shopping"
  | "travel"
  | "health"
  | "rent"
  | "groceries"
  | "other";

export type SplitType = "equal" | "exact" | "percentage";

export interface SplitDetail {
  user: Types.ObjectId;
  amount?: number; // For exact amounts
  percentage?: number; // For percentage splits
}

export interface IExpense extends Document {
  title: string;
  amount: number;
  paidBy: Types.ObjectId;
  splitBetween: Types.ObjectId[];
  splitType: SplitType;
  splitDetails?: SplitDetail[];
  group: Types.ObjectId;
  category: ExpenseCategory;
  expenseDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SplitDetailSchema = new Schema<SplitDetail>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number },
    percentage: { type: Number },
  },
  { _id: false },
);

const ExpenseSchema = new Schema<IExpense>(
  {
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    paidBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    splitBetween: [
      { type: Schema.Types.ObjectId, ref: "User", required: true },
    ],
    splitType: {
      type: String,
      enum: ["equal", "exact", "percentage"],
      default: "equal",
    },
    splitDetails: [SplitDetailSchema],
    group: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    category: {
      type: String,
      enum: [
        "food",
        "transport",
        "utilities",
        "entertainment",
        "shopping",
        "travel",
        "health",
        "rent",
        "groceries",
        "other",
      ],
      default: "other",
    },
    expenseDate: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const Expense: Model<IExpense> =
  mongoose.models.Expense || mongoose.model<IExpense>("Expense", ExpenseSchema);

export default Expense;
