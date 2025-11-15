
import type { PostgrestError, PostgrestResponse, PostgrestSingleResponse } from "@supabase/supabase-js";

import { initSupabase, type ChatSupabaseClient } from "./supabase/client";
import {
    mapAgentRow,
    mapConversationRow,
    mapMemberRow,
    mapMessageRow,
    mapStudioRow,
    type ConversationRowWithRelations,
    type MemberStudioRowWithRelations,
} from "./supabase/mappers";
import type {
    IAgent,
    IConversation,
    IConversationMessagePreset,
    IMember,
    IMessage,
    IStudio,
    AgentRow,
    ConversationMemberInsert,
    ConversationRow,
    MemberRow,
    MemberStudioInsert,
    MemberStudioRow,
    MessageInsert,
    MessageRow,
    StudioRow,
} from "./supabase/types";

import type {

    IConnectionParams,
    TChatKitConfig,
    TNewConversationWithMessageParams,
    TNewMessage,
} from "./interfaces.cjs";
import { getConfig } from "./env.cjs";

const DEFAULT_MESSAGE_TYPE = "text";

type ConversationMessagesResult = IConversation & {
    messages: IMessage[];
    studio: IStudio;
};

export class ChatKit {
    supabase?: ChatSupabaseClient;
    options: TChatKitConfig = { verboseLabel: "INFO", verboseLevel: 30 };
    bootAt = new Date();

    _initialized = false;

    constructor(options?: TChatKitConfig) {
        if (options?.verboseLabel) {
            this.options.verboseLabel = options.verboseLabel.toUpperCase() as TChatKitConfig["verboseLabel"];
        }
        if (this.options.verboseLabel !== "NONE") {
            console.log(
                `Kit boot ${new Date().toISOString()} with verbose level: ${this.options.verboseLabel} (${this.options.verboseLevel})`,
            );
        }
    }

    public async init(env: any) {
        if (this._initialized) {
            throw new Error("Kit is already initialized");
        }
        const config = getConfig(env);
        console.log('config', config);

        if (config.supabase) {
            this.supabase = initSupabase(config.supabase);
        }




        this._initialized = true;
        console.log(`Kit initialized ${new Date().toISOString()} ELAPSED: ${this.timeElapsedInSeconds()}s`);
    }

    public timeElapsedInSeconds() {
        if (!this._initialized) {
            throw new Error("Kit is not initialized");
        }
        return (new Date().valueOf() - this.bootAt.valueOf()) / 1000;
    }

    public async createAgent(
        name: string,
        languages: string[],
        language: string,
        presetMessages: IConversationMessagePreset[],
        test?: boolean,
    ) {
        void presetMessages; // reserved for future use
        const supabase = this.ensureSupabase();

        const response = (await supabase
            .from("agents")
            .insert({ name, languages, language, test })
            .select()
            .single()) as PostgrestSingleResponse<AgentRow>;

        if (response.error || !response.data) {
            this.handleSupabaseError("Failed to create agent", response.error);
        }

        return mapAgentRow(response.data!);
    }

