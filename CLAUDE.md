# Clearmark Fullstack: project brief

## How to explain things to me
- My backend knowledge is basic to novice level.
- Use plain language and explain any jargon in-line, in a few words.
- Give one clear recommendation, and break tasks into small numbered steps.
- I have one hour a day for this project.

## Goal
- By Oct 14, 2026, clearmark.bz runs on this stack well enough to market: credibility pages, Calendly booking, a mailing-list form, and editing from my phone.
- clearmark.bz (ClearMark clients) and kreickmarketing.com (my portfolio for agencies hiring me) will share one backend but must look fully unrelated to visitors.
- ClearMark content comes from the ClearMark Brand Playbook. Never name Chevrolet or MediaMonks.

## Tech stack
- Next.js for the site and app code.
- GitHub stores the code.
- Supabase holds all data, logins and files.
- Vercel hosts the site for this sprint; Cirrus Hosting keeps the domains.
- Booking uses my existing Calendly link.

## Design rules
- Colors live in `styles/colors.css`. Use the named variables (e.g. `var(--midnight)`), never raw hex codes in components.
- Primaries: White, Clay Light (page background), Clay, Midnight (text, dark areas), Rogue Cherry (main action buttons), Tidal Azure.
- Neutral and secondary hex values marked "approx" are placeholders until the exact Figma values are added.
- Type rules live in `styles/typography.css`: Saira for headings and body, Courier Prime for buttons. Use the `h1`-`h6`, `.tagline` and `.text-{size}-{weight}` classes rather than new font sizes.
- Buttons are pill shaped. Logo files are in `public/`.

## Rules
- Never put secret keys in the code; use environment variables (`.env.local`, see `.env.example`).
- Turn on Row Level Security for every Supabase table.
- Only work on the dev Supabase project unless I say otherwise.
