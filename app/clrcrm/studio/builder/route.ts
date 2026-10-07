import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCrmMember, getServerSupabase } from "@/lib/supabase-server";
import { livePageIds, type BuilderState } from "@/lib/builder-site";

// Studio builder: the template-and-spots editor. Its source is one HTML file,
// docs/prototypes/studio-builder/studio-builder.html (the same file the Claude
// prototype is published from). Here it is served behind the CRM login, with the
// saved draft from Supabase handed to it, so it saves and publishes for real.
export const dynamic = "force-dynamic";

const SOURCE = path.join(process.cwd(), "docs/prototypes/studio-builder/studio-builder.html");

export async function GET(request: Request) {
  const member = await getCrmMember();
  if (!member) return NextResponse.redirect(new URL("/clrcrm/login?next=/clrcrm/studio/builder", request.url));

  const supabase = await getServerSupabase();
  const { data: site } = await supabase.from("sites").select("id").eq("slug", "clearmark").maybeSingle();
  const { data: row } = site
    ? await supabase.from("builder_sites").select("draft, published").eq("site_id", site.id).maybeSingle()
    : { data: null };

  // JSON inside a <script>: escape "<" so no saved text can close the tag.
  const state = JSON.stringify(row?.draft && Object.keys(row.draft).length ? row.draft : null).replace(/</g, "\\u003c");
  const livePages = JSON.stringify(livePageIds(row?.published as BuilderState | null));
  const html = (await readFile(SOURCE, "utf8"))
    .replace(/(["`])media\//g, "$1/studio-media/")
    .replace("<script>", `<script>window.__STUDIO_LIVE__ = true; window.__STUDIO_STATE__ = ${state}; window.__STUDIO_LIVE_PAGES__ = ${livePages};</script>\n<script>`);

  return new NextResponse(`<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow">\n${html}`, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}
