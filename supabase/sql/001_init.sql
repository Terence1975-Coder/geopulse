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

-- Add the circular FK after both tables exist (idempotent)
do $$
begin
    if not exists (
        select 1
        from pg_constraint c
        join pg_class t on t.oid = c.conrelid
        join pg_namespace n on n.oid = t.relnamespace
        where n.nspname = 'public'
          and t.relname = 'companies'
          and c.conname = 'companies_created_by_fkey'
    ) then
        alter table public.companies
            add constraint companies_created_by_fkey
                foreign key (created_by) references public.profiles (id);
    end if;
end;
$$;

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
    status text not null default 'queued'
        constraint agent_runs_status_check
            check (status in ('queued', 'running', 'completed', 'failed', 'cancelled')),
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
create index if not exists agent_runs_status_open_idx on public.agent_runs (status) where status in ('queued', 'running');

-- RLS enablement (default deny)
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.workspace_settings enable row level security;
alter table public.agent_runs enable row level security;

-- Helper to read the role claim from JWT
create or replace function public.jwt_role() returns text
    language sql
    stable
as $$
    select coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '');
$$;

-- updated_at trigger helper
create or replace function public.set_updated_at() returns trigger
    language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
    before update on public.profiles
    for each row
    execute procedure public.set_updated_at();

drop trigger if exists workspace_settings_set_updated_at on public.workspace_settings;
create trigger workspace_settings_set_updated_at
    before update on public.workspace_settings
    for each row
    execute procedure public.set_updated_at();

-- profiles policies
drop policy if exists "profiles select self" on public.profiles;
create policy "profiles select self" on public.profiles
    for select using (auth.uid() = id);

drop policy if exists "profiles insert self" on public.profiles;
create policy "profiles insert self" on public.profiles
    for insert with check (auth.uid() = id);

drop policy if exists "profiles update self" on public.profiles;
create policy "profiles update self" on public.profiles
    for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles service role full access" on public.profiles;
create policy "profiles service role full access" on public.profiles
    for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- companies policies
drop policy if exists "companies select same company" on public.companies;
create policy "companies select same company" on public.companies
    for select using (
        exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
              and p.company_id = companies.id
        )
    );

drop policy if exists "companies write admin or service role" on public.companies;
create policy "companies write admin or service role" on public.companies
    for all using (
        auth.role() = 'service_role'
        or public.jwt_role() = 'admin'
    ) with check (
        auth.role() = 'service_role'
        or public.jwt_role() = 'admin'
    );

-- workspace_settings policies
drop policy if exists "workspace_settings select same company" on public.workspace_settings;
create policy "workspace_settings select same company" on public.workspace_settings
    for select using (
        exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
              and p.company_id = workspace_settings.company_id
        )
    );

drop policy if exists "workspace_settings service role write" on public.workspace_settings;
create policy "workspace_settings service role write" on public.workspace_settings
    for all using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');

-- agent_runs policies
drop policy if exists "agent_runs select same company" on public.agent_runs;
create policy "agent_runs select same company" on public.agent_runs
    for select using (
        exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
              and p.company_id = agent_runs.company_id
        )
    );

drop policy if exists "agent_runs insert same company" on public.agent_runs;
create policy "agent_runs insert same company" on public.agent_runs
    for insert with check (
        exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
              and p.company_id = agent_runs.company_id
        )
    );

drop policy if exists "agent_runs service role update" on public.agent_runs;
create policy "agent_runs service role update" on public.agent_runs
    for update using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');

-- API role grants
grant usage on schema public to authenticated, service_role;

grant select, insert, update on public.profiles to authenticated;
grant select on public.companies to authenticated;
grant select on public.workspace_settings to authenticated;
grant select, insert on public.agent_runs to authenticated;

grant select, insert, update, delete on public.profiles to service_role;
grant select, insert, update, delete on public.companies to service_role;
grant select, insert, update, delete on public.workspace_settings to service_role;
grant select, insert, update, delete on public.agent_runs to service_role;

commit;
