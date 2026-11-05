---
name: studio-upgrades
description: Make changes to Clearmark Studio (the website builder at clearmark.bz/apps/studio) and its client sites' templates (ClearMark, Kreick Marketing, and future client sites), check them, and put them live with /push-live. Use when Andrew types /studio-upgrades, asks for a Studio change, a template change or new template, a builder fix, or a new client site in Studio, from any folder.
---

# Studio upgrades

Andrew runs his websites in **Clearmark Studio**, his own builder (like WordPress, but custom). Each client site has its own template set, built with the same pattern. This skill knows where everything is and how changes go live, so it works from any chat.

## Talking to Andrew
- He has some coding experience and is learning Claude Code. Keep it short and plain.
- When he must do something, say **one thing**, in one or two lines, with a command he can click Run on if needed.
- Never ask him to merge pull requests. Never open pull requests.

## Where it lives
- Code: `~/Developer/kreickmarketing.github.io` (GitHub `Kreickmarketing/kreickmarketing.github.io`, Next.js on Vercel project "clearmark", live at www.clearmark.bz). Work there on `main`, using absolute paths or `git -C`, whatever folder this chat was opened in.
- First read `docs/studio-plan.md` (the plan and a dated log of every change) and `docs/project-status.md`.
- Never commit `README.md`: it clashes with `readme.md` on macOS and always looks changed.
- Supabase (logins, saved pages): don't change data, tables or settings unless Andrew asks.

## The builder
- `docs/prototypes/studio-builder/studio-builder.html` is the whole builder (one file). Served behind the login by `app/apps/studio/builder/route.ts` at `/apps/studio/builder?site=<slug>`; its API is `app/apps/studio/builder/api/`.
- Live pages are drawn by `lib/builder-site.ts` + `components/builder-site.css`. Change the builder and the live drawing together.
- Studio screens: `/apps/studio` (My Sites), `/apps/studio/templates` (browse templates, start pages).
- Every template has three layouts: **Desktop 1280, Tablet 768, Mobile 390** (breakpoints: tablet up to 1000px, phone up to 700px, as `@container` rules).

## The sites
| Site | Slug | Templates | Look | Canvas (Claude Design) |
| --- | --- | --- | --- | --- |
| ClearMark | `clearmark` | `TEMPLATES` in the builder; live in `lib/builder-site.ts` | `styles/*.css` (Saira, ClearMark colors) | https://claude.ai/artifact/4SAJ91HAWLnyKJBSLAYmpM (copy: `docs/prototypes/claude-design-templates/`) |
| Kreick Marketing | `kreick` | `km-*` in `lib/km-sections.ts` (templates, page templates, starting words, live drawing `drawKm`) + `KM_HTML` in the builder | `styles/brands/kreick.css` (under `.brand-km`, Barlow) | https://claude.ai/artifact/2QVUF1U7BcnCxZiwFAREQv (copy: `docs/prototypes/kreick-design-templates/`) |

- ClearMark template changes from the canvas: follow the repo's `/push-check` skill (`.claude/skills/push-check/SKILL.md`).
- Kreick changes: edit `lib/km-sections.ts` / `kreick.css` / `KM_HTML`, then `node scripts/sync-kreick.mjs` (copies into the builder, rebuilds the canvas boards).
- Kreick has no live address yet (Publish is off for it); its pages are built and saved in Studio.

## Adding a new client site
Follow the Kreick pattern: a `sites` row in Supabase (ask Andrew first), the slug in `lib/studio-sites.ts` (`BUILDER_SITES`), a brand stylesheet in `styles/brands/<client>.css` scoped to `.brand-<x>`, a templates file like `lib/km-sections.ts`, a sync script like `scripts/sync-kreick.mjs`, and a canvas. Log the decisions in `docs/studio-plan.md`.

## Checking a change (before it goes live)
1. `npx tsc --noEmit`, then `npx next build` (no `.env.local`? add `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder` in front).
2. Look at it: open the builder prototype from a static server on `docs/prototypes` (`studio-builder.html?site=kreick` for Kreick) at Desktop, Tablet and Mobile, and test what changed. Stop servers and remove any temporary files afterwards.
3. Add a dated entry to `docs/studio-plan.md` (what changed, why, what's next) and commit on `main` in `~/Developer/kreickmarketing.github.io`.

## Going live (/push-live, or Andrew says "push live")
Andrew asking is his OK. Re-run step 1, then `git push origin HEAD:main` from that folder (his settings allow exactly that command). Vercel puts it on clearmark.bz in about 2 minutes; check the commit's Vercel status (`gh api repos/Kreickmarketing/kreickmarketing.github.io/commits/<sha>/status`) and tell him it's live. If the push is refused, give him that one command to click Run on.
