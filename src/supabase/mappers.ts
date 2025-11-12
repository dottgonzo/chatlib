import type {
    IAgent,
    IConversation,
    IConversationMessagePreset,
    IMember,
    IMessage,
    IStudio,
} from "../interfaces.cjs";
import type {
    AgentRow,
    ConversationMemberRow,
    ConversationRow,
    MemberRow,
    MessageRow,
    StudioAgentRow,
    StudioPresetMessageRow,
    StudioRow,
} from "./types";

export type ConversationRowWithRelations = ConversationRow & {
    conversation_members?: ConversationMemberRow[] | null;
};

export type StudioRowWithRelations = StudioRow & {
    studio_agents?: StudioAgentRow[] | null;
    studio_preset_messages?: StudioPresetMessageRow[] | null;
};

function mapPresetMessages(rows: StudioPresetMessageRow[] | null | undefined): IConversationMessagePreset[] {
    if (!rows || rows.length === 0) {
        return [];
    }
    return rows
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(row => ({ type: row.type, tokens: row.tokens }));
}

export function mapAgentRow(row: AgentRow): IAgent {
    if (!row.languages || row.languages.length === 0) {
        return { ...row, languages: [row.language] };
    }
    return row;
}

export function mapMemberRow(row: MemberRow): IMember {
    return row;
}

function extractIds<T extends { [key: string]: string }>(entries: T[] | null | undefined, field: keyof T): string[] {
    if (!entries || entries.length === 0) return [];
    return entries.map(entry => String(entry[field]));
}

export function mapConversationRow(row: ConversationRowWithRelations): IConversation {
    return {
        ...row,
        members: extractIds(row.conversation_members ?? [], "member_id"),
    };
}

export function mapMessageRow(row: MessageRow): IMessage {
    return row;
}

export function mapStudioRow(row: StudioRowWithRelations): IStudio {
    return {
        ...row,
        agents: extractIds(row.studio_agents ?? [], "agent_id"),
        presetMessages: mapPresetMessages(row.studio_preset_messages),
        studio_members: [],
    };
}

