import { getServerSupabase } from "@/lib/supabase-server";
import type { PageContent, SiteSettings } from "@/lib/studio";

// Studio reads as the logged-in CRM member, so Row Level Security lets it see
// drafts as well as published pages.

export type SiteRow = {
  id: string;
  slug: string;
  name: string;
  domain: string | null;
  status: "live" | "coming";
  settings: SiteSettings & { thumbnail?: string };
  updated_at: string;
  pages: { count: number }[];
};

export type PageRow = {
  id: string;
  slug: string;
  title: string;
  draft: PageContent;
  published: PageContent | null;
  published_at: string | null;
  updated_at: string;
};

export type CollectionRow = { id: string; slug: string; name: string; items: { count: number }[] };

export async function getSites() {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("sites")
    .select("id, slug, name, domain, status, settings, updated_at, pages(count)")
    .order("status", { ascending: false }) // "live" before "coming"
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as SiteRow[];
}

export async function getSite(slug: string) {
  const supabase = await getServerSupabase();
  const { data: site, error } = await supabase
    .from("sites")
    .select("id, slug, name, domain, status, settings, updated_at")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!site) return null;

  const [pages, collections] = await Promise.all([
    supabase.from("pages").select("id, slug, title, draft, published, published_at, updated_at")
      .eq("site_id", site.id).order("sort_order").order("title"),
    supabase.from("collections").select("id, slug, name, items(count)")
      .eq("site_id", site.id).order("sort_order"),
  ]);
  if (pages.error) throw new Error(pages.error.message);
  if (collections.error) throw new Error(collections.error.message);

  return {
    site: site as Omit<SiteRow, "pages">,
    pages: (pages.data ?? []) as PageRow[],
    collections: (collections.data ?? []) as CollectionRow[],
  };
}

// Draft, Published, or Published with changes waiting.
export function pageStatus(p: PageRow) {
  if (!p.published) return { key: "draft", label: "Draft" } as const;
  if (JSON.stringify(p.draft) !== JSON.stringify(p.published)) return { key: "changed", label: "Unpublished changes" } as const;
  return { key: "live", label: "Published" } as const;
}

export function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}
