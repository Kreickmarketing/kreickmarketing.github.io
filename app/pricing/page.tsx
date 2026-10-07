import type { Metadata } from "next";
import BuilderRoute from "@/components/BuilderRoute";

// Made in Studio (page "Pricing"). Refreshed on every Publish, and at least every 5 minutes.
export const revalidate = 300;
export const metadata: Metadata = { title: "Pricing | ClearMark" };

export default function Pricing() {
  return <BuilderRoute pageId="pricing" />;
}
