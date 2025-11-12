-- enable uuid generation
create extension if not exists "pgcrypto";

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  role text not null,
  email text not null,
  status text not null,
  display_name text,
  lang text not null default 'en',
  test boolean not null default false
);
create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  languages text[] not null default array['en']::text[],
  language text not null default 'en',
  test boolean not null default false
);
create table if not exists public.studios (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  languages text[] not null default array['en']::text[],
  language text not null default 'en',
  master_studio uuid references public.studios(id) on delete set null,
  version integer not null default 1,
  test boolean not null default false
);
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  studio_version integer not null,
  title text not null,
  test boolean not null default false
);
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  member_id uuid references public.members(id) on delete set null,
  agent_id uuid references public.agents(id) on delete set null,
  message_type text not null default 'text',
  tokens text,
  status text not null default 'pending',
  test boolean not null default false
);

create index if not exists messages_conversation_member_idx
  on public.messages (conversation_id, member_id);

create index if not exists messages_conversation_agent_idx
  on public.messages (conversation_id, agent_id);

create index if not exists conversations_studio_title_idx
  on public.conversations (studio_id, title);

create table if not exists public.studio_agents (
  studio_id uuid not null references public.studios(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  test boolean not null default false
  primary key (studio_id, agent_id)
);

create index if not exists studio_agents_agent_idx
  on public.studio_agents (agent_id);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  test boolean not null default false,
  primary key (conversation_id, member_id)
);

create index if not exists conversation_members_member_idx
  on public.conversation_members (member_id);

create table if not exists public.studio_preset_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  type text not null,
  tokens text not null,
  sort_order integer not null default 0,
  test boolean not null default false
);
create index if not exists studio_preset_messages_studio_idx
  on public.studio_preset_messages (studio_id, sort_order);