    private async createDerivativeStudio(parent_studio_id: string, member_id: string, test: boolean): Promise<string> {
        const supabase = this.ensureSupabase();
        const parentStudioResponse = (await supabase
            .from("studios")
            .select("*")
            .eq("id", parent_studio_id)
            .maybeSingle()) as PostgrestSingleResponse<StudioRow | null>;
        if (parentStudioResponse.error || !parentStudioResponse.data) {
            this.handleSupabaseError("Failed to load parent studio", parentStudioResponse.error);
        }
        const parentStudio = parentStudioResponse.data!;
        const newMemberStudio: MemberStudioInsert = {
            name: `${parentStudio.name}-${member_id}`,
            studio_id: parentStudio.id,
            member_id,
            test,
        };
        const memberStudioResponse = (await supabase
            .from("member_studios")
            .insert(newMemberStudio)
            .select()
            .single()) as PostgrestSingleResponse<MemberStudioRow>;

        if (memberStudioResponse.error || !memberStudioResponse.data) {
            this.handleSupabaseError("Failed to create member studio", memberStudioResponse.error);
        }

        return memberStudioResponse.data!.id as string;
    }
    public async initializeMember(member_id: string): Promise<void> {

        const memberResponse = (await this.ensureSupabase()
            .from("members")
            .select("*")
            .eq("id", member_id)
            .maybeSingle()) as PostgrestSingleResponse<MemberRow>;
        if (memberResponse.error || !memberResponse.data) {
            this.handleSupabaseError("Failed to load member", memberResponse.error);
        }
        const test = memberResponse.data!.test!;
        const defaultStudio = await this.fetchStudioTemplateByName("default");
        await this.createDerivativeStudio(defaultStudio.id as string, member_id, test);

    }
    public async deleteMember(member_id: string): Promise<void> {
        const supabase = this.ensureSupabase();

        const memberStudiosResponse = (await supabase
            .from("member_studios")
            .select("id")
            .eq("member_id", member_id)) as PostgrestResponse<Pick<MemberStudioRow, "id">>;
        if (memberStudiosResponse.error) {
            this.handleSupabaseError("Failed to load member studios", memberStudiosResponse.error);
        }
        const memberStudioIds = (memberStudiosResponse.data ?? []).map(memberStudio => memberStudio.id);

        let conversationIds: string[] = [];
        if (memberStudioIds.length > 0) {
            const conversationsResponse = (await supabase
                .from("conversations")
                .select("id")
                .in("member_studio_id", memberStudioIds)) as PostgrestResponse<Pick<ConversationRow, "id">>;
            if (conversationsResponse.error) {
                this.handleSupabaseError("Failed to load member conversations", conversationsResponse.error);
            }
            conversationIds = (conversationsResponse.data ?? []).map(conversation => conversation.id);
        }

        if (conversationIds.length > 0) {
            const conversationMessagesResponse = await supabase
                .from("messages")
                .delete()
                .in("conversation_id", conversationIds);
            if (conversationMessagesResponse.error) {
                this.handleSupabaseError("Failed to delete conversation messages", conversationMessagesResponse.error);
            }

            const conversationMembersResponse = await supabase
                .from("conversation_members")
                .delete()
                .in("conversation_id", conversationIds);
            if (conversationMembersResponse.error) {
                this.handleSupabaseError(
                    "Failed to delete conversation members for conversations",
                    conversationMembersResponse.error,
                );
            }

            const conversationsDeleteResponse = await supabase
                .from("conversations")
                .delete()
                .in("id", conversationIds);
            if (conversationsDeleteResponse.error) {
                this.handleSupabaseError("Failed to delete conversations", conversationsDeleteResponse.error);
            }
        }

        if (memberStudioIds.length > 0) {
            const memberStudiosDeleteResponse = await supabase
                .from("member_studios")
                .delete()
                .in("id", memberStudioIds);
            if (memberStudiosDeleteResponse.error) {
                this.handleSupabaseError("Failed to delete member studios", memberStudiosDeleteResponse.error);
            }
        }

        const memberMessagesResponse = await supabase.from("messages").delete().eq("member_id", member_id);
        if (memberMessagesResponse.error) {
            this.handleSupabaseError("Failed to delete member messages", memberMessagesResponse.error);
        }

        const memberConversationMembersResponse = await supabase
            .from("conversation_members")
            .delete()
            .eq("member_id", member_id);
        if (memberConversationMembersResponse.error) {
            this.handleSupabaseError("Failed to delete member conversation memberships", memberConversationMembersResponse.error);
        }

        const memberResponse = (await supabase
            .from("members")
            .delete()
            .eq("id", member_id)) as PostgrestResponse<MemberRow>;
        if (memberResponse.error) {
            this.handleSupabaseError("Failed to delete member", memberResponse.error);
        }
    }
    public async createConversationWithMessage(
        member_studio_id: string,
        member_id: string,
        options: TNewConversationWithMessageParams,
    ): Promise<IConversation> {
        const supabase = this.ensureSupabase();
        const studio = await this.fetchMemberStudioById(member_studio_id);

        const members = [member_id];

        const memberResponse = (await supabase
            .from("members")
            .select("*")
            .eq("id", member_id)
            .maybeSingle()) as PostgrestSingleResponse<MemberRow>;
        if (memberResponse.error || !memberResponse.data) {
            this.handleSupabaseError("Failed to load member", memberResponse.error);
        }
        let test = false;
        if (memberResponse.data!.test) {
            test = true;
        }
        const candidateResponse = (await supabase
            .from("conversations")
            .select("*, conversation_members(member_id)")
            .eq("member_studio_id", member_studio_id)
            .eq("title", options.message.tokens)) as PostgrestResponse<ConversationRowWithRelations>;

        if (candidateResponse.error) {
            this.handleSupabaseError("Failed to lookup existing conversation", candidateResponse.error);
        }

        const candidates = (candidateResponse.data ?? []).map(row => mapConversationRow(row));
        const existingConversation = candidates.find(conversation =>
            this.membersMatch(conversation.members, members),
        );

        if (existingConversation) {
            return existingConversation;
        }

        const insertResponse = (await supabase
            .from("conversations")
            .insert({
                member_studio_id,
                studio_version: studio.version,
                title: options.message.tokens,
                test,
            })
            .select()
            .single()) as PostgrestSingleResponse<ConversationRow>;

        if (insertResponse.error || !insertResponse.data) {
            this.handleSupabaseError("Failed to create conversation", insertResponse.error);
        }

        const conversationId = insertResponse.data!.id;
        await this.insertConversationMembers(conversationId, members);

        const conversation = await this.fetchConversation(conversationId);
        await this.addMessage(conversation.id, member_id, { tokens: options.message.tokens });
        return conversation;
    }

