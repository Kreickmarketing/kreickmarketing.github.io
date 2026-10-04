-- Paste this into Supabase > SQL Editor and click Run.
-- It creates the list of people allowed into clearmark.bz/clrcrm.
-- Logging in isn't enough on its own: the account must also be on this list.

create table if not exists public.crm_members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (char_length(username) between 1 and 60),
  created_at timestamptz not null default now()
);

-- Row Level Security: a logged-in person can only see their own row,
-- and nobody can add, change or delete rows from the website.
alter table public.crm_members enable row level security;

drop policy if exists "Members can see their own row" on public.crm_members;
create policy "Members can see their own row"
  on public.crm_members
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- To give someone access, first create them in Authentication > Users
-- (email = username@clearmark.bz), then run this with their username:
--
-- insert into public.crm_members (user_id, username)
-- select id, 'andrew' from auth.users where email = 'andrew@clearmark.bz';
