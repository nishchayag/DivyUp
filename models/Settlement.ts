import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ISettlement extends Document {
  group: Types.ObjectId;
  paidBy: Types.ObjectId; // The person who paid
  paidTo: Types.ObjectId; // The person who received
  amount: number;
  note?: string;
  settledAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SettlementSchema = new Schema<ISettlement>(
  {
    group: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    paidBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    paidTo: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    note: { type: String },
    settledAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Index for efficient queries
SettlementSchema.index({ group: 1, settledAt: -1 });

const Settlement: Model<ISettlement> =
  mongoose.models.Settlement ||
  mongoose.model<ISettlement>("Settlement", SettlementSchema);

export default Settlement;
