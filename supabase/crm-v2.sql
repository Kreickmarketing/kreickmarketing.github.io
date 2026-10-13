-- CRM v2 (Oct 13, 2026): the folk-style CRM at /clrcrm/crm.
-- Adds companies, deals (folk sales funnel), groups, notes, interactions, reminders,
-- email sequences and settings, and a few new columns on clients (the people table).
-- Nothing existing is removed or changed. Needs clrcrm.sql and crm-tables.sql first.
-- Applied to clearmark-test. Safe to re-run.

-- People: extra columns on the existing clients table.
alter table public.clients add column if not exists title text;
alter table public.clients add column if not exists linkedin text;
alter table public.clients add column if not exists market text;
alter table public.clients add column if not exists lead_status text;
alter table public.clients add column if not exists company_id uuid;
alter table public.clients drop constraint if exists clients_lead_status_check;
alter table public.clients add constraint clients_lead_status_check
  check (lead_status is null or lead_status in ('New lead', 'Contacted', 'Qualified', 'Unqualified', 'Customer', 'Partner', 'Author'));

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 200),
  industry text,
  market text,
  website text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'clients_company_id_fkey') then
    alter table public.clients add constraint clients_company_id_fkey foreign key (company_id) references public.companies(id) on delete set null;
  end if;
end $$;

-- Deals move through the folk sales funnel.
create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  company_id uuid references public.companies(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  stage text not null default 'New lead' check (stage in (
    'New lead', 'Qualified', 'Discovery', 'Demo booked', 'Active discussion', 'Closed won', 'Closed lost'
  )),
  value numeric(12, 2),
  value_is_estimate boolean not null default false,
  owners text[] not null default '{}',
  tasks_open smallint not null default 0,
  position integer not null default 0,
  notes text,
  stage_entered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  icon text not null default '•' check (char_length(icon) between 1 and 4),
  color text not null default 'azure' check (color ~ '^[a-z-]{2,20}$'),
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.crm_group_members (
  group_id uuid not null references public.crm_groups(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (group_id, client_id)
);

create table if not exists public.crm_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  author text,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);
create table if not exists public.crm_interactions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  kind text not null default 'email' check (kind in ('email', 'meeting', 'call', 'message', 'other')),
  title text not null check (char_length(title) between 1 and 300),
  people text,
  happened_on date not null default current_date,
  created_at timestamptz not null default now()
);
create table if not exists public.crm_reminders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 300),
  due_on date,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

-- Email sequences: step 1, a wait, then a follow-up. Sending comes later.
create table if not exists public.crm_sequences (
  id uuid primary key default gen_random_uuid(),
  subject text not null check (char_length(subject) between 1 and 200),
  status text not null default 'Draft' check (status in ('Draft', 'In review', 'Scheduled', 'Sent')),
  body text not null default '',
  follow_body text not null default '',
  wait_days smallint not null default 3 check (wait_days between 0 and 60),
  recipients uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Small team-wide settings (assistant switches and the like), one row per key.
create table if not exists public.crm_settings (
  key text primary key check (key ~ '^[a-z0-9_.-]{1,60}$'),
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists clients_company_id_idx on public.clients(company_id);
create index if not exists deals_company_id_idx on public.deals(company_id);
create index if not exists deals_client_id_idx on public.deals(client_id);
create index if not exists deals_product_id_idx on public.deals(product_id);
create index if not exists crm_group_members_client_idx on public.crm_group_members(client_id);
create index if not exists crm_notes_client_idx on public.crm_notes(client_id);
create index if not exists crm_interactions_client_idx on public.crm_interactions(client_id);
create index if not exists crm_reminders_client_idx on public.crm_reminders(client_id);

-- Keep updated_at current, and stamp when a deal changes stage.
create or replace function public.stamp_deal_stage() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.stage is distinct from old.stage then new.stage_entered_at = now(); end if;
  return new;
end;
$$;
drop trigger if exists deals_stage_entered on public.deals;
create trigger deals_stage_entered before update on public.deals for each row execute function public.stamp_deal_stage();
drop trigger if exists deals_updated_at on public.deals;
create trigger deals_updated_at before update on public.deals for each row execute function public.set_updated_at();
drop trigger if exists companies_updated_at on public.companies;
create trigger companies_updated_at before update on public.companies for each row execute function public.set_updated_at();
drop trigger if exists crm_sequences_updated_at on public.crm_sequences;
create trigger crm_sequences_updated_at before update on public.crm_sequences for each row execute function public.set_updated_at();

-- Row Level Security: CRM members only, for reading and editing, on every new table.
do $$
declare t text;
begin
  foreach t in array array['companies','deals','crm_groups','crm_group_members','crm_notes','crm_interactions','crm_reminders','crm_sequences','crm_settings'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "CRM members manage %s" on public.%I', t, t);
    execute format($p$create policy "CRM members manage %s" on public.%I for all to authenticated
      using (exists (select 1 from public.crm_members m where m.user_id = (select auth.uid())))
      with check (exists (select 1 from public.crm_members m where m.user_id = (select auth.uid())))$p$, t, t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;
