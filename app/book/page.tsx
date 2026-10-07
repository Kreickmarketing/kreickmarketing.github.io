import type { Metadata } from "next";
import BuilderRoute from "@/components/BuilderRoute";

// Made in Studio (page "Book a call"). Refreshed on every Publish, and at least every 5 minutes.
export const revalidate = 300;
export const metadata: Metadata = { title: "Book a call | ClearMark" };

export default function Book() {
  return <BuilderRoute pageId="book" />;
}
