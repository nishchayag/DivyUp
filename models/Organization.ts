import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IOrganization extends Document {
  name: string;
  slug: string;
  owner: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      index: true,
      maxlength: 140,
    },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

const Organization: Model<IOrganization> =
  mongoose.models.Organization ||
  mongoose.model<IOrganization>("Organization", OrganizationSchema);

export default Organization;
