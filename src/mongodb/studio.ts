import { Schema, model } from "mongoose";
import { IConversationMessagePreset } from "../interfaces.cjs";


// 1. Create an interface representing a document in MongoDB.
export interface IStudio {
    _id: any;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    languages: string[];
    language: string;
    presetMessages: IConversationMessagePreset[];
    agents: any[];
    master_studio: any;
    studio_members: any[];
    version: number;
    test?: boolean;
}

const _conversationMessagePresetSchema = new Schema<IConversationMessagePreset>({
    type: { type: String, required: true },
    tokens: { type: String, required: true },
}, {
    _id: false,
    timestamps: false,
});

const studioSchema = new Schema<IStudio>({
    name: { type: String, required: true },
    languages: { type: [String], required: true, default: ["en"] },
    language: { type: String, required: true, default: "en" },
    presetMessages: { type: [_conversationMessagePresetSchema], required: true },
    agents: { type: [Schema.Types.ObjectId], ref: "Agent", required: true },
    master_studio: { type: Schema.Types.ObjectId, ref: "Studio" },
    version: { type: Number, required: true, default: 1 },
    test: { type: Boolean, required: false, default: false },
}, {
    timestamps: true,
});

// 3. Create a Model.
const Studio = model<IStudio>("Studio", studioSchema);
export default Studio;
