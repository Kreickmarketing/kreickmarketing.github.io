# CRM v2 handoff (Oct 13, 2026)

Start here when continuing the new CRM. Written at the end of a claude.ai session so a Claude Code session can pick up where it stopped.

## Goal
Replace the CRM at https://clearmark-tan.vercel.app/clrcrm/crm with a folk-style CRM (Andrew approved "overwrite", Oct 13). The Author Portal builder lives inside it as a side-nav tab.

## Approved design (clickable prototypes)
- **ClearMark CRM prototype** (the design to build): https://claude.ai/artifact/7omMyg89EDXmAfd3qBHwfy
  - Icon rail + resizable side panel. Drag the border to widen; dragging past 248px snaps it closed. Hovering the border shows a pill with a two-way arrow, "Collapse" or "Expand" and "drag to resize". Click toggles; `[` key toggles.
  - Side panel = accordion sections in the Studio layers style, but white. Grip (⋮⋮) to reorder sections, chevrons, mono type chips ("table · 7"), status dots (green placed or active, yellow partial, grey empty). Drag people rows from the table onto a group to add them; drag groups to reorder; "+ Add group".
  - Views: People table, Companies table, Deals pipeline (drag cards between stages), record side panel (Recap, Details, Interactions, Notes, Reminders), Messages (sequences with {first_name} {company} merge fields + "Wait 3 days" follow-up), Dashboards, Assistants (on/off switches).
  - Authors tab = Author Portal builder: preview of the author's page, content cards on the right, Books / Blocks / Sources in the side panel (Google Drive, monday, Uploads, each with a refresh icon). Drag a source onto a block, Claude drafts it and rates the fit, then Place in preview, then Publish.
  - Look: white and light grey only (no cream), Saira + Courier Prime, pill buttons, thin rounded light-grey scrollbars. Single light theme.
- **Earlier Author Portal (navy/tan, superseded by the CRM's Authors tab)**: https://claude.ai/artifact/MkVKdf5KpmxQeNYkREepCy. It holds the full working drag-and-drop logic (Drive, monday, uploads, AI fit checks, per-author privacy) to port.
- Prototype source files are saved in this repo: `docs/prototypes/crm/crm.html` (the CRM, version 5) and `docs/prototypes/author-portal/author-portal.html` (the earlier navy/tan builder with the live Drive, monday and AI logic). They are the files the claude.ai links were published from (the page skeleton is added at publish time, so each file starts at `<title>`).

## Database (Supabase project clearmark-test, ref nbwmldranmowcqjuinyb)
- Existing: `clients` (6 real leads L-1001 to L-1006 with a 16-step `stage`), `products` (11), `crm_members` (team login).
- **Not applied yet:** `supabase/crm-v2.sql` adds companies, deals, crm_groups, crm_group_members, crm_notes, crm_interactions, crm_reminders, crm_sequences, crm_settings, plus columns on clients (title, linkedin, market, lead_status, company_id). CRM-members-only RLS on every table. Nothing existing removed.
  - The first attempt to apply it was cancelled at the approval prompt. Andrew approved the change in principle ("1. yes").
- **Open question for Andrew before applying:** deal stages. The script currently uses folk's marketing-page stages: New lead, Qualified, Discovery, Demo booked, Active discussion, Closed won, Closed lost. Proposed instead, from folk's real templates on Mobbin: **No status, To contact, Contacted, Discovery, Proposal, Negotiation, Contract, Closed-Won, Closed-Lost**, editable like folk (store stages in `crm_settings`, not a CHECK constraint). Update the script once he answers.
- Do not touch the other project, CLR-CRM-01 (a job-application tracker).

## How to build it (same pattern as Studio)
1. Start from `docs/prototypes/crm/crm.html` (already saved).
2. Replace `app/clrcrm/crm/page.tsx` with `app/clrcrm/crm/route.ts`, the way `app/clrcrm/studio/builder/route.ts` serves Studio. Check the CRM login, read the tables, and inject them as `window.__CRM_DATA__`. Keep `clients/`, `products/`, `funnel/`, `database/` as the older views for now.
3. Add `app/clrcrm/crm/api/route.ts`: one POST with `{op, ...}` (person create or update, deal create or move stage, group create, reorder or add member, note, interaction, reminder, sequence save, settings save). Check `getCrmMember()` on every call; RLS is the second lock.
4. In the HTML, swap the sample data for `window.__CRM_DATA__` and send each change to the API.
5. Seed only real data: map existing clients to lead_status (Contact Captured → Contacted, Payment Collected → Customer; Tim, Kuren → Partner) and create companies from their company names. Ask Andrew before adding contacts from the Sep 13 target profiles (Kevin Zadai, Mike Cowan, Evan Tarakjian, Thomas Karlsson, Brad Herman, Jennifer Nizza). Known deal values: Warrior Notes $8,000; K & Co. $2,500 (unconfirmed: he once said $500).
6. Messages: save drafts only (sending needs an email connection later). Dashboards: folk layout, four tiles (revenue, conversion rate, average deal, deals closed) + leads by date, revenue by close date, by status, by industry.
7. Author Portal tab: phase 2. Server-side Drive and monday access needs keys Andrew adds in Vercel.
8. `npm run build`, run Supabase security advisors, push to the branch and `main` (Vercel auto-deploys `main`), update `docs/project-status.md`.

## Notes
- No Vercel tool in this setup: deploys happen by pushing `main`; Andrew checks the Vercel dashboard if a deploy fails.
- Darkness in Disguise test data: Drive folder "Nori-Google-Drive-Folder-Set-Up-Sandbox" (id 1rzYOdJglQ6bs8bfqKo-zxvZ79ed3PXFk); monday book board 18426053316. On-sale date conflict: board says Apr 1, 2027, impact report says Sep 1, 2026.
- Stage tracker for authors = the book board's 11 groups, in board order: Author Meetings, Onboarding (Locked to S1 Sales Conference), Accounting/Finance, Onboarding (Post Sales Con.), Marketing Strategy, Source + Manuscript, Production, Post Production, Marketing Activation, Ancillary Products, Media / PR.
