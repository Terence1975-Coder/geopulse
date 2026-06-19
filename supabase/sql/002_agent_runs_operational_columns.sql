-- 002_agent_runs_operational_columns.sql
-- Promote operational agent run metadata into first-class nullable columns.
-- Keeps existing JSON envelope backward-compatible.

begin;

alter table public.agent_runs
    add column if not exists stage text;

alter table public.agent_runs
    add column if not exists input_hash text;

alter table public.agent_runs
    add column if not exists error_message text;

-- Backfill from existing JSON-envelope rows.
update public.agent_runs
set
    stage = coalesce(stage, input ->> 'stage'),
    input_hash = coalesce(input_hash, input ->> 'input_hash'),
    error_message = coalesce(
        error_message,
        case
            when status = 'failed'
             and output_summary like 'error:%'
            then trim(leading ' ' from substring(output_summary from 7))
            else null
        end
    )
where input is not null
   or status = 'failed';

create index if not exists agent_runs_stage_idx
    on public.agent_runs (stage);

create index if not exists agent_runs_input_hash_idx
    on public.agent_runs (input_hash);

create index if not exists agent_runs_failed_idx
    on public.agent_runs (status)
    where status = 'failed';

commit;
