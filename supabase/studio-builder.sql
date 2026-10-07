-- Studio builder (the template-and-spots editor): one row per site.
-- Applied to clearmark-test on Oct 7, 2026. For a new project: paste into
-- Supabase > SQL Editor and run once (needs studio.sql first).
--
-- draft     = everything the builder saves as you work (pages, spots, design).
-- published = the copy visitors see, made by Publish. Visitors can read only this column.

create table if not exists public.builder_sites (
  site_id uuid primary key references public.sites (id) on delete cascade,
  draft jsonb not null default '{}'::jsonb,
  published jsonb,
  published_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Every Publish is kept here so it can be restored.
create table if not exists public.builder_versions (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  published jsonb not null,
  published_at timestamptz not null default now(),
  published_by uuid references auth.users (id) on delete set null
);
create index if not exists builder_versions_site on public.builder_versions (site_id, published_at desc);
create index if not exists builder_versions_published_by on public.builder_versions (published_by);

create or replace trigger builder_sites_updated_at before update on public.builder_sites
  for each row execute function public.set_updated_at();

alter table public.builder_sites enable row level security;
alter table public.builder_versions enable row level security;

create policy "CRM members manage builder_sites" on public.builder_sites for all to authenticated
  using ((select public.is_crm_member())) with check ((select public.is_crm_member()));
create policy "CRM members manage builder_versions" on public.builder_versions for all to authenticated
  using ((select public.is_crm_member())) with check ((select public.is_crm_member()));
create policy "Visitors read published builder pages" on public.builder_sites for select to anon
  using (published is not null);

revoke all on public.builder_sites, public.builder_versions from anon;
grant select (site_id, published, published_at) on public.builder_sites to anon;
grant select, insert, update, delete on public.builder_sites, public.builder_versions to authenticated;

-- Publish: copy the draft to published and keep a version, in one step.
create or replace function public.publish_builder(p_site uuid)
returns timestamptz
language plpgsql security invoker set search_path = '' as $$
declare
  v_draft jsonb;
  v_now timestamptz := now();
begin
  if not public.is_crm_member() then
    raise exception 'Only CRM members can publish';
  end if;
  update public.builder_sites set published = draft, published_at = v_now
   where site_id = p_site
  returning draft into v_draft;
  if v_draft is null then
    raise exception 'Nothing saved yet';
  end if;
  insert into public.builder_versions (site_id, published, published_at, published_by)
  values (p_site, v_draft, v_now, (select auth.uid()));
  return v_now;
end;
$$;

revoke execute on function public.publish_builder(uuid) from public, anon;
grant execute on function public.publish_builder(uuid) to authenticated;
