import { notFound } from "next/navigation";
import BuilderPage from "./BuilderPage";
import Footer from "./Footer";
import { getBuilderPage } from "@/lib/builder-public";

// A whole live page made only in the Studio builder (no hand-built version).
// Shows "not found" until the page is published from Studio.
export default async function BuilderRoute({ pageId }: { pageId: string }) {
  const studio = await getBuilderPage("clearmark", pageId);
  if (!studio) notFound();
  return (
    <>
      <main>
        <BuilderPage page={studio.page} livePages={studio.livePages} />
      </main>
      <Footer />
    </>
  );
}
