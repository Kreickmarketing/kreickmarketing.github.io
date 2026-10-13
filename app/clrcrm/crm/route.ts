import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCrmMember, getServerSupabase } from "@/lib/supabase-server";
import { displayName, loadCrm } from "@/lib/crm-v2";

// New CRM: people, companies, deals board, messages, dashboards, assistants and the
// Author Portal builder. Its source is one HTML file, docs/prototypes/crm/crm.html (the
// Claude prototype). Here it is served behind the CRM login with the saved records from
// Supabase (crm_* tables) handed to it; it saves changes through ./api.
// Messages, Assistants and the Author Portal still run on sample data.
export const dynamic = "force-dynamic";

const SOURCE = path.join(process.cwd(), "docs/prototypes/crm/crm.html");

export async function GET(request: Request) {
  const member = await getCrmMember();
  if (!member) return NextResponse.redirect(new URL("/clrcrm/login?next=/clrcrm/crm", request.url));

  const data = await loadCrm(await getServerSupabase());
  // JSON inside a <script>: escape "<" so no saved text can close the tag.
  const json = JSON.stringify({ ...data, me: displayName(member.username) }).replace(/</g, "\\u003c");
  const html = (await readFile(SOURCE, "utf8"))
    .replace("<head>", '<head><meta name="robots" content="noindex, nofollow">')
    .replace("<script>", `<script>window.__CRM__ = ${json};</script>\n<script>`);
  return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
