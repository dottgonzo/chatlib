import { ChatKit } from "../dist/index.cjs";

const testStudio1Data = {
    name: "Test Studio",
    languages: ["en"],
    language: "en",
    test: true,
}

const testAgent1Data = {
    name: "Test Agent",
    languages: ["en"],
    language: "en",
    test: true,
}

const testConversation1Data = {
    members: ["123"],
    message: {
        tokens: "Hello, how are you? This is a test conversation.",
    },
    test: true,
}
const testMember1Data = {
    name: "Test Member",
    email: "test@test.com",
    phone: "1234567890",
    status: "active",
    role: "user",
    test: true,
}
export async function createConversations() {
    const chatKit = new ChatKit();
    await chatKit.init();


    await chatKit.mongo?.agents.deleteMany({ test: true });
    await chatKit.mongo!.studio.deleteMany({ test: true });

    await chatKit.mongo!.conversations.deleteMany({ test: true });
    await chatKit.mongo!.messages.deleteMany({ test: true });
    await chatKit.mongo!.members.deleteMany({ test: true });

    const testAgent1 = await chatKit.mongo?.agents.create(testAgent1Data);

    const testStudio1 = await chatKit.mongo?.studio.create({ ...testStudio1Data, agents: [testAgent1?._id] });

    const testMember1 = await chatKit.mongo?.members.create(testMember1Data);

    const testConversation1 = await chatKit.createConversationWithMessage(testStudio1?._id, testMember1?._id, { agents: [testAgent1?._id], message: testConversation1Data.message });

    console.log(testConversation1);
}

createConversations().then(() => {
    console.log("Conversations created");
}).catch((error) => {
    console.error(error);
});