import Image from "next/image";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SignupForm from "@/components/SignupForm";
import StudioPage from "@/components/StudioPage";
import { getPublishedPage } from "@/lib/studio-public";

// Once Home is published in Studio, the live page comes from Studio
// (refreshed on every Publish, and at least every 5 minutes).
// Until then, the hand-built page below is shown.
export const revalidate = 300;

const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || "https://calendly.com";

export default async function Home() {
  const studio = await getPublishedPage("clearmark", "/");
  if (studio) {
    return (
      <>
        <main>
          <StudioPage content={studio.content} settings={studio.settings} cards={studio.cards} />
          <MailingList />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Nav calendlyUrl={calendlyUrl} />
      <main>
        <section className="hero">
          <Image src="/hero.jpg" alt="" fill priority sizes="100vw" className="hero-image" />
          <div className="hero-content">
            <p className="tagline">ClearMark</p>
            <h1>Your single source of truth shouldn&apos;t be a person.</h1>
            <p className="text-xl-light">Make it visible.</p>
            <a href={calendlyUrl} target="_blank" rel="noopener noreferrer" className="button button-action">
              Book a call
            </a>
          </div>
        </section>

        <MailingList />
      </main>
      <Footer />
    </>
  );
}

function MailingList() {
  return (
    <section className="signup-section">
      <div className="signup-copy">
        <p className="tagline">Mailing list</p>
        <h5>Stay in the loop</h5>
        <p className="text-md-light">Short, useful notes on making work visible. No spam.</p>
      </div>
      <SignupForm />
    </section>
  );
}