    public async addMessage(conversation_id: string, member_id: string, options: TNewMessage): Promise<string[]> {
        const supabase = this.ensureSupabase();

        const memberResponse = (await supabase
            .from("members")
            .select("*")
            .eq("id", member_id)
            .maybeSingle()) as PostgrestSingleResponse<MemberRow>;

        if (memberResponse.error || !memberResponse.data) {
            this.handleSupabaseError("Failed to load member", memberResponse.error);
        }
        let test = false;
        if (memberResponse.data!.test) {
            test = true;
        }

        const existingMessagesResponse = (await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conversation_id)
            .eq("member_id", member_id)
            .order("created_at", { ascending: false })
            .limit(1)) as PostgrestResponse<MessageRow>;

        if (existingMessagesResponse.error) {
            this.handleSupabaseError("Failed to lookup previous messages", existingMessagesResponse.error);
        }

        const existingMessage = existingMessagesResponse.data?.[0];
        if (existingMessage?.tokens && options.tokens) {
            return [existingMessage.id];
        }

        const newMessagePayload: MessageInsert = {
            conversation_id,
            member_id,
            agent_id: null,
            tokens: options.tokens ?? null,
            status: "completed",
            message_type: DEFAULT_MESSAGE_TYPE,
            test,
        };

        const newMessageResponse = (await supabase
            .from("messages")
            .insert(newMessagePayload)
            .select()
            .single()) as PostgrestSingleResponse<MessageRow>;

        if (newMessageResponse.error || !newMessageResponse.data) {
            this.handleSupabaseError("Failed to create user message", newMessageResponse.error);
        }

        const conversation = await this.fetchConversation(conversation_id);
        const studio = await this.fetchMemberStudioById(conversation.member_studio_id);
        let studioAgents: IAgent[] = studio.agents ?? [];

        if (studioAgents.length === 0) {
            const studioAgentsResponse = (await supabase
                .from("studio_agents")
                .select("agent:agents(*)")
                .eq("studio_id", studio.studio_id)) as PostgrestResponse<{ agent: AgentRow | null }>;

            if (studioAgentsResponse.error) {
                this.handleSupabaseError("Failed to load studio agents", studioAgentsResponse.error);
            }

            studioAgents = (studioAgentsResponse.data ?? [])
                .map(entry => entry.agent)
                .filter((agent): agent is AgentRow => Boolean(agent))
                .map(agent => mapAgentRow(agent));
        }

        const agentIds: string[] = studioAgents.map(agent => agent.id as string);
        if (agentIds.length === 0) {
            return [];
        }

        const agentMessagesPayload: MessageInsert[] = agentIds.map((agentId: string) => ({
            conversation_id,
            member_id: null,
            agent_id: agentId,
            status: "pending",
            message_type: DEFAULT_MESSAGE_TYPE,
            test,
        }));

