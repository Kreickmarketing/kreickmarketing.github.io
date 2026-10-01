# ClearMark site (Phase one starter)

A simple ClearMark landing page that tests the whole setup: a nav, a hero, a "Book a call" button that opens Calendly, and a mailing-list form that saves to Supabase.

## Set it up (about 30 minutes)

1. **Supabase.** Create a project called `clearmark-test`. Open **SQL Editor**, paste everything in `supabase/signups.sql`, and click **Run**. This creates the sign-up table (a spreadsheet-like list in the database).
2. **Your settings.** Copy `.env.example` to a new file called `.env.local`. Fill in:
   - the Supabase **Project URL** and **anon public key** (Project Settings, then API)
   - your Calendly link
3. **Run it on your computer.** In this folder, run `npm install`, then `npm run dev`. Open http://localhost:3000.
4. **Test the form.** Sign up with your own name. In Supabase, open **Table Editor**, then **signups**. Your name should be there.
5. **Put it live.** In Vercel, click **Add New**, then **Project**, and pick this repository. Leave **Root Directory** as `./`. Under **Environment Variables**, add the same three settings from `.env.local`. Click **Deploy**.

## Where things live

| What | File |
| --- | --- |
| Home page | `app/page.tsx` |
| Nav bar | `components/Nav.tsx` |
| Mailing-list form | `components/SignupForm.tsx` and `app/actions.ts` |
| Colors | `styles/colors.css` |
| Type rules | `styles/typography.css` |
| Layout and buttons | `app/globals.css` |
| Logo and hero image | `public/` |
