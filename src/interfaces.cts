import type { TStorageConfig } from "cloud-object-storage-lib/interfaces";
import type { createClient } from "redis";

export type TSupabaseConfig = {
  url: string;
  serviceRoleKey: string;
  schema?: "public";
};

export type TRedisConfig = {
  client: ReturnType<typeof createClient>;
  consumer: string;
  PROCESSING_TIMEOUT_MS: number;
  CLAIM_MIN_IDLE_MS: number;
  READ_BLOCK_MS: number;
  BATCH: number;
};

export interface IConnectionParams {
  supabase?: TSupabaseConfig;
  minio?: TStorageConfig;
  redis?: TRedisConfig;
}

export type TChatKitConfig = {
  verboseLevel?: number;
  verboseLabel?:
  | "INFO"
  | "DEBUG"
  | "ERROR"
  | "WARN"
  | "FATAL"
  | "TRACE"
  | "NONE";
};
export type TNewMessage = {
  tokens: string;
  model?: string;
};


export type TNewConversationWithMessageParams = {
  message: TNewMessage;
};

export type {
  IConversationMessagePreset,
  IMember,
  IAgent,
  IConversation,
  IMessage,
  IStudio,
} from "./supabase/types";
