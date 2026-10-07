-- The four ClearMark offers as Products in the Studio CMS (clearmark-test, Oct 7, 2026).
-- Before this they were typed into the Studio code. Mapping to the content fields:
-- title → CT100, subtitle → CT200, price → CP, price note → CPDT (first line),
-- photo → media CI-01, the card's small "+" label → first tag.
-- All four are "published" (Ready) so the live site shows them as before.

insert into public.items (collection_id, slug, ct100, ct200, cp, cpdt, status, sort_order)
select c.id, v.slug, v.ct100, v.ct200, v.cp, array[v.note], 'published', v.sort_order
from public.collections c
join public.sites s on s.id = c.site_id and s.slug = 'clearmark'
cross join (values
  ('agency-systems', 'Agency Systems', 'Pilot in three weeks, then a live cycle', '$2,500+', 'setup · then $500–$1,500/mo', 1),
  ('content-system', 'Content System', 'AI content calendar and video scripts', '$125+', 'a month · up to $500', 2),
  ('publishing-system', 'Publishing System', 'Book relaunch calendar and launch sprint', '$1,500+', 'project · up to $5,000', 3),
  ('working-interview', 'Working Interview', 'A fast proof-of-work build, money-back', '$37', 'one-time', 4)
) as v (slug, ct100, ct200, cp, note, sort_order)
where c.slug = 'products'
on conflict (collection_id, slug) do nothing;

insert into public.media (item_id, code, url, alt, sort_order)
select i.id, 'CI-01', v.url, v.alt, 0
from public.items i
join (values
  ('agency-systems', '/studio-media/poppies.jpg', 'A woman working at a laptop in a field of orange poppies'),
  ('content-system', '/studio-media/flowers.jpg', 'A field of blue flowers'),
  ('publishing-system', '/studio-media/bridge.jpg', 'People walking across a wooden bridge'),
  ('working-interview', '/studio-media/rock-climb.jpg', 'A climber on a rock face')
) as v (slug, url, alt) on v.slug = i.slug
where not exists (select 1 from public.media m where m.item_id = i.id and m.code = 'CI-01');

insert into public.tags (site_id, name, slug)
select s.id, t.name, t.slug from public.sites s,
  (values ('Agency pilot', 'agency-pilot'), ('In the pipeline', 'in-the-pipeline')) as t (name, slug)
where s.slug = 'clearmark'
on conflict (site_id, slug) do nothing;

insert into public.item_tags (item_id, tag_id, sort_order)
select i.id, t.id, 0
from public.items i
join (values ('agency-systems', 'agency-pilot'), ('content-system', 'in-the-pipeline'),
             ('publishing-system', 'in-the-pipeline'), ('working-interview', 'in-the-pipeline')) as v (item, tag) on v.item = i.slug
join public.tags t on t.slug = v.tag
join public.sites s on s.id = t.site_id and s.slug = 'clearmark'
on conflict do nothing;
