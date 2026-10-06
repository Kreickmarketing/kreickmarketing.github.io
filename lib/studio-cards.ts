import type { SupabaseClient } from "@supabase/supabase-js";
import type { CardContent } from "@/components/Card";
import type { PageContent } from "./studio";

type ItemRow = {
  slug: string; ct100: string; ct200: string | null; ct300: string | null; cs: string | null;
  cb: string | null; cbl: string | null; cp: string | null; cpdt: string[] | null;
  collections: { slug: string };
  media: { code: string; url: string | null; storage_path: string | null; alt: string | null }[];
  item_tags: { sort_order: number; tags: { name: string } | null }[];
};

const FALLBACK_IMAGE = "/hero.jpg";

// Loads the CMS items that a page's card grids show, keyed "collection/slug".
// With the visitor (anon) client, Row Level Security returns published items only.
export async function loadCards(supabase: SupabaseClient, siteId: string, content: PageContent) {
  const wanted = new Set(content.sections.flatMap((s) => s.cards ? s.cards.items.map((i) => `${s.cards!.collection}/${i}`) : []));
  if (wanted.size === 0) return {};
  return loadItems(supabase, siteId, wanted);
}

// Every item in the site's collections (Studio's editor and preview, so any
// item can be added to the page). Members see drafts too.
export function loadAllCards(supabase: SupabaseClient, siteId: string) {
  return loadItems(supabase, siteId, null);
}

async function loadItems(supabase: SupabaseClient, siteId: string, wanted: Set<string> | null) {
  let query = supabase
    .from("items")
    .select("slug, ct100, ct200, ct300, cs, cb, cbl, cp, cpdt, sort_order, collections!inner(slug, site_id), media(code, url, storage_path, alt), item_tags(sort_order, tags(name))")
    .eq("collections.site_id", siteId)
    .order("sort_order")
    .limit(500);
  if (wanted) query = query.in("slug", [...wanted].map((k) => k.split("/")[1]));
  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const cards: Record<string, CardContent> = {};
  for (const r of (data ?? []) as unknown as ItemRow[]) {
    const key = `${r.collections.slug}/${r.slug}`;
    if (wanted && !wanted.has(key)) continue;
    const image = r.media.find((m) => m.code === "CI-01");
    cards[key] = {
      ct100: r.ct100,
      ct200: r.ct200 ?? undefined,
      ct300: r.ct300 ?? undefined,
      cs: r.cs ?? undefined,
      cb: r.cb ?? undefined,
      cbl: r.cbl ?? undefined,
      cp: r.cp ?? undefined,
      cpdt: r.cpdt ?? undefined,
      tags: r.item_tags.sort((a, b) => a.sort_order - b.sort_order).flatMap((t) => t.tags ? [t.tags.name] : []),
      image: image?.url ?? FALLBACK_IMAGE, // Storage files arrive in step 7
      imageAlt: image?.alt ?? "",
    };
  }
  return cards;
}
