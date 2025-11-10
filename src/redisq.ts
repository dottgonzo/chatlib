// file: consumer.js
import { config } from "./env.cjs";

// Redis 5.8.3 specific types and message format handling
// This code is optimized for Redis client version 5.8.3 message formats
// OBJECTS-ONLY messaging: all messages must be JSON objects, primitive values are not supported
type RedisStreamMessage = [string, [string, string][]]; // [id, fields]
type RedisStream = [string, RedisStreamMessage[]]; // [streamName, messages]
type RedisAutoClaimMessage = {
    id: string;
    message: Record<string, any>; // JSON objects stored as key-value pairs
} | null;
type RedisAutoClaimResult = {
    nextId: string;
    messages: RedisAutoClaimMessage[];
    deletedMessages: string[];
};


export async function consumeJSON(stream: string, group: string, handleEntry: (data: any) => Promise<void>) {






    async function processMessage(id: string, flatFields: [string, string][]) {
        const started = Date.now();
        const ids = [id];
        const args = [stream, group, "ACKED", "IDS", "1", ...ids];

        try {
            // Convert flat fields back to object
            const messageObj = Object.fromEntries(flatFields);

            // Handle only JSON objects - validate that all string values are valid JSON
            const isValidJsonObject = Object.values(messageObj).every(value => {
                if (typeof value === "string") {
                    try {
                        JSON.parse(value);
                        return true;
                    } catch {
                        return false;
                    }
                }
                return true; // Non-string values are fine
            });

            if (!isValidJsonObject) {
                console.warn(`[${config.redis!.consumer}] Discarding non-JSON message id=${id}: contains non-JSON string values`);
                return config.redis!.client.sendCommand(["XACKDEL", ...args]);
            }

            // Parse JSON string values in the object to reconstruct the original object
            const payload: Record<string, any> = {};
            for (const [key, value] of Object.entries(messageObj)) {
                if (typeof value === "string") {
                    try {
                        payload[key] = JSON.parse(value);
                    } catch (parseError) {
                        // If it's not JSON, keep as string (for primitive string values)
                        payload[key] = value;
                    }
                } else {
                    payload[key] = value;
                }
            }

            console.log(`[${config.redis!.consumer}] processing JSON id=${id} payload=`, payload);
            await handleEntry(payload);

            // Acknowledge and delete the message after successful processing
            return config.redis!.client.sendCommand(["XACKDEL", ...args]);
        } catch (err: any) {
            console.error(`[${config.redis!.consumer}] error processing JSON id=${id}:`, err);
            if (Date.now() - started > config.redis!.PROCESSING_TIMEOUT_MS) {
                console.warn(`[${config.redis!.consumer}] processing timeout for id=${id}`);
            }
            // Still acknowledge the message to prevent reprocessing
            return config.redis!.client.sendCommand(["XACKDEL", ...args]);
        }
    }

    async function autoclAimPending() {
        try {
            const res = await config.redis!.client.xAutoClaim(stream, group, config.redis!.consumer!, config.redis!.CLAIM_MIN_IDLE_MS, "0-0", {
                COUNT: config.redis!.BATCH
            }) as RedisAutoClaimResult;

            const claimed = res?.messages || [];
            if (claimed.length > 0) {
                console.log(`[${config.redis!.consumer}] autoClaimed ${claimed.length} pending`);
                for (const msg of claimed) {
                    if (msg && msg.id && msg.message) {
                        // Redis 5.8.3 xAutoClaim returns messages as {id, message} objects
                        const flatFields = Object.entries(msg.message);
                        await processMessage(msg.id, flatFields);
                    }
                }
            }
        } catch (e: any) {
            if (!String(e?.message || e).includes("NOGROUP")) {
                console.debug(`[${config.redis!.consumer}] xAutoClaim note:`, e?.message || e);
            }
        }
    }

    async function readLoop() {
        while (true) {
            const data = await config.redis!.client.xReadGroup(group, config.redis!.consumer!, { key: stream, id: ">" }, {
                COUNT: config.redis!.BATCH,
                BLOCK: config.redis!.READ_BLOCK_MS
            }) as RedisStream[] | null;

            if (!data) {
                await autoclAimPending();
                continue;
            }

            // Redis 5.8.3 xReadGroup returns array of [streamName, messages] tuples
            for (const stream of data) {
                const [streamName, messages] = stream;
                console.log(`[${config.redis!.consumer}] received ${messages.length} messages from stream: ${streamName}`);

                for (const [id, flatFields] of messages) {
                    await processMessage(id, flatFields);
                }
            }

            await autoclAimPending();
        }
    }

    try {
        config.redis!.client.on("error", err => console.error("Redis error:", err));


        await config.redis!.client.connect();

        try {
            await config.redis!.client.xGroupCreate(stream, group, "$", { MKSTREAM: true });
        } catch (e: any) {
            if (!String(e?.message || e).includes("BUSYGROUP")) throw e;
        }

        console.log(`[${config.redis!.consumer}] ready: stream='${stream}' group='${group}' consumer='${config.redis!.consumer!}'`);
        await readLoop();
    } catch (err) {
        console.error(err);
        try { await config.redis!.client.quit(); } catch { }
        process.exit(1);
    }



    process.on("SIGINT", async () => { try { await config.redis!.client.quit(); } catch { } process.exit(0); });
    process.on("SIGTERM", async () => { try { await config.redis!.client.quit(); } catch { } process.exit(0); });
}

export async function sendJSON(stream: string, payload: Record<string, any>) {
    // Send JSON objects directly to Redis stream without encapsulation
    // Only objects are supported - primitive values are not allowed
    if (typeof payload !== "object" || payload === null) {
        throw new Error("sendJSON only accepts objects. Primitive values are not supported.");
    }

    // Send object directly as key-value pairs (Redis handles JSON serialization)
    await config.redis!.client.xAdd(stream, "*", payload);
}


/*
USAGE EXAMPLES - OBJECTS ONLY:

// ✅ VALID: Send JSON objects
await sendJSON({ userId: 123, action: "login", timestamp: Date.now() });

// ✅ VALID: Send complex nested JSON objects
await sendJSON({ 
    user: { id: 123, name: "John" }, 
    event: "login",
    metadata: { ip: "192.168.1.1", userAgent: "Chrome" }
});

// ✅ VALID: Send deeply nested JSON objects
await sendJSON({
    user: { 
        id: 123, 
        profile: { 
            name: "John", 
            preferences: { theme: "dark", notifications: true } 
        } 
    },
    event: "profile_update"
});

// ❌ INVALID: Primitive values (will throw error)
// await sendJSON("Hello World");  // ❌ Error: only accepts objects
// await sendJSON(42);             // ❌ Error: only accepts objects  
// await sendJSON(true);           // ❌ Error: only accepts objects

// Consumer usage:
await consumer(async (data) => {
    console.log("Received JSON object:", data);
    // data will be the original JSON object you sent
    // Non-JSON messages are automatically discarded
    // No manual JSON.parse needed!
    // data is guaranteed to be an object
});

// Messages that are not valid JSON objects will be:
// - Logged as warnings
// - Automatically acknowledged and deleted
// - Not processed by your handler function
*/