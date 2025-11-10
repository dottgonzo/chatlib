import { Schema, model } from "mongoose";
import { IConversationMessagePreset } from "../interfaces.cjs";


// 1. Create an interface representing a document in MongoDB.
export interface IAgent {
  _id: any;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  languages: string[];
  language: string;
  presetMessages: IConversationMessagePreset[];
}

const _conversationMessagePresetSchema = new Schema<IConversationMessagePreset>({
  type: { type: String, required: true },
  message: { type: String, required: true },
});

const agentSchema = new Schema<IAgent>({
  name: { type: String, required: true },
  languages: { type: [String], required: true, default: ["en"] },
  language: { type: String, required: true, default: "en" },
  presetMessages: { type: [_conversationMessagePresetSchema], required: true },

}, {
  timestamps: true,
});

// 3. Create a Model.
const Agent = model<IAgent>("Agent", agentSchema);
export default Agent;
