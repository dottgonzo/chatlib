import { Schema, model } from "mongoose";


// 1. Create an interface representing a document in MongoDB.
export interface IMember {
  _id: any;
  createdAt: Date;
  updatedAt: Date;
  role: string;
  status: string;
  displayName?: string;
  aiContext?: string;
  lang: string;
  test?: boolean;
}

const memberSchema = new Schema<IMember>({
  role: { type: String, required: true },
  status: { type: String, required: true },
  displayName: { type: String },
  aiContext: { type: String },
  lang: { type: String, required: true, default: "en" },
  test: { type: Boolean, required: false, default: false },
});

// 3. Create a Model.
const Member = model<IMember>("Member", memberSchema);
export default Member;
