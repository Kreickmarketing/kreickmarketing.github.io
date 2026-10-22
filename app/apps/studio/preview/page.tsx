import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import BuilderPage from "@/components/BuilderPage";
import Footer from "@/components/Footer";
import KmSitePage from "@/components/KmSitePage";
import { getCrmMember, getServerSupabase } from "@/lib/supabase-server";
import { livePageIds, pagesOf, renderLivePage, type BuilderState } from "@/lib/builder-site";
import { loadCms } from "@/lib/cms";
import { builderSite } from "@/lib/studio-sites";

// Studio → Preview: a page as it will look live, drawn from the saved work in progress (the
// draft), full screen in its own tab. Team only (proxy.ts and the check below). Links between
// pages stay in the preview; nothing here changes the live site.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ site?: string; page?: string }> };

export default async function StudioPreview({ searchParams }: Props) {
  const sp = await searchParams, site = builderSite(sp.site), pageId = String(sp.page || "home");
  if (!(await getCrmMember())) redirect("/apps/login?next=" + encodeURIComponent(`/apps/studio/preview?site=${site}&page=${pageId}`));
  const supabase = await getServerSupabase();
  const { data: row } = await supabase.from("sites").select("id").eq("slug", site).maybeSingle();
  if (!row) notFound();
  const { data } = await supabase.from("builder_sites").select("draft").eq("site_id", row.id).maybeSingle();
  const state = (data?.draft ?? null) as BuilderState | null;
  if (!state) notFound();
  const cms = await loadCms(supabase, row.id);
  const pages = pagesOf(state);
  const href = (id: string) => `/apps/studio/preview?site=${site}&page=${encodeURIComponent(id)}`;
  const page = renderLivePage(state, pageId, cms, (p) => href(p.id));
  if (!page) notFound();
  if (site === "kreick") return <main><KmSitePage page={page} /></main>;
  return (
    <>
      <main><BuilderPage page={page} livePages={livePageIds(state, cms)} paths={Object.fromEntries(pages.map((p) => [p.id, href(p.id)]))} /></main>
      <Footer content={page.footer} />
    </>
  );
}
