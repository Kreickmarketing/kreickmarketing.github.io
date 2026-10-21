# Plan: move the team apps from `/clrcrm/...` to `/apps/...`

Written Oct 20, 2026. **Plan only.** Nothing here has been changed, committed, pushed or deployed. The site is live, so every step below waits for Andrew's go-ahead.

## 1. What we're working with

- **Repo:** GitHub `Kreickmarketing/kreickmarketing.github.io` (the `package.json` name is `clearmark-site`, which is confusing; the separate `clearmark-site` repo on GitHub is not the live one). Confirmed: the live Vercel deployment's commit `9b46bab` ("Log: Oct 17 template changes live") exists only in this repo.
- **Vercel project:** `clearmark` (team clearmark). www.clearmark.bz and clearmark-tan.vercel.app are the same deployment, so this is a **route rename plus redirects inside one project**. No DNS or domain change.
- **Framework:** Next.js 16 (App Router). In Next 16 the old `middleware.ts` is called `proxy.ts`; this repo has one.
- **Login:** Supabase email + password only (username "andrew" becomes andrew@clearmark.bz). **No Google, GitHub or other OAuth providers**, so there are no OAuth callback URLs to change. The only external auth URL is the **password-reset email link** (`/clrcrm/auth/callback`).
- **Cookies:** Supabase's login cookie is set by `@supabase/ssr` with its default path `/`, not `/clrcrm`. Logged-in people **stay logged in** after the move.
- **Sitemap / robots:** none in the repo. The team area is kept out of search engines by an `X-Robots-Tag: noindex` header in `proxy.ts` and `robots: noindex` in the layouts.
- **Who uses these URLs:** only Andrew and Tim (team login). Client-facing pages (`/`, `/about`, `/pricing`, Studio-published pages) don't change. That keeps the risk low.

> Clone note: the repo has both `README.md` and `readme.md`. macOS treats those as the same file, so a fresh clone shows `M README.md` in `git status`. That's not a real change; don't commit it.

## 2. Final address map

