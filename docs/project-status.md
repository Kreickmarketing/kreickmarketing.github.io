# Project status (updated Oct 5, 2026, after Studio step 1)

## Live
- ClearMark site: https://clearmark-tan.vercel.app (Vercel auto-deploys `main`). Home, About, Privacy, Terms; footer.
- Design system: /design-system (colors, type, buttons, nav, footer, components, grid, content fields, 13 cards).
- Team area (login "andrew"): /clrcrm (Brand Playbook), /clrcrm/crm (CRM: 6 leads, 11 products in Supabase), /clrcrm/interview (interview drill).
- Kreick Marketing site (separate repo kreickmarketing-site): https://kreickmarketing.vercel.app (Gigs, 6 case studies, AI Explorations).

## Where things live in this repo
- `styles/colors.css`, `styles/typography.css`, `styles/buttons.css`: the only sources for color, type and buttons.
- `components/`: Card (13 sizes), Hero, SectionHeader, Credibility, Platforms, SiteNav (+ SiteTabBar), Footer. All size themselves by their own width.
- `app/design-system/`: the design system page and its sample content.
- `app/clrcrm/`: team area (login, CRM, playbook, interview).
- `supabase/`: SQL for signups, crm_members, clients, products, and Studio (`studio.sql`: sites, pages, collections, items, media, tags, versions). Project clearmark-test only.
- `lib/studio.ts`: the shape of a Studio page (sections → components or a card grid).
- `docs/design-system/`: text-styles.md, cards.md (content fields, card specs).
- `docs/studio-plan.md`: the Studio plan.
- `uploads/`, `assets/`: Andrew's image uploads (hero-poppies.jpg, platforms-bg.jpg, avatars, platform-logo-01–10, certification logos, reference screenshots). Not yet wired into the components; components still show placeholders.
- `components/core`, `components/navigation`: Andrew's uploaded design-system export (reference only, not used; follow his newer images where they differ).

## Next moves
1. Swap the real images from uploads/ and assets/ into Hero, Credibility and Platforms.
2. Andrew: add NEXT_PUBLIC_CALENDLY_URL = https://calendly.com/andrew-clearmark/15min in Vercel.
3. Studio step 2: My Sites and Pages screens (step 1, the Supabase tables, done Oct 5; see docs/studio-plan.md).

## Rules to remember
- Never name Chevrolet or MediaMonks on ClearMark. Kreick site must not link to ClearMark.
- Only the dev Supabase project (clearmark-test). Never secret keys in code. RLS on every table.
- Push each change to branch claude/cool-davinci-8nuk9x and to main.
- Andrew wants plain language, one recommendation, short numbered steps.
