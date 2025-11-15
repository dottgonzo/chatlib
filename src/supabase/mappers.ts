import type { IAgent, IConversation, IConversationMessagePreset, IMember, IMessage, IStudio } from "../interfaces.cjs";
import type {
    AgentRow,
    ConversationMemberRow,
    ConversationRow,
    MemberRow,
    MemberStudioRow,
    MessageRow,
    StudioAgentRow,
    StudioPresetMessageRow,
    StudioRow,
} from "./types";

export type ConversationRowWithRelations = ConversationRow & {
    conversation_members?: ConversationMemberRow[] | null;
};

type StudioAgentRelation = StudioAgentRow & {
    agent?: AgentRow | null;
};

export type StudioRowWithRelations = StudioRow & {
    studio_agents?: StudioAgentRelation[] | null;
    studio_preset_messages?: StudioPresetMessageRow[] | null;
};

export type MemberStudioRowWithRelations = MemberStudioRow & {
    template?: StudioRowWithRelations | null;
    member?: MemberRow | null;
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

export function mapStudioRow(row: MemberStudioRowWithRelations): IStudio {
    if (!row.template) {
        throw new Error("Member studio is missing template information");
    }
    const template = row.template;
    const agents: IAgent[] = (template.studio_agents ?? [])
        .map(relation => relation.agent)
        .filter((agent): agent is AgentRow => Boolean(agent))
        .map(agent => mapAgentRow(agent));
    const members: IMember[] = row.member ? [mapMemberRow(row.member)] : [];

    return {
        ...row,
        template,
        languages: template.languages,
        language: template.language,
        version: template.version,
        agents,
        presetMessages: mapPresetMessages(template.studio_preset_messages),
        members,
    };
}

