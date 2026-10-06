import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCrmMember } from "@/lib/supabase-server";
import { getPageForEditing } from "../../studio/queries";
import LivePreview from "./LivePreview";

export const metadata: Metadata = { title: "Preview | Studio", robots: { index: false, follow: false } };

// The page as visitors will see it, drawn inside the Studio editor's preview
// frame. It starts from the saved draft and then follows the editor's
// unsaved changes as you type. Kept outside the Studio frame so none of the
// editor's styles leak into the page.
export default async function PreviewPage({ params }: { params: Promise<{ pageId: string }> }) {
  const member = await getCrmMember();
  if (!member) redirect("/clrcrm/login?denied=1");
  const { pageId } = await params;
  const data = await getPageForEditing(pageId);
  if (!data) notFound();
  return <LivePreview initial={data.page.draft} settings={data.site.settings} cards={data.cards} />;
}
