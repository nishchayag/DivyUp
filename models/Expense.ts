import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IExpense extends Document {
  title: string;
  amount: number;
  currency: string;
  category?: string;
  notes?: string;
  paidBy: Types.ObjectId;
  splitBetween: Types.ObjectId[];
  splitMode: "equal" | "percentage";
  splitShares?: { userId: Types.ObjectId; percentage: number }[];
  group: Types.ObjectId;
  status: "open" | "settled";
  settledAt?: Date;
  recurrence?: {
    enabled: boolean;
    frequency: "weekly" | "monthly";
    nextRunAt?: Date;
  };
  payments: {
    amount: number;
    paidBy: Types.ObjectId;
    note?: string;
    createdAt: Date;
  }[];
  comments: {
    user: Types.ObjectId;
    text: string;
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: {
      type: String,
      enum: ["USD", "EUR", "GBP", "INR", "CAD", "AUD", "JPY"],
      default: "USD",
      required: true,
    },
    category: { type: String },
    notes: { type: String },
    paidBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    splitBetween: [
      { type: Schema.Types.ObjectId, ref: "User", required: true },
    ],
    splitMode: {
      type: String,
      enum: ["equal", "percentage"],
      default: "equal",
      required: true,
    },
    splitShares: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        percentage: { type: Number, required: true },
      },
    ],
    group: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    status: {
      type: String,
      enum: ["open", "settled"],
      default: "open",
      required: true,
    },
    settledAt: { type: Date },
    recurrence: {
      enabled: { type: Boolean, default: false },
      frequency: { type: String, enum: ["weekly", "monthly"] },
      nextRunAt: { type: Date },
    },
    payments: [
      {
        amount: { type: Number, required: true },
        paidBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        note: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    comments: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        text: { type: String, required: true, maxlength: 1000 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

const Expense: Model<IExpense> =
  mongoose.models.Expense || mongoose.model<IExpense>("Expense", ExpenseSchema);

export default Expense;