| Now | New | Code today |
|---|---|---|
| `/clrcrm` | `/apps/playbook` | `app/clrcrm/page.tsx` |
| (none) | `/apps` | new: **launcher page**, a card per app in the same style as Studio → My Sites (decided by Andrew Oct 20; section 3c) |
| `/clrcrm/login` | `/apps/login` | `app/clrcrm/login/` |
| `/clrcrm/forgot` | `/apps/forgot` | `app/clrcrm/forgot/` (not in Andrew's list; same pattern) |
| `/clrcrm/reset` | `/apps/reset` | `app/clrcrm/reset/` (same) |
| `/clrcrm/auth/callback` | `/apps/auth/callback` | `app/clrcrm/auth/callback/route.ts` (same) |
| `/clrcrm/crm` | `/apps/crm` | `app/clrcrm/crm/route.ts` (serves `docs/prototypes/crm/crm.html`) |
| `/clrcrm/crm/api` | `/apps/crm/api` | `app/clrcrm/crm/api/route.ts` |
| `/clrcrm/crm/products` | `/apps/crm/products` (temporary: retired once Andrew moves the products into the CRM by hand) | `app/clrcrm/crm/products/page.tsx` |
| `/clrcrm/studio` and everything under it | `/apps/studio/...` | `app/clrcrm/studio/` (My Sites, `[site]`, `[site]/[pageId]`, `builder`, `builder/api`, `builder/api/cms`) |
| `/clrcrm/preview/[pageId]` | `/apps/preview/[pageId]` | `app/clrcrm/preview/` (same) |
| `/clrcrm/interview` | `/apps/interview` | `app/clrcrm/interview/` |
| (future) | `/apps/socialstudio/...` | separate Vercel project, attached by a rewrite (section 6) |

## 3. Code changes (one branch, one PR)

Branch name suggestion: `apps-url-migration`.

### 3a. Move the folders

`git mv` renames a file and keeps its history.

1. `git mv app/clrcrm app/apps`
2. Playbook to its own folder: `app/apps/page.tsx` → `app/apps/playbook/page.tsx`. Its helpers (`PlaybookControls.tsx`, `playbook-content.ts`) can stay in `app/apps/` (just fix the import paths) or move with it.
3. Add a new `app/apps/page.tsx`: the launcher page (section 3c).
4. Products stays where it is inside the folder: `app/apps/crm/products/` → `/apps/crm/products` (decided Oct 21). No folder split needed; it keeps `crm/layout.tsx` and its light CRM look. It's temporary: once Andrew has moved the products into the CRM by hand, delete the folder (plus `crm/layout.tsx`, `crm/data.ts`, `crm/queries.ts` if nothing else uses them), its menu item and its launcher card, and add a redirect `/apps/crm/products` → `/apps/crm`.
5. Leave the CSS file names (`clrcrm.css`, `crm-` classes) alone. Renaming them is cosmetic and makes the diff harder to review.

### 3b. Change hard-coded paths

Every `/clrcrm` in code, found with `grep -rn clrcrm`:

| File | What changes |
|---|---|
| `next.config.ts` | `redirects()` rewritten (section 4). **`outputFileTracingIncludes` keys must become `/apps/studio/builder` and `/apps/crm`.** Without that, Vercel doesn't bundle the two HTML files and the CRM and Studio builder return errors (500) in production even though they work locally. |
| `proxy.ts` | `matcher` → `["/apps", "/apps/((?!socialstudio(?:/|$)).*)"]` (every `/apps` page except the future Social Studio zone). Public list → `/apps/login`, `/apps/forgot`, `/apps/auth`. Login redirect → `/apps/login`. The "don't add `?next=`" check: `path !== "/apps" && path !== "/apps/playbook"`. `/clrcrm` can leave the matcher, because config redirects run before the proxy. |
| `app/apps/next-path.ts` | `safeNext`: allow `/apps/...` (not `/apps/login`), default `/apps` (the launcher). Also allow `/clrcrm/...` so an old link `/clrcrm/login?next=/clrcrm/crm` still lands on the CRM after login (the redirect then forwards it). |
| `app/apps/auth/callback/route.ts` | default `next` → `/apps`, allowed → `/apps...`; expired link → `/apps/forgot?expired=1`. |
| `app/apps/actions.ts` | logout → `/apps/login`; reset email `redirectTo` → `${origin}/apps/auth/callback?next=/apps/reset`; after login → `/apps`. |
| `app/apps/CrmShell.tsx` | menu links: All apps `/apps` (new), Studio `/apps/studio`, CRM `/apps/crm`, Products `/apps/crm/products` (temporary), Playbook `/apps/playbook`, Interview `/apps/interview`; logo → `/apps`. |
| layouts and pages with `redirect("/clrcrm/login?denied=1")` | `/apps/login?denied=1` in Products, Studio, Playbook, Interview and Preview. |
| `app/apps/reset/page.tsx` | `/apps/forgot?expired=1`. |
| `app/apps/forgot/ForgotForm.tsx`, `login/LoginForm.tsx` | links to `/apps/login`, `/apps/forgot`. |
| `app/apps/crm/route.ts` | login redirect → `/apps/login?next=/apps/crm`. |
| `app/apps/studio/builder/route.ts` | login redirect → `/apps/login?next=/apps/studio/builder`. |
| `app/apps/studio/page.tsx`, `[site]/page.tsx`, `[site]/[pageId]/PageEditor.tsx` | links `/apps/studio...`; preview iframe `src` → `/apps/preview/${id}`. |
| `app/apps/studio/actions.ts` | `revalidatePath("/apps/studio/...")`. |
| `docs/prototypes/crm/crm.html` | `fetch('/clrcrm/crm/api')` (line ~518) → `/apps/crm/api`; comments. Copied record links use `location.pathname`, so they update themselves. |
| `docs/prototypes/studio-builder/studio-builder.html` | `const API = "/apps/studio/builder/api"` (~2077); `DASH` → `/apps/studio` (~3863); "Team area" link → `/apps/playbook` (~3869); `RESERVED_SLUGS`: add `"apps"` (~3802); comments. |
| `lib/builder-site.ts` line 447 | add `"apps"` to `RESERVED_SLUGS`, so nobody can publish a Studio page at `/apps` (it would be hidden behind the apps area). Keep `"clrcrm"` in the list, because the old paths still redirect. |
| Comments only | `lib/builder-site.ts`, `lib/crm-ai.ts`, `lib/crm-v2.ts`, `scripts/sync-style.mjs`, `supabase/*.sql`, the `*.css` header comments. |
| `docs/project-status.md`, `docs/studio-plan.md` | update the addresses and add a dated log line. |

**The two prototype HTML files also exist as Claude artifacts** (CRM prototype, Studio builder artifact `ErVXjLTHdeD2tCbDRga3JP`). If one of them is later copied back over the repo file, the old `/clrcrm` API paths come back and saving breaks. Make the same edits in the artifact copies, or check for `clrcrm` after every port. For a quick check:

```bash
grep -rn clrcrm app lib proxy.ts next.config.ts docs/prototypes
```

(`grep -rn` searches folders for text and prints file and line. After the migration it should only find redirect rules, `RESERVED_SLUGS` and history notes.)

### 3c. The `/apps` launcher page

Andrew's decision (Oct 20): `/apps` looks like Studio → My Sites (dark page, small "kicker" label above a big title, a grid of cards with a picture or a big letter, name, a line of text and a small meta line, and a "Coming" pill on apps that aren't ready). Each app gets its own card.

