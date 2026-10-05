-- Studio tables: sites, pages, CMS collections and items, media, tags, versions.
-- Applied to clearmark-test on Oct 5, 2026 (Studio step 1). For a new project: paste into
-- Supabase > SQL Editor and run (needs clrcrm.sql and crm-tables.sql first). Safe to re-run.
--
-- Who can do what (Row Level Security on every table):
--   • CRM members (public.crm_members) can read and change everything.
--   • Visitors (anon) can only read what is published. Page drafts and versions stay private.

-- ─── Tables ───────────────────────────────────────────────────────────────────

create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null check (char_length(name) between 1 and 200),
  domain text,
  vercel_project text,
  status text not null default 'live' check (status in ('live', 'coming')),
  settings jsonb not null default '{}'::jsonb,   -- nav links, nav button, Calendly link, favicon …
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A page's content is JSON: an ordered list of sections. Each section holds either
-- ordered components ({ id, type, props }) or a card grid ({ collection, items, width }).
-- See lib/studio.ts for the exact shape.
create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  slug text not null check (slug ~ '^(/|(/[a-z0-9-]+)+)$'),   -- '/' for Home, '/gigs', '/work/acme'
  title text not null check (char_length(title) between 1 and 200),
  description text,
  search_visible boolean not null default true,
  social_image text,
  sort_order int not null default 0,
  draft jsonb not null default '{"sections": []}'::jsonb,
  published jsonb,                                           -- null until the first Publish
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, slug)
);

-- CMS: a collection (Products, Portfolio) holds items. Items use the content fields.
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9-]+$'),
  name text not null check (char_length(name) between 1 and 200),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (site_id, slug)
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections (id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9-]+$'),
  ct100 text not null check (char_length(ct100) between 1 and 300),   -- Content Title 100
  ct200 text,                                                          -- Content Title 200
  ct300 text,                                                          -- Content Title 300
  cs text,          -- Content Short, up to 144 words (checked in Studio)
  cl text,          -- Content Long, up to 1,500 words (checked in Studio)
  cb text,          -- Content Button text
  cbl text,         -- Content Button Link
  cp text,          -- Content Price
  cpt text,         -- Content Price Title
  cps text,         -- Content Price Subtitle
  cpd text,         -- Content Price Description
  cpdt text[],      -- Content Price Dates, one line each
  status text not null default 'draft' check (status in ('draft', 'published')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (collection_id, slug)
);

-- Images (CI-01 …) and videos (CV-01 …), kept outside the content fields.
-- Each belongs to one item or one page.
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references public.items (id) on delete cascade,
  page_id uuid references public.pages (id) on delete cascade,
  code text not null check (code ~ '^C[IV]-[0-9]{2,}$'),
  storage_path text,   -- a file in Supabase Storage
  url text,            -- or a link (Vimeo, YouTube, or a file in public/)
  alt text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  check (num_nonnulls(item_id, page_id) = 1),
  check (num_nonnulls(storage_path, url) = 1)
);
create unique index if not exists media_item_code on public.media (item_id, code) where item_id is not null;
create unique index if not exists media_page_code on public.media (page_id, code) where page_id is not null;

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  slug text not null check (slug ~ '^[a-z0-9-]+$'),
  custom_link text,    -- empty = the tag's own page /tags/<slug>
  created_at timestamptz not null default now(),
  unique (site_id, slug)
);

create table if not exists public.item_tags (
  item_id uuid not null references public.items (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  sort_order int not null default 0,
  primary key (item_id, tag_id)
);

-- Every Publish is saved here so it can be viewed and restored.
create table if not exists public.versions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages (id) on delete cascade,
  published jsonb not null,
  published_at timestamptz not null default now(),
  published_by uuid references auth.users (id) on delete set null,
  summary text
);

-- Indexes for the foreign keys (keeps lookups fast).
create index if not exists pages_site on public.pages (site_id);
create index if not exists collections_site on public.collections (site_id);
create index if not exists items_collection on public.items (collection_id);
create index if not exists tags_site on public.tags (site_id);
create index if not exists item_tags_tag on public.item_tags (tag_id);
create index if not exists versions_page on public.versions (page_id, published_at desc);
create index if not exists versions_published_by on public.versions (published_by);

-- Keep updated_at current (set_updated_at comes from crm-tables.sql).
create or replace trigger sites_updated_at before update on public.sites
  for each row execute function public.set_updated_at();
