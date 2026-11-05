-- Clearmark Drive (/apps/drive): one tree of folders and files that every app under /apps reads.
-- Applied to clearmark-website on Oct 24, 2026, in the SQL Editor (run once; the folders and copies at the end are not repeatable).
--
-- A row points at a file where it already is (bucket + path), so nothing is copied or moved:
--   drive          new uploads (private, any file type, 50 MB per file)
--   craft-library  FigCraft's designs and exports from before Drive (supabase/craft-library.sql)
--   studio-media   Studio's website images (public; their URLs are in published pages, so Drive
--                  never moves or deletes them)
-- Team-only (CRM members, public.is_crm_member()), except files under a folder marked
-- public_folder (each website's folder): /files/<id>/<name> serves those to anyone.

-- ─── Bucket ──────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('drive', 'drive', false, 52428800, null)
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "CRM members read drive" on storage.objects for select to authenticated
  using (bucket_id = 'drive' and public.is_crm_member());
create policy "CRM members add drive" on storage.objects for insert to authenticated
  with check (bucket_id = 'drive' and public.is_crm_member());
create policy "CRM members change drive" on storage.objects for update to authenticated
  using (bucket_id = 'drive' and public.is_crm_member())
  with check (bucket_id = 'drive' and public.is_crm_member());
create policy "CRM members remove drive" on storage.objects for delete to authenticated
  using (bucket_id = 'drive' and public.is_crm_member());

-- ─── Folders and files ───────────────────────────────────────────────────────────

create table public.drive_items (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.drive_items (id) on delete cascade,
  kind text not null check (kind in ('folder', 'file')),
  name text not null check (char_length(name) between 1 and 255),
  mime text,
  size bigint not null default 0,
  bucket text check (bucket in ('drive', 'craft-library', 'studio-media')),
  path text,
  thumb_path text,
  -- What an app keeps here ("figcraft" + "design" / "export").
  app text,
  role text,
  -- A website's folder: everything under it can be shown publicly.
  public_folder boolean not null default false,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  updated_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((kind = 'folder' and bucket is null and path is null) or (kind = 'file' and bucket is not null and path is not null)),
  check (kind = 'folder' or not public_folder)
);

create index drive_items_children on public.drive_items (parent_id, kind, name);
create unique index drive_items_object on public.drive_items (bucket, path) where path is not null;

-- Keep updated_at current (set_updated_at comes from crm-tables.sql).
create or replace trigger drive_items_updated_at before update on public.drive_items
  for each row execute function public.set_updated_at();

alter table public.drive_items enable row level security;

create policy "CRM members manage drive_items" on public.drive_items for all to authenticated
  using ((select public.is_crm_member())) with check ((select public.is_crm_member()));

-- ─── Tree helpers ────────────────────────────────────────────────────────────────

-- An item and everything inside it (folder delete, move checks).
create or replace function public.drive_descendants(item uuid) returns setof public.drive_items
language sql stable security invoker set search_path = '' as $$
  with recursive down as (
    select d.* from public.drive_items d where d.id = item
    union all
    select c.* from public.drive_items c join down on c.parent_id = down.id
  )
  select * from down;
$$;

-- An item and the folders above it, nearest first (breadcrumbs).
create or replace function public.drive_ancestors(item uuid) returns setof public.drive_items
language sql stable security invoker set search_path = '' as $$
  with recursive up as (
    select d.*, 0 as depth from public.drive_items d where d.id = item
    union all
    select p.*, up.depth + 1 from public.drive_items p join up on p.id = up.parent_id
  )
  select id, parent_id, kind, name, mime, size, bucket, path, thumb_path, app, role, public_folder,
         created_by, updated_by, created_at, updated_at
  from up order by depth;
$$;

-- Where a file is, only when it sits under a website folder: what /files/<id>/<name> serves to
-- anyone. Runs as its owner so logged-out visitors can ask, and tells them nothing else.
create or replace function public.drive_public_file(item uuid)
returns table (bucket text, path text, mime text, name text)
language sql stable security definer set search_path = '' as $$
  with recursive up as (
    select d.id, d.parent_id, d.public_folder from public.drive_items d where d.id = item
    union all
    select p.id, p.parent_id, p.public_folder from public.drive_items p join up on p.id = up.parent_id
  )
  select f.bucket, f.path, f.mime, f.name from public.drive_items f
  where f.id = item and f.kind = 'file' and exists (select 1 from up where up.public_folder);
$$;

-- A drive object belongs to a public file (lets visitors read just those objects).
create or replace function public.drive_object_is_public(object_path text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.drive_items d
    where d.bucket = 'drive' and d.path = object_path and exists (select 1 from public.drive_public_file(d.id))
  );
$$;

grant execute on function public.drive_public_file(uuid) to anon, authenticated;
grant execute on function public.drive_object_is_public(text) to anon, authenticated;

create policy "Anyone reads public drive files" on storage.objects for select to anon, authenticated
  using (bucket_id = 'drive' and public.drive_object_is_public(name));

-- ─── Starting folders, FigCraft's Library and the websites' images ───────────────

do $$
declare
  figcraft uuid; exports uuid; websites uuid; clearmark uuid; kreick uuid;
begin
  insert into public.drive_items (kind, name) values ('folder', 'figcraft') returning id into figcraft;
  insert into public.drive_items (parent_id, kind, name) values (figcraft, 'folder', 'Exports') returning id into exports;
  insert into public.drive_items (kind, name) values ('folder', 'Websites') returning id into websites;
  insert into public.drive_items (parent_id, kind, name, public_folder) values (websites, 'folder', 'ClearMark', true) returning id into clearmark;
  insert into public.drive_items (parent_id, kind, name, public_folder) values (websites, 'folder', 'Kreick Marketing', true) returning id into kreick;

  -- FigCraft's Library, with the same ids (open tabs and ?file= links keep working).
  insert into public.drive_items (id, parent_id, kind, name, mime, size, bucket, path, thumb_path, app, role,
                                  created_by, updated_by, created_at, updated_at)
  select l.id, case when l.kind = 'export' then exports else figcraft end, 'file',
         l.name || case when l.kind = 'export' then '.png' else '.figcraft' end,
         case when l.kind = 'export' then 'image/png' else 'application/octet-stream' end,
         l.size, 'craft-library', l.storage_path, l.thumb_path, l.app, l.kind,
         l.created_by, l.updated_by, l.created_at, l.updated_at
  from public.library_files l;

  -- Studio's uploads, named as Studio shows them, in the folder of the site that uses them.
  insert into public.drive_items (parent_id, kind, name, mime, size, bucket, path, created_at, updated_at)
  select
    case when exists (
      select 1 from public.builder_sites b join public.sites s on s.id = b.site_id
      where s.slug = 'kreick' and b.draft::text like '%' || o.name || '%'
    ) then kreick else clearmark end,
    'file',
    coalesce(nullif((
      select m ->> 'name' from public.builder_sites b, jsonb_array_elements(coalesce(b.draft -> 'media', '[]'::jsonb)) m
      where m ->> 'src' like '%' || o.name limit 1
    ), ''), split_part(o.name, '/', 2)),
    o.metadata ->> 'mimetype', coalesce((o.metadata ->> 'size')::bigint, 0),
    'studio-media', o.name, o.created_at, coalesce(o.updated_at, o.created_at)
  from storage.objects o
  where o.bucket_id = 'studio-media' and o.name not like '%.emptyFolderPlaceholder';
end $$;
