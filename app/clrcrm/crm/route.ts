import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCrmMember, getServerSupabase } from "@/lib/supabase-server";
import { displayName, loadCrm, loadSettings, runFollowUps } from "@/lib/crm-v2";
import { aiReady } from "@/lib/crm-ai";
import { emailReady } from "@/lib/email";

// New CRM: people, companies, deals board, messages, dashboards, assistants and the
// Author Portal builder. Its source is one HTML file, docs/prototypes/crm/crm.html (the
// Claude prototype). Here it is served behind the CRM login with the saved records from
// Supabase (crm_* tables) handed to it; it saves changes through ./api.
// The Follow-up, Recap and Research assistants are real (the last two need ANTHROPIC_API_KEY);
// Messages and the Author Portal still run on sample data.
export const dynamic = "force-dynamic";

const SOURCE = path.join(process.cwd(), "docs/prototypes/crm/crm.html");

export async function GET(request: Request) {
  const member = await getCrmMember();
  if (!member) return NextResponse.redirect(new URL("/clrcrm/login?next=/clrcrm/crm", request.url));

  const supabase = await getServerSupabase();
  const settings = await loadSettings(supabase);
  // The Follow-up assistant runs each time the CRM is opened (it never stops the page loading).
  let added = 0;
  try { added = await runFollowUps(supabase, settings); } catch (e) { console.error("Follow-up assistant failed:", e); }
  const data = await loadCrm(supabase);
  // JSON inside a <script>: escape "<" so no saved text can close the tag.
  const json = JSON.stringify({ ...data, settings, followUpsAdded: added, ai: aiReady(), email: emailReady(), me: displayName(member.username) }).replace(/</g, "\\u003c");
  const html = (await readFile(SOURCE, "utf8"))
    .replace("<head>", '<head><meta name="robots" content="noindex, nofollow">')
    .replace("<script>", `<script>window.__CRM__ = ${json};</script>\n<script>`);
  return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
