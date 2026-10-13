import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCrmMember } from "@/lib/supabase-server";

// New CRM (prototype): people, companies, deals board, messages, dashboards,
// assistants and the Author Portal builder. Its source is one HTML file,
// docs/prototypes/crm/crm.html (the Claude prototype). It runs on sample data kept
// in the browser; nothing saves to Supabase yet. Served behind the CRM login.
export const dynamic = "force-dynamic";

const SOURCE = path.join(process.cwd(), "docs/prototypes/crm/crm.html");

export async function GET(request: Request) {
  const member = await getCrmMember();
  if (!member) return NextResponse.redirect(new URL("/clrcrm/login?next=/clrcrm/crm", request.url));
  const html = (await readFile(SOURCE, "utf8")).replace("<head>", '<head><meta name="robots" content="noindex, nofollow">');
  return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
