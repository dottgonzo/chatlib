import { Schema, model } from "mongoose";


// 1. Create an interface representing a document in MongoDB.
export interface IMessage {
  _id: any;
  createdAt: Date;
  updatedAt: Date;
  conversation: any;
  authorType: string;
  authorId: any;
  messageType: string;
  tokens?: string;
  status?: string;
}

const messageSchema = new Schema<IMessage>({
  conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
  authorType: { type: String, required: true },
  authorId: { type: Schema.Types.ObjectId, required: true },
  messageType: { type: String, required: true },
  tokens: { type: String },
  status: { type: String, required: true, default: "pending" },
}, {
  timestamps: true,
});

// 3. Create a Model.
const Message = model<IMessage>("Message", messageSchema);
export default Message;
