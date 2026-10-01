-- Paste this into Supabase > SQL Editor and click Run.
-- It creates the mailing-list table and locks it down.

create table if not exists public.signups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  email text not null unique check (char_length(email) between 3 and 320),
  created_at timestamptz not null default now()
);

-- Row Level Security: nobody can read or change rows from the website...
alter table public.signups enable row level security;

-- ...except this one rule: visitors may add themselves to the list.
drop policy if exists "Visitors can sign up" on public.signups;
create policy "Visitors can sign up"
  on public.signups
  for insert
  to anon
  with check (true);
