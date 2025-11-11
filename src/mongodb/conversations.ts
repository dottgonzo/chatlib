import { Schema, model } from "mongoose";
import { IConversationMessagePreset } from "../interfaces.cjs";


// 1. Create an interface representing a document in MongoDB.
export interface IConversation {
  _id: any;
  createdAt: Date;
  updatedAt: Date;
  studio: any
  studio_version: number
  members: any[]
  title: string;
  test?: boolean;
}




const conversationSchema = new Schema<IConversation>({
  studio: { type: Schema.Types.ObjectId, ref: "Studio", required: true },
  members: { type: [Schema.Types.ObjectId], ref: "Member", required: true },
  title: { type: String, required: true },
  studio_version: { type: Number, required: true },
  test: { type: Boolean, required: false, default: false },
}, {
  timestamps: true,
});

// 3. Create a Model.
const Conversation = model<IConversation>("Conversation", conversationSchema);
export default Conversation;
