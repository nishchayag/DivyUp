import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  image?: string;
  passwordHash?: string;
  preferredCurrency?: "USD" | "EUR" | "GBP" | "INR" | "CAD" | "AUD" | "JPY";
  activeOrganization?: mongoose.Types.ObjectId;
  isPlatformAdmin?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    image: { type: String },
    passwordHash: { type: String },
    preferredCurrency: {
      type: String,
      enum: ["USD", "EUR", "GBP", "INR", "CAD", "AUD", "JPY"],
      default: "USD",
    },
    activeOrganization: { type: Schema.Types.ObjectId, ref: "Organization" },
    isPlatformAdmin: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
