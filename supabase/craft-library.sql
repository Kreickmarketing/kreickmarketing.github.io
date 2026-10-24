-- Craft Library: designs and exports saved from the Craft apps (FigCraft first) at /apps/create.
-- NOT YET APPLIED. Paste into Supabase > SQL Editor (project clearmark-test) and run.
--
-- Private bucket "craft-library": files are only reachable through short-lived signed links that
-- the Library API (app/apps/create/library/api) hands out after checking the login. Uploads go
-- straight from the browser to Supabase with a one-time signed link, as Studio's do, so large
-- files don't pass through Vercel. 50 MB per file (the free-plan maximum).
-- The whole team shares one library: every CRM member (public.is_crm_member(), see studio.sql)
-- can list, open, save, rename and delete every file.
--
-- Paths carry ids, never file names (names can identify clients):
--   designs  figcraft/<id>.figcraft  + thumbnail figcraft/<id>.thumb.png
--   exports  exports/<yyyy-mm>/<id>.png

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('craft-library', 'craft-library', false, 52428800,
        array['application/octet-stream', 'application/zip', 'image/png'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "CRM members read craft-library" on storage.objects for select to authenticated
  using (bucket_id = 'craft-library' and public.is_crm_member());
create policy "CRM members add craft-library" on storage.objects for insert to authenticated
  with check (bucket_id = 'craft-library' and public.is_crm_member());
create policy "CRM members change craft-library" on storage.objects for update to authenticated
  using (bucket_id = 'craft-library' and public.is_crm_member())
  with check (bucket_id = 'craft-library' and public.is_crm_member());
create policy "CRM members remove craft-library" on storage.objects for delete to authenticated
  using (bucket_id = 'craft-library' and public.is_crm_member());

-- One row per saved file: what the Library lists (name, thumbnail, who and when).
create table public.library_files (
  id uuid primary key default gen_random_uuid(),
  app text not null default 'figcraft' check (app in ('figcraft', 'designcraft', 'photocraft', 'filmcraft')),
  kind text not null check (kind in ('design', 'export')),
  name text not null check (char_length(name) between 1 and 200),
  storage_path text not null unique,
  thumb_path text,
  size bigint not null default 0,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  updated_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index library_files_listing on public.library_files (app, kind, updated_at desc);

-- Keep updated_at current (set_updated_at comes from crm-tables.sql).
create or replace trigger library_files_updated_at before update on public.library_files
  for each row execute function public.set_updated_at();

alter table public.library_files enable row level security;

create policy "CRM members manage library_files" on public.library_files for all to authenticated
  using ((select public.is_crm_member())) with check ((select public.is_crm_member()));