How to build it, reusing what's there:

1. **App list in code, not in Supabase.** The apps change rarely and only with a code change, so a small file `app/apps/apps-list.ts` is simplest (no new table, no new security rules):
   ```ts
   export type AppCard = { key: string; name: string; href: string; blurb: string; thumbnail?: string; status?: "coming"; external?: boolean };
   export const APPS: AppCard[] = [
     { key: "studio",       name: "Studio",           href: "/apps/studio",           blurb: "Website builder" },
     { key: "crm",          name: "CRM",              href: "/apps/crm",              blurb: "People, deals, messages", external: true },
     { key: "products",     name: "Products",         href: "/apps/crm/products",     blurb: "Price list (until it moves into the CRM)" },
     { key: "playbook",     name: "Playbook",         href: "/apps/playbook",         blurb: "ClearMark brand playbook" },
     { key: "interview",    name: "Interview",        href: "/apps/interview",        blurb: "Interview drill" },
     { key: "socialstudio", name: "Social Studio",    href: "/apps/socialstudio",     blurb: "Social posts and calendar", status: "coming", external: true },
   ];
   ```
   `external: true` means "use a plain `<a>` link with a full page load". That's needed for the CRM (it's an HTML file, not a React page, just like the ClearMark card that opens the builder today) and for Social Studio (a separate app, section 6). Names, blurbs and order are placeholders for Andrew to adjust.
2. **`app/apps/page.tsx`** copies the shape of `app/apps/studio/page.tsx`: title **"Clearmark Apps"** (decided Oct 21; small kicker label above it optional, e.g. "Team"), `<ul className="studio-sites">`, one card per app. "Coming" cards aren't clickable (same `studio-site-coming` style). The meta line could show "Coming" or stay empty, since apps don't have a page count or an edit date like sites do.
3. **Card component:** move `SiteCard`'s markup into a shared `app/apps/Card.tsx` (thumbnail or first letter, Coming pill, name, line, meta) used by both My Sites and the launcher, so the two pages can't drift apart. Optional: keep two copies for now and merge them later.
4. **Frame and styles:** `/apps` has no layout above it (each app folder has its own), so the page itself does the member check (`getCrmMember()`, else `redirect("/apps/login?denied=1")`) and wraps its content in `<CrmShell current="apps" className="studio">` with `clrcrm.css` and `studio/studio.css` imported. The card styles in `studio.css` (`.studio-sites`, `.studio-site`, `.studio-thumb`, …) are written for the `.studio` frame, which is why it needs `className="studio"`. Cleaner later on: move those card rules into a small `cards.css` shared by both pages.
5. **Thumbnails:** to start, the big first letter (like the Kreick Marketing card). Andrew can add images later to `public/apps/<key>.jpg` and set `thumbnail` in the list.
6. **Navigation:**
   - `CrmShell`: logo → `/apps`, add an "All apps" menu item at the top, and allow `current="apps"`.
   - After login, the default destination becomes `/apps` (not the Playbook): `safeNext` default, `auth/callback` default and `actions.ts` after login. An explicit `?next=` still wins.
   - Studio builder's "Team area" link (`studio-builder.html` ~3869) → `/apps`.
   - `proxy.ts`: no extra `?next=` for `/apps` itself (`path !== "/apps"`).
