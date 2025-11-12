import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { TSupabaseConfig } from "../interfaces.cjs";
import type { Database } from "./types";

export type ChatSupabaseClient = SupabaseClient<Database, "public">;

export function initSupabase(config: TSupabaseConfig): ChatSupabaseClient {
    const options: Parameters<typeof createClient<Database, "public">>[2] = {
        auth: { persistSession: false },
    };

    if (config.schema) {
        options.db = { schema: config.schema as "public" };
    }

    return createClient<Database, "public">(config.url, config.serviceRoleKey, options);
}

