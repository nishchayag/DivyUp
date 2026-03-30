import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type MembershipRole = "owner" | "admin" | "member";

export interface IMembership extends Document {
  user: Types.ObjectId;
  organization: Types.ObjectId;
  role: MembershipRole;
  createdAt: Date;
  updatedAt: Date;
}

const MembershipSchema = new Schema<IMembership>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["owner", "admin", "member"],
      default: "member",
      required: true,
    },
  },
  { timestamps: true },
);

MembershipSchema.index({ user: 1, organization: 1 }, { unique: true });

const Membership: Model<IMembership> =
  mongoose.models.Membership ||
  mongoose.model<IMembership>("Membership", MembershipSchema);

export default Membership;
