import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import { ChatKit } from "../dist/index.cjs";
import type {
    AgentInsert,
    AgentRow,
    MemberInsert,
    MemberRow,
    StudioAgentInsert,
    StudioInsert,
    StudioRow,
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

export async function createConversations() {
    const chatKit = new ChatKit();
    await chatKit.init();

    const supabaseClient = chatKit.supabase;
    if (!supabaseClient) {
        throw new Error("Supabase client not initialized");
    }
    const supabase = supabaseClient;

    // clean existing test data
    await supabase.from("messages").delete().eq("test", true);
    await supabase.from("conversations").delete().eq("test", true);
    await supabase.from("studios").delete().eq("test", true);
    await supabase.from("agents").delete().eq("test", true);
    await supabase.from("members").delete().eq("test", true);

    const agentPayload: AgentInsert = {
        name: "Test Agent",
        languages: ["en"],
        language: "en",
        test: true,
    };
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
    const studioAgentPayload: StudioAgentInsert = { studio_id: studioId, agent_id: agentId };
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

    const testConversation1 = await chatKit.createConversationWithMessage(studioId, memberId, {
        message: testConversation1Data.message,
    });

    console.log(testConversation1);
}

createConversations()
    .then(() => {
        console.log("Conversations created");
    })
    .catch(error => {
        console.error(error);
    });