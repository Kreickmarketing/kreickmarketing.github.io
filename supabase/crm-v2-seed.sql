-- New CRM starting data (Oct 13, 2026), applied to the dev project as the migration "crm_v2_seed".
-- 1. The people, companies and deals from the CRM prototype (from ClearMark's pipeline notes;
--    deal values marked estimate are placeholders).
-- 2. The 6 leads from the old CRM (`clients`, untouched) merged in: matching people get the
--    old email and a note with the old notes; Paul Czarnowski is added as a new person.

insert into public.crm_groups (id, name, icon, color, sort) values
  ('pipeline', 'Pipeline', 'P', '#0099CE', 0),
  ('partners', 'Partners', '∞', '#469C6F', 1),
  ('authors', 'Nori Media · Authors', 'A', '#DB1F3D', 2)
on conflict (id) do nothing;

insert into public.crm_companies (name, industry, market, status) values
  ('Warrior Notes', 'Ministry & publishing', 'Creative & publishing', 'Proposal sent'),
  ('Whitaker House', 'Christian trade publishing', 'Creative & publishing', 'Warm intro'),
  ('INVNT', 'Brand experience & live events', 'Enterprise AI governance', 'In conversation'),
  ('Spector & Co', 'B2B content agency', 'Creative & publishing', 'Awaiting reply'),
  ('Omnitas', 'monday.com implementation', 'Channel partner', 'Partner'),
  ('Perfect Storm', 'Paid ads & SEO', 'Performance marketing', 'Partner'),
  ('K & Co. Family Jewelers', 'Fine jewelry retail', 'Performance marketing', 'Client'),
  ('Nori Media Group', 'Christian publishing', 'Creative & publishing', 'Client'),
  ('Independent', null, 'Referral', 'Partner'),
  ('Colt (partner lead)', null, null, null)
on conflict (name) do nothing;

insert into public.crm_deals (name, company_id, stage, value, estimate, owners, tasks, created_at)
select d.name, c.id, d.stage, d.value, d.estimate, d.owners, d.tasks, d.created::timestamptz
from (values
  ('Capture → distill → route pilot', 'Warrior Notes', 'Proposal', 8000, false, array['Andrew Kreick'], 3, '2026-08-15'),
  ('Publishing workflow pilot', 'Whitaker House', 'Outreach', 7500, true, array['Andrew Kreick'], 1, '2026-09-15'),
  ('AI governance foundation', 'INVNT', 'Conversation', 25000, true, array['Andrew Kreick'], 2, '2026-09-15'),
  ('Content workflow pilot', 'Spector & Co', 'Outreach', 8000, true, array['Andrew Kreick'], 1, '2026-09-15'),
  ('Padis: ten ad directions', 'Perfect Storm', 'Pilot', 0, false, array['Tim Ferman', 'Andrew Kreick'], 2, '2026-10-05'),
  ('monday.com referral partnership', 'Omnitas', 'Conversation', 0, false, array['Andrew Kreick'], 1, '2026-08-15'),
  ('5th anniversary mailer + email', 'K & Co. Family Jewelers', 'Pilot', 2500, false, array['Tim Ferman', 'Andrew Kreick'], 4, '2026-10-05'),
  ('SURGE + Author Portal', 'Nori Media Group', 'Retainer', 7500, false, array['Andrew Kreick'], 2, '2026-07-15'),
  ('Exit-readiness systematization', 'Colt (partner lead)', 'Lead', 15000, true, array['Andrew Kreick'], 0, '2026-10-05')
) as d(name, company, stage, value, estimate, owners, tasks, created)
join public.crm_companies c on c.name = d.company
where not exists (select 1 from public.crm_deals x where x.name = d.name);

