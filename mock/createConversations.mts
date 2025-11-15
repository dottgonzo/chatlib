import assert from "node:assert/strict";
import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import { ChatKit } from "../dist/index.cjs";
import { getConfig } from "../dist/env.cjs";

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
    StudioInsert,
    StudioRow,
    StudioAgentRow,
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
    name: "default",
    languages: ["en"],
    language: "en",
    test: false,
};
const studioPayload: StudioInsert = {
    name: "default",
    languages: ["en"],
    language: "en",
    test: false,
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

    const memberStudiosCleanupResponse = await supabase.from("member_studios").delete().eq("test", true);
    if (memberStudiosCleanupResponse.error) {
        throw new Error(memberStudiosCleanupResponse.error?.message ?? "Failed to delete test member studios");
    }


    const messagesResponse = await supabase.from("messages").delete().eq("test", true);
    if (messagesResponse.error) {
        throw new Error(messagesResponse.error?.message ?? "Failed to delete test messages");
    }



    const conversationMembersResponse = await supabase
        .from("conversation_members")
        .delete()
        .eq("test", true)
    if (conversationMembersResponse.error) {
        throw new Error(conversationMembersResponse.error?.message ?? "Failed to delete test conversation members");
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

    const previousStudioResponse = await supabase
        .from("studios")
        .select("*")
        .eq("name", studioPayload.name)
        .eq("test", false)
        .maybeSingle() as PostgrestSingleResponse<StudioRow | null>;
    if (previousStudioResponse.error) {
        throw new Error(previousStudioResponse.error?.message ?? "Failed to load previous studio");
    }
    let studioId: string | undefined = undefined;
    if (!previousStudioResponse.data) {

        const studioResponse = await supabase
            .from("studios")
            .insert(studioPayload)
            .select()
            .single() as PostgrestSingleResponse<StudioRow>;

        if (studioResponse.error || !studioResponse.data) {
            throw new Error(studioResponse.error?.message ?? "Failed to create test studio");
        }
        studioId = studioResponse.data.id as string;
    } else {
        studioId = previousStudioResponse.data.id as string;
    }

    const previousStudioAgentResponse = await supabase
        .from("studio_agents")
        .select("*")
        .eq("studio_id", studioId)
        .eq("agent_id", agentId)
        .maybeSingle() as PostgrestSingleResponse<StudioAgentRow | null>;
    if (previousStudioAgentResponse.error) {
        throw new Error(previousStudioAgentResponse.error?.message ?? "Failed to load previous studio agent");
    }
    if (!previousStudioAgentResponse.data) {
        const studioAgentPayload: StudioAgentInsert = { studio_id: studioId, agent_id: agentId, test: false };
        const studioAgentResponse = await supabase
            .from("studio_agents")
            .upsert(studioAgentPayload, { onConflict: "studio_id,agent_id" });
        if (studioAgentResponse.error) {
            throw new Error(studioAgentResponse.error?.message ?? "Failed to link studio and agent");
        }
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

    await chatKit.initializeMember(memberId);
    const memberStudios = await chatKit.getMemberStudios(memberId);
    if (memberStudios.length === 0) {
        throw new Error("Member studio was not created");
    }
    const memberStudioId = memberStudios[0].id as string;

    const testConversation1 = await chatKit.createConversationWithMessage(memberStudioId, memberId, {
        message: testConversation1Data.message,
    });
    const conversationDetails = await chatKit.getConversationMessages(testConversation1.id);

    assert.equal(conversationDetails.id, testConversation1.id, "Conversation id mismatch");
    assert.equal(conversationDetails.studio.id, memberStudioId, "Member studio id mismatch");
    assert.equal(conversationDetails.studio.studio_id, studioId, "Studio template id mismatch");
    assert.ok(conversationDetails.studio.agents.length > 0, "Studio agents not loaded");
    assert.ok(conversationDetails.studio.members.length > 0, "Studio members not loaded");
    assert.ok(conversationDetails.messages.length > 0, "Conversation messages not loaded");

    console.log("Conversation created", JSON.stringify(conversationDetails, null, 2));

    console.log("Member studios", JSON.stringify(memberStudios, null, 2));
}

createConversations()
    .then(() => {
        console.log("Conversations created");
    })
    .catch(error => {
        console.error(error);
    });