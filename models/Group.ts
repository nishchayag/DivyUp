import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IGroup extends Document {
  name: string;
  description?: string;
  currency: string;
  monthlyBudget?: number;
  isArchived: boolean;
  archivedAt?: Date;
  expensePermission: "all" | "admins";
  organization: Types.ObjectId;
  members: Types.ObjectId[];
  creator: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<IGroup>(
  {
    name: { type: String, required: true },
    description: { type: String },
    currency: {
      type: String,
      enum: ["USD", "EUR", "GBP", "INR", "CAD", "AUD", "JPY"],
      default: "USD",
      required: true,
    },
    monthlyBudget: { type: Number, min: 0 },
    isArchived: { type: Boolean, default: false, index: true },
    archivedAt: { type: Date },
    expensePermission: {
      type: String,
      enum: ["all", "admins"],
      default: "all",
      required: true,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    creator: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

const Group: Model<IGroup> =
  mongoose.models.Group || mongoose.model<IGroup>("Group", GroupSchema);

export default Group;
