import assert from "node:assert/strict";
import type { PostgrestResponse, PostgrestSingleResponse } from "@supabase/supabase-js";
import { ChatKit } from "../dist/index.cjs";

import type {
    IConversation,
    IMessage,
    IMember,
    IStudio,
    AgentInsert,
    AgentRow,
    MemberInsert,
    MemberRow,
    StudioAgentInsert,
    StudioMemberInsert,
    StudioInsert,
    StudioRow,
    StudioMemberRow,
} from "../src/supabase/types";

const testConversation1Data = {
    message: {
        tokens: "Hello, how are you? This is a test conversation.",
    },
    test: true,
};

const testMember1Data: MemberInsert = {
    email: "test@example.com",
    role: "user",
    status: "active",
    display_name: "Test Member",
    lang: "en",
    test: true,
};
const agentPayload: AgentInsert = {
    name: "Test Agent",
    languages: ["en"],
    language: "en",
    test: true,
};
export async function createConversations() {
    const chatKit = new ChatKit();
    await chatKit.init(process.env);

    const supabase = chatKit.supabase;
    if (!supabase) {
        throw new Error("Supabase client not initialized");
    }

    // clean existing test data
    const studioAgentsResponse = await supabase.from("studio_agents").delete().eq("test", true);
    if (studioAgentsResponse.error) {
        throw new Error(studioAgentsResponse.error?.message ?? "Failed to delete test studio agents");
    }
    const studioPresetMessagesResponse = await supabase.from("studio_preset_messages").delete().eq("test", true);
    if (studioPresetMessagesResponse.error) {
        throw new Error(studioPresetMessagesResponse.error?.message ?? "Failed to delete test studio preset messages");
    }

    const studioMembersCleanupResponse = await supabase.from("studio_members").delete().eq("test", true);
    if (studioMembersCleanupResponse.error) {
        throw new Error(studioMembersCleanupResponse.error?.message ?? "Failed to delete test studio members");
    }


    const messagesResponse = await supabase.from("messages").delete().eq("test", true);
    if (messagesResponse.error) {
        throw new Error(messagesResponse.error?.message ?? "Failed to delete test messages");
    }


    const testConversationsResponse = await supabase
        .from("conversations")
        .select("id")
        .eq("test", true) as PostgrestResponse<{ id: string }>;
    if (testConversationsResponse.error) {
        throw new Error(testConversationsResponse.error?.message ?? "Failed to load test conversations");
    }
    const testConversationIds = (testConversationsResponse.data ?? []).map(row => row.id);
    if (testConversationIds.length > 0) {
        const conversationMembersResponse = await supabase
            .from("conversation_members")
            .delete()
            .in("conversation_id", testConversationIds);
        if (conversationMembersResponse.error) {
            throw new Error(conversationMembersResponse.error?.message ?? "Failed to delete test conversation members");
        }
    }
    const conversationsResponse = await supabase.from("conversations").delete().eq("test", true);
    if (conversationsResponse.error) {
        throw new Error(conversationsResponse.error?.message ?? "Failed to delete test conversations");
    }
    const agentsResponse = await supabase.from("agents").delete().eq("test", true);
    if (agentsResponse.error) {
        throw new Error(agentsResponse.error?.message ?? "Failed to delete test agents");
    }
    const studiosResponse = await supabase.from("studios").delete().eq("test", true);
    if (studiosResponse.error) {
        throw new Error(studiosResponse.error?.message ?? "Failed to delete test studios");
    }
    const membersResponse = await supabase.from("members").delete().eq("test", true);
    if (membersResponse.error) {
        throw new Error(membersResponse.error?.message ?? "Failed to delete test members");
    }
    const agentResponse = await supabase
        .from("agents")
        .insert(agentPayload)
        .select()
        .single() as PostgrestSingleResponse<AgentRow>;
    if (agentResponse.error || !agentResponse.data) {
        throw new Error(agentResponse.error?.message ?? "Failed to create test agent");
    }

    const agentId = agentResponse.data.id as string;

    const studioPayload: StudioInsert = {
        name: "Test Studio",
        languages: ["en"],
        language: "en",
        test: true,
    };
    const studioResponse = await supabase
        .from("studios")
        .insert(studioPayload)
        .select()
        .single() as PostgrestSingleResponse<StudioRow>;

    if (studioResponse.error || !studioResponse.data) {
        throw new Error(studioResponse.error?.message ?? "Failed to create test studio");
    }
    const studioId = studioResponse.data.id as string;
    const studioAgentPayload: StudioAgentInsert = { studio_id: studioId, agent_id: agentId, test: true };
    const studioAgentResponse = await supabase
        .from("studio_agents")
        .upsert(studioAgentPayload, { onConflict: "studio_id,agent_id" });
    if (studioAgentResponse.error) {
        throw new Error(studioAgentResponse.error?.message ?? "Failed to link studio and agent");
    }


    const memberResponse = await supabase
        .from("members")
        .insert(testMember1Data)
        .select()
        .single() as PostgrestSingleResponse<MemberRow>;
    if (memberResponse.error || !memberResponse.data) {
        throw new Error(memberResponse.error?.message ?? "Failed to create test member");
    }


    const memberId = memberResponse.data.id as string;

    const studioMemberPayload: StudioMemberInsert = { studio_id: studioId, member_id: memberId, test: true };
    const studioMemberResponse = await supabase
        .from("studio_members")
        .upsert(studioMemberPayload, { onConflict: "studio_id,member_id" })
    if (studioMemberResponse.error) {
        throw new Error(studioMemberResponse.error?.message ?? "Failed to link studio and member");
    }

    const testConversation1 = await chatKit.createConversationWithMessage(studioId, memberId, {
        message: testConversation1Data.message,
    });

    const conversationDetails = await chatKit.getConversationMessages(testConversation1.id);

    assert.equal(conversationDetails.id, testConversation1.id, "Conversation id mismatch");
    assert.equal(conversationDetails.studio.id, studioId, "Studio id mismatch");
    assert.ok(conversationDetails.studio.agents.length > 0, "Studio agents not loaded");
    assert.ok(conversationDetails.studio.members.length > 0, "Studio members not loaded");
    assert.ok(conversationDetails.messages.length > 0, "Conversation messages not loaded");

    console.log("Conversation created", JSON.stringify(conversationDetails, null, 2));

    const memberStudios = await chatKit.getMemberStudios(memberId);
    console.log("Member studios", JSON.stringify(memberStudios, null, 2));
}

createConversations()
    .then(() => {
        console.log("Conversations created");
    })
    .catch(error => {
        console.error(error);
    });