import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getCrmMember, getServerSupabase } from "@/lib/supabase-server";
import { livePageIds, withUnpublished, type BuilderState } from "@/lib/builder-site";

// Save (PUT), Publish (POST ?action=publish) and Unpublish one page
// (POST ?action=unpublish&page=<id>) for the Studio builder.
// Every call checks the login again; Supabase's row rules (RLS) are the second lock.
const MAX_BYTES = 2_000_000;
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

async function siteId() {
  const supabase = await getServerSupabase();
  const { data } = await supabase.from("sites").select("id").eq("slug", "clearmark").maybeSingle();
  return { supabase, id: data?.id as string | undefined };
}

export async function PUT(request: Request) {
  if (!(await getCrmMember())) return fail("You're logged out. Log in again", 401);
  const text = await request.text();
  if (text.length > MAX_BYTES) return fail("This draft is too big to save (an uploaded image?)", 413);
  let draft: unknown;
  try { draft = JSON.parse(text); } catch { return fail("That draft isn't readable"); }
  const pages = (draft as { pages?: unknown } | null)?.pages;
  if (!draft || typeof draft !== "object" || Array.isArray(draft) || !pages || typeof pages !== "object") return fail("That draft has no pages");

  const { supabase, id } = await siteId();
  if (!id) return fail("Site not found", 404);
  const { error } = await supabase.from("builder_sites").upsert({ site_id: id, draft });
  if (error) return fail(error.message, 500);
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const params = new URL(request.url).searchParams, action = params.get("action");
  if (action !== "publish" && action !== "unpublish") return fail("Unknown action");
  if (!(await getCrmMember())) return fail("You're logged out. Log in again", 401);
  const { supabase, id } = await siteId();
  if (!id) return fail("Site not found", 404);
  if (action === "unpublish") {
    // Take one page off the live site now; it stays in Studio (draft) as work in progress.
    const page = params.get("page") || "";
    if (!/^[a-z0-9-]{1,60}$/.test(page) || page === "home") return fail("That page can't be unpublished");
    const { data: row, error: readError } = await supabase.from("builder_sites").select("draft, published").eq("site_id", id).maybeSingle();
    if (readError || !row) return fail(readError?.message || "Nothing saved yet", 500);
    const published = row.published && Object.keys(row.published).length ? withUnpublished(row.published as BuilderState, page, true) : row.published;
    const { error } = await supabase.from("builder_sites").update({ draft: withUnpublished(row.draft as BuilderState, page, true), published }).eq("site_id", id);
    if (error) return fail(error.message, 500);
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true, livePages: livePageIds(published as BuilderState | null) });
  }
  const { data, error } = await supabase.rpc("publish_builder", { p_site: id });
  if (error) return fail(error.message, 500);
  revalidatePath("/", "layout");  // every live page (Home, About, Pricing, Book a call)
  const { data: row } = await supabase.from("builder_sites").select("published").eq("site_id", id).maybeSingle();
  return NextResponse.json({ ok: true, at: data, livePages: livePageIds(row?.published as BuilderState | null) });
}
