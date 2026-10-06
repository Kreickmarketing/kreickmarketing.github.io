# Studio plan

Studio is Andrew's own website editor (like Framer or Figma Sites), for all his sites. The design stays locked in code, built with Claude; Andrew arranges and fills the pieces from any device. Agreed Oct 4–5, 2026.

**Start here in a new session:** read this file, `CLAUDE.md`, `docs/project-status.md` and `docs/design-system/cards.md`.

## What Studio does

```
LOG IN  (the existing /clrcrm login; Supabase auth + crm_members)
  │
  ▼
MY SITES  ─ a card per site (like Framer's "All" page): ClearMark, Kreick Marketing, future client sites
  │
  ▼
A SITE
  ├── PAGES      Home, Gigs, case studies …
  │               └── PAGE EDITOR
  │                    • left: Insert panel (like Figma "Insert"): Components and Cards, with thumbnails
  │                    • centre: the live page
  │                    • drag a component or card onto the page
  │                    • move sections up/down; move components within or between sections;
  │                      reorder cards inside their section (drag on laptop, ↑ ↓ arrows on phone)
  │                    • edit text, links, images, videos in place
  │                    • change a component's type (fields carry over where they match;
  │                      unused fields are hidden, not deleted)
  │                    • click a card to edit its CMS item ("Also on: /gigs, /work" notice)
  │                    • Save draft → Publish (live within about a minute)
  ├── CMS        Products, Portfolio (cards pull from these)
  ├── SETTINGS   page settings (title, URL, description, search on/off, social image),
  │              site images (favicon, social preview), domains + DNS status (needs a Vercel
  │              access key stored as an environment variable), connections (Supabase,
  │              Calendly, analytics)
  ├── VERSIONS   every Publish saved (date, what changed); view and restore
  └── CRM        already built at /clrcrm/crm
```

Reference screens Andrew shared: Framer dashboard (All projects, Domains), Framer site settings (General, Home page settings, Domains with DNS table, Staging + Versions), Figma Sites Insert panel (Blocks: Pages, Navigation, Heroes, Features, CMS, Embeds).

## Definitions

- **Component:** a page building block, content belongs to one page (Hero, Section header, Credibility, Platforms, nav, footer). Shared styling.
- **Card:** shows a CMS item (product, portfolio piece). Same item can appear on many pages; editing it changes it everywhere.
- **Design system** (`/design-system`, `app/design-system/`) is Studio's library. Everything in it must be a standalone component that sizes itself by its own width (container queries) so it can be dropped anywhere.

## Content fields (see docs/design-system/cards.md)

CT100, CT200, CT300 (titles) · CS Content Short ≤144 words · CL Content Long ≤1,500 words · Slug · CB / CBL button text and link · CP, CPT, CPS, CPD, CPDT price fields · Tags (comma-separated; each tag has its own page `/tags/<slug>` or a custom link) · CI-01… images and CV-01… videos kept OUTSIDE the content fields: files in Supabase Storage (videos may be Vimeo/YouTube links), listed in a separate media list (number, file or link, alt text, order).

## Data model (proposed, Supabase, RLS on every table)

- `sites` (name, slug, domain, vercel_project, settings json)
- `pages` (site, slug, title, description, search_visible, social_image, draft json, published json, published_at)
- page JSON = ordered sections → each section has a type and ordered components, or a card grid (collection, item ids, card width)
- `collections` / `items` (CMS: products, portfolio) using the content fields
- `media` (item or page, number CI-01/CV-01, storage path or URL, alt, order)
- `tags` (name, slug, custom_link) + `item_tags`
- `versions` (page, published json, published_at, published_by, summary)
- Public sites read only published content (anon select on published rows); editing only for CRM members.
- Live site updates on Publish via Next.js revalidation.

## Build order (each step ≈ one 1-hour session)

1. ✅ Sites, pages, sections, CMS collections in Supabase; ClearMark Home first. (Done Oct 5: `supabase/studio.sql`, page shape in `lib/studio.ts`.)
2. ✅ My Sites and Pages screens. (Done Oct 6: `app/clrcrm/studio/`.)
3. ✅ Page editor: edit text and links; Save draft → Publish. (Done Oct 6.)
4. ✅ Insert panel + move sections, components and cards. (Done Oct 6.)
5. CMS screens (Products, Portfolio) with "Also on" notice.
6. Change component type.
7. Image and video uploads (Supabase Storage).
8. Page settings, Versions with restore, Domains.
Then: connect the Kreick site (separate Vercel project; needs the Supabase URL and publishable key added there).

## Progress log

