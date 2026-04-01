import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface INotification extends Document {
  organization: Types.ObjectId;
  user: Types.ObjectId;
  title: string;
  message: string;
  kind: "comment" | "payment" | "settled" | "reminder" | "system";
  readAt?: Date;
  link?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    kind: {
      type: String,
      enum: ["comment", "payment", "settled", "reminder", "system"],
      default: "system",
      required: true,
    },
    readAt: { type: Date },
    link: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

NotificationSchema.index({ user: 1, createdAt: -1 });

const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
