import { Schema, model } from "mongoose";
import { IConversationMessagePreset } from "../interfaces.cjs";


// 1. Create an interface representing a document in MongoDB.
export interface IConversation {
  _id: any;
  createdAt: Date;
  updatedAt: Date;
  agents: any[]
  members: any[]
  title: string;
  presetMessages: IConversationMessagePreset[];
}



const _conversationMessagePresetSchema = new Schema<IConversationMessagePreset>({
  type: { type: String, required: true },
  message: { type: String, required: true },
},
  {
    _id: false,
    timestamps: false,
  });

const conversationSchema = new Schema<IConversation>({
  agents: { type: [Schema.Types.ObjectId], ref: "Agent", required: true },
  members: { type: [Schema.Types.ObjectId], ref: "Member", required: true },
  title: { type: String, required: true },
  presetMessages: { type: [_conversationMessagePresetSchema], required: true },
}, {
  timestamps: true,
});

// 3. Create a Model.
const Conversation = model<IConversation>("Conversation", conversationSchema);
export default Conversation;
