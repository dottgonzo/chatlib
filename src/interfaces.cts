

export type TSupabaseConfig = {
  url: string;
  serviceRoleKey: string;
  schema?: "public";
};



export interface IConnectionParams {
  supabase?: TSupabaseConfig;
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
