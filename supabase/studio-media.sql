-- Studio uploads (images and videos) — Supabase Storage bucket "studio-media".
-- Applied to clearmark-test on Oct 7, 2026.
--
-- Public bucket: anyone can view a file by its URL (they're shown on the live site).
-- Only CRM members (public.is_crm_member(), see studio.sql) can add, change,
-- list or delete files. Uploads go straight from the browser to Supabase with a
-- one-time signed URL that the Studio API hands out after checking the login,
-- so large videos don't pass through Vercel.
-- 50 MB per file (the free-plan maximum); images and MP4/WebM video only.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('studio-media', 'studio-media', true, 52428800,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'video/mp4', 'video/webm'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "CRM members read studio-media" on storage.objects for select to authenticated
  using (bucket_id = 'studio-media' and public.is_crm_member());
create policy "CRM members add studio-media" on storage.objects for insert to authenticated
  with check (bucket_id = 'studio-media' and public.is_crm_member());
create policy "CRM members change studio-media" on storage.objects for update to authenticated
  using (bucket_id = 'studio-media' and public.is_crm_member())
  with check (bucket_id = 'studio-media' and public.is_crm_member());
create policy "CRM members remove studio-media" on storage.objects for delete to authenticated
  using (bucket_id = 'studio-media' and public.is_crm_member());
