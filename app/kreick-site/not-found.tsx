import type { Metadata } from "next";
import "@/styles/brands/kreick.css";

// A missing page on the Kreick site: Kreick's look and name, nothing from ClearMark.
export const metadata: Metadata = { title: "Page not found | Kreick Marketing", description: "Kreick Marketing" };

export default function KreickNotFound() {
  return (
    <main className="brand-km" style={{ minHeight: "100vh" }}>
      <section className="sec km">
        <div className="km-in">
          <h1 className="km-title">Page not found</h1>
          <p className="km-lede">This page isn&apos;t here. <a href="/" style={{ textDecoration: "underline" }}>Go to the home page</a>.</p>
        </div>
      </section>
    </main>
  );
}
