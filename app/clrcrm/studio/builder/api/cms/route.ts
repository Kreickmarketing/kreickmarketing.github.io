import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getCrmMember, getServerSupabase } from "@/lib/supabase-server";
import { safeImage, safeVideo } from "@/lib/builder-site";
import { checkItem, loadCms, tagSlug, type ItemInput } from "@/lib/cms";

// Save one CMS item (Products / Portfolio) from Studio: POST { item }.
// Checks the login, then every field (lib/cms.ts → checkItem); Supabase's row rules are the
// second lock. Saves the fields, the main image (CI-01) and the tags, then returns the
// site's whole CMS so Studio stays in step. A "Ready" (published) item shows on the live
// site straight away, wherever a page uses it.
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(request: Request) {
  if (!(await getCrmMember())) return fail("You're logged out. Log in again", 401);
  let body: { item?: ItemInput };
  try { body = await request.json(); } catch { return fail("That request isn't readable"); }
  const { item, error } = checkItem(body.item || {}, (url) => !!safeImage(url), (url) => !!safeVideo(url));
  if (!item) return fail(error || "That item isn't valid");

  const supabase = await getServerSupabase();
  const { data: site } = await supabase.from("sites").select("id").eq("slug", "clearmark").maybeSingle();
  if (!site) return fail("Site not found", 404);
  const { data: col } = await supabase.from("collections").select("id").eq("site_id", site.id).eq("slug", item.collection).maybeSingle();
  if (!col) return fail("Database not found", 404);

  const fields = {
    slug: item.slug, status: item.status, ct100: item.ct100, ct200: item.ct200 || null, ct300: item.ct300 || null,
    cs: item.cs || null, cl: item.cl || null, cb: item.cb || null, cbl: item.cbl || null,
    cp: item.cp || null, cpt: item.cpt || null, cps: item.cps || null, cpd: item.cpd || null,
    cpdt: item.cpdt.length ? item.cpdt : null, updated_at: new Date().toISOString(),
  };
  let id = item.id;
  if (id) {
    const { error: e } = await supabase.from("items").update(fields).eq("id", id).eq("collection_id", col.id);
    if (e) return fail(e.code === "23505" ? "Another item already uses that slug." : e.message, e.code === "23505" ? 400 : 500);
  } else {
    const { data: last } = await supabase.from("items").select("sort_order").eq("collection_id", col.id).order("sort_order", { ascending: false }).limit(1).maybeSingle();
    const { data: made, error: e } = await supabase.from("items").insert({ ...fields, collection_id: col.id, sort_order: (last?.sort_order ?? 0) + 1 }).select("id").single();
    if (e || !made) return fail(e?.code === "23505" ? "Another item already uses that slug." : e?.message || "Couldn't add it", e?.code === "23505" ? 400 : 500);
    id = made.id as string;
  }

  // Media. With a full list (Studio, Oct 8): replace all the item's images and videos.
  // Older callers send only the main image (CI-01): replace just that one.
  if (item.media) {
    await supabase.from("media").delete().eq("item_id", id);
    if (item.media.length) {
      const { error: e } = await supabase.from("media").insert(item.media.map((m, n) => ({ item_id: id, code: m.code, url: m.url, alt: m.alt || null, sort_order: n })));
      if (e) return fail(e.message, 500);
    }
  } else {
    await supabase.from("media").delete().eq("item_id", id).eq("code", "CI-01");
    if (item.image) {
      const { error: e } = await supabase.from("media").insert({ item_id: id, code: "CI-01", url: item.image.url, alt: item.image.alt || null, sort_order: 0 });
      if (e) return fail(e.message, 500);
    }
  }

  // Tags: each made once per site and reused; this item's list is replaced in order.
  await supabase.from("item_tags").delete().eq("item_id", id);
  for (const [n, name] of item.tags.entries()) {
    const slug = tagSlug(name);
    if (!slug) continue;
    let { data: tag } = await supabase.from("tags").select("id").eq("site_id", site.id).eq("slug", slug).maybeSingle();
    if (!tag) ({ data: tag } = await supabase.from("tags").insert({ site_id: site.id, name, slug }).select("id").single());
    if (tag) await supabase.from("item_tags").insert({ item_id: id, tag_id: tag.id, sort_order: n });
  }

  revalidatePath("/", "layout");  // live pages that show this item
  return NextResponse.json({ ok: true, id, cms: await loadCms(supabase, site.id) });
}