insert into public.crm_people (name, company_id, deal_id, title, status, market, owner, introduced_by, last_interaction, groups, recap, reminders)
select p.name, c.id, d.id, p.title, p.status, p.market, p.owner, p.via, p.last::date, p.groups, p.recap, p.rem
from (values
  ('Kevin Zadai', 'Warrior Notes', 'Capture → distill → route pilot', 'Founder', 'Proposal sent', 'Creative & publishing', 'Andrew Kreick', 'Brad Herman', '2026-10-09', array['pipeline'], array['Founder processes verbally; decisions are reconstructed after the fact.', '$8,000 three-week capture → distill → route pilot is scoped.', 'Campaign uses his aviation background: preflight checklists, systems verification.'], 1),
  ('Mike Cowan', 'Warrior Notes', 'Capture → distill → route pilot', 'Organization Hub', 'In conversation', 'Creative & publishing', 'Andrew Kreick', 'Brad Herman', '2026-10-07', array['pipeline'], array['Spends 5–8 hours a week turning the founder’s direction into action.', 'Frame the pilot as freeing him for higher-value work, not replacing him.'], 0),
  ('Ned Clements', 'Whitaker House', 'Publishing workflow pilot', 'Head of Sales', 'Warm intro', 'Creative & publishing', 'Andrew Kreick', 'Brad Herman', '2026-10-02', array['pipeline'], array['Commits retail dates on production forecasts he can’t see.', 'Closest match to the Nori SURGE result: 360 days → 16 weeks.', 'Enter through sales, not production.'], 1),
  ('James Kinney', 'INVNT', 'AI governance foundation', 'Chief AI Officer', 'In conversation', 'Enterprise AI governance', 'Andrew Kreick', 'Former colleague', '2026-09-29', array['pipeline'], array['Owns AI outcomes on a foundation that isn’t visible yet.', 'Lead with “visibility before governance”.', 'Expect enterprise procurement and a longer cycle.'], 0),
  ('Evan Tarakjian', 'Spector & Co', 'Content workflow pilot', 'Creative Lead', 'Awaiting reply', 'Creative & publishing', 'Andrew Kreick', 'Direct outreach', '2026-09-24', array['pipeline'], array['20 years in B2B content; approach portfolio-first.', 'Montreal agency, a candidate for the Omnitas referral test.'], 1),
  ('Thomas Karlsson', 'Omnitas', 'monday.com referral partnership', 'CEO', 'Partner', 'Channel partner', 'Andrew Kreick', 'Kuren Rai', '2026-10-01', array['partners'], array['Green light at CEO level for monday.com implementation partnership.', 'Activates once the first agency client is introduced.'], 0),
  ('Kuren Rai', 'Omnitas', 'monday.com referral partnership', 'Enterprise Business Consultant', 'Partner', 'Channel partner', 'Andrew Kreick', null, '2026-10-08', array['partners'], array['Guides structure and validates CRM builds, about 15–20 hours a month early on.'], 1),
  ('Tim Ferman', 'Perfect Storm', 'Padis: ten ad directions', 'Founder', 'Partner', 'Performance marketing', 'Andrew Kreick', 'Family', '2026-10-12', array['partners'], array['Paid ads + SEO partner; co-delivering the K & Co. mailer.', 'Padis: ten ad directions on a one-week cycle.'], 1),
  ('Rich Neciuk', 'K & Co. Family Jewelers', '5th anniversary mailer + email', 'Owner, bench jeweler', 'Client', 'Performance marketing', 'Tim Ferman', 'Tim Ferman', '2026-10-11', array['pipeline'], array['5th anniversary in Idaho, Dec 10 open house; mailer + email + landing page.', 'Two directions in review: Black Velvet and White Satin.'], 1),
  ('Kat Neciuk', 'K & Co. Family Jewelers', '5th anniversary mailer + email', 'Owner', 'Client', 'Performance marketing', 'Tim Ferman', 'Tim Ferman', '2026-10-11', array['pipeline'], array['Picks the creative direction with Rich on Oct 13.'], 0),
  ('Jennifer Nizza', 'Nori Media Group', 'SURGE + Author Portal', 'Author, Darkness in Disguise', 'Author', 'Creative & publishing', 'Andrew Kreick', 'Nori Media Group', '2026-10-10', array['authors'], array['Book in Production: front cover in final design, pagination from Oct 15.', 'Video for the launch is due Oct 30.'], 1),
  ('Brad Herman', 'Independent', null, 'Introducer', 'Partner', 'Referral', 'Andrew Kreick', null, '2026-09-30', array['partners'], array['Warm introductions to Warrior Notes and Whitaker House.'], 0)
) as p(name, company, deal, title, status, market, owner, via, last, groups, recap, rem)
left join public.crm_companies c on c.name = p.company
left join public.crm_deals d on d.name = p.deal
where not exists (select 1 from public.crm_people x where x.name = p.name);

