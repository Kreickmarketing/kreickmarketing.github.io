-- Oct 14, 2026: Visible Yes/No per CMS field (Studio → CMS item).
-- hidden = the parts of an item that cards don't show. Empty = everything visible.
-- Field keys: ct100, ct200, ct300, cs, cl, tags, media, plus the groups price (CP, CPT, CPS,
-- CPD, CPDT) and button (CB, CBL). The text stays saved; only the cards leave it out.
-- Applied to clearmark-test. The items table's existing row rules (RLS) cover the new column.
alter table public.items add column if not exists hidden text[] not null default '{}';
alter table public.items drop constraint if exists items_hidden_check;
alter table public.items add constraint items_hidden_check
  check (hidden <@ array['ct100', 'ct200', 'ct300', 'cs', 'cl', 'tags', 'media', 'price', 'button']::text[]);
