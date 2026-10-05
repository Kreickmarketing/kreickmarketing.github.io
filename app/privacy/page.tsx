import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || "https://calendly.com";

export const metadata: Metadata = { title: "Privacy Policy | ClearMark" };

// Placeholder until the Privacy Policy text is written.
export default function Privacy() {
  return (
    <>
      <Nav calendlyUrl={calendlyUrl} />
      <main className="page">
        <p className="tagline">Privacy Policy</p>
        <h4>Coming soon</h4>
      </main>
      <Footer />
    </>
  );
}
