# Project status (updated Oct 14, 2026, new CRM: Follow-up assistant live)

## Live
- ClearMark site: https://clearmark-tan.vercel.app (Vercel auto-deploys `main`). Home, About, Privacy, Terms; footer. Home switches to the Studio version once it's published in Studio.
- Design system: /design-system (colors, type, buttons, nav, footer, components, grid, content fields, 13 cards).
- Team area (login "andrew"): /clrcrm (Brand Playbook), /clrcrm/studio/builder (Studio: templates and dotted spots, saves to Supabase, Publish puts Home, About, Pricing and Book a call live; each page shows its live link; side nav with logo menu, Pages (+ Add page), Modules, CMS, Settings (page addresses); no Design view: design comes from Claude Design), /clrcrm/studio (My Sites and the older editor), /clrcrm/crm (new CRM, Oct 13: People, Companies, Deals board and Dashboards read and save Supabase `crm_*` tables (supabase/crm-v2.sql, seed in crm-v2-seed.sql: 13 people, 10 companies, 9 deals, the 6 old leads merged in and linked by legacy_client_id); adding people, deals, notes and groups, moving deals, adding people to groups, editing and deleting people (Edit details / Delete person in their panel) editing and deleting deals (Edit on a deal card or in the person's panel), adding, editing and deleting companies (click a company), deleting notes, logging interactions (updates Last interaction) and reminders (crm_reminders; person's Reminders tab, side panel → My follow-ups) all save. Follow-up assistant (Oct 14) is real: settings saved in crm_settings (Assistants page); each time the CRM opens it adds a "Follow up with …" reminder, due today, for anyone with no interaction in the chosen time (default 1 week) who has no open reminder and hasn't already been reminded since their last interaction (lib/crm-v2.ts runFollowUps). Recap, Research and Author Portal assistants still need a Claude API key (app/clrcrm/crm/api, lib/crm-v2.ts); Messages, Assistants and the Author Portal still run on sample data; source `docs/prototypes/crm/crm.html`, from the Claude prototype https://claude.ai/artifact/7omMyg89EDXmAfd3qBHwfy), /clrcrm/crm/pipeline (old CRM: 6 leads, 11 products in Supabase, with its Database, Funnel, Products and Clients tabs; team menu → "Old CRM"), /clrcrm/interview (interview drill).
- Kreick Marketing site (separate repo kreickmarketing-site): https://kreickmarketing.vercel.app (Gigs, 6 case studies, AI Explorations).

## Where things live in this repo
- `styles/colors.css`, `styles/typography.css`, `styles/buttons.css`: the only sources for color, type and buttons.
- `components/`: Card (13 sizes), Hero, SectionHeader, Credibility, Platforms, SiteNav (+ SiteTabBar), Footer. All size themselves by their own width.
- `app/design-system/`: the design system page and its sample content.
- `app/clrcrm/`: team area (login, Studio, CRM, playbook, interview).
- Uploads: Supabase Storage bucket `studio-media` (clearmark-test), see `supabase/studio-media.sql`.
- CMS: Products (the 4 offers + a draft sample) and Portfolio in Supabase `items`/`media`/`tags`; edited in Studio → CMS; offer cards read from it (`lib/cms.ts`).
- `supabase/`: SQL for signups, crm_members, clients, products, and Studio (`studio.sql`: sites, pages, collections, items, media, tags, versions). Project clearmark-test only.
- `lib/studio.ts`: the shape of a Studio page (sections → components or a card grid).
- `docs/design-system/`: text-styles.md, cards.md (content fields, card specs).
- `docs/studio-plan.md`: the Studio plan.
- `uploads/`, `assets/`: Andrew's image uploads (hero-poppies.jpg, platforms-bg.jpg, avatars, platform-logo-01–10, certification logos, reference screenshots). Not yet wired into the components; components still show placeholders.
- `components/core`, `components/navigation`: Andrew's uploaded design-system export (reference only, not used; follow his newer images where they differ).

## Next moves
0. New CRM: Andrew checks it with real use (the Follow-up assistant adds ~6 reminders the first time it opens), then retires the old CRM (/clrcrm/crm/pipeline + `clients`). After that: real email sending for Messages, the Recap and Follow-up assistants (Claude), and the Author Portal's Drive and monday connections.
1. Swap the real images from uploads/ and assets/ into Hero, Credibility and Platforms.
2. Andrew: add NEXT_PUBLIC_CALENDLY_URL = https://calendly.com/andrew-clearmark/15min in Vercel.
3. Andrew: open Studio → ClearMark → Home → Edit, check the preview, then Publish. The first Publish replaces the old hand-built homepage.
4. Andrew: log in → Studio → "Open Studio for ClearMark" → check Home → Publish (tap twice) → check the live home page. Until the first Publish the old hand-built home stays up.
5. Studio is changing direction to a builder with fixed layouts and dotted spots (see docs/studio-plan.md, Oct 6). Andrew reviews the prototype at https://claude.ai/artifact/ErVXjLTHdeD2tCbDRga3JP, then we port it. Templates are fine-tuned on the Claude Design canvas https://claude.ai/artifact/4SAJ91HAWLnyKJBSLAYmpM; Andrew's first round (hero headline size, stacked selling points, Platforms tags and logos at the bottom) is in prototype v7.


## Rules to remember
- Never name Chevrolet or MediaMonks on ClearMark. Kreick site must not link to ClearMark.
- Only the dev Supabase project (clearmark-test). Never secret keys in code. RLS on every table.
- Push each change to branch claude/cool-davinci-8nuk9x and to main.
- Andrew wants plain language, one recommendation, short numbered steps.
