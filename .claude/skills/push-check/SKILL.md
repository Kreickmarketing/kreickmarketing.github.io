---
name: push-check
description: Bring ClearMark Studio design templates from the "ClearMark Studio Templates" Claude Design canvas into the Studio prototype and the site code, and check they work, WITHOUT putting them live. Use when Andrew types /push-check (optionally with template names, e.g. "/push-check logos hero"), or comments "push check <template>" (or "READY <template>") on the canvas and sends it to Claude. /push-live is the separate step that puts checked work live.
---

# /push-check: canvas → Studio prototype, checked, not live

Andrew designs Studio's section templates on the Claude Design canvas. This skill brings them into the code and checks them so he can look before anything goes live. **It never pushes to `main`.** When he's happy he runs `/push-live`.

- Canvas: https://claude.ai/artifact/4SAJ91HAWLnyKJBSLAYmpM ("ClearMark Studio Templates", a Design artifact; files under `project/`)
- Repo copy of the canvas: `docs/prototypes/claude-design-templates/`
- Studio prototype artifact: https://claude.ai/artifact/ErVXjLTHdeD2tCbDRga3JP (publish `docs/prototypes/studio-builder/studio-builder.html`)

## Which templates

- `/push-check logos hero` → those template ids.
- `/push-check` with nothing after it → every template whose canvas boards differ from the repo copy.
- A canvas comment → the template named in it, or the row the comment sits on.

Template ids (board files are `<id>_desktop|tablet|phone.dc.html`): hero, logos, heading, photo-points, photo-tags, offers, mailing (and any new row on the canvas).

## Steps

1. **Get the boards.** `Artifact` read the canvas (`project/canvas.json` and the three boards for each template). Copy them into `docs/prototypes/claude-design-templates/`. `git diff` that folder to see what Andrew changed. No change for a template → say so and skip it.
2. **Bring the design into Studio.** For each changed template:
   - Find it in `TEMPLATES` in `docs/prototypes/studio-builder/studio-builder.html` (the board's `data-template` = template id; its `data-spot`s = spot keys) and its section type's markup (`SECTION_HTML`) and CSS.
   - Match the boards: desktop = the base rules; tablet = `@container (max-width: 1000px)`; phone = `@container (max-width: 700px)`.
   - Make the **same** change in `components/builder-site.css` (every selector prefixed `.site `) and, if the markup changed, in `lib/builder-site.ts` (`renderLivePage`).
   - Colors: the variables in `styles/colors.css` only, never raw hex. Type: Saira / Courier Prime and the existing type rules. Snap off-system colors, sizes and spacing to the nearest ClearMark value and list each snap for Andrew.
   - Board text is sample text. Don't change page content; only a spot's starting words if Andrew asks.
   - A new or removed spot changes saved pages: **stop and ask Andrew** before going on.
   - Never name Chevrolet or MediaMonks anywhere.
3. **Checks** (all must pass): `npx tsc --noEmit`, then `npx next build`. Open the prototype in Playwright (Chromium is pre-installed) at 1280, 768 and 390 wide, screenshot the template and compare with the boards; show Andrew the screenshots. A failure → fix it and re-check, or stop and report.
4. **Prototype.** Publish `studio-builder.html` to the prototype artifact URL above.
5. **Log and back up.** Add a dated line to `docs/studio-plan.md` ("checked, not live yet"). Commit (clear message, the session's attribution lines) and push to the session's backup branch only. Network errors: retry up to 4 times (2s, 4s, 8s, 16s).
6. **Tell Andrew** in plain words: what changed, the snaps made, that the checks passed, the prototype link, and "say /push-live when you're happy". If it came from a canvas comment, reply under that comment (ArtifactComments) as well.

## Never

- Push to `main`. That's `/push-live`.
- Touch Supabase (data, tables or settings): designs are code only.
- Put secret keys in code.
