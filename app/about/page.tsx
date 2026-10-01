import Nav from "@/components/Nav";

const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || "https://calendly.com";

// Placeholder until the About page is built in the sprint (Thu Oct 8).
export default function About() {
  return (
    <>
      <Nav calendlyUrl={calendlyUrl} />
      <main className="page">
        <p className="tagline">About</p>
        <h4>Coming soon</h4>
      </main>
    </>
  );
}
