import { Schema, model } from "mongoose";


// 1. Create an interface representing a document in MongoDB.
export interface IAgent {
  _id: any;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  languages: string[];
  language: string;
  test?: boolean;
}


const agentSchema = new Schema<IAgent>({
  name: { type: String, required: true },
  languages: { type: [String], required: true, default: ["en"] },
  language: { type: String, required: true, default: "en" },
  test: { type: Boolean, required: false, default: false },
}, {
  timestamps: true,
});

// 3. Create a Model.
const Agent = model<IAgent>("Agent", agentSchema);
export default Agent;
