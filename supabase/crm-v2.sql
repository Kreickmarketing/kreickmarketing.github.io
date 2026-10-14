-- New CRM (Oct 13, 2026): people, companies, deals, notes, interactions and groups
-- for clearmark.bz/clrcrm/crm. Applied to the dev project (clearmark-test) as the
-- migrations "crm_v2_tables" and "crm_v2_policies". The old CRM's `clients` and `products` tables are untouched.

-- Groups in the side panel (Pipeline, Partners, Authors, and any you add).
create table if not exists public.crm_groups (
  id text primary key check (id ~ '^[a-z0-9-]{1,40}$'),
  name text not null check (char_length(name) between 1 and 60),
  icon text not null default '•' check (char_length(icon) between 1 and 4),
  color text not null default '#0099CE' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  sort integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.crm_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 200),
  industry text check (char_length(industry) <= 200),
  market text check (char_length(market) <= 100),
  status text check (char_length(status) <= 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_deals (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  company_id uuid references public.crm_companies (id) on delete set null,
  stage text not null default 'Lead' check (stage in ('Lead', 'Outreach', 'Conversation', 'Proposal', 'Pilot', 'Retainer')),
  value numeric(12, 2) not null default 0 check (value >= 0),
  estimate boolean not null default false,
  owners text[] not null default '{}',
  tasks smallint not null default 0 check (tasks >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_people (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  company_id uuid references public.crm_companies (id) on delete set null,
  deal_id uuid references public.crm_deals (id) on delete set null,
  title text check (char_length(title) <= 200),
  email text check (char_length(email) <= 320),
  phone text check (char_length(phone) <= 40),
  status text check (status in ('Warm intro', 'Contacted', 'Awaiting reply', 'In conversation', 'Proposal sent', 'Client', 'Partner', 'Author')),
  market text check (char_length(market) <= 100),
  owner text check (char_length(owner) <= 100),
  introduced_by text check (char_length(introduced_by) <= 200),
  last_interaction date,
  groups text[] not null default '{}',
  recap text[] not null default '{}',
  reminders smallint not null default 0 check (reminders >= 0),
  legacy_client_id uuid references public.clients (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_notes (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.crm_people (id) on delete cascade,
  author text not null check (char_length(author) between 1 and 100),
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);

create table if not exists public.crm_interactions (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.crm_people (id) on delete cascade,
  kind text not null default 'mail' check (kind in ('mail', 'meet', 'call')),
  title text not null check (char_length(title) between 1 and 300),
  who text check (char_length(who) <= 300),
  happened_on date not null,
  created_at timestamptz not null default now()
);

create index if not exists crm_deals_company_idx on public.crm_deals (company_id);
create index if not exists crm_people_company_idx on public.crm_people (company_id);
create index if not exists crm_people_deal_idx on public.crm_people (deal_id);
create index if not exists crm_people_legacy_idx on public.crm_people (legacy_client_id);
create index if not exists crm_notes_person_idx on public.crm_notes (person_id);
create index if not exists crm_interactions_person_idx on public.crm_interactions (person_id);

create trigger crm_companies_updated_at before update on public.crm_companies for each row execute function public.set_updated_at();
create trigger crm_deals_updated_at before update on public.crm_deals for each row execute function public.set_updated_at();
create trigger crm_people_updated_at before update on public.crm_people for each row execute function public.set_updated_at();

-- Row Level Security: CRM members only, for reading and editing (same rule as `clients`).
-- Anyone else, logged in or not, sees and changes nothing.
alter table public.crm_groups enable row level security;
alter table public.crm_companies enable row level security;
alter table public.crm_deals enable row level security;
alter table public.crm_people enable row level security;
alter table public.crm_notes enable row level security;
alter table public.crm_interactions enable row level security;
create policy "CRM members manage crm_groups" on public.crm_groups for all to authenticated
  using (exists (select 1 from public.crm_members m where m.user_id = (select auth.uid())))
  with check (exists (select 1 from public.crm_members m where m.user_id = (select auth.uid())));
create policy "CRM members manage crm_companies" on public.crm_companies for all to authenticated
  using (exists (select 1 from public.crm_members m where m.user_id = (select auth.uid())))
  with check (exists (select 1 from public.crm_members m where m.user_id = (select auth.uid())));
create policy "CRM members manage crm_deals" on public.crm_deals for all to authenticated
  using (exists (select 1 from public.crm_members m where m.user_id = (select auth.uid())))
  with check (exists (select 1 from public.crm_members m where m.user_id = (select auth.uid())));
create policy "CRM members manage crm_people" on public.crm_people for all to authenticated
  using (exists (select 1 from public.crm_members m where m.user_id = (select auth.uid())))
  with check (exists (select 1 from public.crm_members m where m.user_id = (select auth.uid())));
create policy "CRM members manage crm_notes" on public.crm_notes for all to authenticated
  using (exists (select 1 from public.crm_members m where m.user_id = (select auth.uid())))
  with check (exists (select 1 from public.crm_members m where m.user_id = (select auth.uid())));
create policy "CRM members manage crm_interactions" on public.crm_interactions for all to authenticated
  using (exists (select 1 from public.crm_members m where m.user_id = (select auth.uid())))
  with check (exists (select 1 from public.crm_members m where m.user_id = (select auth.uid())));

-- Reminders (Oct 14, migration "crm_v2_reminders"): follow-ups with a due date, ticked off when done.
-- crm_people.reminders (the old count) is no longer used; the CRM counts open reminders here.
create table if not exists public.crm_reminders (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.crm_people (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 300),
  due date,
  done boolean not null default false,
  created_by text check (char_length(created_by) <= 100),
  created_at timestamptz not null default now()
);
create index if not exists crm_reminders_person_idx on public.crm_reminders (person_id);
alter table public.crm_reminders enable row level security;
create policy "CRM members manage crm_reminders" on public.crm_reminders for all to authenticated
  using (exists (select 1 from public.crm_members m where m.user_id = (select auth.uid())))
  with check (exists (select 1 from public.crm_members m where m.user_id = (select auth.uid())));

-- Settings (Oct 14, migration "crm_v2_settings"): one row with the Assistants page choices,
-- e.g. {"assist":{"follow":true,...},"followAfter":"1 week"}.
create table if not exists public.crm_settings (
  id text primary key default 'crm' check (id = 'crm'),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create trigger crm_settings_updated_at before update on public.crm_settings for each row execute function public.set_updated_at();
alter table public.crm_settings enable row level security;
create policy "CRM members manage crm_settings" on public.crm_settings for all to authenticated
  using (exists (select 1 from public.crm_members m where m.user_id = (select auth.uid())))
  with check (exists (select 1 from public.crm_members m where m.user_id = (select auth.uid())));
insert into public.crm_settings (id, data) values ('crm', '{"assist":{"follow":true,"recap":true,"research":false,"portal":true},"followAfter":"1 week"}'::jsonb)
on conflict (id) do nothing;

-- Message sequences (Oct 14, migration "crm_v2_sequences"): subject, email text, follow-up and
-- recipients (crm_people ids). Seeded with the 3 drafts from the CRM prototype.
-- Until an email service is connected, "Mark as sent" logs an email interaction per recipient
-- and a follow-up reminder (app/clrcrm/crm/api).
create table if not exists public.crm_sequences (
  id uuid primary key default gen_random_uuid(),
  subject text not null default '' check (char_length(subject) <= 200),
  body text not null default '' check (char_length(body) <= 10000),
  follow_up text not null default '' check (char_length(follow_up) <= 5000),
  wait_days smallint not null default 3 check (wait_days between 0 and 60),
  status text not null default 'Draft' check (status in ('Draft', 'Sent')),
  recipients uuid[] not null default '{}',
  created_by text check (char_length(created_by) <= 100),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger crm_sequences_updated_at before update on public.crm_sequences for each row execute function public.set_updated_at();
alter table public.crm_sequences enable row level security;
create policy "CRM members manage crm_sequences" on public.crm_sequences for all to authenticated
  using (exists (select 1 from public.crm_members m where m.user_id = (select auth.uid())))
  with check (exists (select 1 from public.crm_members m where m.user_id = (select auth.uid())));

-- Email sending (Oct 14, migration "crm_v2_sequence_followup"): when the follow-up step went out.
alter table public.crm_sequences add column if not exists followup_sent_at timestamptz;
