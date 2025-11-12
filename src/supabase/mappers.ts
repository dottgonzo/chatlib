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
    StudioMemberRow,
    StudioPresetMessageRow,
    StudioRow,
} from "./types";

export type ConversationRowWithRelations = ConversationRow & {
    conversation_members?: ConversationMemberRow[] | null;
};

type StudioAgentRelation = StudioAgentRow & {
    agent?: AgentRow | null;
};

type StudioMemberRelation = StudioMemberRow & {
    member?: MemberRow | null;
};

export type StudioRowWithRelations = StudioRow & {
    studio_agents?: StudioAgentRelation[] | null;
    studio_members?: StudioMemberRelation[] | null;
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

    return row;
}

export function mapMemberRow(row: MemberRow): IMember {
    return row;
}

function extractIds<T extends { [key: string]: string | boolean | null }>(entries: T[] | null | undefined, field: keyof T): string[] {
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
    const agents: IAgent[] = (row.studio_agents ?? [])
        .map(relation => relation.agent)
        .filter((agent): agent is AgentRow => Boolean(agent))
        .map(agent => mapAgentRow(agent));
    const members: IMember[] = (row.studio_members ?? [])
        .map(relation => relation.member)
        .filter((member): member is MemberRow => Boolean(member))
        .map(member => mapMemberRow(member));

    return {
        ...row,
        agents,
        presetMessages: mapPresetMessages(row.studio_preset_messages),
        members,
    };
}

