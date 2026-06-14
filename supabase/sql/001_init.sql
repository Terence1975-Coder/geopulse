-- 001_init.sql — Supabase core schema, indexes, and RLS policies for v1

begin;

-- Extensions
create extension if not exists "pgcrypto";

-- Tables
create table if not exists public.companies (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    domain text,
    industry text,
    size_band text,
    created_by uuid,
    created_at timestamptz not null default now()
);

create table if not exists public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    full_name text,
    role text,
    email text unique,
    company_id uuid references public.companies (id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Add the circular FK after both tables exist
alter table public.companies
    add constraint companies_created_by_fkey
        foreign key (created_by) references public.profiles (id);

create table if not exists public.workspace_settings (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null references public.companies (id),
    default_workspace text,
    feature_flags jsonb not null default '{}'::jsonb,
    privacy_mode text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.agent_runs (
    id uuid primary key default gen_random_uuid(),
    company_id uuid references public.companies (id),
    user_id uuid references public.profiles (id),
    status text,
    input jsonb,
    output_summary text,
    started_at timestamptz not null default now(),
    completed_at timestamptz
);

-- Indexes
create unique index if not exists companies_domain_unique_not_null
    on public.companies (lower(domain)) where domain is not null;

create index if not exists profiles_company_id_idx on public.profiles (company_id);

create unique index if not exists workspace_settings_company_id_idx
    on public.workspace_settings (company_id);

create index if not exists agent_runs_company_id_idx on public.agent_runs (company_id);
create index if not exists agent_runs_user_id_idx on public.agent_runs (user_id);
create index if not exists agent_runs_status_open_idx on public.agent_runs (status) where status = 'open';

-- RLS enablement (default deny)
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.workspace_settings enable row level security;
alter table public.agent_runs enable row level security;

alter table public.profiles force row level security;
alter table public.companies force row level security;
alter table public.workspace_settings force row level security;
alter table public.agent_runs force row level security;

-- Helper to read the role claim from JWT
create or replace function public.jwt_role() returns text
    language sql
    stable
as $$
    select coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '');
$$;

-- profiles policies
create policy if not exists "profiles select self" on public.profiles
    for select using (auth.uid() = id);

create policy if not exists "profiles insert self" on public.profiles
    for insert with check (auth.uid() = id);

create policy if not exists "profiles update self" on public.profiles
    for update using (auth.uid() = id) with check (auth.uid() = id);

create policy if not exists "profiles service role full access" on public.profiles
    for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- companies policies
create policy if not exists "companies select same company" on public.companies
    for select using (
        exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
              and p.company_id = companies.id
        )
    );

create policy if not exists "companies write admin or service role" on public.companies
    for all using (
        auth.role() = 'service_role'
        or public.jwt_role() = 'admin'
    ) with check (
        auth.role() = 'service_role'
        or public.jwt_role() = 'admin'
    );

-- workspace_settings policies
create policy if not exists "workspace_settings select same company" on public.workspace_settings
    for select using (
        exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
              and p.company_id = workspace_settings.company_id
        )
    );

create policy if not exists "workspace_settings service role write" on public.workspace_settings
    for all using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');

-- agent_runs policies
create policy if not exists "agent_runs select same company" on public.agent_runs
    for select using (
        exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
              and p.company_id = agent_runs.company_id
        )
    );

create policy if not exists "agent_runs insert same company" on public.agent_runs
    for insert with check (
        exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
              and p.company_id = agent_runs.company_id
        )
    );

create policy if not exists "agent_runs service role update" on public.agent_runs
    for update using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');

commit;
