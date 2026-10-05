import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || "https://calendly.com";

export const metadata: Metadata = { title: "Terms & Conditions | ClearMark" };

// Placeholder until the Terms & Conditions text is written.
export default function Terms() {
  return (
    <>
      <Nav calendlyUrl={calendlyUrl} />
      <main className="page">
        <p className="tagline">Terms &amp; Conditions</p>
        <h4>Coming soon</h4>
      </main>
      <Footer />
    </>
  );
}
