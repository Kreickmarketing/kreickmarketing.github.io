import { notFound } from "next/navigation";
import { getPageForEditing } from "../../queries";
import PageEditor from "./PageEditor";

// The page editor: fields on the left, the live page on the right.
export default async function EditPage({ params }: { params: Promise<{ site: string; pageId: string }> }) {
  const { site: siteSlug, pageId } = await params;
  const data = await getPageForEditing(pageId);
  if (!data || data.site.slug !== siteSlug) notFound();
  const { page, site, cards } = data;

  return (
    <PageEditor
      page={{ id: page.id, slug: page.slug, title: page.title, draft: page.draft, published: page.published }}
      site={{ slug: site.slug, name: site.name }}
      cardNames={Object.fromEntries(Object.entries(cards).map(([k, c]) => [k, c.ct100]))}
    />
  );
}
