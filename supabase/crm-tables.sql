-- CRM tables for clearmark.bz/clrcrm: clients (the sales pipeline) and products.
-- Applied to clearmark-test on Oct 4, 2026. For a new project: paste into Supabase > SQL Editor and run (needs clrcrm.sql first). Safe to re-run.
-- Only people on public.crm_members (see clrcrm.sql) can read or change these rows.

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  lead_code text unique,
  name text not null check (char_length(name) between 1 and 200),
  company text,
  email text,
  phone text,
  source text,
  stage text check (stage in (
    '1. Ad Live', '2. Lead Magnet Downloaded', '3. Contact Captured',
    '4. Discovery Call Booked', '5. Discovery Call Held', '6. Presentation / Product Demo',
    '7. Pricing Presented', '8. Contract Sent', '9. Payment Collected',
    '10. Login / Onboarding Started', '11. Subscription Confirmed', '12. Custom System Delivered',
    '13. Coaching Calls (Ongoing)', '14. Objection Handling Trained', '15. Welcome / Swag',
    '16. Program Accepted (Active Customer)', 'LOST'
  )),
  stage_entered_date date,
  discovery_call_date date,
  deal_value numeric(12, 2),
  probability smallint check (probability between 0 and 100),
  payment_status text,
  next_action text,
  next_action_date date,
  owner text,
  last_contact_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  product_code text unique,
  name text not null check (char_length(name) between 1 and 200),
  category text,
  price_type text check (price_type in ('Fixed', 'Range')),
  price numeric(12, 2),
  price_min numeric(12, 2),
  price_max numeric(12, 2),
  billing_type text,
  payment_route text,
  funnel_url text,
  description text,
  status text,
  quickbooks_item_id text,
  paypal_product_id text,
  stripe_price_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep updated_at current on every edit.
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- When a lead changes stage, record the day it moved (unless the edit sets the date itself).
create or replace function public.stamp_stage_entered() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.stage is distinct from old.stage and new.stage_entered_date is not distinct from old.stage_entered_date then
    new.stage_entered_date = current_date;
  end if;
  return new;
end;
$$;

drop trigger if exists clients_stage_entered on public.clients;
create trigger clients_stage_entered before update on public.clients
  for each row execute function public.stamp_stage_entered();

drop trigger if exists clients_updated_at on public.clients;
create trigger clients_updated_at before update on public.clients
  for each row execute function public.set_updated_at();
drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

-- Row Level Security: CRM members only, for reading and editing.
alter table public.clients enable row level security;
alter table public.products enable row level security;

drop policy if exists "CRM members manage clients" on public.clients;
create policy "CRM members manage clients" on public.clients
  for all to authenticated
  using (exists (select 1 from public.crm_members m where m.user_id = (select auth.uid())))
  with check (exists (select 1 from public.crm_members m where m.user_id = (select auth.uid())));

drop policy if exists "CRM members manage products" on public.products;
create policy "CRM members manage products" on public.products
  for all to authenticated
  using (exists (select 1 from public.crm_members m where m.user_id = (select auth.uid())))
  with check (exists (select 1 from public.crm_members m where m.user_id = (select auth.uid())));

-- The website only ever uses the logged-in (authenticated) role for these tables.
revoke all on public.clients, public.products from anon;
grant select, insert, update, delete on public.clients, public.products to authenticated;
