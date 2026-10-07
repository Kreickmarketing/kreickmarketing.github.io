import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import BuilderPage from "@/components/BuilderPage";
import { getBuilderPage } from "@/lib/builder-public";

const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || "https://calendly.com";

// Once About is published in Studio, this page comes from Studio
// (refreshed on every Publish, and at least every 5 minutes). Until then, a placeholder.
export const revalidate = 300;

export default async function About() {
  const studio = await getBuilderPage("clearmark", "about");
  if (studio) {
    return (
      <>
        <main>
          <BuilderPage page={studio.page} livePages={studio.livePages} />
        </main>
        <Footer />
      </>
    );
  }
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