create or replace trigger pages_updated_at before update on public.pages
  for each row execute function public.set_updated_at();
create or replace trigger items_updated_at before update on public.items
  for each row execute function public.set_updated_at();

-- ─── Row Level Security ───────────────────────────────────────────────────────

-- True when the logged-in person is on the CRM members list.
create or replace function public.is_crm_member() returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.crm_members m where m.user_id = (select auth.uid()));
$$;

alter table public.sites enable row level security;
alter table public.pages enable row level security;
alter table public.collections enable row level security;
alter table public.items enable row level security;
alter table public.media enable row level security;
alter table public.tags enable row level security;
alter table public.item_tags enable row level security;
alter table public.versions enable row level security;

-- Members manage everything.
do $$
declare t text;
begin
  foreach t in array array['sites', 'pages', 'collections', 'items', 'media', 'tags', 'item_tags', 'versions'] loop
    execute format('drop policy if exists "CRM members manage %1$s" on public.%1$I', t);
    execute format('create policy "CRM members manage %1$s" on public.%1$I for all to authenticated
      using ((select public.is_crm_member())) with check ((select public.is_crm_member()))', t);
  end loop;
end $$;

-- Visitors read only what is published.
drop policy if exists "Visitors read sites" on public.sites;
create policy "Visitors read sites" on public.sites for select to anon using (true);

drop policy if exists "Visitors read published pages" on public.pages;
create policy "Visitors read published pages" on public.pages for select to anon
  using (published is not null);

drop policy if exists "Visitors read collections" on public.collections;
create policy "Visitors read collections" on public.collections for select to anon using (true);

drop policy if exists "Visitors read published items" on public.items;
create policy "Visitors read published items" on public.items for select to anon
  using (status = 'published');

drop policy if exists "Visitors read published media" on public.media;
create policy "Visitors read published media" on public.media for select to anon
  using (
    exists (select 1 from public.items i where i.id = item_id and i.status = 'published')
    or exists (select 1 from public.pages p where p.id = page_id and p.published is not null)
  );

drop policy if exists "Visitors read tags" on public.tags;
create policy "Visitors read tags" on public.tags for select to anon using (true);

drop policy if exists "Visitors read published item tags" on public.item_tags;
create policy "Visitors read published item tags" on public.item_tags for select to anon
  using (exists (select 1 from public.items i where i.id = item_id and i.status = 'published'));

-- Table permissions. Visitors may not see a page's draft column at all.
revoke all on public.sites, public.pages, public.collections, public.items, public.media,
  public.tags, public.item_tags, public.versions from anon;
grant select on public.sites, public.collections, public.items, public.media, public.tags, public.item_tags to anon;
grant select (id, site_id, slug, title, description, search_visible, social_image, sort_order, published, published_at)
  on public.pages to anon;
grant select, insert, update, delete on public.sites, public.pages, public.collections, public.items,
  public.media, public.tags, public.item_tags, public.versions to authenticated;

-- ─── Starting content: ClearMark Home ─────────────────────────────────────────
-- Draft only: nothing goes live until Andrew presses Publish in Studio (step 3).

insert into public.sites (slug, name, domain, vercel_project, status, settings) values
  ('clearmark', 'ClearMark', 'clearmark.bz', 'clearmark', 'live', jsonb_build_object(
    'nav', jsonb_build_array(
      jsonb_build_object('label', 'About', 'href', '/about'),
      jsonb_build_object('label', 'Solutions', 'href', '#solutions'),
      jsonb_build_object('label', 'Platforms', 'href', '#platforms'),
      jsonb_build_object('label', 'Why', 'href', '#why'),
      jsonb_build_object('label', 'The Engine', 'href', '#engine'),
      jsonb_build_object('label', 'Pricing', 'href', '#pricing')),
    'navCta', jsonb_build_object('label', 'Book a call', 'href', 'https://calendly.com/andrew-clearmark/15min'),
    'calendlyUrl', 'https://calendly.com/andrew-clearmark/15min')),
  ('kreick', 'Kreick Marketing', 'kreickmarketing.com', 'kreickmarketing', 'coming', '{}'::jsonb)
on conflict (slug) do nothing;

insert into public.collections (site_id, slug, name, sort_order)
select s.id, c.slug, c.name, c.sort_order
from public.sites s, (values ('products', 'Products', 0), ('portfolio', 'Portfolio', 1)) as c (slug, name, sort_order)
where s.slug = 'clearmark'
on conflict (site_id, slug) do nothing;

insert into public.items (collection_id, slug, ct100, ct200, ct300, cs, cb, cbl, cp, cpdt, status)
select c.id, 'cpo-cio-leadership-track', 'CPO→CIO', 'Leadership Track',
  'Every Chief People Officer Must Be a CIO in 2026',
  'A hands-on program for people leaders who now own AI adoption: clear steps, real tools and a roadmap your team will actually use.',
  'Book a call', 'https://calendly.com/andrew-clearmark/15min', '$2,500',
  array['Starting on Wednesday', 'January 28, 2026'], 'draft'
from public.collections c join public.sites s on s.id = c.site_id
where s.slug = 'clearmark' and c.slug = 'products'
on conflict (collection_id, slug) do nothing;

insert into public.media (item_id, code, url, alt)
select i.id, 'CI-01', '/design-system/poppies.webp', 'A woman working at a laptop in a field of orange poppies'
from public.items i where i.slug = 'cpo-cio-leadership-track'
on conflict do nothing;

insert into public.tags (site_id, name, slug)
select s.id, t.name, t.slug
from public.sites s, (values
  ('Hybrid course', 'hybrid-course'), ('Leadership upskilling', 'leadership-upskilling'),
  ('Digital transformation', 'digital-transformation')) as t (name, slug)
where s.slug = 'clearmark'
on conflict (site_id, slug) do nothing;

insert into public.item_tags (item_id, tag_id, sort_order)
select i.id, t.id, row_number() over (order by t.slug)
from public.items i, public.tags t
where i.slug = 'cpo-cio-leadership-track'
  and t.slug in ('hybrid-course', 'leadership-upskilling', 'digital-transformation')
on conflict do nothing;

insert into public.pages (site_id, slug, title, description, sort_order, draft)
select s.id, '/', 'Home', 'ClearMark turns your AI investment into a visible, predictable, performing asset.', 0,
  jsonb_build_object('sections', jsonb_build_array(
    jsonb_build_object('id', 'hero', 'components', jsonb_build_array(
      jsonb_build_object('id', 'hero-1', 'type', 'hero', 'props', jsonb_build_object(
        'title', 'Turning your AI investment into a visible, predictable, performing asset.',
        'cta', jsonb_build_object('label', 'Book a call', 'href', 'https://calendly.com/andrew-clearmark/15min'),
        'image', '/design-system/poppies.webp',
        'imageAlt', 'A woman working at a laptop in a field of orange poppies')))),
    jsonb_build_object('id', 'credibility', 'components', jsonb_build_array(
      jsonb_build_object('id', 'credibility-1', 'type', 'credibility', 'props', jsonb_build_object(
        'label', 'Speaker & certifications:',
        'logos', jsonb_build_array(
          jsonb_build_object('name', 'The Alliance Canada'), jsonb_build_object('name', 'Ambrose University'),
          jsonb_build_object('name', 'Clear mark'), jsonb_build_object('name', 'LaPalabra.ca')))))),
    jsonb_build_object('id', 'platforms', 'components', jsonb_build_array(
      jsonb_build_object('id', 'platforms-1', 'type', 'platforms', 'props', jsonb_build_object(
        'label', 'Platforms',
        'title', jsonb_build_array('For any business.', 'On any platform.'),
        'tags', jsonb_build_array('Growth & Sales', 'Marketing & Content', 'HR & People Operations',
          'IT & Service Operations', 'Executive & Strategy', 'Operations (cross-functional)',
          'Legal & Compliance', 'R&D / Innovation', 'Data Analytics'),
        'logos', (select jsonb_agg(jsonb_build_object('name', n)) from unnest(array['Airtable', 'Oracle NetSuite',
          'Einstein', 'Gemini', 'Notion', 'Workday', 'Slack', 'ServiceNow', 'Copilot', 'SAP']) as n))))),
    jsonb_build_object('id', 'solutions', 'components', jsonb_build_array(
      jsonb_build_object('id', 'solutions-header', 'type', 'section-header', 'props', jsonb_build_object(
        'tagline', 'Solutions',
        'title', jsonb_build_array('Clear steps,', 'visible results'))))),
    jsonb_build_object('id', 'solutions-cards', 'cards', jsonb_build_object(
      'collection', 'products', 'items', jsonb_build_array('cpo-cio-leadership-track'), 'width', 640))))
from public.sites s where s.slug = 'clearmark'
on conflict (site_id, slug) do nothing;