insert into public.crm_notes (person_id, author, body, created_at)
select x.id, n.author, n.body, n.at::timestamptz
from (values
  ('Kevin Zadai', 'Andrew Kreick', 'Kevin flies a Phenom 300. Keep the campaign in checklist language.', '2026-10-11 12:00'),
  ('Kevin Zadai', 'Andrew Kreick', 'Mike is the synthesis bottleneck; position the pilot as relief, not replacement.', '2026-09-26 12:00'),
  ('Tim Ferman', 'Andrew Kreick', 'K & Co. price: deck says $2,500. Confirm before invoicing.', '2026-10-12 12:00')
) as n(person, author, body, at)
join public.crm_people x on x.name = n.person;

insert into public.crm_interactions (person_id, kind, title, who, happened_on)
select x.id, i.kind, i.title, i.who, i.on_date::date
from (values
  ('Kevin Zadai', 'mail', 'Preflight check: 15 minutes on Warrior Notes ops', 'Andrew Kreick', '2026-10-09'),
  ('Kevin Zadai', 'meet', 'Scoping call: capture → distill → route', 'Andrew Kreick, Brad Herman', '2026-09-26'),
  ('Kevin Zadai', 'mail', 'Intro via Brad Herman', 'Brad Herman', '2026-09-18'),
  ('Tim Ferman', 'call', 'K & Co. directions review', 'Andrew Kreick', '2026-10-12'),
  ('Tim Ferman', 'mail', 'Padis ad directions: v1 boards', 'Tim Ferman', '2026-10-08')
) as i(person, kind, title, who, on_date)
join public.crm_people x on x.name = i.person;

-- Old CRM leads → new people (matched by lead code; the old rows stay as they are).
with m(code, person) as (values
  ('L-1001', 'Ned Clements'), ('L-1002', 'Tim Ferman'), ('L-1003', 'James Kinney'),
  ('L-1004', 'Kuren Rai'), ('L-1005', 'Rich Neciuk'))
update public.crm_people p
set email = coalesce(p.email, c.email), phone = coalesce(p.phone, c.phone), legacy_client_id = c.id
from m join public.clients c on c.lead_code = m.code
where p.name = m.person;

insert into public.crm_people (name, company_id, email, phone, owner, introduced_by, last_interaction, groups, recap, legacy_client_id)
select c.name, co.id, c.email, c.phone, coalesce(c.owner, 'Andrew Kreick'), c.source, c.last_contact_date, array['pipeline'],
  array['Moved from the old CRM (' || c.lead_code || '). No details yet.'], c.id
from public.clients c
left join public.crm_companies co on co.name = c.company
where c.lead_code = 'L-1006'
  and not exists (select 1 from public.crm_people x where x.legacy_client_id = c.id);

insert into public.crm_notes (person_id, author, body, created_at)
select p.id, 'Andrew Kreick',
  concat_ws(E'\n',
    'From the old CRM (' || c.lead_code || ': ' || c.name || coalesce(', ' || c.company, '') || ').',
    'Stage: ' || coalesce(c.stage, 'none') || '. Source: ' || coalesce(c.source, 'not recorded') || '.',
    c.notes,
    'Next action: ' || c.next_action),
  coalesce(c.last_contact_date::timestamptz, c.created_at)
from public.crm_people p
join public.clients c on c.id = p.legacy_client_id
where (c.notes is not null or c.next_action is not null)
  and not exists (select 1 from public.crm_notes n where n.person_id = p.id and n.body like 'From the old CRM (' || c.lead_code || '%');
