import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import BuilderPage from "@/components/BuilderPage";
import { getBuilderPage } from "@/lib/builder-public";

// Every page made in the Studio builder, apart from Home: About, Pricing, Book a call
// and any page Andrew adds. The address (slug) is set in Studio → Settings → page;
// a page shows here once it's published. Refreshed on every Publish, and at least every 5 minutes.
export const revalidate = 300;

const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || "https://calendly.com";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const studio = await getBuilderPage("clearmark", { path: "/" + slug });
  return { title: `${studio?.name ?? (slug === "about" ? "About" : "Not found")} | ClearMark` };
}

export default async function StudioPage({ params }: Props) {
  const { slug } = await params;
  const studio = await getBuilderPage("clearmark", { path: "/" + slug });
  if (studio) {
    return (
      <>
        <main>
          <BuilderPage page={studio.page} livePages={studio.livePages} paths={studio.paths} />
        </main>
        <Footer content={studio.page.footer} />
      </>
    );
  }
  // The nav has always linked to /about: until About is published, a placeholder.
  if (slug === "about" && !(await getBuilderPage("clearmark", { id: "about" }))) {
    return (
      <>
        <Nav calendlyUrl={calendlyUrl} />
        <main className="page">
          <p className="tagline">About</p>
          <h4>Coming soon</h4>
        </main>
        <Footer />
      </>
    );
  }
  notFound();
}