- **Oct 5, 2026: step 1 done.** In clearmark-test: tables `sites`, `pages`, `collections`, `items`, `media`, `tags`, `item_tags`, `versions`, all with RLS. CRM members can do everything (`is_crm_member()`); visitors read only published pages and items, never a page's draft or the versions. Seeded: ClearMark (live) and Kreick Marketing (coming); Products and Portfolio collections; one sample product (CPO→CIO Leadership Track, still a draft) with its image and 3 tags; ClearMark Home as a **draft** with 5 sections (Hero, Credibility, Platforms, Solutions header, a card grid). Nothing is published yet, so the live site is unchanged.
  - Note for Claude: the Supabase MCP `apply_migration` hangs (60s timeout) on any statement with `drop … if exists` or other "destructive" SQL because it waits for a confirmation. On a fresh table use `create or replace trigger` and plain `create policy` instead.
  - The CMS `items` are separate from the CRM `products` table (that one is for sales: prices, Stripe IDs). Linking them can come later.
- **Oct 6, 2026: step 2 done.** Decision: Studio uses **dark panels** (Midnight/Charcoal, like Figma and Framer). New "Studio" item in the team menu. `/clrcrm/studio` = My Sites (a card per site; ClearMark opens, Kreick shows "Coming"). `/clrcrm/studio/clearmark` = the site: Pages list (status Draft / Published / Unpublished changes, section count) and its CMS collections with item counts; CMS, Settings and Versions tabs say "soon". Card thumbnail comes from `sites.settings.thumbnail`. `CrmShell` takes an optional `className` for the dark theme.
  - Note for Claude: `next dev` appends a Next.js block to CLAUDE.md; revert it (`git checkout CLAUDE.md`) before committing. Screenshots: global Playwright via `require(npm root -g + '/playwright')`.
- **Oct 6, 2026: step 3 done.** Page editor at `/clrcrm/studio/<site>/<page id>` (open from "Edit →" on the Pages list). Left: fields for every text and link, built from the component's content (labels and reading order in `PageEditor.tsx`). Right: live preview in a frame (`/clrcrm/preview/<page id>`, kept outside the Studio styles), Desktop (1280px, shrunk to fit) or Phone (390px). Phones: Edit / Preview switch. Save draft → `saveDraft`; Publish → `publishPage` → database function `publish_page` (copies draft live, saves a `versions` row with the optional "What changed?" note, publishes the CMS items its cards show), then refreshes the live page. Every save is checked by `lib/studio-validate.ts` (known component types, card widths, safe links only, images must be files in public/).
  - Live site: `app/page.tsx` shows the published Studio Home (plus the mailing-list form and footer) once Home has been published; until then it shows the old hand-built homepage. Shared renderer: `components/StudioPage.tsx`; visitor-side loading: `lib/studio-public.ts`, `lib/studio-cards.ts`.
  - Not yet: images (step 7), adding/removing/reordering sections (step 4), the Kreick site.
- **Oct 6, 2026: step 4 done.** The editor's left panel has two tabs. **+ Insert**: the 4 components and 13 cards (incl. Card-Image-Text, now supported in card grids as width `"image-text"`), with small drawings; tap to add after the open section, or drag onto the Layers list (laptop). **Layers**: one bar per section; drag the bar (laptop) or ↑ ↓ (phone) to move, × to remove; open a section to edit its link name (#anchor, used by nav links; must be unique), its fields, move components within the section or "Into section above/below", and for card grids: card size, add a card from the collection, ↑ ↓ ×. Lists inside components (tags, logos, headline lines) have + Add and ×. **Undo** takes back layout changes (last 30). The preview scrolls to and outlines the section you open.
  - Code: `page-ops.ts` (pure layout changes, unit-tested), `blocks.tsx` (Insert catalogue, starting text, drawings), `Fields.tsx` (edit boxes). Editor and preview now load every item in the site (`loadAllCards`).
  - Note for Claude: in Chrome, changing the page inside `dragstart` cancels the drag, so drag state is set in a `setTimeout`; both panels stay mounted (one `hidden`) so a drag from Insert survives the switch to Layers.
- **Next: step 5**, CMS screens (Products, Portfolio): edit items' content fields and tags, publish/unpublish, with an "Also on: /…" notice listing pages that show the item.

## First draft scope (agreed)

ClearMark only (Kreick shown as "coming"), Home page, Insert panel with the 4 components and 13 cards, drag onto page, move sections, edit text and links, draft → Publish.

## Decisions still open

1. ~~Studio's look~~: decided Oct 6, dark panels.
2. Where the 6 nav links go (About, Solutions, Platforms, Why, The Engine, Pricing). Editable in Studio, so not blocking.
3. Which credibility logos: the 4 in the design (Alliance Canada, Ambrose, Clear mark, LaPalabra) or the repo's Harvard/MIT/Berkeley/Wharton.
