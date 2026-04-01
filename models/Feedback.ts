import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IFeedback extends Document {
  organization: Types.ObjectId;
  user: Types.ObjectId;
  message: string;
  page?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
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
    message: { type: String, required: true, maxlength: 2000 },
    page: { type: String, maxlength: 200 },
  },
  { timestamps: true },
);

const Feedback: Model<IFeedback> =
  mongoose.models.Feedback ||
  mongoose.model<IFeedback>("Feedback", FeedbackSchema);

export default Feedback;