        const agentMessagesResponse = (await supabase
            .from("messages")
            .insert(agentMessagesPayload)
            .select("id")) as PostgrestResponse<Pick<MessageRow, "id">>;

        if (agentMessagesResponse.error) {
            this.handleSupabaseError("Failed to queue agent messages", agentMessagesResponse.error);
        }

        return (agentMessagesResponse.data ?? []).map(row => row.id);
    }

    public async getConversationMessages(conversation_id: string): Promise<ConversationMessagesResult> {
        const supabase = this.ensureSupabase();

        const conversation = await this.fetchConversation(conversation_id);
        const studio = await this.fetchMemberStudioById(conversation.member_studio_id);

        const messagesResponse = (await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conversation_id)
            .order("created_at", { ascending: true })) as PostgrestResponse<MessageRow>;

        if (messagesResponse.error) {
            this.handleSupabaseError("Failed to load conversation messages", messagesResponse.error);
        }

        const messages = (messagesResponse.data ?? []).map(row => mapMessageRow(row));

        let members: IMember[] = [];
        if (conversation.members.length > 0) {
            const membersResponse = (await supabase
                .from("members")
                .select("*")
                .in("id", conversation.members)) as PostgrestResponse<MemberRow>;

            if (membersResponse.error) {
                this.handleSupabaseError("Failed to load conversation members", membersResponse.error);
            }

            members = (membersResponse.data ?? []).map(row => mapMemberRow(row));
        }

        let agents: IAgent[] = studio.agents ?? [];
        if (agents.length === 0) {
            const agentsResponse = (await supabase
                .from("studio_agents")
                .select("agent:agents(*)")
                .eq("studio_id", studio.studio_id)) as PostgrestResponse<{ agent: AgentRow | null }>;

            if (agentsResponse.error) {
                this.handleSupabaseError("Failed to load studio agents", agentsResponse.error);
            }

            agents = (agentsResponse.data ?? [])
                .map(entry => entry.agent)
                .filter((agent): agent is AgentRow => Boolean(agent))
                .map(agent => mapAgentRow(agent));
        }

        const studioMembers = studio.members && studio.members.length > 0 ? studio.members : members;

        return {
            ...conversation,
            studio: {
                ...studio,
                members: studioMembers,
                agents,
            },
            messages,
        };
    }
    public async getMemberStudios(member_id: string): Promise<IStudio[]> {
        const supabase = this.ensureSupabase();
        const response = (await supabase
            .from("member_studios")
            .select(
                "*, member:members(*), template:studios(*, studio_agents(agent:agents(*)), studio_preset_messages(type,tokens,sort_order))",
            )
            .eq("member_id", member_id)) as PostgrestResponse<MemberStudioRowWithRelations>;

        if (response.error) {
            this.handleSupabaseError("Failed to load member studios", response.error);
        }

        return response.data?.map(row => mapStudioRow(row)) ?? [];
    }

    private async completeMessage(message_id: string, lastUpdatedAt: Date, tokens: string): Promise<IMessage> {
        const supabase = this.ensureSupabase();
        const isoUpdatedAt = lastUpdatedAt.toISOString();

        const currentMessageResponse = (await supabase
            .from("messages")
            .select("*")
            .eq("id", message_id)
            .eq("updated_at", isoUpdatedAt)
            .maybeSingle()) as PostgrestSingleResponse<MessageRow | null>;

        if (currentMessageResponse.error) {
            this.handleSupabaseError("Failed to verify message state", currentMessageResponse.error);
        }

        if (!currentMessageResponse.data) {
            throw new Error("Message is outdated");
        }

        const updatedMessageResponse = (await supabase
            .from("messages")
            .update({ tokens })
            .eq("id", message_id)
            .select()
            .single()) as PostgrestSingleResponse<MessageRow>;

        if (updatedMessageResponse.error || !updatedMessageResponse.data) {
            this.handleSupabaseError("Failed to update message tokens", updatedMessageResponse.error);
        }

        return mapMessageRow(updatedMessageResponse.data!);
    }

    public async completeWithAi(message_id: string): Promise<IMessage> {
        const supabase = this.ensureSupabase();

        const response = (await supabase
            .from("messages")
            .select("*")
            .eq("id", message_id)
            .maybeSingle()) as PostgrestSingleResponse<MessageRow | null>;

        if (response.error) {
            this.handleSupabaseError("Failed to load message", response.error);
        }

        if (!response.data) {
            throw new Error("Message not found");
        }

        return mapMessageRow(response.data);
    }

    private ensureSupabase(): ChatSupabaseClient {
        if (!this.supabase) {
            throw new Error("Supabase is not initialized");
        }
        return this.supabase;
    }

    private handleSupabaseError(context: string, error: PostgrestError | null): never {
        const detail = error?.details ? ` (${error.details})` : "";
        throw new Error(`${context}${error?.message ? `: ${error.message}` : ""}${detail}`);
    }

    private async fetchMemberStudioById(memberStudioId: string): Promise<IStudio> {
        const supabase = this.ensureSupabase();
        const response = (await supabase
            .from("member_studios")
            .select(
                "*, member:members(*), template:studios(*, studio_agents(agent:agents(*)), studio_preset_messages(type,tokens,sort_order))",
            )
            .eq("id", memberStudioId)
            .maybeSingle()) as PostgrestSingleResponse<MemberStudioRowWithRelations | null>;

        if (response.error) {
            this.handleSupabaseError("Failed to load member studio", response.error);
        }

        if (!response.data) {
            throw new Error("Member studio not found");
        }

        return mapStudioRow(response.data);
    }
    private async fetchStudioTemplateByName(studioName: string): Promise<StudioRow> {
        const supabase = this.ensureSupabase();
        const response = (await supabase
            .from("studios")
            .select("*")
            .eq("name", studioName)
            .maybeSingle()) as PostgrestSingleResponse<StudioRow | null>;

        if (response.error) {
            this.handleSupabaseError("Failed to load studio template", response.error);
        }

        if (!response.data) {
            throw new Error("Studio template not found");
        }

        return response.data;
    }
    private async fetchAgentById(agentId: string): Promise<IAgent> {
        const supabase = this.ensureSupabase();
        const response = (await supabase
            .from("agents")
            .select("*")
            .eq("id", agentId)
            .maybeSingle()) as PostgrestSingleResponse<AgentRow | null>;
        if (response.error) {
            this.handleSupabaseError("Failed to load agent", response.error);
        }

        if (!response.data) {
            throw new Error("Agent not found");
        }
        return mapAgentRow(response.data);
    }
    private async fetchConversation(conversationId: string): Promise<IConversation> {
        const supabase = this.ensureSupabase();
        const response = (await supabase
            .from("conversations")
            .select("*, conversation_members(member_id)")
            .eq("id", conversationId)
            .maybeSingle()) as PostgrestSingleResponse<ConversationRowWithRelations | null>;

        if (response.error) {
            this.handleSupabaseError("Failed to load conversation", response.error);
        }

        if (!response.data) {
            throw new Error("Conversation not found");
        }

        return mapConversationRow(response.data);
    }

    private membersMatch(existingMembers: string[], expectedMembers: string[]): boolean {
        if (existingMembers.length !== expectedMembers.length) {
            return false;
        }
        const existingSet = new Set(existingMembers);
        return expectedMembers.every(member => existingSet.has(member));
    }

    private async insertConversationMembers(conversationId: string, memberIds: string[]): Promise<void> {
        const supabase = this.ensureSupabase();
        const memberResponse = (await supabase
            .from("members")
            .select("*")
            .eq("id", memberIds[0])
            .maybeSingle()) as PostgrestSingleResponse<MemberRow>;
        if (memberResponse.error || !memberResponse.data) {
            this.handleSupabaseError("Failed to load member", memberResponse.error);
        }
        let test = false;
        if (memberResponse.data!.test) {
            test = true;
        }
        const uniqueMembers = Array.from(new Set(memberIds));
        if (uniqueMembers.length === 0) {
            return;
        }

        const payload: ConversationMemberInsert[] = uniqueMembers.map(memberId => ({
            conversation_id: conversationId,
            member_id: memberId,
            test,
        }));

        const response = await supabase
            .from("conversation_members")
            .upsert(payload, { onConflict: "conversation_id,member_id" });

        if (response.error) {
            this.handleSupabaseError("Failed to link conversation members", response.error);
        }
    }
}

export const chatkit: InstanceType<typeof ChatKit> = new ChatKit();