7. **Social Studio card:** shows "Coming" until the rewrite in section 6 is live. Then remove `status: "coming"`.

## 4. Redirects from the old addresses

In `next.config.ts` → `redirects()`. Next.js checks them top to bottom and uses the **first match**, so specific rules go first. Query strings (`?next=...`, `?code=...`) are passed along by default. The `#p=<id>` part of copied CRM links stays in the browser and survives too.

```ts
async redirects() {
  const permanent = false; // step 1: temporary (307). Change to true (308) after a week with no problems (see below).
  const retired = ["pipeline", "database", "funnel", "clients", "clients/:path*"];
  return [
    // Old CRM lead pages (retired Oct 14): straight to the new CRM, no double hop.
    ...retired.map((p) => ({ source: `/clrcrm/crm/${p}`, destination: "/apps/crm", permanent })),
    // Playbook (the old team home)
    { source: "/clrcrm", destination: "/apps/playbook", permanent },
    // Everything else keeps its path: login, forgot, reset, auth/callback, crm, crm/api,
    // studio/**, interview, preview/**
    { source: "/clrcrm/:path+", destination: "/apps/:path+", permanent },
  ];
},
```

Notes:
- **307 first, then 308.** Browsers remember a 308 (permanent) redirect for a long time. If we had to roll back, people whose browser had cached a 308 would keep being sent to `/apps/...`, which wouldn't exist on the old version, so they'd get a 404. So: ship with 307 (temporary), check for a week, then a tiny follow-up PR sets `permanent = true`, which makes them 308. Both 307 and 308 keep POST requests as POST, so an old open CRM tab still saves through `/clrcrm/crm/api`.
- Password-reset emails sent **before** the switch link to `/clrcrm/auth/callback?code=...`. The catch-all forwards them with the code to `/apps/auth/callback`, and the new `safeNext` accepts the old `next=/clrcrm/reset` (see 3b).
- No trailing-slash issue: Next.js's default is no trailing slash, and it removes one before redirects run.

## 5. Settings outside the code (Andrew does these; nothing is changed by this plan)

1. **Supabase → Authentication → URL Configuration → Redirect URLs** (the Supabase project the live site uses, which per `docs/project-status.md` is **clearmark-test**). Add before the deploy:
   - `https://www.clearmark.bz/apps/auth/callback`
   - `https://clearmark-tan.vercel.app/apps/auth/callback`
   - for preview testing: `https://*-clearmark.vercel.app/**` (Vercel preview addresses end in `-<team>.vercel.app`; copy the exact one from the preview deployment)

   **Keep** the old `/clrcrm/auth/callback` entries for a few weeks, then remove them. If `/apps/auth/callback` isn't in the list, Supabase sends reset links to the "Site URL" (the home page) instead, and password reset quietly breaks.
2. **Supabase → Authentication → Email Templates:** check the "Reset password" template doesn't contain a hand-typed `/clrcrm` link. The default `{{ .ConfirmationURL }}` is fine.
3. **Supabase "Site URL":** no change.
4. **Vercel → Settings → Environment Variables:** make sure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are also enabled for **Preview**. If they're missing, the proxy skips the login check on previews and the test in section 7 doesn't prove anything.
5. **Saved content in Supabase:** Studio drafts, published pages and CMS items could contain typed `/clrcrm` links. Read-only check in the Supabase SQL Editor (it only reads, it changes nothing):
   ```sql
   select site, 'draft' as which from builder_sites where draft::text ilike '%clrcrm%'
   union all
   select site, 'published' from builder_sites where published::text ilike '%clrcrm%';
   ```
   (Check the real column names in `supabase/studio-builder.sql` first.) Anything it finds still works thanks to the redirects, but it's worth cleaning up.
