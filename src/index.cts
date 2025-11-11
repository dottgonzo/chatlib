import { initStorage } from "cloud-object-storage-lib";
import type MinioStorage from "cloud-object-storage-lib/libs/minio.js";

import { config } from "./env.cjs";
import { initDb, TMONGODB } from "./mongodb/db";

import type { IConversationMessagePreset, TChatKitConfig, TNewConversationWithMessageParams, TNewMessage } from "./interfaces.cjs";
import { consumeJSON, sendJSON } from "./redisq";
import { IMessage } from "./mongodb/messages";
import { IConversation } from "./mongodb/conversations";
import { IStudio } from "./mongodb/studio";

export class ChatKit {
    mongo?: TMONGODB;
    storage?: MinioStorage;
    options: TChatKitConfig = { verboseLabel: "INFO", verboseLevel: 30 };
    bootAt = new Date();
    redis?: {
        consumeJSON: (stream: string, group: string, handleEntry: (data: any) => Promise<void>) => Promise<void>;
        sendJSON: (stream: string, payload: Record<string, any>) => Promise<void>;
    }
    _initialized = false;
    constructor(options?: TChatKitConfig) {
        if (options?.verboseLabel) {
            this.options.verboseLabel =
                options.verboseLabel.toUpperCase() as TChatKitConfig["verboseLabel"];
        }
        if (this.options.verboseLabel !== "NONE")
            console.log(
                `Kit boot ${new Date().toISOString()} with verbose level: ${this.options.verboseLabel} (${this.options.verboseLevel})`
            );
    }
    public async init() {
        if (this._initialized) {
            throw new Error("Kit is already initialized");
        }

        if (config.mongodb) {
            this.mongo = await initDb(config.mongodb.uri, config.mongodb.options);
        }

        if (config.minio) {
            this.storage = initStorage(config.minio) as MinioStorage;
        }

        if (config.redis) {
            this.redis = {
                consumeJSON: (stream: string, group: string, handleEntry: (data: any) => Promise<void>) => consumeJSON(stream, group, handleEntry),
                sendJSON: (stream: string, payload: Record<string, any>) => sendJSON(stream, payload),
            }
        }
        this._initialized = true;
        console.log(
            `Kit initialized ${new Date().toISOString()} ELAPSED: ${this.timeElapsedInSeconds()}s`
        );
    }
    public timeElapsedInSeconds() {
        if (!this._initialized) {
            throw new Error("Kit is not initialized");
        }
        return (new Date().valueOf() - this.bootAt.valueOf()) / 1000;
    }
    public async createAgent(name: string, languages: string[], language: string, presetMessages: IConversationMessagePreset[]) {
        if (!this.mongo) {
            throw new Error("MongoDB is not initialized");
        }
        const agent = await this.mongo.agents.create({ name, languages, language, presetMessages });
        return agent;
    }

    public async createConversationWithMessage(studio_id: string, member_id: string, options: TNewConversationWithMessageParams): Promise<IConversation> {
        if (!this.mongo) {
            throw new Error("MongoDB is not initialized");
        }
        const studio = await this.mongo.studio.findById(studio_id).read("secondaryPreferred").lean();
        if (!studio) {
            throw new Error("Studio not found");
        }
        const params = { studio: studio_id, members: options.members, title: options.message.tokens, authors: { $in: [member_id] } }
        let previousConversation = await this.mongo.conversations.findOne(params).read("secondaryPreferred").lean();
        if (!previousConversation) {
            previousConversation = await this.mongo.conversations.findOne(params).read("primary").lean();
            if (previousConversation) {
                return previousConversation;
            }
        } else {
            return previousConversation;
        }


        const conversation = await this.mongo.conversations.create({ studio: studio_id, studio_version: studio.version, members: options.members, title: options.message.tokens, authors: [member_id] });
        await this.addMessage(conversation._id, member_id, { tokens: options.message.tokens });
        return conversation;
    }

    public async addMessage(conversation_id: string, member_id: string, options: TNewMessage): Promise<string[]> {
        if (!this.mongo) {
            throw new Error("MongoDB is not initialized");
        }
        let messages = await this.mongo.messages.find({ conversation: conversation_id, authorType: "user", authorId: member_id }).sort({ createdAt: -1 }).limit(1).read("primary").lean();
        if (messages[0]?.tokens && options.tokens) {
            return [messages[0]._id];
        }
        const newMessage = await this.mongo.messages.create({ conversation: conversation_id, authorType: "user", authorId: member_id, tokens: options.tokens, status: "completed" });
        let message = await this.mongo.messages.findById(newMessage._id).read("secondaryPreferred").lean();
        if (!message) {
            message = await this.mongo.messages.findById(newMessage._id).read("primary").lean();
            if (!message) {
                throw new Error("Message not found");
            }
        }
        const conversation = await this.mongo.conversations.findById(conversation_id).lean()
        if (!conversation) {
            throw new Error("Conversation not found");
        }
        const studio = await this.mongo.studio.findById(conversation.studio).populate("agents").read("secondaryPreferred").lean();
        if (!studio) {
            throw new Error("Studio not found");
        }
        let agentMessages: string[] = [];
        for (const agent of studio.agents) {
            const agentMessage = {
                conversation: conversation_id,
                authorType: "agent",
                authorId: agent._id,
                status: "pending",
            }
            const newAgentMessage = await this.mongo.messages.create(agentMessage);
            agentMessages.push(newAgentMessage._id.toString());
        }
        return agentMessages;
    }
    private async completeMessage(message_id: string, lastUpdatedAt: Date, tokens: string): Promise<IMessage> {
        if (!this.mongo) {
            throw new Error("MongoDB is not initialized");
        }
        const oldMessage = await this.mongo.messages.findOne({ _id: message_id, updatedAt: lastUpdatedAt }).read("secondaryPreferred").lean();
        if (!oldMessage) {
            const oldMessage = await this.mongo.messages.findOne({ _id: message_id, updatedAt: lastUpdatedAt }).read("primary").lean();
            if (!oldMessage) {
                throw new Error("Message is outdated");
            }
        }

        await this.mongo.messages.updateOne({ _id: message_id }, { $set: { tokens } });
        let message = await this.mongo.messages.findById(message_id).read("secondaryPreferred").lean();
        if (!message) {
            message = await this.mongo.messages.findById(message_id).read("primary").lean();
            if (!message) {
                throw new Error("Message not created?!");
            }
        }
        return message;
    }
    public async completeWithAi(message_id: string): Promise<IMessage> {
        if (!this.mongo) {
            throw new Error("MongoDB is not initialized");
        }
        let message = await this.mongo.messages.findById(message_id).read("secondaryPreferred").lean();
        if (!message) {
            message = await this.mongo.messages.findById(message_id).read("primary").lean();
            if (!message) {
                throw new Error("Message not found");
            }
        }

        return message;
    }
}
export const chatkit: InstanceType<typeof ChatKit> = new ChatKit();
