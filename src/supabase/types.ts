export type Json =
    | string
    | number
    | boolean
    | null
    | Json[]
    | { [key: string]: Json };

export interface Database {
    public: {
        Tables: {
            agents: {
                Row: {
                    id: string;
                    created_at: Date;
                    updated_at: Date;
                    name: string;
                    languages: string[];
                    language: string;
                    test: boolean | null;
                };
                Insert: {
                    id?: string;
                    created_at?: string;
                    updated_at?: string;
                    name: string;
                    languages: string[];
                    language?: string;
                    test?: boolean | null;
                };
                Update: {
                    id?: string;
                    created_at?: string;
                    updated_at?: string;
                    name?: string;
                    languages?: string[];
                    language?: string;
                    test?: boolean | null;
                };
                Relationships: [];
            };
            members: {
                Row: {
                    id: string;
                    created_at: Date;
                    updated_at: Date;
                    email: string;
                    role: string;
                    status: string;
                    display_name: string | null;
                    lang: string;
                    test: boolean | null;
                };
                Insert: {
                    id?: string;
                    created_at?: string;
                    updated_at?: string;
                    email: string;
                    role: string;
                    status: string;
                    display_name?: string | null;
                    lang?: string;
                    test?: boolean | null;
                };
                Update: {
                    id?: string;
                    created_at?: string;
                    updated_at?: string;
                    email?: string;
                    role?: string;
                    status?: string;
                    display_name?: string | null;
                    lang?: string;
                    test?: boolean | null;
                };
                Relationships: [];
            };
            studios: {
                Row: {
                    id: string;
                    created_at: Date;
                    updated_at: Date;
                    name: string;
                    languages: string[];
                    language: string;
                    master_studio: string | null;
                    version: number;
                    test: boolean | null;
                };
                Insert: {
                    id?: string;
                    created_at?: string;
                    updated_at?: string;
                    name: string;
                    languages: string[];
                    language?: string;
                    master_studio?: string | null;
                    version?: number;
                    test?: boolean | null;
                };
                Update: {
                    id?: string;
                    created_at?: string;
                    updated_at?: string;
                    name?: string;
                    languages?: string[];
                    language?: string;
                    master_studio?: string | null;
                    version?: number;
                    test?: boolean | null;
                };
                Relationships: [];
            };
            studio_preset_messages: {
                Row: {
                    id: string;
                    created_at: Date;
                    updated_at: Date;
                    studio_id: string;
                    type: string;
                    tokens: string;
                    sort_order: number;
                };
                Insert: {
                    id?: string;
                    created_at?: string;
                    updated_at?: string;
                    studio_id: string;
                    type: string;
                    tokens: string;
                    sort_order?: number;
                };
                Update: {
                    id?: string;
                    created_at?: string;
                    updated_at?: string;
                    studio_id?: string;
                    type?: string;
                    tokens?: string;
                    sort_order?: number;
                };
                Relationships: [];
            };
            conversations: {
                Row: {
                    id: string;
                    created_at: string;
                    updated_at: string;
                    studio_id: string;
                    studio_version: number;
                    title: string;
                    test: boolean | null;
                };
                Insert: {
                    id?: string;
                    created_at?: string;
                    updated_at?: string;
                    studio_id: string;
                    studio_version: number;
                    title: string;
                    test?: boolean | null;
                };
                Update: {
                    id?: string;
                    created_at?: string;
                    updated_at?: string;
                    studio_id?: string;
                    studio_version?: number;
                    title?: string;
                    test?: boolean | null;
                };
                Relationships: [];
            };
            messages: {
                Row: {
                    id: string;
                    created_at: string;
                    updated_at: string;
                    conversation_id: string;
                    member_id: string | null;
                    agent_id: string | null;
                    message_type: string;
                    tokens: string | null;
                    status: string;
                    test: boolean | null;
                };
                Insert: {
                    id?: string;
                    created_at?: string;
                    updated_at?: string;
                    conversation_id: string;
                    member_id?: string | null;
                    agent_id?: string | null;
                    message_type?: string;
                    tokens?: string | null;
                    status?: string;
                    test?: boolean | null;
                };
                Update: {
                    id?: string;
                    created_at?: string;
                    updated_at?: string;
                    conversation_id?: string;
                    member_id?: string | null;
                    agent_id?: string | null;
                    message_type?: string;
                    tokens?: string | null;
                    status?: string;
                    test?: boolean | null;
                };
                Relationships: [];
            };
            studio_agents: {
                Row: {
                    studio_id: string;
                    agent_id: string;
                };
                Insert: {
                    studio_id: string;
                    agent_id: string;
                };
                Update: {
                    studio_id?: string;
                    agent_id?: string;
                };
                Relationships: [];
            };
            conversation_members: {
                Row: {
                    conversation_id: string;
                    member_id: string;
                };
                Insert: {
                    conversation_id: string;
                    member_id: string;
                };
                Update: {
                    conversation_id?: string;
                    member_id?: string;
                };
                Relationships: [];
            };
        };
        Views: Record<string, never>;
        Functions: Record<string, never>;
        Enums: Record<string, never>;
        CompositeTypes: Record<string, never>;
    };
}

export type PublicSchema = Database["public"];

export type TableName = keyof PublicSchema["Tables"];

export type Table<RowName extends TableName> = PublicSchema["Tables"][RowName];

export type TableRow<RowName extends TableName> = Table<RowName>["Row"];

export type TableInsert<RowName extends TableName> = Table<RowName>["Insert"];

export type TableUpdate<RowName extends TableName> = Table<RowName>["Update"];

export type AgentRow = TableRow<"agents">;
export type AgentInsert = TableInsert<"agents">;

export type MemberRow = TableRow<"members">;
export type MemberInsert = TableInsert<"members">;

export type StudioRow = TableRow<"studios">;
export type StudioInsert = TableInsert<"studios">;

export type ConversationRow = TableRow<"conversations">;
export type ConversationInsert = TableInsert<"conversations">;

export type MessageRow = TableRow<"messages">;
export type MessageInsert = TableInsert<"messages">;

export type StudioAgentRow = TableRow<"studio_agents">;
export type StudioAgentInsert = TableInsert<"studio_agents">;

export type ConversationMemberRow = TableRow<"conversation_members">;
export type ConversationMemberInsert = TableInsert<"conversation_members">;

export type StudioPresetMessageRow = TableRow<"studio_preset_messages">;
export type StudioPresetMessageInsert = TableInsert<"studio_preset_messages">;

export type IConversationMessagePreset = Pick<StudioPresetMessageRow, "type" | "tokens">;

export type IMember = MemberRow;

export type IAgent = AgentRow;

export type IConversation = ConversationRow & {
    members: string[];
};

export type IMessage = MessageRow;

export type IStudio = StudioRow & {
    agents: string[];
    presetMessages: IConversationMessagePreset[];
    studio_members: string[];
};