6. **Bookmarks, phone home-screen icons, saved logins:** tell Tim. Old bookmarks keep working through the redirects. Password managers save logins per site, not per path, so they still fill in.
7. No OAuth providers, Calendly, Resend or DNS settings are affected.

## 6. Later: attach Social Studio at `/apps/socialstudio` (multi-zones)

When the Social Studio app is deployed as its own Vercel project with `basePath: "/apps/socialstudio"`:

1. In **this** repo's `next.config.ts`, add:
   ```ts
   async rewrites() {
     const zone = process.env.SOCIAL_STUDIO_URL; // e.g. https://clearmark-social-studio.vercel.app
     return zone ? [
       { source: "/apps/socialstudio", destination: `${zone}/apps/socialstudio` },
       { source: "/apps/socialstudio/:path+", destination: `${zone}/apps/socialstudio/:path+` },
     ] : [];
   },
   ```
   A **rewrite** is different from a redirect: the browser keeps showing clearmark.bz while Vercel quietly fetches the page from the other project. Because the other app uses `basePath`, its scripts and images (`/apps/socialstudio/_next/...`) are covered by the same rule.
2. Add `SOCIAL_STUDIO_URL` in Vercel (Production and Preview). If it's empty, nothing is attached, so this can ship before Social Studio is ready.
3. `proxy.ts` already leaves `/apps/socialstudio` alone (see the matcher in 3b). Social Studio does its own login check.
4. **Shared login:** the Supabase cookie is on clearmark.bz with path `/`. If Social Studio uses the **same Supabase project**, the team is already logged in there. If it uses a different project, it needs its own login page, plus its own entries in that project's Redirect URLs.
5. Links between the zones (for example a "Social Studio" item in `CrmShell`) must be plain `<a href>`, not Next's `<Link>`, because `<Link>` only works inside one app.
6. The Social Studio Vercel project must not have Deployment Protection on its production URL, or the rewrite gets a login wall.
7. No `RESERVED_SLUGS` change needed for it, because `"apps"` (added in 3b) already covers everything under `/apps`.

## 7. Testing on a Vercel preview before production

A preview deployment is a private copy of the site that Vercel builds from a branch, at its own `*.vercel.app` address. Production (`main`) doesn't change. **Pushing the branch is the one outward step, and it waits for Andrew's OK.**

1. Locally: `npm run build` (builds like Vercel does, so it catches broken imports), then `npm run dev` and click through.
2. Do the Supabase Redirect URL step (5.1, including the preview pattern) first.
3. Push the branch and open the preview link from the PR or the Vercel dashboard.
4. Checklist on the preview:
   - [ ] Logged out: `/apps/crm` → `/apps/login?next=/apps/crm` → log in → lands on the CRM.
   - [ ] Logged out: `/apps` → login → lands on the `/apps` launcher. Logged out: `/apps/playbook` → login → Playbook.
   - [ ] Launcher: one card per app, it looks like Studio → My Sites, every card opens the right app, the Social Studio card shows "Coming" and isn't clickable. Check on a phone width too.
   - [ ] Every menu item in the top bar opens the right page (All apps, Studio, CRM, Products, Playbook, Interview); the logo goes to `/apps`.
   - [ ] CRM: data loads, edit and save a test record (check the network tab: POST goes to `/apps/crm/api`, status 200). Copy a record link and open it.
   - [ ] Studio: My Sites → builder opens with the saved draft; make a change and see "Saved" (POST to `/apps/studio/builder/api`). **Don't Publish on the preview**: it writes to the same Supabase as the live site.
   - [ ] Studio page editor: preview iframe loads (`/apps/preview/<id>`).
   - [ ] `/apps/crm/products` shows the price list in the light CRM frame.
   - [ ] Interview loads.
   - [ ] Forgot password → email arrives → link opens `/apps/auth/callback` → `/apps/reset` → new password works.
   - [ ] Old addresses: `/clrcrm`, `/clrcrm/login?next=/clrcrm/crm`, `/clrcrm/crm`, `/clrcrm/crm/products`, `/clrcrm/crm/pipeline`, `/clrcrm/studio/builder?page=about`, `/clrcrm/interview` each go to the right new page. Quick check from the terminal (`curl -sI` fetches only the headers; the `Location` line shows where it redirects):
     ```bash
     curl -sI https://<preview-url>/clrcrm/crm/products | grep -i -E "^(HTTP|location)"
     ```
   - [ ] Response header `X-Robots-Tag: noindex, nofollow` on `/apps/...` pages.
   - [ ] Public site unaffected: `/`, `/about`, `/pricing`, `/privacy`, `/design-system`.
5. Merge to `main` → production deploys. Repeat a short version of the checklist on www.clearmark.bz.
6. One week later: the small PR that switches redirects to `permanent: true` (308).

## 8. Rollback

- **Fastest:** Vercel dashboard → project `clearmark` → Deployments → the last good one (before the merge) → **Instant Rollback**. About 1 minute; the live site goes back to the `/clrcrm` version.
- That's safe because the redirects are still **307** (temporary) for the first week, so no browser has cached a permanent jump to `/apps`.
- Then fix forward on the branch, or undo the merge in git with `git revert -m 1 <merge commit>` (this adds a new commit that undoes the merge without rewriting history).
- Keep the old `/clrcrm/auth/callback` Supabase Redirect URLs until the move has settled, so rollback doesn't break password reset.
- After the switch to 308: don't roll back to the `/clrcrm` version. Fix forward instead, because browsers will keep sending old addresses to `/apps`.

## 9. Open questions for Andrew

1. ~~Products address~~ **Decided Oct 21:** `/apps/crm/products` for now. Andrew will move the products into the CRM by hand and then retire this page (see 3a step 4).
2. ~~What should `/apps` alone show?~~ **Decided Oct 20:** a launcher in the Studio My Sites style, one card per app (section 3c). **Decided Oct 21:** title "Clearmark Apps"; login lands on `/apps`. Still open (fine to settle during the code review): card names, short descriptions and order, and pictures vs. the big letter for now.
3. ~~Pages not in your list~~ **Decided Oct 21:** yes, forgot password, reset, auth callback and Studio preview move to `/apps/forgot`, `/apps/reset`, `/apps/auth/callback`, `/apps/preview/...`.
4. ~~Domain~~ **Decided Oct 20: `www.clearmark.bz` is the main address.** It's already set up that way: checked Oct 20, `clearmark.bz` answers with a 308 (permanent) redirect to `https://www.clearmark.bz/`, and the path carries over, so `clearmark.bz/apps/crm` → `www.clearmark.bz/apps/crm`. That's the usual recommendation for sites on Vercel: `www` points at Vercel with a CNAME (a DNS alias), which lets Vercel move traffic between its servers, while the bare domain can only use a fixed A record (an IP address). Nothing to change. Write and share links as `www.clearmark.bz/apps/...`, and use the `www` addresses in the Supabase Redirect URLs (5.1). The `clearmark-tan.vercel.app` entry stays for direct Vercel links.
5. ~~Social Studio login~~ **Decided Oct 20: same Supabase project as this site** (one login, one bill). What follows from that:
   - The team is logged in to Social Studio automatically (same cookie on www.clearmark.bz, section 6.4). Social Studio checks membership with the same `crm_members` table.
   - Give Social Studio's tables a clear prefix (for example `social_*`, like the CRM's `crm_*`) so the two apps' tables don't get mixed up, with Row Level Security on each, as for every table.
   - From Oct 30, 2026, Supabase no longer gives new `public` tables API access automatically. Each `create table` in Social Studio's SQL needs its own `grant ... to authenticated` (and `to anon` only where logged-out visitors may read), or the app gets "permission denied".
   - Its files go in their own Storage bucket (for example `social-media`), separate from `studio-media`.
   - Both apps share the plan's limits (database size, storage, bandwidth). Videos and exported images from Social Studio can fill Storage quickly, so check the Supabase usage page once it's in use.
   - The `.env` values `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the Social Studio Vercel project are the same as here.
6. **Timing:** a quiet hour for the merge, and a heads-up to Tim about the new addresses?
7. **Studio Publish on preview:** it writes to the live database. Skip it during preview testing (the plan's default), or set up a separate test Supabase project for previews later?
